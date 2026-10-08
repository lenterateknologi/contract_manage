<?php

use App\Http\Controllers\Chat\ChatController;
use Illuminate\Support\Facades\Route;

/*
 * ── Discussion & Messaging API ──
 * Handles all discussion threads, chat messages, reactions, and attachments.
 */

// 1. Discussions Thread List & Detail
Route::get('/discussions', [ChatController::class, 'getDiscussions']);
Route::get('/discussions/{contractId}', [ChatController::class, 'getDiscussionDetail']);
Route::post('/discussions/{contractId}/messages', [ChatController::class, 'sendMessage']);
Route::post('/discussions/{contractId}/read', [ChatController::class, 'markAsRead']);

// 2. Direct / Nested Contract Messages (Standard & Backward Compatibility)
Route::prefix('contracts/{contractId}/messages')->controller(ChatController::class)->group(function () {
    Route::get('/', 'getMessages');
    Route::post('/', 'sendMessage');
    Route::post('/read', 'markAsRead');
});

// 3. Message Details, Reactions, and Attachments
Route::get('/messages/{messageId}', [ChatController::class, 'getMessageDetail']);
Route::post('/messages/{messageId}/reaction', [ChatController::class, 'toggleReaction']);
Route::get('/messages/attachment/{messageId}', [ChatController::class, 'downloadAttachment'])->name('contracts.message-attachment');
