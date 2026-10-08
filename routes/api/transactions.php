<?php

use App\Http\Controllers\Admin\AdminContractWorkflowController;
use App\Http\Controllers\Contract\ContractApprovalController;
use App\Http\Controllers\Contract\ContractController;
use App\Http\Controllers\Contract\ContractExportController;
use App\Http\Controllers\Contract\ContractFileController;
use App\Http\Controllers\Contract\ContractFormController;
use App\Http\Controllers\Contract\ContractMemberController;
use App\Http\Controllers\Contract\ContractPurchaseOrderController;
use App\Http\Controllers\Contract\ContractReferenceController;
use App\Http\Controllers\Contract\ContractSlaOverdueController;
use App\Models\Master\FormTemplate;
use Illuminate\Support\Facades\Route;

// ── Contract API ──
Route::prefix('contracts')->group(function () {
    // ── SLA Overdue Monitoring & Notification ──
    Route::controller(ContractSlaOverdueController::class)->prefix('sla')->group(function () {
        Route::get('/overdue', 'index')->name('api.contracts.sla.overdue');
        Route::post('/overdue/notify-all', 'notifyAllOverdue')->name('api.contracts.sla.notify-all');
        Route::post('/{id}/notify', 'notifyManager')->name('api.contracts.sla.notify-manager');
    });

    Route::controller(ContractController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/types', 'getTypes');
        Route::get('/submission-types', 'getSubmissionTypes');
        Route::post('/', 'store');
        Route::get('/workflows', 'getWorkflows');
        Route::get('/users', 'getUsers');
        Route::get('/roles', 'getRoles');
        Route::get('/dashboard-metrics', 'getDashboardMetrics');
        Route::prefix('dashboard')->group(function () {
            Route::get('/visibility', 'getDashboardVisibility');
            Route::get('/summary', 'getDashboardSummary');
            Route::get('/overview', 'getDashboardOverview');
            Route::get('/distributions', 'getDashboardDistributions');
            Route::get('/trends', 'getDashboardTrends');
            Route::get('/analysis', 'getDashboardAnalysis');
            Route::get('/workload', 'getDashboardWorkload');
            Route::get('/master-data', 'getDashboardMasterData');
            Route::get('/recent-activity', 'getDashboardRecentActivity');
        });
        Route::get('/{id}', 'show');
        Route::patch('/{id}', 'update');
        Route::post('/{id}/review-doc', 'reviewDoc');
        Route::delete('/{id}', 'destroy');
        Route::post('/bulk-delete', 'bulkDestroy');
    });

    Route::controller(ContractApprovalController::class)->prefix('{id}')->group(function () {
        Route::get('/workflow', 'getWorkflow');
        Route::get('/current-step', 'getCurrentStep');
        Route::get('/timeline', 'getTimeline');
        Route::get('/requirements', 'getRequirements');
        Route::get('/actions', 'getAvailableActions');
        Route::post('/send', 'send');
        Route::post('/assign-pic', 'assignPic');
        Route::post('/approve', 'approve');
        Route::post('/reject', 'reject');
        Route::post('/recall', 'recall');
        Route::post('/add-approver', 'addAdhocApprover');
        Route::post('/submit-approvers', 'submitAdhocApprovers');
        Route::delete('/approver/{approvalId}', 'removeAdhocApprover');
    });

    // ── Admin-only Contract Operations ──
    Route::controller(AdminContractWorkflowController::class)->group(function () {
        Route::post('/{id}/override-workflow', 'override');
        Route::get('/admin/workflows', 'getWorkflows');
    });

    Route::controller(ContractApprovalController::class)->group(function () {
        Route::post('/bulk-approve', 'bulkApprove');
    });

    Route::controller(ContractFileController::class)->prefix('{id}')->group(function () {
        Route::get('/document-types', 'getDocumentTypes');
        Route::get('/document-types/{type}', 'getDocumentTypes');
        Route::post('/revision', 'uploadRevision');
        Route::get('/revision/versions', 'getRevisionVersions');
        Route::post('/version', 'changeVersion');
        Route::get('/attachments', 'getAttachments');
        Route::post('/attachments', 'uploadAttachment');
        Route::delete('/attachments/{atId}', 'deleteAttachment');
        Route::get('/download', 'download')->name('api.contracts.download');
        Route::get('/file/{versionNo}', 'fileContent')->name('api.contracts.file-url');
        Route::get('/attachment/{atId}', 'attachmentFile')->name('api.contracts.attachment-file');
        Route::get('/pdf/{versionNo}', 'pdfPreview')->name('api.contracts.pdf-preview');
        Route::get('/attachment-pdf/{atId}', 'attachmentPdfPreview')->name('api.contracts.attachment-pdf-preview');
        Route::get('/vendor-document/{docId}', 'vendorDocumentFile')->name('api.contracts.vendor-document-file');
        Route::get('/vendor-document-pdf/{docId}', 'vendorDocumentPdfPreview')->name('api.contracts.vendor-document-pdf-preview');
        Route::post('/agreement', 'uploadAgreement');
        Route::get('/agreement/versions', 'getAgreementVersions');
        Route::get('/agreement/compare', 'compareAgreementVersions');
    });

    Route::controller(ContractMessageController::class)->prefix('{contractId}/messages')->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::post('/read', 'markRead');
    });

    Route::controller(ContractMemberController::class)->prefix('{id}/members')->group(function () {
        Route::get('/', 'index');
    });

    Route::controller(ContractReferenceController::class)->prefix('{id}/reference')->group(function () {
        Route::get('/', 'show');
        Route::get('/search', 'search');
        Route::patch('/', 'update');
    });

    Route::controller(ContractPurchaseOrderController::class)->prefix('{id}/purchase-orders')->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::patch('/{poId}', 'update');
        Route::delete('/{poId}', 'destroy');
    });

    Route::controller(ContractFormController::class)->prefix('{id}/form-submissions')->group(function () {
        Route::get('/{type}', 'getFormSubmission');
        Route::post('/', 'saveFormSubmission');
        Route::get('/{type}/compare', 'compareFormVersions');
    });

    Route::controller(ContractExportController::class)->prefix('{id}')->group(function () {
        Route::post('/form-submissions/{type}/pdf/queue', 'exportFormSubmissionPdfQueue')->name('api.contracts.form-submissions.pdf.queue');
        Route::get('/form-submissions/{type}/pdf', 'exportFormSubmissionPdf')->name('api.contracts.form-submissions.pdf');
        Route::get('/audit-trail', 'getAuditTrail');
        Route::get('/audit-trail/document', 'renderAuditDocument')->name('api.contracts.audit.document');
        Route::get('/audit-trail/pdf', 'exportAuditPdf')->name('api.contracts.audit.pdf');
        Route::get('/audit-trail/pdf/queue', 'exportAuditPdfQueue')->name('api.contracts.audit.pdf.queue');
        Route::get('/approval/pdf', 'exportApprovalTimelinePdf')->name('api.contracts.approval.pdf');
        Route::get('/audit-trail/excel', 'exportAuditExcel')->name('api.contracts.audit.excel');
    });
});

// Helpers
Route::get('/form-templates/{id}/fields', function ($id) {
    $tpl = FormTemplate::with(['fields' => fn ($q) => $q->orderBy('order')])->findOrFail($id);

    return response()->json($tpl);
});
