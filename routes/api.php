<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\VendorAdminController;
use App\Http\Controllers\Admin\WorkflowAdminController;
use App\Http\Controllers\Contract\ContractApprovalController;
use App\Http\Controllers\Contract\ContractController;
use App\Http\Controllers\Contract\ContractExportController;
use App\Http\Controllers\Contract\ContractFileController;
use App\Http\Controllers\Contract\ContractFormController;
use App\Http\Controllers\Contract\ContractMessageController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Template\TemplateController;
use App\Models\FormTemplate;
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
    Route::post('/contracts/{id}/send', [ContractApprovalController::class, 'send']);
    Route::post('/contracts/{id}/approve', [ContractApprovalController::class, 'approve']);
    Route::post('/contracts/{id}/reject', [ContractApprovalController::class, 'reject']);
    Route::post('/contracts/{id}/add-approver', [ContractApprovalController::class, 'addAdhocApprover']);
    Route::post('/contracts/{id}/submit-approvers', [ContractApprovalController::class, 'submitAdhocApprovers']);
    Route::delete('/contracts/{id}/approver/{approvalId}', [ContractApprovalController::class, 'removeAdhocApprover']);
    Route::post('/contracts/{id}/revision', [ContractFileController::class, 'uploadRevision']);
    Route::get('/contracts/{id}/revision/versions', [ContractFileController::class, 'getRevisionVersions']);
    Route::post('/contracts/{id}/version', [ContractFileController::class, 'changeVersion']);
    Route::post('/contracts/{id}/attachments', [ContractFileController::class, 'uploadAttachment']);
    Route::delete('/contracts/{id}/attachments/{atId}', [ContractFileController::class, 'deleteAttachment']);
    Route::get('/contracts/{id}/download', [ContractFileController::class, 'download'])->name('api.contracts.download');
    Route::get('/contracts/{id}/file/{versionNo}', [ContractFileController::class, 'fileContent'])->name('api.contracts.file-url');
    Route::get('/contracts/{id}/attachment/{atId}', [ContractFileController::class, 'attachmentFile'])->name('api.contracts.attachment-file');
    Route::get('/contracts/{id}/pdf/{versionNo}', [ContractFileController::class, 'pdfPreview'])->name('api.contracts.pdf-preview');
    Route::get('/contracts/{id}/attachment-pdf/{atId}', [ContractFileController::class, 'attachmentPdfPreview'])->name('api.contracts.attachment-pdf-preview');
    Route::get('/contracts/{id}/vendor-document/{docId}', [ContractFileController::class, 'vendorDocumentFile'])->name('api.contracts.vendor-document-file');
    Route::get('/contracts/{id}/vendor-document-pdf/{docId}', [ContractFileController::class, 'vendorDocumentPdfPreview'])->name('api.contracts.vendor-document-pdf-preview');

    // ── Contract Transactions (Messages, Forms, Agreements, Audit) ──
    Route::get('/contracts/{contractId}/messages', [ContractMessageController::class, 'index']);
    Route::post('/contracts/{contractId}/messages', [ContractMessageController::class, 'store']);
    Route::post('/contracts/{contractId}/messages/read', [ContractMessageController::class, 'markRead']);

    Route::get('/contracts/{id}/form-submissions/{type}', [ContractFormController::class, 'getFormSubmission']);
    Route::post('/contracts/{id}/form-submissions', [ContractFormController::class, 'saveFormSubmission']);
    Route::get('/contracts/{id}/form-submissions/{type}/compare', [ContractFormController::class, 'compareFormVersions']);
    Route::get('/contracts/{id}/form-submissions/{type}/pdf/queue', [ContractExportController::class, 'exportFormSubmissionPdfQueue'])->name('api.contracts.form-submissions.pdf.queue');
    Route::get('/contracts/{id}/form-submissions/{type}/pdf', [ContractExportController::class, 'exportFormSubmissionPdf'])->name('api.contracts.form-submissions.pdf');

    Route::post('/contracts/{id}/agreement', [ContractFileController::class, 'uploadAgreement']);
    Route::get('/contracts/{id}/agreement/versions', [ContractFileController::class, 'getAgreementVersions']);
    Route::get('/contracts/{id}/agreement/compare', [ContractFileController::class, 'compareAgreementVersions']);

    Route::get('/contracts/{id}/audit-trail', [ContractExportController::class, 'getAuditTrail']);
    Route::get('/contracts/{id}/audit-trail/document', [ContractExportController::class, 'renderAuditDocument'])->name('api.contracts.audit.document');
    Route::get('/contracts/{id}/audit-trail/pdf', [ContractExportController::class, 'exportAuditPdf'])->name('api.contracts.audit.pdf');
    Route::get('/contracts/{id}/audit-trail/pdf/queue', [ContractExportController::class, 'exportAuditPdfQueue'])->name('api.contracts.audit.pdf.queue');
    Route::get('/contracts/{id}/approval/pdf/queue', [ContractExportController::class, 'exportApprovalTimelinePdfQueue'])->name('api.contracts.approval.pdf.queue');
    Route::get('/contracts/{id}/audit-trail/excel', [ContractExportController::class, 'exportAuditExcel'])->name('api.contracts.audit.excel');

    // Bulk Actions
    Route::post('/contracts/bulk-delete', [ContractController::class, 'bulkDestroy']);
    Route::post('/contracts/bulk-approve', [ContractApprovalController::class, 'bulkApprove']);

    // Helpers
    Route::get('/form-templates/{id}/fields', function ($id) {
        $tpl = FormTemplate::with(['fields' => fn ($q) => $q->orderBy('order')])->findOrFail($id);

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
        Route::get('/vendors', [VendorAdminController::class, 'index']);
        Route::post('/vendors', [VendorAdminController::class, 'store']);
        Route::put('/vendors/{vendor}', [VendorAdminController::class, 'update']);
        Route::delete('/vendors/{vendor}', [VendorAdminController::class, 'destroy']);
        Route::post('/vendors/bulk-delete', [VendorAdminController::class, 'bulkDestroy']);
        Route::post('/vendors/{vendor}/documents', [VendorAdminController::class, 'uploadDocument']);
        Route::delete('/vendors/{vendor}/documents/{document}', [VendorAdminController::class, 'destroyDocument']);

        // Workflows
        Route::get('/workflows', [WorkflowAdminController::class, 'index']);
        Route::post('/workflows', [WorkflowAdminController::class, 'store']);
        Route::put('/workflows/{workflow}', [WorkflowAdminController::class, 'update']);
        Route::delete('/workflows/{workflow}', [WorkflowAdminController::class, 'destroy']);
        Route::post('/workflows/bulk-delete', [WorkflowAdminController::class, 'bulkDestroy']);
        Route::get('/workflows/{workflow}/steps', [WorkflowAdminController::class, 'steps']);
        Route::post('/workflows/{workflow}/steps', [WorkflowAdminController::class, 'updateSteps']);

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
