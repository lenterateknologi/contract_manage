<?php

use App\Http\Controllers\Admin\MasterConfigController;
use App\Http\Controllers\Admin\MasterDataAdminController;
use App\Http\Controllers\Admin\OrganizationController;
use App\Http\Controllers\Admin\VendorAdminController;
use App\Http\Controllers\Admin\WorkflowAdminController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\EmailTestController;
use App\Http\Controllers\FormTemplateController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TemplateController;
use App\Models\Contract;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
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

    // Version Comparison for any authorized user
    Route::get('/admin/contracts/{id}/form-submissions/{type}/compare', [ContractController::class, 'compareFormVersions'])->name('contracts.form-submissions.compare');
    Route::get('/admin/contracts/{id}/agreement/compare', [ContractController::class, 'compareAgreementVersions'])->name('contracts.agreement.compare');

    Route::middleware(['admin'])->prefix('admin')->group(function () {
        Route::get('/contracts', [ContractController::class, 'contractsView'])->defaults('view', 'contracts')->name('admin.contracts.index');
        Route::get('/audit', [ContractController::class, 'contractsView'])->defaults('view', 'audit')->name('admin.audit');

        Route::get('/contracts-data', [ContractController::class, 'index'])->name('contracts.data');
        Route::get('/contracts/workflows', [ContractController::class, 'getWorkflows'])->name('contracts.workflows');
        Route::get('/contracts/users', [ContractController::class, 'getUsers'])->name('contracts.users');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');

        Route::get('/users', [AdminController::class, 'users'])->name('admin.users');
        Route::get('/members', [AdminController::class, 'members'])->name('admin.members');
        Route::post('/users', [AdminController::class, 'storeUser'])->name('admin.users.store');
        Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('admin.users.update');
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('admin.users.destroy');
        Route::post('/users/bulk-delete', [AdminController::class, 'bulkDestroyUser'])->name('admin.users.bulk-destroy');

        Route::get('/contract-types', [MasterConfigController::class, 'contractTypes'])->name('admin.contract-types');
        Route::get('/contract-types/create', [MasterConfigController::class, 'createContractType'])->name('admin.contract-types.create');
        Route::get('/contract-types/{type}/edit', [MasterConfigController::class, 'editContractType'])->name('admin.contract-types.edit');
        Route::post('/contract-types', [MasterConfigController::class, 'storeContractType'])->name('admin.contract-types.store');
        Route::put('/contract-types/{type}', [MasterConfigController::class, 'updateContractType'])->name('admin.contract-types.update');
        Route::delete('/contract-types/{type}', [MasterConfigController::class, 'destroyContractType'])->name('admin.contract-types.destroy');
        Route::post('/contract-types/bulk-delete', [MasterConfigController::class, 'bulkDestroyContractTypes'])->name('admin.contract-types.bulk-destroy');

        // Master Status
        Route::get('/contract-statuses', [MasterConfigController::class, 'contractStatuses'])->name('admin.contract-statuses');
        Route::post('/contract-statuses', [MasterConfigController::class, 'storeContractStatus'])->name('admin.contract-statuses.store');
        Route::put('/contract-statuses/{status}', [MasterConfigController::class, 'updateContractStatus'])->name('admin.contract-statuses.update');
        Route::delete('/contract-statuses/{status}', [MasterConfigController::class, 'destroyContractStatus'])->name('admin.contract-statuses.delete');
        Route::post('/contract-statuses/bulk-delete', [MasterConfigController::class, 'bulkDestroyStatuses'])->name('admin.contract-statuses.bulk-destroy');

        // Master Group
        Route::get('/company-groups', [OrganizationController::class, 'companyGroups'])->name('admin.company-groups');
        Route::post('/company-groups', [OrganizationController::class, 'storeCompanyGroup'])->name('admin.company-groups.store');
        Route::put('/company-groups/{group}', [OrganizationController::class, 'updateCompanyGroup'])->name('admin.company-groups.update');
        Route::delete('/company-groups/{group}', [OrganizationController::class, 'destroyCompanyGroup'])->name('admin.company-groups.destroy');
        Route::post('/company-groups/bulk-delete', [OrganizationController::class, 'bulkDestroyCompanyGroup'])->name('admin.company-groups.bulk-destroy');

        // Master Region
        Route::get('/regions', [OrganizationController::class, 'regions'])->name('admin.regions');
        Route::post('/regions', [OrganizationController::class, 'storeRegion'])->name('admin.regions.store');
        Route::put('/regions/{region}', [OrganizationController::class, 'updateRegion'])->name('admin.regions.update');
        Route::delete('/regions/{region}', [OrganizationController::class, 'destroyRegion'])->name('admin.regions.destroy');
        Route::post('/regions/bulk-delete', [OrganizationController::class, 'bulkDestroyRegion'])->name('admin.regions.bulk-destroy');

        // Master Company
        Route::get('/companies', [OrganizationController::class, 'companies'])->name('admin.companies');
        Route::post('/companies', [OrganizationController::class, 'storeCompany'])->name('admin.companies.store');
        Route::put('/companies/{company}', [OrganizationController::class, 'updateCompany'])->name('admin.companies.update');
        Route::delete('/companies/{company}', [OrganizationController::class, 'destroyCompany'])->name('admin.companies.destroy');
        Route::post('/companies/bulk-delete', [OrganizationController::class, 'bulkDestroyCompany'])->name('admin.companies.bulk-destroy');

        Route::get('/numbering-formats', [MasterConfigController::class, 'numberingFormats'])->name('admin.numbering-formats');
        Route::put('/numbering-formats/{format}', [MasterConfigController::class, 'updateNumberingFormat'])->name('admin.numbering-formats.update');

        // Master Departemen
        Route::get('/departments', [MasterConfigController::class, 'departments'])->name('admin.departments');
        Route::post('/departments', [MasterConfigController::class, 'storeDepartment'])->name('admin.departments.store');
        Route::put('/departments/{department}', [MasterConfigController::class, 'updateDepartment'])->name('admin.departments.update');
        Route::delete('/departments/{department}', [MasterConfigController::class, 'destroyDepartment'])->name('admin.departments.destroy');
        Route::post('/departments/bulk-delete', [MasterConfigController::class, 'bulkDestroyDepartment'])->name('admin.departments.bulk-destroy');

        // Master Vendor
        Route::get('/vendors', [VendorAdminController::class, 'index'])->name('admin.vendors');
        Route::get('/vendors/create', [VendorAdminController::class, 'create'])->name('admin.vendors.create');
        Route::post('/vendors', [VendorAdminController::class, 'store'])->name('admin.vendors.store');
        Route::get('/vendors/{vendor}/edit', [VendorAdminController::class, 'edit'])->name('admin.vendors.edit');
        Route::put('/vendors/{vendor}', [VendorAdminController::class, 'update'])->name('admin.vendors.update');
        Route::delete('/vendors/{vendor}', [VendorAdminController::class, 'destroy'])->name('admin.vendors.destroy');
        Route::post('/vendors/bulk-delete', [VendorAdminController::class, 'bulkDestroy'])->name('admin.vendors.bulk-destroy');
        Route::post('/vendors/{vendor}/documents', [VendorAdminController::class, 'uploadDocument'])->name('admin.vendors.documents.upload');
        Route::delete('/vendors/{vendor}/documents/{document}', [VendorAdminController::class, 'destroyDocument'])->name('admin.vendors.documents.destroy');

        // Workflows
        Route::get('/workflows', [WorkflowAdminController::class, 'index'])->name('admin.workflows');
        Route::get('/workflows/create', [WorkflowAdminController::class, 'create'])->name('admin.workflows.create');
        Route::post('/workflows', [WorkflowAdminController::class, 'store'])->name('admin.workflows.store');
        Route::get('/workflows/export', [WorkflowAdminController::class, 'export'])->name('admin.workflows.export');
        Route::post('/workflows/import', [WorkflowAdminController::class, 'import'])->name('admin.workflows.import');
        Route::get('/workflows/{workflow}/edit', [WorkflowAdminController::class, 'edit'])->name('admin.workflows.edit');
        Route::put('/workflows/{workflow}', [WorkflowAdminController::class, 'update'])->name('admin.workflows.update');
        Route::delete('/workflows/{workflow}', [WorkflowAdminController::class, 'destroy'])->name('admin.workflows.destroy');
        Route::post('/workflows/bulk-delete', [WorkflowAdminController::class, 'bulkDestroy'])->name('admin.workflows.bulk-destroy');
        Route::get('/workflows/visualize', [WorkflowAdminController::class, 'visualize'])->name('admin.workflows.visualize');
        Route::get('/workflows/{workflow}/steps', [WorkflowAdminController::class, 'steps'])->name('admin.workflows.steps');
        Route::post('/workflows/{workflow}/steps', [WorkflowAdminController::class, 'updateSteps'])->name('admin.workflows.steps.update');
        Route::put('/workflows/master-actions/{id}', [WorkflowAdminController::class, 'updateMasterAction'])->name('admin.workflows.master-actions.update');
        Route::delete('/workflows/master-actions/{id}', [WorkflowAdminController::class, 'destroyMasterAction'])->name('admin.workflows.master-actions.destroy');

        // Master Data Sync
        Route::get('/master-data-sync', [MasterDataAdminController::class, 'index'])->name('admin.master-data-sync');
        Route::get('/master-data-sync/export', [MasterDataAdminController::class, 'export'])->name('admin.master-data-sync.export');
        Route::post('/master-data-sync/import', [MasterDataAdminController::class, 'import'])->name('admin.master-data-sync.import');

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
        Route::get('/navigation', [MasterConfigController::class, 'navigation'])->name('admin.navigation');
        Route::post('/navigation/reorder', [MasterConfigController::class, 'reorderNavigation'])->name('admin.navigation.reorder');

        Route::get('/module-groups', [MasterConfigController::class, 'moduleGroups'])->name('admin.module-groups.index');
        Route::post('/module-groups', [MasterConfigController::class, 'storeModuleGroup'])->name('admin.module-groups.store');
        Route::put('/module-groups/{group}', [MasterConfigController::class, 'updateModuleGroup'])->name('admin.module-groups.update');
        Route::delete('/module-groups/{group}', [MasterConfigController::class, 'destroyModuleGroup'])->name('admin.module-groups.destroy');
        Route::post('/module-groups/bulk-delete', [MasterConfigController::class, 'bulkDestroyModuleGroups'])->name('admin.module-groups.bulk-destroy');

        Route::get('/modules', [MasterConfigController::class, 'modules'])->name('admin.modules.index');
        Route::post('/modules', [MasterConfigController::class, 'storeModule'])->name('admin.modules.store');
        Route::put('/modules/{module}', [MasterConfigController::class, 'updateModule'])->name('admin.modules.update');
        Route::delete('/modules/{module}', [MasterConfigController::class, 'destroyModule'])->name('admin.modules.destroy');
        Route::post('/modules/bulk-delete', [MasterConfigController::class, 'bulkDestroyModules'])->name('admin.modules.bulk-destroy');

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

        Route::delete('/form-templates/{template}', [FormTemplateController::class, 'destroy'])->name('admin.form-templates.destroy');
        Route::post('/form-templates/bulk-delete', [FormTemplateController::class, 'bulkDestroy'])->name('admin.form-templates.bulk-destroy');
        Route::post('/form-templates/{template}/duplicate', [FormTemplateController::class, 'duplicate'])->name('admin.form-templates.duplicate');
        Route::patch('/form-templates/{template}/metadata', [FormTemplateController::class, 'updateMetadata'])->name('admin.form-templates.metadata.update');

        // API aliases have been moved to api.php

    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
