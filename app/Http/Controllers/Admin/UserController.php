<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use App\Support\PhoneHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with(['role', 'branch'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role_id', $role);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => Role::all(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'currentBranchId' => Branch::current()?->id,
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/users/create', [
            'roles' => Role::all(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'currentBranchId' => Branch::current()?->id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $phone = null;

        if ($request->has('phone')) {
            $phone = PhoneHelper::normalize($request->input('phone'));
            $request->merge(['phone' => $phone]);
        }
        $phoneRules = ['nullable', 'string', 'max:20'];

        if ($phone !== null) {
            $phoneRules[] = Rule::unique('users', 'phone');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => $phoneRules,
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'is_active' => ['boolean'],
            'is_waiter' => ['boolean'],
        ], [
            'phone.unique' => 'This phone number already exists. Please use another phone number.',
        ]);
        if (Role::find($validated['role_id'])?->slug === 'super_admin') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Super Admin accounts can only be created through the seeding system.']);

            return back();
        }

        $validated['password'] = Hash::make($validated['password'] ?? '12345678');
        $validated['is_active'] = $request->boolean('is_active');
        $validated['is_waiter'] = $request->boolean('is_waiter');
        $validated['email_verified_at'] = now();

        User::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User created successfully.']);

        return to_route('admin.users.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('admin/users/edit', [
            'user' => $user->load('role'),
            'roles' => Role::all(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $user->load('role');

        if ($user->role?->slug === 'super_admin') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'The Super Admin account cannot be edited.']);

            return back();
        }

        $phone = null;

        if ($request->has('phone')) {
            $phone = PhoneHelper::normalize($request->input('phone'));
            $request->merge(['phone' => $phone]);
        }

        $phoneRules = ['nullable', 'string', 'max:20'];

        if ($phone !== null) {
            $phoneRules[] = Rule::unique('users', 'phone')->ignore($user->id);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => $phoneRules,
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'is_active' => ['boolean'],
            'is_waiter' => ['boolean'],
        ]);

        if (Role::find($validated['role_id'])?->slug === 'super_admin') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Super Admin accounts can only be created through the seeding system.']);

            return back();
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $validated['is_active'] = $request->boolean('is_active');
        $validated['is_waiter'] = $request->boolean('is_waiter');

        $user->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'User updated successfully.']);

        return to_route('admin.users.index');
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->load('role');

        if ($user->role?->slug === 'super_admin') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'The Super Admin account cannot be deleted.',
            ]);

            return back();
        }

        if ($user->id === Auth::id()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'You cannot delete your own account.',
            ]);

            return back();
        }

        $user->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'User deleted successfully.',
        ]);

        return to_route('admin.users.index');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        $user->load('role');

        if ($user->role?->slug === 'super_admin') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'The Super Admin account cannot be deactivated.',
            ]);

            return back();
        }

        if ($user->id === Auth::id()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'You cannot deactivate your own account.',
            ]);

            return back();
        }

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $user->is_active
                ? 'User activated successfully.'
                : 'User deactivated successfully.',
        ]);

        return back();
    }
}
