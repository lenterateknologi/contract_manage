<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class EmailTestController extends Controller
{
    /**
     * Show the email test page
     */
    public function index()
    {
        // Only allow in non-production environments
        if (app()->environment('production')) {
            abort(403, 'Email testing is not available in production environment.');
        }

        return view('emails.email-test');
    }

    /**
     * Send a test email
     */
    public function sendTestEmail(Request $request): JsonResponse
    {
        // Only allow in non-production environments
        if (app()->environment('production')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email testing is not available in production environment.'
            ], 403);
        }

        try {
            $validator = Validator::make($request->all(), [
                'email' => ['required', 'email'],
                'subject' => ['required', 'string', 'max:255'],
                'message' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Send test email
            Mail::raw($request->message, function ($mail) use ($request) {
                $mail->to($request->email)
                     ->subject($request->subject)
                     ->from(config('mail.from.address'), config('mail.from.name'));
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Test email sent successfully to ' . $request->email
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to send test email: ' . $e->getMessage(),
                'error' => $e->getMessage()
            ], 500);
        }
    }
}