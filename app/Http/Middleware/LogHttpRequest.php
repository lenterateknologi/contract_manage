<?php

namespace App\Http\Middleware;

use App\Models\HttpLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogHttpRequest
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
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
        $url = $request->fullUrl();
        $parsedUrl = parse_url($url);

        HttpLog::create([
            'id' => now()->getTimestampMs() * 1000 + rand(0, 999), // unique id
            'method' => $request->method(),
            'full_url' => $url,
            'domain' => $parsedUrl['host'] ?? '',
            'path' => $request->path(),
            'path_index' => substr($request->path(), 0, 255),
            'title' => $request->route() ? $request->route()->getName() : null,
            'ip' => $request->ip(),
            'header' => json_encode($request->headers->all()),
            'file' => $request->hasFile('file') ? json_encode($request->allFiles()) : null,
            'body' => $request->isMethod('get') ? null : json_encode($request->all()),
            'user_id' => auth()->id(),
            'created_at' => now(),
        ]);
    }
}