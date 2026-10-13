<?php

use App\Models\Master\Module;
use App\Models\Master\Role;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function (\Illuminate\Http\Request $request) {
    $user = Auth::user();
    if (! $user) {
        return redirect()->route('login');
    }

    $sidebarNavGroups = app(\App\Http\Middleware\HandleInertiaRequests::class)->share($request)['sidebarNavGroups'] ?? [];

    foreach ($sidebarNavGroups as $group) {
        if (! empty($group['items'])) {
            foreach ($group['items'] as $item) {
                if (! empty($item['url']) && $item['url'] !== '/' && $item['url'] !== '#') {
                    return redirect($item['url']);
                }
            }
        }
    }

    return redirect('/contracts/activity');
})->name('home');

Route::middleware(['auth'])->group(function () {
    require __DIR__.'/web/transactions.php';
    require __DIR__.'/web/master.php';
    require __DIR__.'/web/services.php';
    require __DIR__.'/web/discussions.php';
});

// ── Public Signed Routes for PDF Rendering (Browsershot) ──
Route::controller(\App\Http\Controllers\Contract\ContractExportController::class)->group(function () {
    Route::get('/api/contracts/{id}/approval/document/print', 'renderApprovalTimeline')->name('contracts.approval.document.print')->middleware('signed');
    Route::get('/api/contracts/{id}/audit-trail/document/print', 'renderAuditDocument')->name('contracts.audit.document.print')->middleware('signed');
    Route::get('/api/contracts/{id}/form-submissions/{type}/print', 'renderFormSubmission')->name('contracts.form-submissions.print')->middleware('signed');
});

require __DIR__.'/web/form-builder.php';

require __DIR__.'/web/settings.php';
require __DIR__.'/web/auth.php';
