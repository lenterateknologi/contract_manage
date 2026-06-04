<?php

use App\Http\Controllers\Contract\ContractController;
use App\Http\Controllers\Contract\ContractExportController;
use App\Http\Controllers\Contract\ContractFileController;
use Illuminate\Support\Facades\Route;

// ── Public Signed Routes for PDF Rendering (Browsershot) ──
Route::controller(ContractExportController::class)->group(function () {
    Route::get('/api/contracts/{id}/approval/document/print', 'renderApprovalTimeline')->name('contracts.approval.document.print')->middleware('signed');
    Route::get('/api/contracts/{id}/audit-trail/document/print', 'renderAuditDocument')->name('contracts.audit.document.print')->middleware('signed');
});

Route::controller(ContractController::class)->group(function () {
    Route::get('dashboard', 'contractsView')->defaults('view', 'dashboard')->name('dashboard');

    Route::prefix('contracts')->group(function () {
        Route::get('/', 'contractsView')->defaults('view', 'contracts')->name('contracts');
        Route::get('/mine', 'contractsView')->defaults('view', 'mine')->name('contracts.mine');
        Route::get('/pending', 'contractsView')->defaults('view', 'pending')->name('pending');
        Route::get('/f1', 'contractsView')->defaults('view', 'f1')->name('f1');
        Route::get('/f2', 'contractsView')->defaults('view', 'f2')->name('f2');
        Route::get('/expiry', 'contractsView')->defaults('view', 'expiry')->name('expiry');
        Route::get('/{id}', 'showView')->name('contracts.show');

        // Metadata & Helpers
        Route::get('/workflows', 'getWorkflows')->name('contracts.workflows');
        Route::get('/users', 'getUsers')->name('contracts.users');
        Route::get('/types', 'getTypes')->name('contracts.types');
        Route::get('/submission-types', 'getSubmissionTypes')->name('contracts.submission-types');
        Route::get('/roles', 'getRoles')->name('contracts.roles');
    });

    Route::get('my-contracts', 'contractsView')->defaults('view', 'mine'); // Backward compat
});

// Version Comparison
Route::controller(ContractFileController::class)->group(function () {
    Route::get('/admin/contracts/{id}/form-submissions/{type}/compare', 'compareFormVersions')->name('contracts.form-submissions.compare');
    Route::get('/admin/contracts/{id}/agreement/compare', 'compareAgreementVersions')->name('contracts.agreement.compare');
});

Route::middleware(['admin'])->prefix('admin')->group(function () {
    Route::controller(ContractController::class)->group(function () {
        Route::get('/contracts', 'contractsView')->defaults('view', 'contracts')->name('admin.contracts.index');
        Route::get('/audit', 'contractsView')->defaults('view', 'audit')->name('admin.audit');
        Route::get('/contracts-data', 'index')->name('contracts.data');
        Route::get('/contracts/export', 'export')->name('admin.contracts.export');
        Route::post('/contracts/import', 'import')->name('admin.contracts.import');
        Route::post('/contracts', 'store')->name('contracts.store');
    });
    Route::post('/admin/contracts/{id}/form-submissions/{type}/export-queue', [ContractExportController::class, 'exportFormSubmissionPdfQueue'])->name('admin.contracts.export-queue');
});
