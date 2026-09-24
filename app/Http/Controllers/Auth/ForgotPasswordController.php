<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ForgotPasswordResetMail;
use App\Models\ForgotPassword;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ForgotPasswordController extends Controller
{
    /**
     * Show the forgot password form.
     */
    public function showForgotPasswordForm(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle forgot password request.
     */
    public function sendResetLink(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
        ], [
            'email.required' => 'Email atau username wajib diisi.',
        ]);

        $identifier = trim($request->input('email'));
        $isEmail = filter_var($identifier, FILTER_VALIDATE_EMAIL);

        $user = $isEmail
            ? User::where('email', $identifier)->first()
            : User::where('username', $identifier)->orWhere('nik', $identifier)->first();

        if (! $user) {
            return back()->withErrors([
                'email' => 'Akun dengan email atau username tersebut tidak ditemukan.',
            ]);
        }

        if (empty($user->email) || ! filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return back()->withErrors([
                'email' => 'Akun ditemukan tetapi belum memiliki alamat email yang valid. Silakan hubungi administrator.',
            ]);
        }

        // Create forgot password token
        $token = hash('sha256', Str::random(40));
        $expireAt = now()->addMinutes(60); // 1 hour expiry

        ForgotPassword::create([
            'email' => $user->email,
            'user_id' => $user->id,
            'token' => $token,
            'expire_at' => $expireAt,
        ]);

        $resetUrl = route('password.reset', ['token' => $token]);

        if (config('notifications.email.enabled', true)) {
            try {
                Mail::to($user->email)
                    ->send(new ForgotPasswordResetMail($user, $resetUrl, $expireAt));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Failed sending forgot password reset email: '.$e->getMessage());
            }
        }

        return back()->with('status', 'Tautan atur ulang kata sandi telah dikirim ke email terdaftar Anda ('.$user->email.').');
    }

    /**
     * Show the reset password form.
     */
    public function showResetPasswordForm(Request $request, string $token): Response
    {
        $forgotPassword = ForgotPassword::where('token', $token)->first();

        if (! $forgotPassword || ! $forgotPassword->isValid()) {
            return Inertia::render('auth/reset-password', [
                'token' => $token,
                'email' => '',
                'error' => 'This password reset link is invalid or has expired.',
            ]);
        }

        return Inertia::render('auth/reset-password', [
            'token' => $token,
            'email' => $forgotPassword->email,
        ]);
    }

    /**
     * Handle password reset.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:8|confirmed',
        ]);

        $forgotPassword = ForgotPassword::where('token', $request->token)
            ->where('email', $request->email)
            ->first();

        if (! $forgotPassword || ! $forgotPassword->isValid()) {
            return back()->withErrors([
                'token' => 'This password reset link is invalid or has expired.',
            ]);
        }

        // Update user password
        /** @var User $user */
        $user = $forgotPassword->user;
        $user->password = Hash::make($request->password);
        $user->save();

        // Mark token as redeemed
        $forgotPassword->markAsRedeemed();

        return redirect()->route('login')->with('status', 'Your password has been reset successfully.');
    }
}
