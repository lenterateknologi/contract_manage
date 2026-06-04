<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/**
 * ── Discussion & Messaging (Web) ──
 */

Route::middleware(['auth'])->group(function () {
    // Global Inbox View (Placeholder)
    Route::get('/discussions', function () {
        return Inertia::render('discussions/index', [
            'breadcrumbs' => [
                ['title' => 'Diskusi', 'href' => route('web.discussions.index'), 'icon' => 'MessageSquare'],
            ],
        ]);
    })->name('web.discussions.index');
    
    // Future: Thread views, mention lists, etc.
});
