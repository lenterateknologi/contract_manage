<?php

use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractMessageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('contracts/index', ['currentView' => 'dashboard']);
    })->name('dashboard');

    Route::get('contracts', function () {
        return Inertia::render('contracts/index', ['currentView' => 'contracts']);
    })->name('contracts');

    Route::get('pending', function () {
        return Inertia::render('contracts/index', ['currentView' => 'pending']);
    })->name('pending');

    Route::get('f1', function () {
        return Inertia::render('contracts/index', ['currentView' => 'f1']);
    })->name('f1');

    Route::get('f2', function () {
        return Inertia::render('contracts/index', ['currentView' => 'f2']);
    })->name('f2');

    Route::get('audit', function () {
        return Inertia::render('contracts/index', ['currentView' => 'audit']);
    })->name('audit');

    Route::get('contracts/{id}', function ($id) {
        return Inertia::render('contracts/show', ['contractId' => $id]);
    })->name('contracts.show');

    // ── Contract API (under web middleware so session auth works) ──
    Route::prefix('api')->group(function () {
        Route::get('/contracts',                            [ContractController::class, 'index']);
        Route::get('/contract-types',                       [ContractController::class, 'getTypes']);
        Route::post('/contracts',                          [ContractController::class, 'store']);
        Route::get('/contracts/{id}',                      [ContractController::class, 'show']);
        Route::post('/contracts/{id}/approve',             [ContractController::class, 'approve']);
        Route::post('/contracts/{id}/reject',              [ContractController::class, 'reject']);
        Route::post('/contracts/{id}/revision',            [ContractController::class, 'uploadRevision']);
        Route::post('/contracts/{id}/version',             [ContractController::class, 'changeVersion']);
        Route::post('/contracts/{id}/attachments',         [ContractController::class, 'uploadAttachment']);
        Route::delete('/contracts/{id}/attachments/{atId}', [ContractController::class, 'deleteAttachment']);
        Route::get('/contracts/{id}/download',             [ContractController::class, 'download'])->name('contracts.download');
        Route::get('/contracts/{id}/file/{versionNo}',     [ContractController::class, 'fileContent'])->name('contracts.file-url');
        Route::get('/contracts/{id}/attachment/{atId}',    [ContractController::class, 'attachmentFile'])->name('contracts.attachment-file');
        Route::get('/contracts/{id}/pdf/{versionNo}',      [ContractController::class, 'pdfPreview'])->name('contracts.pdf-preview');
        Route::get('/contracts/{id}/attachment-pdf/{atId}', [ContractController::class, 'attachmentPdfPreview'])->name('contracts.attachment-pdf-preview');

        Route::get('/contracts/{contractId}/messages',     [ContractMessageController::class, 'index']);
        Route::post('/contracts/{contractId}/messages',    [ContractMessageController::class, 'store']);
        Route::post('/contracts/{contractId}/messages/read', [ContractMessageController::class, 'markRead']);
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
