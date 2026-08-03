<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use App\Models\Role;
use App\Models\User;
use App\Models\WaiterTableAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    /**
     * Display waiters and kitchen staff
     * for the currently selected branch.
     */
    public function index(Request $request): Response
    {
        $branchId = $request->session()->get('current_branch_id');

        if (!$branchId) {
            return Inertia::render('admin/staff/index', [
                'waiters' => [],
                'kitchenStaff' => [],
                'filters' => [
                    'search_waiter' => $request->search_waiter,
                    'status_waiter' => $request->status_waiter,
                    'search_kitchen' => $request->search_kitchen,
                    'status_kitchen' => $request->status_kitchen,
                ],
            ]);
        }

        $waiterRole = Role::where('slug', 'waiter')->first();
        $kitchenRole = Role::where('slug', 'kitchen_staff')->first();

        /*
        |--------------------------------------------------------------------------
        | Waiter Staff
        |--------------------------------------------------------------------------
        */

        $waiters = User::with([
                'role',
                'latestTableAssignment.table',
                'activeTableAssignments.table',
            ])
            ->where('branch_id', $branchId)
            ->where('role_id', $waiterRole?->id)
            ->when($request->search_waiter, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->status_waiter, function ($query, $status) {
                $query->where(
                    'is_active',
                    $status === 'active' ? 1 : 0
                );
            })
            ->latest()
            ->paginate(10, ['*'], 'waiter_page')
            ->withQueryString();

        /*
        |--------------------------------------------------------------------------
        | Kitchen Staff
        |--------------------------------------------------------------------------
        */

        $kitchenStaff = User::with('role')
            ->where('branch_id', $branchId)
            ->where('role_id', $kitchenRole?->id)
            ->when($request->search_kitchen, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->status_kitchen, function ($query, $status) {
                $query->where(
                    'is_active',
                    $status === 'active' ? 1 : 0
                );
            })
            ->latest()
            ->paginate(10, ['*'], 'kitchen_page')
            ->withQueryString();

        return Inertia::render('admin/staff/index', [
            'waiters' => $waiters,
            'kitchenStaff' => $kitchenStaff,
            'filters' => [
                'search_waiter' => $request->search_waiter,
                'status_waiter' => $request->status_waiter,
                'search_kitchen' => $request->search_kitchen,
                'status_kitchen' => $request->status_kitchen,
            ],
        ]);
    }

    /**
     * Create a new staff member
     * inside the currently selected branch.
     */
    public function store(Request $request): RedirectResponse
    {
        $branchId = $request->session()->get('current_branch_id');

        if (!$branchId) {
            return back()->withErrors([
                'branch' => 'Please select a branch before creating staff.',
            ]);
        }

        $validated = $request->validate([
            'first_name' => [
                'required',
                'string',
                'max:255',
            ],

            'last_name' => [
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
                'required',
                'string',
                'confirmed',
                Password::defaults(),
            ],

            'role_id' => [
                'required',
                'exists:roles,id',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Only Allow Waiter or Kitchen Staff Roles
        |--------------------------------------------------------------------------
        */

        $allowedRole = Role::whereIn('slug', [
            'waiter',
            'kitchen_staff',
        ])
            ->where('id', $validated['role_id'])
            ->exists();

        if (!$allowedRole) {
            return back()->withErrors([
                'role_id' => 'Only waiter and kitchen staff roles can be created here.',
            ])->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Create Staff
        |--------------------------------------------------------------------------
        */

        $role = Role::findOrFail($validated['role_id']);

        User::create([
            'name' => $validated['first_name']
                . ' '
                . $validated['last_name'],

            'email' => $validated['email'],

            'phone' => $validated['phone'] ?? null,

            'password' => Hash::make(
                $validated['password']
            ),

            'role_id' => $validated['role_id'],

            /*
             * IMPORTANT:
             * Branch is assigned automatically
             * from the current branch session.
             */
            'branch_id' => $branchId,

            'is_active' => $request->boolean(
                'is_active'
            ),

            'email_verified_at' => now(),
        ]);

        $roleLabel = $role->slug === 'waiter'
            ? 'Waiter'
            : 'Kitchen Staff';

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$roleLabel} created successfully.",
        ]);

        return back();
    }

    /**
     * Update a staff member.
     */
    public function update(
        Request $request,
        User $user
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

        if (!$branchId) {
            return back()->withErrors([
                'branch' => 'Please select a branch first.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Make Sure Staff Belongs to Current Branch
        |--------------------------------------------------------------------------
        */

        if ((int) $user->branch_id !== (int) $branchId) {
            abort(403, 'You cannot modify staff from another branch.');
        }

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

            'is_active' => [
                'boolean',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Only Allow Waiter or Kitchen Staff Roles
        |--------------------------------------------------------------------------
        */

        $allowedRole = Role::whereIn('slug', [
            'waiter',
            'kitchen_staff',
        ])
            ->where('id', $validated['role_id'])
            ->exists();

        if (!$allowedRole) {
            return back()->withErrors([
                'role_id' => 'Only waiter and kitchen staff roles can be assigned here.',
            ])->withInput();
        }

        /*
        |--------------------------------------------------------------------------
        | Update Password Only If Provided
        |--------------------------------------------------------------------------
        */

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

        /*
        |--------------------------------------------------------------------------
        | Prevent Branch Change
        |--------------------------------------------------------------------------
        |
        | We intentionally do NOT accept branch_id
        | from the request.
        |
        */

        $user->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Staff member updated successfully.',
        ]);

        return back();
    }

    /**
     * Delete a staff member.
     */
    public function destroy(
        Request $request,
        User $user
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

        if (!$branchId) {
            return back()->withErrors([
                'branch' => 'Please select a branch first.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Make Sure Staff Belongs to Current Branch
        |--------------------------------------------------------------------------
        */

        if ((int) $user->branch_id !== (int) $branchId) {
            abort(403, 'You cannot delete staff from another branch.');
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Self Deletion
        |--------------------------------------------------------------------------
        */

        if ($user->id === auth()->id()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'You cannot delete your own account.',
            ]);

            return back();
        }

        $user->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Staff member deleted successfully.',
        ]);

        return back();
    }

    /**
     * Assign tables to a waiter.
     */
    public function assignTable(
        Request $request
    ): RedirectResponse {
        $branchId = $request->session()->get('current_branch_id');

        if (!$branchId) {
            return back()->withErrors([
                'branch' => 'Please select a branch first.',
            ]);
        }

        $validated = $request->validate([
            'waiter_id' => [
                'required',
                'exists:users,id',
            ],

            'table_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'table_ids.*' => [
                'exists:restaurant_tables,id',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Verify Waiter Belongs to Current Branch
        |--------------------------------------------------------------------------
        */

        $waiterRole = Role::where(
            'slug',
            'waiter'
        )->first();

        $waiter = User::where(
            'id',
            $validated['waiter_id']
        )
            ->where(
                'branch_id',
                $branchId
            )
            ->where(
                'role_id',
                $waiterRole?->id
            )
            ->first();

        if (!$waiter) {
            return back()->withErrors([
                'waiter_id' => 'The selected waiter does not belong to the current branch.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Verify All Tables Belong to Current Branch
        |--------------------------------------------------------------------------
        */

        $validTableCount = RestaurantTable::whereIn(
            'id',
            $validated['table_ids']
        )
            ->where(
                'branch_id',
                $branchId
            )
            ->count();

        if (
            $validTableCount !==
            count($validated['table_ids'])
        ) {
            return back()->withErrors([
                'table_ids' => 'One or more selected tables do not belong to the current branch.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Check Already Assigned Tables
        |--------------------------------------------------------------------------
        */

        $alreadyAssigned = WaiterTableAssignment::whereIn(
            'table_id',
            $validated['table_ids']
        )
            ->whereIn(
                'status',
                [
                    'assigned',
                    'serving',
                ]
            )
            ->where(
                'waiter_id',
                '!=',
                $validated['waiter_id']
            )
            ->with(
                'waiter:id,name',
                'table:id,table_number'
            )
            ->get();

        if ($alreadyAssigned->isNotEmpty()) {
            $tableNames = $alreadyAssigned
                ->map(function ($assignment) {
                    return "Table {$assignment->table->table_number} (assigned to {$assignment->waiter->name})";
                })
                ->implode(', ');

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot assign: {$tableNames} already assigned to another waiter.",
            ]);

            return back();
        }

        /*
        |--------------------------------------------------------------------------
        | Deactivate Old Assignments
        |--------------------------------------------------------------------------
        */

        WaiterTableAssignment::where(
            'waiter_id',
            $validated['waiter_id']
        )
            ->whereIn(
                'status',
                [
                    'assigned',
                    'serving',
                ]
            )
            ->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

        /*
        |--------------------------------------------------------------------------
        | Create New Assignments
        |--------------------------------------------------------------------------
        */

        foreach ($validated['table_ids'] as $tableId) {
            WaiterTableAssignment::create([
                'waiter_id' => $validated['waiter_id'],
                'table_id' => $tableId,
                'status' => 'assigned',
                'assigned_at' => now(),
            ]);
        }

        $count = count(
            $validated['table_ids']
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$count} table(s) assigned to waiter successfully.",
        ]);

        return back();
    }
}