<?php

use App\Models\Master\Module;
use App\Models\Master\Role;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $user = Auth::user();
    if (! $user) {
        return redirect()->route('login');
    }

    $role = $user->roleRelation ?? Role::find($user->role_id);
    if ($role) {
        $firstModule = Module::where('m_modules.showed_as_menu', true)
            ->where('m_modules.is_active', true)
            ->join('m_access_modules', 'm_modules.id', '=', 'm_access_modules.module_id')
            ->join('m_module_groups', 'm_access_modules.module_group_id', '=', 'm_module_groups.id')
            ->leftJoin('m_role_module_groups', function ($join) use ($role) {
                $join->on('m_module_groups.id', '=', 'm_role_module_groups.module_group_id')
                    ->where('m_role_module_groups.role_id', '=', $role->id);
            })
            ->where('m_access_modules.role_id', $role->id)
            ->where('m_access_modules.can_read', true)
            ->orderByRaw('COALESCE(m_role_module_groups.sequence, 9999) ASC')
            ->orderByRaw('COALESCE(m_access_modules.sequence, 9999) ASC')
            ->select('m_modules.route')
            ->first();

        if ($firstModule && ! empty($firstModule->route)) {
            return redirect($firstModule->route);
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
