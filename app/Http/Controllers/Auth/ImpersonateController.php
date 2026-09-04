<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonateController extends Controller
{
    /**
     * Search active users for impersonation dropdown/combobox.
     */
    public function search(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        $isImpersonating = session()->has('impersonator_id');

        if (! $currentUser || (! $currentUser->isAdmin() && ! $isImpersonating)) {
            return response()->json(['users' => []], 403);
        }

        $query = User::query()
            ->where('is_active', true)
            ->where('id', '!=', $currentUser->id);

        if ($search = trim((string) $request->input('q', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('nik', 'ilike', "%{$search}%")
                    ->orWhere('username', 'ilike', "%{$search}%")
                    ->orWhere('jobtitle_name', 'ilike', "%{$search}%")
                    ->orWhere('company_name', 'ilike', "%{$search}%")
                    ->orWhere('org_name', 'ilike', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')
            ->take(25)
            ->get()
            ->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'nik' => $u->nik ?? $u->username,
                    'email' => $u->email,
                    'role' => $u->role,
                    'job_title' => $u->jobtitle_name ?? $u->role,
                    'company' => $u->company_name,
                    'department' => $u->department_name ?? $u->org_name,
                    'initials' => $u->initials,
                ];
            });

        return response()->json(['users' => $users]);
    }

    /**
     * Switch login to the specified user.
     */
    public function switch(Request $request, string $userId): RedirectResponse
    {
        $currentUser = $request->user();
        $isImpersonating = session()->has('impersonator_id');

        if (! $currentUser || (! $currentUser->isAdmin() && ! $isImpersonating)) {
            abort(403, 'Akses ditolak: Hanya Super Admin / Admin yang dapat beralih akun.');
        }

        $targetUser = User::where('id', $userId)->where('is_active', true)->firstOrFail();

        // Preserve original admin ID in session
        $originalAdminId = $isImpersonating ? session('impersonator_id') : $currentUser->id;

        Auth::login($targetUser);
        $request->session()->regenerate();

        // Re-set impersonator_id in new session
        session(['impersonator_id' => $originalAdminId]);

        return redirect()->back()->with('success', "Berhasil beralih akun sebagai {$targetUser->name} ({$targetUser->role})");
    }

    /**
     * Leave impersonation and return to the original admin account.
     */
    public function leave(Request $request): RedirectResponse
    {
        if (! session()->has('impersonator_id')) {
            return redirect()->back();
        }

        $adminId = session('impersonator_id');
        session()->forget('impersonator_id');

        $adminUser = User::findOrFail($adminId);

        Auth::login($adminUser);
        $request->session()->regenerate();

        return redirect()->back()->with('success', "Kembali ke akun admin: {$adminUser->name}");
    }
}
