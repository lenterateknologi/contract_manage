<?php

use App\Http\Controllers\Chat\ChatController;
use Illuminate\Support\Facades\Route;

/*
 * ── Discussion & Messaging API ──
 * Handles all communication within contracts.
 */

Route::prefix('contracts/{contractId}/messages')->controller(ChatController::class)->group(function () {
    Route::get('/', 'getMessages');
    Route::post('/', 'sendMessage');
    Route::post('/read', 'markAsRead');
});

Route::post('/messages/{messageId}/reaction', [ChatController::class, 'toggleReaction']);
Route::get('/messages/attachment/{messageId}', [ChatController::class, 'downloadAttachment'])->name('contracts.message-attachment');
