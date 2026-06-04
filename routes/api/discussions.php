<?php

use App\Http\Controllers\Contract\ContractMessageController;
use Illuminate\Support\Facades\Route;

/**
 * ── Discussion & Messaging API ──
 * Handles all communication within contracts.
 */

Route::prefix('contracts/{contractId}/messages')->controller(ContractMessageController::class)->group(function () {
    Route::get('/', 'index');
    Route::post('/', 'store');
    Route::post('/read', 'markRead');
});
