<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\MasterConfigController;
use App\Http\Controllers\Admin\MasterDataAdminController;
use App\Http\Controllers\Admin\OrganizationController;
use App\Http\Controllers\Admin\VendorAdminController;
use App\Http\Controllers\Admin\WorkflowAdminController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\System\EmailTestController;
use App\Http\Controllers\Template\TemplateController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['admin'])->prefix('admin')->group(function () {
    Route::controller(AdminController::class)->group(function () {
        Route::prefix('users')->group(function () {
            Route::get('/', 'users')->name('admin.users');
            Route::get('/export', 'exportUsers')->name('admin.users.export');
            Route::post('/import', 'importUsers')->name('admin.users.import');
            Route::post('/', 'storeUser')->name('admin.users.store');
            Route::put('/{user}', 'updateUser')->name('admin.users.update');
            Route::delete('/{user}', 'destroyUser')->name('admin.users.destroy');
            Route::post('/bulk-delete', 'bulkDestroyUser')->name('admin.users.bulk-destroy');
        });

        Route::get('/members', 'members')->name('admin.members');

        Route::prefix('roles')->group(function () {
            Route::get('/', 'roles')->name('admin.roles');
            Route::post('/', 'storeRole')->name('admin.roles.store');
            Route::put('/{role}', 'updateRole')->name('admin.roles.update');
            Route::delete('/{role}', 'destroyRole')->name('admin.roles.destroy');
            Route::post('/bulk-delete', 'bulkDestroyRole')->name('admin.roles.bulk-destroy');
            Route::get('/{role}/config', 'roleConfig')->name('admin.roles.config');
            Route::post('/{role}/access', 'updateRoleAccess')->name('admin.roles.access.update');
            Route::post('/{role}/reorder', 'reorderRoleNavigation')->name('admin.roles.reorder');
        });

        Route::get('/access-mapping/{role?}', 'accessMapping')->name('admin.access-mapping');
        Route::get('/navigation-mapping/{role?}', 'navigationMapping')->name('admin.navigation-mapping');
    });

    Route::controller(MasterConfigController::class)->group(function () {
        Route::prefix('contract-types')->group(function () {
            Route::get('/', 'contractTypes')->name('admin.contract-types');
            Route::get('/create', 'createContractType')->name('admin.contract-types.create');
            Route::get('/{type}/edit', 'editContractType')->name('admin.contract-types.edit');
            Route::post('/', 'storeContractType')->name('admin.contract-types.store');
            Route::put('/{type}', 'updateContractType')->name('admin.contract-types.update');
            Route::delete('/{type}', 'destroyContractType')->name('admin.contract-types.destroy');
            Route::post('/bulk-delete', 'bulkDestroyContractTypes')->name('admin.contract-types.bulk-destroy');
        });

        Route::prefix('contract-statuses')->group(function () {
            Route::get('/', 'contractStatuses')->name('admin.contract-statuses');
            Route::post('/', 'storeContractStatus')->name('admin.contract-statuses.store');
            Route::put('/{status}', 'updateContractStatus')->name('admin.contract-statuses.update');
            Route::delete('/{status}', 'destroyContractStatus')->name('admin.contract-statuses.delete');
            Route::post('/bulk-delete', 'bulkDestroyStatuses')->name('admin.contract-statuses.bulk-destroy');
        });

        Route::prefix('numbering-formats')->group(function () {
            Route::get('/', 'numberingFormats')->name('admin.numbering-formats');
            Route::put('/{format}', 'updateNumberingFormat')->name('admin.numbering-formats.update');
        });

        Route::prefix('departments')->group(function () {
            Route::get('/', 'departments')->name('admin.departments');
            Route::post('/', 'storeDepartment')->name('admin.departments.store');
            Route::put('/{department}', 'updateDepartment')->name('admin.departments.update');
            Route::delete('/{department}', 'destroyDepartment')->name('admin.departments.destroy');
            Route::post('/bulk-delete', 'bulkDestroyDepartment')->name('admin.departments.bulk-destroy');
            Route::get('/export', 'exportDepartments')->name('admin.departments.export');
            Route::post('/import', 'importDepartments')->name('admin.departments.import');
        });

        Route::prefix('navigation')->group(function () {
            Route::get('/', 'navigation')->name('admin.navigation');
            Route::post('/reorder', 'reorderNavigation')->name('admin.navigation.reorder');
        });

        Route::prefix('module-groups')->group(function () {
            Route::get('/', 'moduleGroups')->name('admin.module-groups.index');
            Route::post('/', 'storeModuleGroup')->name('admin.module-groups.store');
            Route::put('/{group}', 'updateModuleGroup')->name('admin.module-groups.update');
            Route::delete('/{group}', 'destroyModuleGroup')->name('admin.module-groups.destroy');
            Route::post('/bulk-delete', 'bulkDestroyModuleGroups')->name('admin.module-groups.bulk-destroy');
        });

        Route::prefix('modules')->group(function () {
            Route::get('/', 'modules')->name('admin.modules.index');
            Route::post('/', 'storeModule')->name('admin.modules.store');
            Route::put('/{module}', 'updateModule')->name('admin.modules.update');
            Route::delete('/{module}', 'destroyModule')->name('admin.modules.destroy');
            Route::post('/bulk-delete', 'bulkDestroyModules')->name('admin.modules.bulk-destroy');
        });
    });

    Route::controller(OrganizationController::class)->group(function () {
        Route::prefix('company-groups')->group(function () {
            Route::get('/', 'companyGroups')->name('admin.company-groups');
            Route::post('/', 'storeCompanyGroup')->name('admin.company-groups.store');
            Route::put('/{group}', 'updateCompanyGroup')->name('admin.company-groups.update');
            Route::delete('/{group}', 'destroyCompanyGroup')->name('admin.company-groups.destroy');
            Route::post('/bulk-delete', 'bulkDestroyCompanyGroup')->name('admin.company-groups.bulk-destroy');
            Route::get('/export', 'exportCompanyGroups')->name('admin.company-groups.export');
            Route::post('/import', 'importCompanyGroups')->name('admin.company-groups.import');
        });

        Route::prefix('regions')->group(function () {
            Route::get('/', 'regions')->name('admin.regions');
            Route::post('/', 'storeRegion')->name('admin.regions.store');
            Route::put('/{region}', 'updateRegion')->name('admin.regions.update');
            Route::delete('/{region}', 'destroyRegion')->name('admin.regions.destroy');
            Route::post('/bulk-delete', 'bulkDestroyRegion')->name('admin.regions.bulk-destroy');
            Route::get('/export', 'exportRegions')->name('admin.regions.export');
            Route::post('/import', 'importRegions')->name('admin.regions.import');
        });

        Route::prefix('companies')->group(function () {
            Route::get('/', 'companies')->name('admin.companies');
            Route::post('/', 'storeCompany')->name('admin.companies.store');
            Route::put('/{company}', 'updateCompany')->name('admin.companies.update');
            Route::delete('/{company}', 'destroyCompany')->name('admin.companies.destroy');
            Route::post('/bulk-delete', 'bulkDestroyCompany')->name('admin.companies.bulk-destroy');
            Route::get('/export', 'exportCompanies')->name('admin.companies.export');
            Route::post('/import', 'importCompanies')->name('admin.companies.import');
        });
    });

    Route::controller(VendorAdminController::class)->prefix('vendors')->group(function () {
        Route::get('/', 'index')->name('admin.vendors');
        Route::get('/create', 'create')->name('admin.vendors.create');
        Route::post('/', 'store')->name('admin.vendors.store');
        Route::get('/export', 'export')->name('admin.vendors.export');
        Route::post('/import', 'import')->name('admin.vendors.import');
        Route::get('/{vendor}/edit', 'edit')->name('admin.vendors.edit');
        Route::put('/{vendor}', 'update')->name('admin.vendors.update');
        Route::delete('/{vendor}', 'destroy')->name('admin.vendors.destroy');
        Route::post('/bulk-delete', 'bulkDestroy')->name('admin.vendors.bulk-destroy');
        Route::post('/{vendor}/documents', 'uploadDocument')->name('admin.vendors.documents.upload');
        Route::delete('/{vendor}/documents/{document}', 'destroyDocument')->name('admin.vendors.documents.destroy');
    });

    Route::controller(WorkflowAdminController::class)->prefix('workflows')->group(function () {
        Route::get('/', 'index')->name('admin.workflows');
        Route::get('/create', 'create')->name('admin.workflows.create');
        Route::post('/', 'store')->name('admin.workflows.store');
        Route::get('/export', 'export')->name('admin.workflows.export');
        Route::post('/import', 'import')->name('admin.workflows.import');
        Route::get('/{workflow}/edit', 'edit')->name('admin.workflows.edit');
        Route::put('/{workflow}', 'update')->name('admin.workflows.update');
        Route::delete('/{workflow}', 'destroy')->name('admin.workflows.destroy');
        Route::post('/bulk-delete', 'bulkDestroy')->name('admin.workflows.bulk-destroy');
        Route::post('/{workflow}/duplicate', 'duplicate')->name('admin.workflows.duplicate');
        Route::get('/{workflow}/steps', 'steps')->name('admin.workflows.steps');
        Route::post('/{workflow}/steps', 'updateSteps')->name('admin.workflows.steps.update');
    });

    Route::controller(MasterDataAdminController::class)->prefix('master-data-sync')->group(function () {
        Route::get('/', 'index')->name('admin.master-data-sync');
        Route::get('/export', 'export')->name('admin.master-data-sync.export');
        Route::post('/import', 'import')->name('admin.master-data-sync.import');
        Route::post('/clean', 'clean')->name('admin.master-data-sync.clean');
    });

    Route::prefix('reports')->group(function () {
        Route::get('/analytics', function () {
            return Inertia::render('reports/analytics', [
                'breadcrumbs' => [
                    ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                    ['title' => 'Analitik Kontrak', 'href' => route('admin.reports.analytics'), 'description' => 'Statistik dan rekapitulasi data kontrak.', 'icon' => 'BarChart3'],
                ],
            ]);
        })->name('admin.reports.analytics');

        Route::get('/audit', function () {
            return Inertia::render('reports/audit', [
                'breadcrumbs' => [
                    ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                    ['title' => 'Jejak Audit', 'href' => route('admin.reports.audit'), 'description' => 'Log aktivitas dan riwayat perubahan sistem.', 'icon' => 'History'],
                ],
            ]);
        })->name('admin.reports.audit');

        Route::controller(ReportController::class)->prefix('api')->group(function () {
            Route::post('/data', 'index');
            Route::get('/export', 'exportCsv');
            Route::get('/audit/export', 'exportAuditCsv');
        });
    });

    Route::controller(TemplateController::class)->prefix('templates')->group(function () {
        Route::get('/', 'index')->name('admin.templates.index');
        Route::post('/folders', 'storeFolder')->name('admin.templates.folders.store');
        Route::put('/folders/{folder}', 'updateFolder')->name('admin.templates.folders.update');
        Route::delete('/folders/{folder}', 'destroyFolder')->name('admin.templates.folders.destroy');
        Route::post('/', 'storeTemplate')->name('admin.templates.store');
        Route::put('/{template}', 'updateTemplate')->name('admin.templates.update');
        Route::delete('/{template}', 'destroyTemplate')->name('admin.templates.destroy');
        Route::get('/{template}/download', 'downloadTemplate')->name('admin.templates.download');
        Route::patch('/folders/{folder}/move', 'moveFolder')->name('admin.templates.folders.move');
        Route::patch('/{template}/move', 'moveTemplate')->name('admin.templates.move');
    });

    Route::post('/test-email', [EmailTestController::class, 'sendTestEmail'])->name('admin.test-email');
});
