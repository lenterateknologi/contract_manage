<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Contract;
use App\Models\User;
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

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'department' => $user->department->name ?? 'N/A',
            'recentContracts' => $this->getRecentContracts($user),
            'collaborators' => $this->getCollaborators($user),
            'user' => $this->formatUserProfile($user),
        ]);
    }

    /**
     * Fetch recent contracts created by user or where user is an approver.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getRecentContracts(User $user): array
    {
        return Contract::where('created_by', $user->id)
            ->orWhereHas('approvals', fn ($q) => $q->where('user_id', $user->id))
            ->with(['contractType', 'creator', 'workflow', 'approvals'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'form_no' => $c->form_no,
                'contract_no' => $c->contract_no,
                'title' => $c->title,
                'type' => $c->contractType?->name,
                'status' => $c->status,
                'progress' => $c->progressData(),
                'time_ago' => $c->created_at->diffForHumans(),
            ])
            ->all();
    }

    /**
     * Fetch colleagues (collaborators) from the same department/division.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getCollaborators(User $user): array
    {
        if (! $user->division_id) {
            return [];
        }

        return User::where('division_id', $user->division_id)
            ->where('id', '!=', $user->id)
            ->take(8)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'initials' => $u->initials,
            ])
            ->all();
    }

    /**
     * Format user details for profile view.
     *
     * @return array<string, mixed>
     */
    private function formatUserProfile(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'phone_number' => $user->phone_number,
            'company' => $user->company?->name,
            'location' => $user->company?->address,
            'group' => $user->company?->group?->name,
            'region' => $user->company?->region?->name,
            'role' => $user->role,
            'initials' => $user->initials,
            'image_src' => $user->image_src,
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar_url,
            'division_id' => $user->division_id,
            'department_id' => $user->division_id,
            'created_at' => $user->created_at->isoFormat('D MMMM YYYY'),
        ];
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if ($request->hasFile('photo')) {
            // Delete old photo if stored in storage
            if ($user->image_src && !str_starts_with($user->image_src, 'http') && \Illuminate\Support\Facades\Storage::disk('public')->exists($user->image_src)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($user->image_src);
            }

            $path = $request->file('photo')->store('avatars', 'public');
            $user->image_src = $path;
        }

        $userColumns = ['name', 'email', 'username', 'phone_number'];
        $updatableData = [];
        foreach ($userColumns as $col) {
            if (array_key_exists($col, $validated)) {
                $updatableData[$col] = $validated[$col];
            }
        }
        // Handle alias phone -> phone_number
        if (isset($validated['phone']) && !isset($validated['phone_number'])) {
            $updatableData['phone_number'] = $validated['phone'];
        }

        $user->fill($updatableData);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('profile.edit')
            ->with('status', 'profile-updated')
            ->with('success', 'Profil berhasil disimpan');
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
