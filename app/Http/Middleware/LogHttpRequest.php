<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogHttpRequest
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent to the browser.
     */
    public function terminate(Request $request, Response $response): void
    {
        try {
            $url = $request->fullUrl();
            $parsedUrl = parse_url($url);

            // Mask sensitive data before logging
            $sensitiveFields = [
                'password',
                'password_confirmation',
                'current_password',
                'token',
                'access_token',
                'refresh_token',
                'otp',
                'pin',
            ];

            $allData = $request->all();
            foreach ($sensitiveFields as $field) {
                if (isset($allData[$field])) {
                    $allData[$field] = '********';
                }
            }

            $body = $request->isMethod('get') ? null : json_encode($allData);
            if ($body && strlen($body) > 60000) {
                $body = substr($body, 0, 60000).'... [TRUNCATED]';
            }

            Log::info('HTTP Request: '.$request->method().' '.$url, [
                'ip' => $request->ip(),
                'user_id' => Auth::id(),
                'body' => $body ? 'Has Body' : 'No Body',
            ]);
        } catch (\Exception $e) {
            Log::error('LogHttpRequest termination error: '.$e->getMessage());
        }
    }
}
