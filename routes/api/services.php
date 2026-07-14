<?php

use App\Http\Controllers\System\EmailTestController;
use App\Http\Controllers\System\NotificationController;
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

    // FCM / Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('api.services.notifications');
    Route::post('/notifications/mark-read', [NotificationController::class, 'markAllRead'])->name('api.services.notifications.mark-read');

    // Reverb / Broadcasting (Custom auth if needed beyond default)
    // Route::post('/broadcasting/auth', [BroadcastController::class, 'authenticate']);
});
