<?php

use App\Http\Controllers\Chat\ChatController;
use Illuminate\Support\Facades\Route;

/*
 * ── Discussion & Messaging (Web) ──
 */

Route::middleware(['auth'])->group(function () {
    // Global Chat Center
    Route::get('/admin/chat/{contractId?}', [ChatController::class, 'index'])->name('admin.chat.index');
    Route::post('/admin/chat/messages/{messageId}/reaction', [ChatController::class, 'toggleReaction'])->name('admin.chat.reaction');

    // Legacy/Alternative path if needed
    Route::get('/discussions', function () {
        return redirect()->route('admin.chat.index');
    })->name('web.discussions.index');
});
