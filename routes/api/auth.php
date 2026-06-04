<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * ── API Authentication (Stateless / Sanctum) ──
 * This file handles authentication for mobile apps (Android/iOS)
 * using token-based authentication.
 */

Route::middleware('guest')->group(function () {
    // Note: You might need to create specific API controllers
    // to return JSON tokens instead of session redirects.

    // Route::post('login', [ApiAuthController::class, 'login']);
    // Route::post('register', [ApiAuthController::class, 'register']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Route::post('logout', [ApiAuthController::class, 'logout']);
    Route::get('user', function (Request $request) {
        return $request->user();
    });
});
