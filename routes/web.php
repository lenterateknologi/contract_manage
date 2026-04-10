<?php

use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractMessageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('auth/login');
})->name('home');

// Email testing (only in non-production environments)
if (!app()->environment('production')) {
    Route::get('/email-test', [\App\Http\Controllers\EmailTestController::class, 'index'])->name('email-test');
    Route::post('/email-test/send', [\App\Http\Controllers\EmailTestController::class, 'sendTestEmail'])->name('email-test.send');
}

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('contracts/index', ['currentView' => 'dashboard']);
    })->name('dashboard');

    Route::get('contracts', function () {
        return Inertia::render('contracts/index', ['currentView' => 'contracts']);
    })->name('contracts');

    Route::get('pending', function () {
        return Inertia::render('contracts/index', ['currentView' => 'pending']);
    })->name('pending');

    Route::get('f1', function () {
        return Inertia::render('contracts/index', ['currentView' => 'f1']);
    })->name('f1');

    Route::get('f2', function () {
        return Inertia::render('contracts/index', ['currentView' => 'f2']);
    })->name('f2');

    Route::get('audit', function () {
        return Inertia::render('contracts/index', ['currentView' => 'audit']);
    })->name('audit');

    Route::get('contracts/{id}', function ($id) {
        return Inertia::render('contracts/show', ['contractId' => $id]);
    })->name('contracts.show');

    // ── Contract API (under web middleware so session auth works) ──
    Route::prefix('api')->group(function () {
        Route::get('/contracts',                            [ContractController::class, 'index']);
        Route::get('/contract-types',                       [ContractController::class, 'getTypes']);
        Route::post('/contracts',                          [ContractController::class, 'store']);
        Route::get('/contracts/{id}',                      [ContractController::class, 'show']);
        Route::post('/contracts/{id}/send',                [ContractController::class, 'send']);
        Route::post('/contracts/{id}/approve',             [ContractController::class, 'approve']);
        Route::post('/contracts/{id}/reject',              [ContractController::class, 'reject']);
        Route::post('/contracts/{id}/revision',            [ContractController::class, 'uploadRevision']);
        Route::post('/contracts/{id}/version',             [ContractController::class, 'changeVersion']);
        Route::post('/contracts/{id}/attachments',         [ContractController::class, 'uploadAttachment']);
        Route::delete('/contracts/{id}/attachments/{atId}', [ContractController::class, 'deleteAttachment']);
        Route::get('/contracts/{id}/download',             [ContractController::class, 'download'])->name('contracts.download');
        Route::get('/contracts/{id}/file/{versionNo}',     [ContractController::class, 'fileContent'])->name('contracts.file-url');
        Route::get('/contracts/{id}/attachment/{atId}',    [ContractController::class, 'attachmentFile'])->name('contracts.attachment-file');
        Route::get('/contracts/{id}/pdf/{versionNo}',      [ContractController::class, 'pdfPreview'])->name('contracts.pdf-preview');
        Route::get('/contracts/{id}/attachment-pdf/{atId}', [ContractController::class, 'attachmentPdfPreview'])->name('contracts.attachment-pdf-preview');

        Route::get('/contracts/{contractId}/messages',     [ContractMessageController::class, 'index']);
        Route::post('/contracts/{contractId}/messages',    [ContractMessageController::class, 'store']);
        Route::post('/contracts/{contractId}/messages/read', [ContractMessageController::class, 'markRead']);
    });

    

    // ── Admin Panel ──
    Route::middleware(['admin'])->prefix('admin')->group(function () {
        Route::get('/users', [\App\Http\Controllers\AdminController::class, 'users'])->name('admin.users');
        Route::post('/users', [\App\Http\Controllers\AdminController::class, 'storeUser'])->name('admin.users.store');
        Route::put('/users/{user}', [\App\Http\Controllers\AdminController::class, 'updateUser'])->name('admin.users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\AdminController::class, 'destroyUser'])->name('admin.users.destroy');

        Route::get('/contract-types', [\App\Http\Controllers\AdminController::class, 'contractTypes'])->name('admin.contract-types');
        Route::post('/contract-types', [\App\Http\Controllers\AdminController::class, 'storeContractType'])->name('admin.contract-types.store');
        Route::put('/contract-types/{type}', [\App\Http\Controllers\AdminController::class, 'updateContractType'])->name('admin.contract-types.update');
        Route::delete('/contract-types/{type}', [\App\Http\Controllers\AdminController::class, 'destroyContractType'])->name('admin.contract-types.destroy');

        Route::get('/workflows', [\App\Http\Controllers\AdminController::class, 'workflows'])->name('admin.workflows');
        Route::post('/workflows', [\App\Http\Controllers\AdminController::class, 'storeWorkflow'])->name('admin.workflows.store');
        Route::put('/workflows/{workflow}', [\App\Http\Controllers\AdminController::class, 'updateWorkflow'])->name('admin.workflows.update');
        Route::delete('/workflows/{workflow}', [\App\Http\Controllers\AdminController::class, 'destroyWorkflow'])->name('admin.workflows.destroy');

        Route::get('/roles', [\App\Http\Controllers\AdminController::class, 'roles'])->name('admin.roles');
        Route::post('/roles', [\App\Http\Controllers\AdminController::class, 'storeRole'])->name('admin.roles.store');
        Route::put('/roles/{role}', [\App\Http\Controllers\AdminController::class, 'updateRole'])->name('admin.roles.update');
        Route::delete('/roles/{role}', [\App\Http\Controllers\AdminController::class, 'destroyRole'])->name('admin.roles.destroy');
        Route::get('/roles/{role}/access', [\App\Http\Controllers\AdminController::class, 'roleAccess'])->name('admin.roles.access');
        Route::post('/roles/{role}/access', [\App\Http\Controllers\AdminController::class, 'updateRoleAccess'])->name('admin.roles.access.update');

        // Email testing
        Route::post('/test-email', [\App\Http\Controllers\EmailTestController::class, 'sendTestEmail'])->name('admin.test-email');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
