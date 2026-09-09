<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LogHttpRequest;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->prefix('api')
                ->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(LogHttpRequest::class);
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'admin' => AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (\Symfony\Component\HttpFoundation\Response $response, \Throwable $exception, \Illuminate\Http\Request $request) {
            $status = $response->getStatusCode();

            // Do not override API JSON requests
            if ($request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia'))) {
                return $response;
            }

            if (in_array($status, [403, 404, 500, 503])) {
                return \Inertia\Inertia::render('errors/Error', [
                    'status' => $status,
                    'message' => $status === 404 ? 'Data kontrak atau halaman yang Anda cari tidak ditemukan.' : ($exception->getMessage() ?: null),
                ])
                ->toResponse($request)
                ->setStatusCode($status);
            }

            if ($status === 419) {
                return back()->with([
                    'message' => 'Sesi telah kedaluwarsa, silakan muat ulang dan coba lagi.',
                ]);
            }

            return $response;
        });
    })->create();
