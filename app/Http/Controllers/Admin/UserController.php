<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    #[OA\Get(
        path: '/api/admin/users',
        summary: 'Get list of users',
        tags: ['Admin'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'List of users'),
        ],
    )]
    public function index(Request $request)
    {
        $query = User::with('department')
            ->when($request->search, function ($q, $search) {
                $search = strtolower($search);
                $q->where(function ($qq) use ($search) {
                    $qq->where(\Illuminate\Support\Facades\DB::raw('LOWER(name)'), 'like', "%{$search}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(email)'), 'like', "%{$search}%")
                        ->orWhere(\Illuminate\Support\Facades\DB::raw('LOWER(username)'), 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($q, $role) {
                $q->whereIn('role', (array) $role);
            })
            ->when($request->department_id, function ($q, $deptId) {
                $q->whereIn('department_id', (array) $deptId);
            });

        if ($request->wantsJson()) {
            return response()->json([
                'users' => $query->orderBy('name')->paginate($request->input('per_page', 10)),
                'roles' => Role::orderBy('name')->get(),
                'departments' => Department::orderBy('name')->get(),
            ]);
        }

        return Inertia::render('admin/index', [
            'currentView' => 'users',
            'users' => $query->orderBy('name')->paginate($request->input('per_page', 10))->withQueryString(),
            'roles' => Role::orderBy('name')->get(),
            'departments' => Department::orderBy('name')->get(),
            'filters' => $request->only(['search', 'role', 'department_id']),
            'breadcrumbs' => [
                ['title' => 'Administrasi', 'href' => '#', 'icon' => 'ShieldCheck'],
                ['title' => 'Manajemen User', 'href' => route('admin.users'), 'description' => 'Kelola akses dan profil pengguna sistem.', 'icon' => 'Users'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:m_users,email',
            'username' => 'required|string|max:20|unique:m_users,username',
            'password' => 'required|string|min:8',
            'role' => 'required|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'department_id' => 'nullable|uuid|exists:m_departments,id',
            'is_active' => 'boolean',
        ]);

        $data['password'] = bcrypt($data['password']);
        $data['initials'] = collect(explode(' ', $data['name']))->map(fn ($n) => strtoupper(substr($n, 0, 1)))->take(2)->join('');

        $user = User::create($data);

        if ($request->wantsJson()) {
            return response()->json($user, 201);
        }

        return back()->with('success', 'User berhasil dibuat.');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:m_users,email,' . $user->id,
            'username' => 'required|string|max:20|unique:m_users,username,' . $user->id,
            'role' => 'required|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'department_id' => 'nullable|uuid|exists:m_departments,id',
            'is_active' => 'boolean',
            'password' => 'nullable|string|min:8',
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = bcrypt($data['password']);
        }

        $user->update($data);

        if ($request->wantsJson()) {
            return response()->json($user);
        }

        return back()->with('success', 'User berhasil diperbarui.');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === Auth::id()) {
            abort(403, 'Tidak dapat menghapus diri sendiri.');
        }
        $user->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'User berhasil dihapus.']);
        }

        return back()->with('success', 'User berhasil dihapus.');
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return back();
        }

        // Prevent deleting yourself
        if (in_array(Auth::id(), $ids)) {
            return back()->with('error', 'Tidak dapat menghapus diri sendiri.in bulk operation.');
        }

        User::whereIn('id', $ids)->delete();

        return back()->with('success', count($ids) . ' pengguna berhasil dihapus.');
    }
}
