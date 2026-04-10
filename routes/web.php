<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractMessageController;
use App\Http\Controllers\EmailTestController;
use App\Http\Controllers\ReportController;
use App\Models\Contract;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

// Email testing (only in non-production environments)
if (! app()->environment('production')) {
    Route::get('/email-test', [EmailTestController::class, 'index'])->name('email-test');
    Route::post('/email-test/send', [EmailTestController::class, 'sendTestEmail'])->name('email-test.send');
}

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [ContractController::class, 'contractsView'])->defaults('view', 'dashboard')->name('dashboard');

    Route::get('contracts', [ContractController::class, 'contractsView'])->defaults('view', 'contracts')->name('contracts');
    Route::get('my-contracts', [ContractController::class, 'contractsView'])->defaults('view', 'mine')->name('contracts.mine');

    Route::get('pending', [ContractController::class, 'contractsView'])->defaults('view', 'pending')->name('pending');
    Route::get('f1', [ContractController::class, 'contractsView'])->defaults('view', 'f1')->name('f1');
    Route::get('f2', [ContractController::class, 'contractsView'])->defaults('view', 'f2')->name('f2');
    Route::get('expiry', [ContractController::class, 'contractsView'])->defaults('view', 'expiry')->name('expiry');

    Route::get('contracts/{id}', function ($id) {
        return Inertia::render('contracts/show', ['contractId' => $id]);
    })->name('contracts.show');

    // ── Contract API (under web middleware so session auth works) ──
    Route::prefix('api')->group(function () {
        Route::get('/contracts', [ContractController::class, 'index']);
        Route::get('/contract-types', [ContractController::class, 'getTypes']);
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

        Route::get('/contracts/{contractId}/messages', [ContractMessageController::class, 'index']);
        Route::post('/contracts/{contractId}/messages', [ContractMessageController::class, 'store']);
        Route::post('/contracts/{contractId}/messages/read', [ContractMessageController::class, 'markRead']);
    });

    Route::middleware(['admin'])->prefix('admin')->group(function () {
        Route::get('/contracts', [ContractController::class, 'contractsView'])->defaults('view', 'contracts')->name('admin.contracts.index');
        Route::get('/contracts-data', [ContractController::class, 'index'])->name('contracts.data');
        Route::get('/contracts/workflows', [ContractController::class, 'getWorkflows'])->name('contracts.workflows');
        Route::get('/contracts/users', [ContractController::class, 'getUsers'])->name('contracts.users');
        Route::post('/contracts', [ContractController::class, 'store'])->name('contracts.store');

        Route::get('/users', [AdminController::class, 'users'])->name('admin.users');
        Route::post('/users', [AdminController::class, 'storeUser'])->name('admin.users.store');
        Route::put('/users/{user}', [AdminController::class, 'updateUser'])->name('admin.users.update');
        Route::delete('/users/{user}', [AdminController::class, 'destroyUser'])->name('admin.users.destroy');

        Route::get('/contract-types', [AdminController::class, 'contractTypes'])->name('admin.contract-types');
        Route::post('/contract-types', [AdminController::class, 'storeContractType'])->name('admin.contract-types.store');
        Route::put('/contract-types/{type}', [AdminController::class, 'updateContractType'])->name('admin.contract-types.update');
        Route::delete('/contract-types/{type}', [AdminController::class, 'destroyContractType'])->name('admin.contract-types.destroy');

        Route::get('/workflows', [AdminController::class, 'workflows'])->name('admin.workflows');
        Route::post('/workflows', [AdminController::class, 'storeWorkflow'])->name('admin.workflows.store');
        Route::put('/workflows/{workflow}', [AdminController::class, 'updateWorkflow'])->name('admin.workflows.update');
        Route::delete('/workflows/{workflow}', [AdminController::class, 'destroyWorkflow'])->name('admin.workflows.destroy');

        Route::get('/roles', [AdminController::class, 'roles'])->name('admin.roles');
        Route::post('/roles', [AdminController::class, 'storeRole'])->name('admin.roles.store');
        Route::put('/roles/{role}', [AdminController::class, 'updateRole'])->name('admin.roles.update');
        Route::delete('/roles/{role}', [AdminController::class, 'destroyRole'])->name('admin.roles.destroy');

        Route::get('/reports', function () {
            return Inertia::render('admin/reports');
        })->name('admin.reports');
        Route::post('/api/reports/data', [ReportController::class, 'index']);
        Route::get('/api/reports/export', [ReportController::class, 'exportCsv']);
        Route::get('/api/reports/audit/export', [ReportController::class, 'exportAuditCsv']);

        // Roles & Access
        Route::get('/roles', [AdminController::class, 'roles'])->name('admin.roles');
        Route::post('/roles', [AdminController::class, 'storeRole'])->name('admin.roles.store');
        Route::put('/roles/{role}', [AdminController::class, 'updateRole'])->name('admin.roles.update');
        Route::delete('/roles/{role}', [AdminController::class, 'destroyRole'])->name('admin.roles.destroy');
        Route::get('/roles/{role}/access', [AdminController::class, 'roleAccess'])->name('admin.roles.access');
        Route::post('/roles/{role}/access', [AdminController::class, 'updateRoleAccess'])->name('admin.roles.access.update');
        Route::get('/roles/{role}/navigation', [AdminController::class, 'roleNavigation'])->name('admin.roles.navigation');
        Route::post('/roles/{role}/reorder', [AdminController::class, 'reorderRoleNavigation'])->name('admin.roles.reorder');

        // Navigation Management (Combined)
        Route::get('/navigation', [AdminController::class, 'navigation'])->name('admin.navigation');
        Route::post('/navigation/reorder', [AdminController::class, 'reorderNavigation'])->name('admin.navigation.reorder');

        // Module Groups (Keep individual CRUD but we focus on navigation page)
        Route::post('/module-groups', [AdminController::class, 'storeModuleGroup'])->name('admin.module-groups.store');
        Route::put('/module-groups/{group}', [AdminController::class, 'updateModuleGroup'])->name('admin.module-groups.update');
        Route::delete('/module-groups/{group}', [AdminController::class, 'destroyModuleGroup'])->name('admin.module-groups.destroy');

        // Modules (Keep individual CRUD)
        Route::post('/modules', [AdminController::class, 'storeModule'])->name('admin.modules.store');
        Route::put('/modules/{module}', [AdminController::class, 'updateModule'])->name('admin.modules.update');
        Route::delete('/modules/{module}', [AdminController::class, 'destroyModule'])->name('admin.modules.destroy');

        // Email testing
        Route::post('/test-email', [EmailTestController::class, 'sendTestEmail'])->name('admin.test-email');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
