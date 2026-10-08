<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    use ApiResponse;

    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        if ($request->wantsJson()) {
            $user = Auth::user();
            $token = null;

            try {
                if ($user && method_exists($user, 'createToken')) {
                    $token = $user->createToken('auth-token')->plainTextToken;
                }
            } catch (\Throwable $e) {
                // Fallback token string if personal_access_tokens table is not yet migrated
                $token = base64_encode($user->id.':'.$user->email.':'.now()->timestamp);
            }

            return $this->successResponse([
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $user,
            ], 'Logged in successfully');
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse|JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->wantsJson()) {
            return $this->successResponse(null, 'Logged out successfully');
        }

        return redirect('/');
    }
}
