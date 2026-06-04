<?php

use App\Http\Controllers\System\EmailTestController;
use Illuminate\Support\Facades\Route;

/*
 * ── System & Integration Services ──
 * This file contains endpoints for infrastructure services like:
 * - Email (Testing/Webhooks)
 * - FCM (Firebase Cloud Messaging / Push Notifications)
 * - Reverb (Real-time Broadcasting)
 */

Route::prefix('services')->group(function () {
    // Email Services
    Route::post('/email/test', [EmailTestController::class, 'sendTestEmail'])->name('api.services.email.test');

    // FCM / Notifications (Placeholders for future implementation)
    // Route::post('/fcm/token', [NotificationController::class, 'updateToken']);
    // Route::post('/notifications/mark-read', [NotificationController::class, 'markAllRead']);

    // Reverb / Broadcasting (Custom auth if needed beyond default)
    // Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate']);
});
