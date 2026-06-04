<?php

use App\Http\Controllers\Contract\ContractApprovalController;
use App\Http\Controllers\Contract\ContractController;
use App\Http\Controllers\Contract\ContractExportController;
use App\Http\Controllers\Contract\ContractFileController;
use App\Http\Controllers\Contract\ContractFormController;
use App\Models\FormTemplate;
use Illuminate\Support\Facades\Route;

// ── Contract API ──
Route::prefix('contracts')->group(function () {
    Route::controller(ContractController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/types', 'getTypes');
        Route::get('/submission-types', 'getSubmissionTypes');
        Route::post('/', 'store');
        Route::get('/workflows', 'getWorkflows');
        Route::get('/users', 'getUsers');
        Route::get('/roles', 'getRoles');
        Route::get('/{id}', 'show');
        Route::patch('/{id}', 'update');
        Route::delete('/{id}', 'destroy');
        Route::post('/bulk-delete', 'bulkDestroy');
    });

    Route::controller(ContractApprovalController::class)->prefix('{id}')->group(function () {
        Route::post('/send', 'send');
        Route::post('/approve', 'approve');
        Route::post('/reject', 'reject');
        Route::post('/add-approver', 'addAdhocApprover');
        Route::post('/submit-approvers', 'submitAdhocApprovers');
        Route::delete('/approver/{approvalId}', 'removeAdhocApprover');
    });

    Route::controller(ContractApprovalController::class)->group(function () {
        Route::post('/bulk-approve', 'bulkApprove');
    });

    Route::controller(ContractFileController::class)->prefix('{id}')->group(function () {
        Route::post('/revision', 'uploadRevision');
        Route::get('/revision/versions', 'getRevisionVersions');
        Route::post('/version', 'changeVersion');
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

    Route::controller(ContractFormController::class)->prefix('{id}/form-submissions')->group(function () {
        Route::get('/{type}', 'getFormSubmission');
        Route::post('/', 'saveFormSubmission');
        Route::get('/{type}/compare', 'compareFormVersions');
    });

    Route::controller(ContractExportController::class)->prefix('{id}')->group(function () {
        Route::get('/form-submissions/{type}/pdf/queue', 'exportFormSubmissionPdfQueue')->name('api.contracts.form-submissions.pdf.queue');
        Route::get('/form-submissions/{type}/pdf', 'exportFormSubmissionPdf')->name('api.contracts.form-submissions.pdf');
        Route::get('/audit-trail', 'getAuditTrail');
        Route::get('/audit-trail/document', 'renderAuditDocument')->name('api.contracts.audit.document');
        Route::get('/audit-trail/pdf', 'exportAuditPdf')->name('api.contracts.audit.pdf');
        Route::get('/audit-trail/pdf/queue', 'exportAuditPdfQueue')->name('api.contracts.audit.pdf.queue');
        Route::get('/approval/pdf/queue', 'exportApprovalTimelinePdfQueue')->name('api.contracts.approval.pdf.queue');
        Route::get('/audit-trail/excel', 'exportAuditExcel')->name('api.contracts.audit.excel');
    });
});

// Helpers
Route::get('/form-templates/{id}/fields', function ($id) {
    $tpl = FormTemplate::with(['fields' => fn ($q) => $q->orderBy('order')])->findOrFail($id);

    return response()->json($tpl);
});
