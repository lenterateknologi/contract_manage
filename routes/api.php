<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractMessageController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    // ── Contract API ──
    Route::get('/contracts', [ContractController::class, 'index']);
    Route::get('/contract-types', [ContractController::class, 'getTypes']);
    Route::get('/contracts/submission-types', [ContractController::class, 'getSubmissionTypes']);
    Route::post('/contracts', [ContractController::class, 'store']);
    Route::get('/contracts/workflows', [ContractController::class, 'getWorkflows']);
    Route::get('/contracts/users', [ContractController::class, 'getUsers']);
    Route::get('/contracts/roles', [ContractController::class, 'getRoles']);
    Route::get('/contracts/{id}', [ContractController::class, 'show']);
    Route::patch('/contracts/{id}', [ContractController::class, 'update']);
    Route::delete('/contracts/{id}', [ContractController::class, 'destroy']);
    Route::post('/contracts/{id}/send', [ContractController::class, 'send']);
    Route::post('/contracts/{id}/approve', [ContractController::class, 'approve']);
    Route::post('/contracts/{id}/reject', [ContractController::class, 'reject']);
    Route::post('/contracts/{id}/revision', [ContractController::class, 'uploadRevision']);
    Route::post('/contracts/{id}/version', [ContractController::class, 'changeVersion']);
    Route::post('/contracts/{id}/attachments', [ContractController::class, 'uploadAttachment']);
    Route::delete('/contracts/{id}/attachments/{atId}', [ContractController::class, 'deleteAttachment']);
    Route::get('/contracts/{id}/download', [ContractController::class, 'download'])->name('api.contracts.download');
    Route::get('/contracts/{id}/file/{versionNo}', [ContractController::class, 'fileContent'])->name('api.contracts.file-url');
    Route::get('/contracts/{id}/attachment/{atId}', [ContractController::class, 'attachmentFile'])->name('api.contracts.attachment-file');
    Route::get('/contracts/{id}/pdf/{versionNo}', [ContractController::class, 'pdfPreview'])->name('api.contracts.pdf-preview');
    Route::get('/contracts/{id}/attachment-pdf/{atId}', [ContractController::class, 'attachmentPdfPreview'])->name('api.contracts.attachment-pdf-preview');
    Route::get('/contracts/{id}/vendor-document/{docId}', [ContractController::class, 'vendorDocumentFile'])->name('api.contracts.vendor-document-file');
    Route::get('/contracts/{id}/vendor-document-pdf/{docId}', [ContractController::class, 'vendorDocumentPdfPreview'])->name('api.contracts.vendor-document-pdf-preview');

    // ── Contract Transactions (Messages, Forms, Agreements, Audit) ──
    Route::get('/contracts/{contractId}/messages', [ContractMessageController::class, 'index']);
    Route::post('/contracts/{contractId}/messages', [ContractMessageController::class, 'store']);
    Route::post('/contracts/{contractId}/messages/read', [ContractMessageController::class, 'markRead']);

    Route::get('/contracts/{id}/form-submissions/{type}', [ContractController::class, 'getFormSubmission']);
    Route::post('/contracts/{id}/form-submissions', [ContractController::class, 'saveFormSubmission']);
    Route::get('/contracts/{id}/form-submissions/{type}/compare', [ContractController::class, 'compareFormVersions']);
    Route::get('/contracts/{id}/form-submissions/{type}/pdf/queue', [ContractController::class, 'exportFormSubmissionPdfQueue'])->name('api.contracts.form-submissions.pdf.queue');
    Route::get('/contracts/{id}/form-submissions/{type}/pdf', [ContractController::class, 'exportFormSubmissionPdf'])->name('api.contracts.form-submissions.pdf');

    Route::post('/contracts/{id}/agreement', [ContractController::class, 'uploadAgreement']);
    Route::get('/contracts/{id}/agreement/versions', [ContractController::class, 'getAgreementVersions']);
    Route::get('/contracts/{id}/agreement/compare', [ContractController::class, 'compareAgreementVersions']);

    Route::get('/contracts/{id}/audit-trail', [ContractController::class, 'getAuditTrail']);
    Route::get('/contracts/{id}/audit-trail/document', [ContractController::class, 'renderAuditDocument'])->name('api.contracts.audit.document');
    Route::get('/contracts/{id}/audit-trail/pdf', [ContractController::class, 'exportAuditPdf'])->name('api.contracts.audit.pdf');
    Route::get('/contracts/{id}/audit-trail/pdf/queue', [ContractController::class, 'exportAuditPdfQueue'])->name('api.contracts.audit.pdf.queue');
    Route::get('/contracts/{id}/approval/pdf/queue', [ContractController::class, 'exportApprovalTimelinePdfQueue'])->name('api.contracts.approval.pdf.queue');
    Route::get('/contracts/{id}/audit-trail/excel', [ContractController::class, 'exportAuditExcel'])->name('api.contracts.audit.excel');

    // Bulk Actions
    Route::post('/contracts/bulk-delete', [ContractController::class, 'bulkDestroy']);
    Route::post('/contracts/bulk-approve', [ContractController::class, 'bulkApprove']);

    // Helpers
    Route::get('/form-templates/{id}/fields', function ($id) {
        $tpl = \App\Models\FormTemplate::with(['fields' => fn($q) => $q->orderBy('order')])->findOrFail($id);
        return response()->json($tpl);
    });

    // ── Admin Data API ──
    Route::prefix('admin')->group(function () {
        Route::get('/reports/data', [ReportController::class, 'index']);
        Route::get('/reports/export', [ReportController::class, 'exportCsv']);
        Route::get('/reports/audit/export', [ReportController::class, 'exportAuditCsv']);
        Route::get('/templates/data', [TemplateController::class, 'getApiData']);

        // Users
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser']);
        Route::post('/users/bulk-delete', [AdminController::class, 'bulkDestroyUser']);

        // Roles
        Route::get('/roles', [AdminController::class, 'roles']);
        Route::post('/roles', [AdminController::class, 'storeRole']);
        Route::put('/roles/{role}', [AdminController::class, 'updateRole']);
        Route::delete('/roles/{role}', [AdminController::class, 'destroyRole']);
        Route::post('/roles/bulk-delete', [AdminController::class, 'bulkDestroyRole']);
        Route::get('/roles/{role}/config', [AdminController::class, 'roleConfig']);
        Route::post('/roles/{role}/access', [AdminController::class, 'updateRoleAccess']);
        Route::post('/roles/{role}/navigation/reorder', [AdminController::class, 'reorderRoleNavigation']);

        // Departments
        Route::get('/departments', [AdminController::class, 'departments']);
        Route::post('/departments', [AdminController::class, 'storeDepartment']);
        Route::put('/departments/{department}', [AdminController::class, 'updateDepartment']);
        Route::delete('/departments/{department}', [AdminController::class, 'destroyDepartment']);
        Route::post('/departments/bulk-delete', [AdminController::class, 'bulkDestroyDepartment']);

        // Contract Types
        Route::get('/contract-types', [AdminController::class, 'contractTypes']);
        Route::post('/contract-types', [AdminController::class, 'storeContractType']);
        Route::put('/contract-types/{type}', [AdminController::class, 'updateContractType']);
        Route::delete('/contract-types/{type}', [AdminController::class, 'destroyContractType']);
        Route::post('/contract-types/bulk-delete', [AdminController::class, 'bulkDestroyContractTypes']);

        // Contract Statuses
        Route::get('/contract-statuses', [AdminController::class, 'contractStatuses']);
        Route::post('/contract-statuses', [AdminController::class, 'storeContractStatus']);
        Route::put('/contract-statuses/{status}', [AdminController::class, 'updateContractStatus']);
        Route::delete('/contract-statuses/{status}', [AdminController::class, 'destroyContractStatus']);
        Route::post('/contract-statuses/bulk-delete', [AdminController::class, 'bulkDestroyStatuses']);

        // Vendors
        Route::get('/vendors', [AdminController::class, 'vendors']);
        Route::post('/vendors', [AdminController::class, 'storeVendor']);
        Route::put('/vendors/{vendor}', [AdminController::class, 'updateVendor']);
        Route::delete('/vendors/{vendor}', [AdminController::class, 'destroyVendor']);
        Route::post('/vendors/bulk-delete', [AdminController::class, 'bulkDestroyVendor']);
        Route::post('/vendors/{vendor}/documents', [AdminController::class, 'uploadVendorDocument']);
        Route::delete('/vendors/{vendor}/documents/{document}', [AdminController::class, 'destroyVendorDocument']);

        // Workflows
        Route::get('/workflows', [AdminController::class, 'workflows']);
        Route::post('/workflows', [AdminController::class, 'storeWorkflow']);
        Route::put('/workflows/{workflow}', [AdminController::class, 'updateWorkflow']);
        Route::delete('/workflows/{workflow}', [AdminController::class, 'destroyWorkflow']);
        Route::post('/workflows/bulk-delete', [AdminController::class, 'bulkDestroyWorkflows']);
        Route::get('/workflows/{workflow}/steps', [AdminController::class, 'workflowSteps']);
        Route::post('/workflows/{workflow}/steps', [AdminController::class, 'updateWorkflowSteps']);

        // Company Groups, Regions, Companies
        Route::get('/company-groups', [AdminController::class, 'companyGroups']);
        Route::post('/company-groups', [AdminController::class, 'storeCompanyGroup']);
        Route::put('/company-groups/{group}', [AdminController::class, 'updateCompanyGroup']);
        Route::delete('/company-groups/{group}', [AdminController::class, 'destroyCompanyGroup']);
        Route::post('/company-groups/bulk-delete', [AdminController::class, 'bulkDestroyCompanyGroup']);

        Route::get('/regions', [AdminController::class, 'regions']);
        Route::post('/regions', [AdminController::class, 'storeRegion']);
        Route::put('/regions/{region}', [AdminController::class, 'updateRegion']);
        Route::delete('/regions/{region}', [AdminController::class, 'destroyRegion']);
        Route::post('/regions/bulk-delete', [AdminController::class, 'bulkDestroyRegion']);

        Route::get('/companies', [AdminController::class, 'companies']);
        Route::post('/companies', [AdminController::class, 'storeCompany']);
        Route::put('/companies/{company}', [AdminController::class, 'updateCompany']);
        Route::delete('/companies/{company}', [AdminController::class, 'destroyCompany']);
        Route::post('/companies/bulk-delete', [AdminController::class, 'bulkDestroyCompany']);
    });
});
