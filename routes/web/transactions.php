<?php

use App\Http\Controllers\Contract\ContractController;
use App\Http\Controllers\Contract\ContractExportController;
use App\Http\Controllers\Contract\ContractFileController;
use App\Http\Controllers\Contract\ContractFormController;
use Illuminate\Support\Facades\Route;

// ── Public Signed Routes for PDF Rendering (Browsershot) ──
Route::controller(ContractExportController::class)->group(function () {
    Route::get('/api/contracts/{id}/approval/document/print', 'renderApprovalTimeline')->name('contracts.approval.document.print')->middleware('signed');
    Route::get('/api/contracts/{id}/audit-trail/document/print', 'renderAuditDocument')->name('contracts.audit.document.print')->middleware('signed');
    Route::get('/api/contracts/{id}/form-submissions/{type}/print', 'renderFormSubmission')->name('contracts.form-submissions.print')->middleware('signed');
});

Route::controller(ContractController::class)->group(function () {
    Route::prefix('dashboard')->group(function () {
        Route::get('/', 'contractsView')->defaults('view', 'dashboard')->name('dashboard');
        Route::get('/ringkasan', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'overview')->name('dashboard.ringkasan');
        Route::get('/ringkasan-kontrak', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'overview_contract')->name('dashboard.ringkasan-kontrak');
        Route::get('/kontrak', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'overview_contract');
        Route::get('/ringkasan-non-kontrak', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'overview_non_contract')->name('dashboard.ringkasan-non-kontrak');
        Route::get('/non-kontrak', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'overview_non_contract');
        Route::get('/ringkasan-nda', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'overview_nda')->name('dashboard.ringkasan-nda');
        Route::get('/nda', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'overview_nda');
        Route::get('/beban-kerja', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'workload')->name('dashboard.beban-kerja');
        Route::get('/workload', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'workload');
        Route::get('/master-data', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'master_data')->name('dashboard.master-data');
        Route::get('/masterdata', 'contractsView')->defaults('view', 'dashboard')->defaults('tab', 'master_data');
    });

    Route::get('/admin/contracts/activity', 'activityView')->defaults('withDuty', true)->name('admin.contracts.activity');

    Route::prefix('contracts')->group(function () {
        Route::get('/', 'contractsView')->defaults('view', 'contracts')->name('contracts');
        Route::get('/activity', 'activityView')->defaults('withDuty', false)->name('contracts.activity');
        Route::get('/mine', 'contractsView')->defaults('view', 'mine')->name('contracts.mine');
        Route::get('/duty', 'contractsView')->defaults('view', 'duty')->name('contracts.duty');
        Route::get('/organization', 'contractsView')->defaults('view', 'organization')->name('contracts.organization');
        Route::get('/org-group', 'contractsView')->defaults('view', 'organization');
        Route::get('/pending', 'contractsView')->defaults('view', 'pending')->name('pending');
        Route::get('/expiry', 'contractsView')->defaults('view', 'expiry')->name('contracts.expiry');
        Route::get('/archived', 'contractsView')->defaults('view', 'archived')->name('contracts.archived');
        Route::get('/in-progress', 'contractsView')->defaults('view', 'in_progress')->name('contracts.in_progress');
        Route::get('/dashboard-metrics', 'getDashboardMetrics')->name('contracts.dashboard-metrics');
        Route::prefix('dashboard')->group(function () {
            Route::get('/visibility', 'getDashboardVisibility')->name('contracts.dashboard.visibility');
            Route::get('/summary', 'getDashboardSummary')->name('contracts.dashboard.summary');
            Route::get('/overview', 'getDashboardOverview')->name('contracts.dashboard.overview');
            Route::get('/distributions', 'getDashboardDistributions')->name('contracts.dashboard.distributions');
            Route::get('/trends', 'getDashboardTrends')->name('contracts.dashboard.trends');
            Route::get('/analysis', 'getDashboardAnalysis')->name('contracts.dashboard.analysis');
            Route::get('/workload', 'getDashboardWorkload')->name('contracts.dashboard.workload');
            Route::get('/master-data', 'getDashboardMasterData')->name('contracts.dashboard.master-data');
            Route::get('/recent-activity', 'getDashboardRecentActivity')->name('contracts.dashboard.recent-activity');
        });
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

// Short URL Route Alias
Route::get('/c/{id}', [ContractController::class, 'showView'])->name('contracts.short');

// Version Comparison
Route::get('/admin/contracts/{id}/form-submissions/{type}/compare', [ContractFormController::class, 'compareFormVersions'])->name('contracts.form-submissions.compare');
Route::get('/admin/contracts/{id}/agreement/compare', [ContractFileController::class, 'compareAgreementVersions'])->name('contracts.agreement.compare');

Route::middleware(['admin'])->prefix('admin')->group(function () {
    Route::controller(ContractController::class)->group(function () {
        Route::get('/contracts', 'contractsView')->defaults('view', 'contracts')->name('admin.contracts.index');
        Route::get('/audit', 'contractsView')->defaults('view', 'audit')->name('admin.audit');
        Route::get('/contracts-data', 'index')->name('contracts.data');
        Route::get('/contracts/export', 'export')->name('admin.contracts.export');
        Route::post('/contracts/import', 'import')->name('admin.contracts.import');
        Route::post('/contracts', 'store')->name('contracts.store');
    });
    Route::post('/contracts/{id}/form-submissions/{type}/export-queue', [ContractExportController::class, 'exportFormSubmissionPdfQueue'])->name('admin.contracts.export-queue');
});
