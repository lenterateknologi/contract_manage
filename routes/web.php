<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractMessageController;
use App\Http\Controllers\EmailTestController;
use App\Http\Controllers\FormTemplateController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TemplateController;
use App\Models\Contract;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('auth/login', [
        'canResetPassword' => Route::has('password.request'),
        'status' => session('status'),
        'canTestEmail' => !app()->environment('production'),
    ]);
})->name('home');

// Email testing (only in non-production environments)
if (! app()->environment('production')) {
    Route::get('/email-test', [EmailTestController::class, 'index'])->name('email-test');
    Route::post('/email-test/send', [EmailTestController::class, 'sendTestEmail'])->name('email-test.send');
}

// ── Public Signed Routes for PDF Rendering (Browsershot) ──
Route::get('/form-templates/render-adhoc/{key}', [FormTemplateController::class, 'renderAdhoc'])
    ->name('admin.form-templates.render-adhoc')
    ->middleware('signed');

Route::get('/form-templates/{template}/render-print', [FormTemplateController::class, 'renderPrint'])
    ->name('admin.form-templates.render-print')
    ->middleware('signed');

Route::get('/api/contracts/{id}/approval/document/print', [ContractController::class, 'renderApprovalTimeline'])
    ->name('contracts.approval.document.print')
    ->middleware('signed');

Route::get('/api/contracts/{id}/audit-trail/document/print', [ContractController::class, 'renderAuditDocument'])
    ->name('contracts.audit.document.print')
    ->middleware('signed');


Route::middleware(['auth'])->group(function () {

    Route::get('dashboard', [ContractController::class, 'contractsView'])->defaults('view', 'dashboard')->name('dashboard');

    Route::get('contracts', [ContractController::class, 'contractsView'])->defaults('view', 'contracts')->name('contracts');
    Route::get('contracts/mine', [ContractController::class, 'contractsView'])->defaults('view', 'mine')->name('contracts.mine');
    Route::get('contracts/pending', [ContractController::class, 'contractsView'])->defaults('view', 'pending')->name('pending');
    Route::get('contracts/f1', [ContractController::class, 'contractsView'])->defaults('view', 'f1')->name('f1');
    Route::get('contracts/f2', [ContractController::class, 'contractsView'])->defaults('view', 'f2')->name('f2');
    Route::get('contracts/expiry', [ContractController::class, 'contractsView'])->defaults('view', 'expiry')->name('expiry');

    Route::get('my-contracts', [ContractController::class, 'contractsView'])->defaults('view', 'mine'); // Backward compat

    Route::get('contracts/{id}', [ContractController::class, 'showView'])->name('contracts.show');

    // ── Contract API (under web middleware so session auth works) ──
    Route::prefix('api')->group(function () {
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
        Route::get('/contracts/{id}/download', [ContractController::class, 'download'])->name('contracts.download');
        Route::get('/contracts/{id}/file/{versionNo}', [ContractController::class, 'fileContent'])->name('contracts.file-url');
        Route::get('/contracts/{id}/attachment/{atId}', [ContractController::class, 'attachmentFile'])->name('contracts.attachment-file');
        Route::get('/contracts/{id}/pdf/{versionNo}', [ContractController::class, 'pdfPreview'])->name('contracts.pdf-preview');
        Route::get('/contracts/{id}/attachment-pdf/{atId}', [ContractController::class, 'attachmentPdfPreview'])->name('contracts.attachment-pdf-preview');
        Route::get('/contracts/{id}/vendor-document/{docId}', [ContractController::class, 'vendorDocumentFile'])->name('contracts.vendor-document-file');
        Route::get('/contracts/{id}/vendor-document-pdf/{docId}', [ContractController::class, 'vendorDocumentPdfPreview'])->name('contracts.vendor-document-pdf-preview');

        // Form Submissions (F1/F2)
        Route::post('/contracts/{id}/form-submissions', [ContractController::class, 'saveFormSubmission']);
        Route::get('/contracts/{id}/form-submissions/{type}', [ContractController::class, 'getFormSubmission']);
        Route::get('/contracts/{id}/form-submissions/{type}/pdf', [ContractController::class, 'exportFormSubmissionPdf']);


        Route::get('/form-templates/{id}/fields', function ($id) {
            $tpl = \App\Models\FormTemplate::with(['fields' => fn($q) => $q->orderBy('order')])->findOrFail($id);
            return response()->json($tpl);
        });

        Route::get('/contracts/{contractId}/messages', [ContractMessageController::class, 'index']);
        Route::post('/contracts/{contractId}/messages', [ContractMessageController::class, 'store']);
        Route::post('/contracts/{contractId}/messages/read', [ContractMessageController::class, 'markRead']);

        // Agreement Data Management
        Route::post('/contracts/{id}/agreement', [ContractController::class, 'uploadAgreement']);
        Route::get('/contracts/{id}/agreement/versions', [ContractController::class, 'getAgreementVersions']);

        // Audit Trail
        Route::get('/contracts/{id}/audit-trail', [ContractController::class, 'getAuditTrail']);
        Route::get('/contracts/{id}/audit-trail/document', [ContractController::class, 'renderAuditDocument'])->name('contracts.audit.document');
        Route::get('/contracts/{id}/audit-trail/pdf', [ContractController::class, 'exportAuditPdf'])->name('contracts.audit.pdf');
        Route::get('/contracts/{id}/audit-trail/pdf/queue', [ContractController::class, 'exportAuditPdfQueue'])->name('contracts.audit.pdf.queue');
        Route::get('/contracts/{id}/approval/pdf/queue', [ContractController::class, 'exportApprovalTimelinePdfQueue'])->name('contracts.approval.pdf.queue');
        Route::get('/contracts/{id}/audit-trail/excel', [ContractController::class, 'exportAuditExcel'])->name('contracts.audit.excel');

        // Bulk Actions
        Route::post('/contracts/bulk-delete', [ContractController::class, 'bulkDestroy']);
        Route::post('/contracts/bulk-approve', [ContractController::class, 'bulkApprove']);
    });

    Route::middleware(['admin'])->prefix('admin')->group(function () {
        Route::get('/contracts', [ContractController::class, 'contractsView'])->defaults('view', 'contracts')->name('admin.contracts.index');
        Route::get('/audit', [ContractController::class, 'contractsView'])->defaults('view', 'audit')->name('admin.audit');

        Route::get('/contracts-data', [ContractController::class, 'index'])->name('contracts.data');
        Route::get('/contracts/workflows', [ContractController::class, 'getWorkflows'])->name('contracts.workflows');
        Route::get('/contracts/users', [ContractController::class, 'getUsers'])->name('contracts.users');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');

        Route::get('/users', [AdminController::class, 'users'])->name('admin.users');
        Route::post('/users', [AdminController::class, 'storeUser'])->name('admin.users.store');
        Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('admin.users.update');
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('admin.users.destroy');
        Route::post('/users/bulk-delete', [AdminController::class, 'bulkDestroyUser'])->name('admin.users.bulk-destroy');

        Route::get('/contract-types', [AdminController::class, 'contractTypes'])->name('admin.contract-types');
        Route::get('/contract-types/create', [AdminController::class, 'createContractType'])->name('admin.contract-types.create');
        Route::get('/contract-types/{type}/edit', [AdminController::class, 'editContractType'])->name('admin.contract-types.edit');
        Route::post('/contract-types', [AdminController::class, 'storeContractType'])->name('admin.contract-types.store');
        Route::put('/contract-types/{type}', [AdminController::class, 'updateContractType'])->name('admin.contract-types.update');
        Route::delete('/contract-types/{type}', [AdminController::class, 'destroyContractType'])->name('admin.contract-types.destroy');
        Route::post('/contract-types/bulk-delete', [AdminController::class, 'bulkDestroyContractTypes'])->name('admin.contract-types.bulk-destroy');

        // Master Status
        Route::get('/contract-statuses', [AdminController::class, 'contractStatuses'])->name('admin.contract-statuses');
        Route::post('/contract-statuses', [AdminController::class, 'storeContractStatus'])->name('admin.contract-statuses.store');
        Route::put('/contract-statuses/{status}', [AdminController::class, 'updateContractStatus'])->name('admin.contract-statuses.update');
        Route::delete('/contract-statuses/{status}', [AdminController::class, 'destroyContractStatus'])->name('admin.contract-statuses.delete');
        Route::post('/contract-statuses/bulk-delete', [AdminController::class, 'bulkDestroyStatuses'])->name('admin.contract-statuses.bulk-destroy');

        Route::get('/numbering-formats', [AdminController::class, 'numberingFormats'])->name('admin.numbering-formats');
        Route::put('/numbering-formats/{format}', [AdminController::class, 'updateNumberingFormat'])->name('admin.numbering-formats.update');

        // Master Departemen
        Route::get('/departments', [AdminController::class, 'departments'])->name('admin.departments');
        Route::post('/departments', [AdminController::class, 'storeDepartment'])->name('admin.departments.store');
        Route::put('/departments/{department}', [AdminController::class, 'updateDepartment'])->name('admin.departments.update');
        Route::delete('/departments/{department}', [AdminController::class, 'destroyDepartment'])->name('admin.departments.destroy');
        Route::post('/departments/bulk-delete', [AdminController::class, 'bulkDestroyDepartment'])->name('admin.departments.bulk-destroy');

        // Master Vendor
        Route::get('/vendors', [AdminController::class, 'vendors'])->name('admin.vendors');
        Route::get('/vendors/create', [AdminController::class, 'createVendor'])->name('admin.vendors.create');
        Route::post('/vendors', [AdminController::class, 'storeVendor'])->name('admin.vendors.store');
        Route::get('/vendors/{vendor}/edit', [AdminController::class, 'editVendor'])->name('admin.vendors.edit');
        Route::put('/vendors/{vendor}', [AdminController::class, 'updateVendor'])->name('admin.vendors.update');
        Route::delete('/vendors/{vendor}', [AdminController::class, 'destroyVendor'])->name('admin.vendors.destroy');
        Route::post('/vendors/bulk-delete', [AdminController::class, 'bulkDestroyVendor'])->name('admin.vendors.bulk-destroy');
        Route::post('/vendors/{vendor}/documents', [AdminController::class, 'uploadVendorDocument'])->name('admin.vendors.documents.upload');
        Route::delete('/vendors/{vendor}/documents/{document}', [AdminController::class, 'destroyVendorDocument'])->name('admin.vendors.documents.destroy');

        // Workflows
        Route::get('/workflows', [AdminController::class, 'workflows'])->name('admin.workflows');
        Route::get('/workflows/create', [AdminController::class, 'createWorkflow'])->name('admin.workflows.create');
        Route::post('/workflows', [AdminController::class, 'storeWorkflow'])->name('admin.workflows.store');
        Route::get('/workflows/{workflow}/edit', [AdminController::class, 'editWorkflow'])->name('admin.workflows.edit');
        Route::put('/workflows/{workflow}', [AdminController::class, 'updateWorkflow'])->name('admin.workflows.update');
        Route::delete('/workflows/{workflow}', [AdminController::class, 'destroyWorkflow'])->name('admin.workflows.destroy');
        Route::post('/workflows/bulk-delete', [AdminController::class, 'bulkDestroyWorkflows'])->name('admin.workflows.bulk-destroy');
        Route::get('/workflows/{workflow}/steps', [AdminController::class, 'workflowSteps'])->name('admin.workflows.steps');
        Route::post('/workflows/{workflow}/steps', [AdminController::class, 'updateWorkflowSteps'])->name('admin.workflows.steps.update');


        Route::get('/reports/analytics', function () {
            return Inertia::render('admin/reports/analytics', [
                'breadcrumbs' => [
                    ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                    ['title' => 'Analitik Kontrak', 'href' => route('admin.reports.analytics'), 'description' => 'Statistik dan rekapitulasi data kontrak.', 'icon' => 'BarChart3'],
                ],
            ]);
        })->name('admin.reports.analytics');

        Route::get('/reports/audit', function () {
            return Inertia::render('admin/reports/audit', [
                'breadcrumbs' => [
                    ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                    ['title' => 'Jejak Audit', 'href' => route('admin.reports.audit'), 'description' => 'Log aktivitas dan riwayat perubahan sistem.', 'icon' => 'History'],
                ],
            ]);
        })->name('admin.reports.audit');
        Route::post('/api/reports/data', [ReportController::class, 'index']);
        Route::get('/api/reports/export', [ReportController::class, 'exportCsv']);
        Route::get('/api/reports/audit/export', [ReportController::class, 'exportAuditCsv']);

        // Roles & Access
        Route::get('/roles', [AdminController::class, 'roles'])->name('admin.roles');
        Route::post('/roles', [AdminController::class, 'storeRole'])->name('admin.roles.store');
        Route::put('/roles/{role}', [AdminController::class, 'updateRole'])->name('admin.roles.update');
        Route::delete('/roles/{role}', [AdminController::class, 'destroyRole'])->name('admin.roles.destroy');
        Route::post('/roles/bulk-delete', [AdminController::class, 'bulkDestroyRole'])->name('admin.roles.bulk-destroy');
        Route::get('/roles/{role}/config', [AdminController::class, 'roleConfig'])->name('admin.roles.config');
        Route::post('/roles/{role}/access', [AdminController::class, 'updateRoleAccess'])->name('admin.roles.access.update');
        Route::post('/roles/{role}/reorder', [AdminController::class, 'reorderRoleNavigation'])->name('admin.roles.reorder');

        // Navigation Management (Combined)
        Route::get('/navigation', [AdminController::class, 'navigation'])->name('admin.navigation');
        Route::post('/navigation/reorder', [AdminController::class, 'reorderNavigation'])->name('admin.navigation.reorder');

        // Module Groups (Keep individual CRUD but we focus on navigation page)
        Route::get('/module-groups', [AdminController::class, 'moduleGroups'])->name('admin.module-groups.index');
        Route::post('/module-groups', [AdminController::class, 'storeModuleGroup'])->name('admin.module-groups.store');
        Route::put('/module-groups/{group}', [AdminController::class, 'updateModuleGroup'])->name('admin.module-groups.update');
        Route::delete('/module-groups/{group}', [AdminController::class, 'destroyModuleGroup'])->name('admin.module-groups.destroy');
        Route::post('/module-groups/bulk-delete', [AdminController::class, 'bulkDestroyModuleGroups'])->name('admin.module-groups.bulk-destroy');

        // Modules (Keep individual CRUD)
        Route::get('/modules', [AdminController::class, 'modules'])->name('admin.modules.index');
        Route::post('/modules', [AdminController::class, 'storeModule'])->name('admin.modules.store');
        Route::put('/modules/{module}', [AdminController::class, 'updateModule'])->name('admin.modules.update');
        Route::delete('/modules/{module}', [AdminController::class, 'destroyModule'])->name('admin.modules.destroy');
        Route::post('/modules/bulk-delete', [AdminController::class, 'bulkDestroyModules'])->name('admin.modules.bulk-destroy');

        // Email testing
        Route::post('/test-email', [EmailTestController::class, 'sendTestEmail'])->name('admin.test-email');

        // Template Management
        Route::get('/templates', [TemplateController::class, 'index'])->name('admin.templates.index');
        Route::post('/templates/folders', [TemplateController::class, 'storeFolder'])->name('admin.templates.folders.store');
        Route::put('/templates/folders/{folder}', [TemplateController::class, 'updateFolder'])->name('admin.templates.folders.update');
        Route::delete('/templates/folders/{folder}', [TemplateController::class, 'destroyFolder'])->name('admin.templates.folders.destroy');
        Route::post('/templates', [TemplateController::class, 'storeTemplate'])->name('admin.templates.store');
        Route::put('/templates/{template}', [TemplateController::class, 'updateTemplate'])->name('admin.templates.update');
        Route::delete('/templates/{template}', [TemplateController::class, 'destroyTemplate'])->name('admin.templates.destroy');
        Route::get('/templates/{template}/download', [TemplateController::class, 'downloadTemplate'])->name('admin.templates.download');
        Route::patch('/templates/folders/{folder}/move', [TemplateController::class, 'moveFolder'])->name('admin.templates.folders.move');
        Route::patch('/templates/{template}/move', [TemplateController::class, 'moveTemplate'])->name('admin.templates.move');

        // Form Templates (Digital Forms)
        Route::get('/form-templates', [FormTemplateController::class, 'index'])->name('admin.form-templates.index');
        Route::get('/form-templates/builder/{template?}', [FormTemplateController::class, 'builder'])->name('admin.form-templates.builder');
        Route::post('/form-templates/save/{template?}', [FormTemplateController::class, 'save'])->name('admin.form-templates.save');
        Route::post('/form-templates/export-adhoc', [FormTemplateController::class, 'exportAdhoc'])->name('admin.form-templates.export-adhoc');
        Route::post('/form-templates/export-queue', [FormTemplateController::class, 'exportAdhocQueue'])->name('admin.form-templates.export-queue');
        Route::get('/form-templates/pdf-status/{jobId}', [FormTemplateController::class, 'checkPdfStatus'])->name('admin.form-templates.pdf-status');
        Route::post('/form-templates/{template}/export-pdf', [FormTemplateController::class, 'exportPdf'])->name('admin.form-templates.export-pdf');
        Route::post('/form-templates/{template}/stream-pdf', [FormTemplateController::class, 'streamPdf'])->name('admin.form-templates.stream-pdf');

        // Contract Form Submission Exports (using admin prefix for consistency/reliability)
        Route::post('/contracts/{id}/form-submissions/{type}/export-queue', [ContractController::class, 'exportFormSubmissionPdfQueue'])->name('admin.contracts.export-queue');
        Route::get('/contracts/{id}/form-submissions/{type}/compare', [ContractController::class, 'compareFormVersions'])->name('admin.contracts.form-submissions.compare');
        Route::get('/contracts/{id}/agreement/compare', [ContractController::class, 'compareAgreementVersions'])->name('admin.contracts.agreement.compare');

        Route::delete('/form-templates/{template}', [FormTemplateController::class, 'destroy'])->name('admin.form-templates.destroy');
        Route::post('/form-templates/bulk-delete', [FormTemplateController::class, 'bulkDestroy'])->name('admin.form-templates.bulk-destroy');
        Route::post('/form-templates/{template}/duplicate', [FormTemplateController::class, 'duplicate'])->name('admin.form-templates.duplicate');
        Route::patch('/form-templates/{template}/metadata', [FormTemplateController::class, 'updateMetadata'])->name('admin.form-templates.metadata.update');




        Route::get('/api/contracts/message-attachment/{messageId}', [ContractMessageController::class, 'downloadAttachment'])->name('contracts.message-attachment');

        Route::get('/api/templates/data', [TemplateController::class, 'getApiData'])->name('admin.templates.api.data');

        // API aliases under admin prefix (called by frontend with /admin/api/... prefix)
        Route::get('/api/contracts/submission-types', [ContractController::class, 'getSubmissionTypes'])->name('admin.api.contracts.submission-types');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
