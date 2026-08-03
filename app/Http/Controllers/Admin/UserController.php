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
     * Users assigned to the current branch via pivot are included.
     */
    private function assertUserAccessible(Request $request, User $user): void
    {
        if ($user->role?->slug === 'super_admin') {
            return;
        }

        $branchId = $this->currentBranchId($request);

        abort_unless(
            $user->canAccessBranch($branchId) ||
            (int) $user->branch_id === $branchId ||
            $user->assignedBranches()->where('branches.id', $branchId)->exists(),
            404
        );
    }

    /**
     * Normalize branch assignment payload.
     *
     * @return array<int>
     */
    private function resolveBranchIds(
        Request $request,
        ?Role $role,
        int $fallbackBranchId
    ): array {
        $branchIds = collect($request->input('branch_ids', []))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($request->filled('branch_id')) {
            $branchIds->push((int) $request->input('branch_id'));
        }

        $branchIds = $branchIds->unique()->values();

        if ($role?->slug === 'super_admin') {
            return $branchIds->all();
        }

        if ($branchIds->isEmpty()) {
            $branchIds->push($fallbackBranchId);
        }

        // Non-manager staff are limited to a single branch.
        if ($role?->slug !== 'manager') {
            return [$branchIds->first()];
        }

        return $branchIds->all();
    }

    /**
     * Display users for the current branch (plus global super admins).
     */
    public function index(Request $request): Response
    {
        $branchId = $this->currentBranchId($request);

        $users = User::with(['role', 'branch', 'assignedBranches'])
            ->where(function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                    ->orWhereHas('assignedBranches', function ($branchQuery) use ($branchId) {
                        $branchQuery->where('branches.id', $branchId);
                    })
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
                $query->where(function ($q) use ($branch) {
                    $q->where('branch_id', $branch)
                        ->orWhereHas('assignedBranches', function ($branchQuery) use ($branch) {
                            $branchQuery->where('branches.id', $branch);
                        });
                });
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
     * Store a new user with branch assignment.
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

            'branch_ids' => [
                'nullable',
                'array',
            ],

            'branch_ids.*' => [
                'integer',
                'exists:branches,id',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $role = Role::find($validated['role_id']);
        $assignedBranchIds = $this->resolveBranchIds(
            $request,
            $role,
            $branchId
        );

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make(
                $validated['password'] ?? '12345678'
            ),
            'role_id' => $validated['role_id'],
            'branch_id' => $assignedBranchIds[0] ?? null,
            'is_active' => $request->boolean('is_active'),
            'email_verified_at' => now(),
        ]);

        if ($role?->slug !== 'super_admin') {
            $user->syncAssignedBranches($assignedBranchIds);
        }

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
                'assignedBranches',
            ]),
            'roles' => Role::all(),
            'branches' => Branch::orderBy('name')->get(),
        ]);
    }

    /**
     * Update an existing user and branch assignments.
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

            'branch_ids' => [
                'nullable',
                'array',
            ],

            'branch_ids.*' => [
                'integer',
                'exists:branches,id',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        $role = Role::find($validated['role_id']);
        $assignedBranchIds = $this->resolveBranchIds(
            $request,
            $role,
            $branchId
        );

        $payload = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'role_id' => $validated['role_id'],
            'is_active' => $request->boolean('is_active'),
        ];

        if (! empty($validated['password'])) {
            $payload['password'] = Hash::make(
                $validated['password']
            );
        }

        if ($role?->slug === 'super_admin') {
            $payload['branch_id'] = $validated['branch_id']
                ?? $user->branch_id;
            $user->update($payload);
            $user->assignedBranches()->detach();
        } else {
            $payload['branch_id'] = $assignedBranchIds[0] ?? null;
            $user->update($payload);
            $user->syncAssignedBranches($assignedBranchIds);
        }

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

        $user->assignedBranches()->detach();
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
