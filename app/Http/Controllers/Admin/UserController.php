<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Get the currently selected branch ID.
     */
    private function currentBranchId(Request $request): int
    {
        $branchId = $request->session()->get('current_branch_id');

        if (! $branchId) {
            abort(400, 'No branch selected.');
        }

        return (int) $branchId;
    }

    /**
     * Branch-scoped users, plus global super admins.
     */
    private function assertUserAccessible(Request $request, User $user): void
    {
        if ($user->hasRole('super_admin')) {
            return;
        }

        abort_unless(
            (int) $user->branch_id === $this->currentBranchId($request),
            404
        );
    }

    /**
     * Display users for the current branch (plus global super admins).
     */
    public function index(Request $request): Response
    {
        $branchId = $this->currentBranchId($request);

        $users = User::with(['role', 'branch'])
            ->where(function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                    ->orWhereHas('role', function ($roleQuery) {
                        $roleQuery->where('slug', 'super_admin');
                    });
            })
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role_id', $role);
            })
            ->when($request->branch, function ($query, $branch) {
                $query->where('branch_id', $branch);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'roles' => Role::all(),
            'branches' => Branch::orderBy('name')->get(),
            'filters' => $request->only([
                'search',
                'role',
                'branch',
            ]),
        ]);
    }

    /**
     * Show create user page.
     */
    public function create(Request $request): Response
    {
        $this->currentBranchId($request);

        return Inertia::render('admin/users/create', [
            'roles' => Role::all(),
            'branches' => Branch::orderBy('name')->get(),
        ]);
    }

    /**
     * Store a new user in the current branch.
     */
    public function store(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranchId($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'password' => [
                'nullable',
                'string',
                'confirmed',
                Password::defaults(),
            ],

            'role_id' => [
                'required',
                'exists:roles,id',
            ],

            'branch_id' => [
                'nullable',
                'exists:branches,id',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $role = Role::find($validated['role_id']);

        // Super admins may remain global; everyone else is assigned to the current branch.
        if ($role?->slug === 'super_admin') {
            $validated['branch_id'] = $validated['branch_id'] ?? $branchId;
        } else {
            $validated['branch_id'] = $branchId;
        }

        $validated['password'] = Hash::make(
            $validated['password'] ?? '12345678'
        );

        $validated['is_active'] = $request->boolean(
            'is_active'
        );

        $validated['email_verified_at'] = now();

        User::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'User created successfully.',
        ]);

        return to_route('admin.users.index');
    }

    /**
     * Show edit user page.
     */
    public function edit(Request $request, User $user): Response
    {
        $this->assertUserAccessible($request, $user);

        return Inertia::render('admin/users/edit', [
            'user' => $user->load([
                'role',
                'branch',
            ]),
            'roles' => Role::all(),
            'branches' => Branch::orderBy('name')->get(),
        ]);
    }

    /**
     * Update an existing user.
     */
    public function update(
        Request $request,
        User $user
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);
        $this->assertUserAccessible($request, $user);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email,' . $user->id,
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'password' => [
                'nullable',
                'string',
                'confirmed',
                Password::defaults(),
            ],

            'role_id' => [
                'required',
                'exists:roles,id',
            ],

            'branch_id' => [
                'nullable',
                'exists:branches,id',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $role = Role::find($validated['role_id']);

        // Prevent moving branch-scoped users to another branch via form tampering.
        if ($role?->slug === 'super_admin') {
            $validated['branch_id'] = $validated['branch_id'] ?? $user->branch_id;
        } else {
            $validated['branch_id'] = $branchId;
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make(
                $validated['password']
            );
        }

        $validated['is_active'] = $request->boolean(
            'is_active'
        );

        $user->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'User updated successfully.',
        ]);

        return to_route('admin.users.index');
    }

    /**
     * Delete a user.
     */
    public function destroy(
        Request $request,
        User $user
    ): RedirectResponse {
        $this->assertUserAccessible($request, $user);

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

    /**
     * Toggle user active status.
     */
    public function toggleStatus(
        Request $request,
        User $user
    ): RedirectResponse {
        $this->assertUserAccessible($request, $user);

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
