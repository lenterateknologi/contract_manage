<?php

use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\VendorAdminController;
use App\Http\Controllers\Admin\WorkflowAdminController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Template\TemplateController;
use Illuminate\Support\Facades\Route;

// ── Admin Data API (Master Data) ──
Route::prefix('admin')->group(function () {
    Route::controller(ReportController::class)->prefix('reports')->group(function () {
        Route::get('/data', 'index');
        Route::get('/export', 'exportCsv');
        Route::get('/audit/export', 'exportAuditCsv');
    });

    Route::get('/templates/data', [TemplateController::class, 'getApiData']);

    Route::controller(AdminController::class)->group(function () {
        // Users
        Route::prefix('users')->group(function () {
            Route::get('/', 'users');
            Route::post('/', 'storeUser');
            Route::put('/{user}', 'updateUser');
            Route::delete('/{user}', 'destroyUser');
            Route::post('/bulk-delete', 'bulkDestroyUser');
        });

        // Roles
        Route::prefix('roles')->group(function () {
            Route::get('/', 'roles');
            Route::post('/', 'storeRole');
            Route::put('/{role}', 'updateRole');
            Route::delete('/{role}', 'destroyRole');
            Route::post('/bulk-delete', 'bulkDestroyRole');
            Route::get('/{role}/config', 'roleConfig');
            Route::post('/{role}/access', 'updateRoleAccess');
            Route::post('/{role}/navigation/reorder', 'reorderRoleNavigation');
        });

        // Departments
        Route::prefix('departments')->group(function () {
            Route::get('/', 'departments');
            Route::post('/', 'storeDepartment');
            Route::put('/{department}', 'updateDepartment');
            Route::delete('/{department}', 'destroyDepartment');
            Route::post('/bulk-delete', 'bulkDestroyDepartment');
        });

        // Contract Types
        Route::prefix('contract-types')->group(function () {
            Route::get('/', 'contractTypes');
            Route::post('/', 'storeContractType');
            Route::put('/{type}', 'updateContractType');
            Route::delete('/{type}', 'destroyContractType');
            Route::post('/bulk-delete', 'bulkDestroyContractTypes');
        });

        // Contract Statuses
        Route::prefix('contract-statuses')->group(function () {
            Route::get('/', 'contractStatuses');
            Route::post('/', 'storeContractStatus');
            Route::put('/{status}', 'updateContractStatus');
            Route::delete('/{status}', 'destroyContractStatus');
            Route::post('/bulk-delete', 'bulkDestroyStatuses');
        });

        // Company Groups, Regions, Companies
        Route::prefix('company-groups')->group(function () {
            Route::get('/', 'companyGroups');
            Route::post('/', 'storeCompanyGroup');
            Route::put('/{group}', 'updateCompanyGroup');
            Route::delete('/{group}', 'destroyCompanyGroup');
            Route::post('/bulk-delete', 'bulkDestroyCompanyGroup');
        });

        Route::prefix('regions')->group(function () {
            Route::get('/', 'regions');
            Route::post('/', 'storeRegion');
            Route::put('/{region}', 'updateRegion');
            Route::delete('/{region}', 'destroyRegion');
            Route::post('/bulk-delete', 'bulkDestroyRegion');
        });

        Route::prefix('companies')->group(function () {
            Route::get('/', 'companies');
            Route::post('/', 'storeCompany');
            Route::put('/{company}', 'updateCompany');
            Route::delete('/{company}', 'destroyCompany');
            Route::post('/bulk-delete', 'bulkDestroyCompany');
        });
    });

    // Vendors
    Route::controller(VendorAdminController::class)->prefix('vendors')->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::put('/{vendor}', 'update');
        Route::delete('/{vendor}', 'destroy');
        Route::post('/bulk-delete', 'bulkDestroy');
        Route::post('/{vendor}/documents', 'uploadDocument');
        Route::delete('/{vendor}/documents/{document}', 'destroyDocument');
    });

    // Workflows
    Route::controller(WorkflowAdminController::class)->prefix('workflows')->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::put('/{workflow}', 'update');
        Route::delete('/{workflow}', 'destroy');
        Route::post('/bulk-delete', 'bulkDestroy');
        Route::get('/{workflow}/steps', 'steps');
        Route::post('/{workflow}/steps', 'updateSteps');
    });
});
