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

require __DIR__.'/web/form-builder.php';

require __DIR__.'/web/settings.php';
require __DIR__.'/web/auth.php';
