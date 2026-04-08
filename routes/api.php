<?php

use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractMessageController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // Contracts
    Route::get('/contracts',                            [ContractController::class, 'index']);
    Route::post('/contracts',                           [ContractController::class, 'store']);
    Route::get('/contracts/{id}',                       [ContractController::class, 'show']);
    Route::post('/contracts/{id}/send',                 [ContractController::class, 'send']);
    Route::post('/contracts/{id}/approve',              [ContractController::class, 'approve']);
    Route::post('/contracts/{id}/reject',               [ContractController::class, 'reject']);
    Route::post('/contracts/{id}/revision',             [ContractController::class, 'uploadRevision']);
    Route::get('/contracts/{id}/download',              [ContractController::class, 'download'])->name('contracts.download');
    Route::get('/contracts/{id}/file/{versionNo}',      [ContractController::class, 'fileContent'])->name('contracts.file-url');

    // Messages
    Route::get('/contracts/{contractId}/messages',      [ContractMessageController::class, 'index']);
    Route::post('/contracts/{contractId}/messages',     [ContractMessageController::class, 'store']);
    Route::post('/contracts/{contractId}/messages/read',[ContractMessageController::class, 'markRead']);
});
