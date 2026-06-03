<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Fetch recent contracts created by user or where user is an approver
        $recentContracts = \App\Models\Contract::where('created_by', $user->id)
            ->orWhereHas('approvals', fn ($q) => $q->where('user_id', $user->id))
            ->with(['contractType', 'creator', 'workflow', 'approvals'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'type' => $c->contractType?->name,
                'status' => $c->status,
                'progress' => $c->progressData(),
                'time_ago' => $c->created_at->diffForHumans(),
            ]);

        // Fetch colleagues (collaborators) from the same department
        $collaborators = \App\Models\User::where('department_id', $user->department_id)
            ->where('id', '!=', $user->id)
            ->take(8)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'initials' => $u->initials,
                'bg_color' => $u->bg_color,
                'text_color' => $u->text_color,
            ]);

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'department' => $user->department->name ?? 'N/A',
            'recentContracts' => $recentContracts,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'phone' => $user->phone,
                'position' => $user->position,
                'company' => $user->company?->name,
                'location' => $user->company?->address,
                'group' => $user->company?->group?->name,
                'region' => $user->company?->region?->name,
                'bio' => $user->bio,
                'role' => $user->role,
                'initials' => $user->initials,
                'bg_color' => $user->bg_color,
                'text_color' => $user->text_color,
                'created_at' => $user->created_at->isoFormat('D MMMM YYYY'),
            ],
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
