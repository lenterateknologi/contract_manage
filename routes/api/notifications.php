<?php

use App\Http\Controllers\System\NotificationController;
use Illuminate\Support\Facades\Route;

/*
 * ── Notifications API ──
 * Comprehensive notification management endpoints for real-time alerts,
 * pending approvals, contract updates, and discussions.
 */

Route::prefix('notifications')->controller(NotificationController::class)->group(function () {
    // 1. List & Summary
    Route::get('/', 'index')->name('api.notifications.index');
    Route::get('/unread-count', 'unreadCount')->name('api.notifications.unread-count');

    // 2. Mark Read Operations
    Route::post('/mark-read', 'markAllRead')->name('api.notifications.mark-read');
    Route::post('/mark-all-read', 'markAllRead')->name('api.notifications.mark-all-read');
    Route::post('/{id}/read', 'markSingleRead')->name('api.notifications.mark-single-read');

    // 3. Dismiss Notification
    Route::delete('/{id}', 'destroy')->name('api.notifications.destroy');
});
