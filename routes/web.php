<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContractController;
use App\Http\Controllers\ContractMessageController;
use App\Http\Controllers\EmailTestController;
use App\Http\Controllers\ReportController;
use App\Models\Approval;
use App\Models\Contract;
use App\Models\ContractType;
use Illuminate\Support\Facades\DB;
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
    Route::get('dashboard', function () {
        $controller = app(ContractController::class);
        $contracts = Contract::with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader',
        ])->orderByDesc('created_at')->get();

        // Basic metrics for dashboard
        $query = Contract::query();
        $approvedContracts = (clone $query)->where('status', 'approved')->get();
        $avgDays = 0;
        if ($approvedContracts->count() > 0) {
            $totalDays = $approvedContracts->sum(function ($c) {
                $firstSentAt = Approval::where('contract_id', $c->id)->oldest()->value('created_at');

                return $firstSentAt ? $firstSentAt->diffInHours($c->updated_at) / 24 : 0;
            });
            $avgDays = round($totalDays / $approvedContracts->count(), 1);
        }

        $metrics = [
            'metrics' => [
                'avgCycleTime' => $avgDays,
                'totalContracts' => $query->count(),
                'pendingApprovals' => Approval::whereIn('contract_id', $contracts->pluck('id'))->where('status', 'pending')->count(),
                'approvedThisMonth' => (clone $query)->where('status', 'approved')
                    ->where('updated_at', '>=', now()->startOfMonth())
                    ->count(),
            ],
            'monthlyTrend' => Contract::leftJoin('contract_types', 'contracts.contract_type_id', '=', 'contract_types.id')
                ->select(
                    DB::raw("to_char(contracts.created_at, 'YYYY-MM') as month"),
                    'contract_types.name as type_name',
                    DB::raw('count(*) as count')
                )
                ->where('contracts.created_at', '>=', now()->subMonths(6))
                ->groupBy('month', 'type_name')
                ->orderBy('month')
                ->get()
                ->groupBy('month')
                ->map(function ($items, $month) {
                    return [
                        'month' => $month,
                        'types' => $items->map(fn ($i) => [
                            'name' => $i->type_name ?? 'Unspecified',
                            'count' => (int) $i->count,
                        ])->values(),
                        'total' => $items->sum('count'),
                    ];
                })->values(),
        ];

        return Inertia::render('contracts/index', [
            'currentView' => 'dashboard',
            'contracts' => $contracts->map(fn ($c) => $controller->formatContract($c)),
            'types' => ContractType::all(),
            'metrics' => $metrics,
        ]);
    })->name('dashboard');

    Route::get('contracts', function () {
        $controller = app(ContractController::class);
        $contracts = Contract::with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader',
        ])->orderByDesc('created_at')->get();

        return Inertia::render('contracts/index', [
            'currentView' => 'contracts',
            'contracts' => $contracts->map(fn ($c) => $controller->formatContract($c)),
            'types' => ContractType::all(),
        ]);
    })->name('contracts');

    Route::get('my-contracts', function () {
        $controller = app(ContractController::class);
        $contracts = Contract::where('created_by', auth()->id())->with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader',
        ])->orderByDesc('created_at')->get();

        return Inertia::render('contracts/index', [
            'currentView' => 'mine',
            'contracts' => $contracts->map(fn ($c) => $controller->formatContract($c)),
            'types' => ContractType::all(),
        ]);
    })->name('contracts.mine');

    Route::get('pending', function () {
        $controller = app(ContractController::class);
        $contracts = Contract::with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader',
        ])->orderByDesc('created_at')->get();

        return Inertia::render('contracts/index', [
            'currentView' => 'pending',
            'contracts' => $contracts->map(fn ($c) => $controller->formatContract($c)),
            'types' => ContractType::all(),
        ]);
    })->name('pending');

    Route::get('f1', function () {
        $controller = app(ContractController::class);
        $contracts = Contract::with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader',
        ])->orderByDesc('created_at')->get();

        return Inertia::render('contracts/index', [
            'currentView' => 'f1',
            'contracts' => $contracts->map(fn ($c) => $controller->formatContract($c)),
            'types' => ContractType::all(),
        ]);
    })->name('f1');

    Route::get('f2', function () {
        $controller = app(ContractController::class);
        $contracts = Contract::with([
            'creator', 'contractType', 'approvals.approver', 'approvals.workflowStep',
            'workflow.steps', 'versions.uploader', 'histories.actor', 'messages.user',
            'attachments.uploader',
        ])->orderByDesc('created_at')->get();

        return Inertia::render('contracts/index', [
            'currentView' => 'f2',
            'contracts' => $contracts->map(fn ($c) => $controller->formatContract($c)),
            'types' => ContractType::all(),
        ]);
    })->name('f2');

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

    // ── Admin Panel ──
    Route::middleware(['admin'])->prefix('admin')->group(function () {
        Route::get('/contracts', [ContractController::class, 'index'])->name('contracts.index');
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
        
        Route::get('/roles/{role}/access', [AdminController::class, 'roleAccess'])->name('admin.roles.access');
        Route::post('/roles/{role}/access', [AdminController::class, 'updateRoleAccess'])->name('admin.roles.access.update');

        // Email testing
        Route::post('/test-email', [EmailTestController::class, 'sendTestEmail'])->name('admin.test-email');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
