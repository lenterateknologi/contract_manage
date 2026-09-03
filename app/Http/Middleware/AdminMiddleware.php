<?php

namespace App\Http\Middleware;

use App\Models\AccessModule;
use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return redirect('/login');
        }

        $user = Auth::user();

        // Admin/Super Admin/is_admin always has access
        if ($user->role === 'Admin' || $user->role === 'Super Admin' || $user->is_admin) {
            return $next($request);
        }

        // For other roles, check database module access dynamically
        $role = Role::firstWhere('name', $user->role);
        if ($role) {
            $currentPath = '/'.ltrim($request->path(), '/');

            // Fetch accessible module routes for this role
            $accessibleRoutes = AccessModule::where('role_id', $role->id)
                ->where('can_read', true)
                ->with('module')
                ->get()
                ->pluck('module.route')
                ->filter()
                ->map(fn ($r) => '/'.ltrim($r, '/'))
                ->values();

            foreach ($accessibleRoutes as $route) {
                // Exact match or prefix match for sub-paths (e.g. /admin/templates/123/download under /admin/templates)
                if ($currentPath === $route || str_starts_with($currentPath, $route.'/')) {
                    return $next($request);
                }
            }
        }

        return redirect('/dashboard');
    }
}
