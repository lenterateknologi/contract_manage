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
        return Inertia::render('contracts/index');
    })->name('dashboard');

    Route::get('contracts', function () {
        return Inertia::render('contracts/index');
    })->name('contracts.index');

    Route::get('contracts/{id}', function ($id) {
        return Inertia::render('contracts/show', ['contractId' => $id]);
    })->name('contracts.show');

    // ── Contract API (under web middleware so session auth works) ──
    Route::prefix('api')->group(function () {
        Route::get('/contracts',                            [ContractController::class, 'index']);
        Route::post('/contracts',                          [ContractController::class, 'store']);
        Route::get('/contracts/{id}',                      [ContractController::class, 'show']);
        Route::post('/contracts/{id}/approve',             [ContractController::class, 'approve']);
        Route::post('/contracts/{id}/reject',              [ContractController::class, 'reject']);
        Route::post('/contracts/{id}/revision',            [ContractController::class, 'uploadRevision']);
        Route::get('/contracts/{id}/download',             [ContractController::class, 'download'])->name('contracts.download');
        Route::get('/contracts/{id}/file/{versionNo}',     [ContractController::class, 'fileContent'])->name('contracts.file-url');
        Route::get('/contracts/{id}/pdf/{versionNo}',      [ContractController::class, 'pdfPreview'])->name('contracts.pdf-preview');

        Route::get('/contracts/{contractId}/messages',     [ContractMessageController::class, 'index']);
        Route::post('/contracts/{contractId}/messages',    [ContractMessageController::class, 'store']);
        Route::post('/contracts/{contractId}/messages/read', [ContractMessageController::class, 'markRead']);
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
