<?php

use Illuminate\Support\Facades\Route;

/*
 * ── API User Settings (Stateless) ──
 */

Route::middleware('auth:sanctum')->group(function () {
    // Profile Management
    // Route::patch('profile', [ApiProfileController::class, 'update']);
    // Route::delete('profile', [ApiProfileController::class, 'destroy']);

    // Password Management
    // Route::put('password', [ApiPasswordController::class, 'update']);
});
