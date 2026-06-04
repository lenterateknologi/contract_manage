<?php

use App\Http\Controllers\System\EmailTestController;
use Illuminate\Support\Facades\Route;

/*
 * ── System & Integration Services (Web) ──
 */

Route::prefix('services')->group(function () {
    // Email Testing Interface
    if (! app()->environment('production')) {
        Route::get('/email/test', [EmailTestController::class, 'index'])->name('web.services.email.test');
    }

    // Future Reverb / FCM Web Views or Debug Panels
    // Route::get('/notifications', [NotificationController::class, 'view']);
});
