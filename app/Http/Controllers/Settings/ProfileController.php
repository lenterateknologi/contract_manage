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
use App\Traits\ApiResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response|\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $formattedUser = $this->formatUserProfile($user);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return $this->successResponse($formattedUser, 'Profile retrieved successfully');
        }

        $data = [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'department' => $user->department->name ?? 'N/A',
            'user' => $formattedUser,
        ];

        return Inertia::render('settings/profile', $data);
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
            'can_create_on_behalf' => (bool) $user->can_create_on_behalf,
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

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return $this->successResponse($this->formatUserProfile($user), 'Profil berhasil disimpan');
        }

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
