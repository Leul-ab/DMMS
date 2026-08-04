<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\RestaurantTable;
use App\Models\Role;
use App\Models\User;
use App\Models\WaiterTableAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $waiterRole = Role::where('slug', 'waiter')->first();
        $kitchenRole = Role::where('slug', 'kitchen_staff')->first();

        // Waiter staff
        $waiters = User::with(['role', 'latestTableAssignment.table', 'activeTableAssignments.table'])
            ->where('role_id', $waiterRole?->id)
            ->when(Branch::current(), function ($query, Branch $branch) {
                $query->where('branch_id', $branch->id);
            })
            ->when($request->search_waiter, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->status_waiter, function ($query, $status) {
                $query->where('is_active', $status === 'active' ? 1 : 0);
            })
            ->latest()
            ->paginate(10, ['*'], 'waiter_page')
            ->withQueryString();

        // Kitchen staff
        $kitchenStaff = User::with('role')
            ->where('role_id', $kitchenRole?->id)
            ->when(Branch::current(), function ($query, Branch $branch) {
                $query->where('branch_id', $branch->id);
            })
            ->when($request->search_kitchen, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->status_kitchen, function ($query, $status) {
                $query->where('is_active', $status === 'active' ? 1 : 0);
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

    public function store(Request $request): RedirectResponse
    {
        $roleId = $request->input('role_id');

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
            'is_active' => ['boolean'],
        ]);

        $validated['name'] = $validated['first_name'] . ' ' . $validated['last_name'];
        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $request->boolean('is_active');
        $validated['email_verified_at'] = now();
        $validated['branch_id'] = Branch::current()?->id;

        unset($validated['first_name'], $validated['last_name']);

        User::create($validated);

        $roleLabel = $roleId == Role::where('slug', 'waiter')->first()?->id ? 'Waiter' : 'Kitchen Staff';
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$roleLabel} created successfully."]);

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
            'is_active' => ['boolean'],
        ]);

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        $validated['is_active'] = $request->boolean('is_active');

        $user->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Staff member updated successfully.']);

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'You cannot delete your own account.']);
            return back();
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Staff member deleted successfully.']);

        return back();
    }

    public function assignTable(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'waiter_id' => ['required', 'exists:users,id'],
            'table_ids' => ['required', 'array'],
            'table_ids.*' => ['exists:restaurant_tables,id'],
        ]);

        // Check if any of the selected tables are already assigned to another waiter
        $alreadyAssigned = WaiterTableAssignment::whereIn('table_id', $validated['table_ids'])
            ->whereIn('status', ['assigned', 'serving'])
            ->where('waiter_id', '!=', $validated['waiter_id'])
            ->with('waiter:id,name', 'table:id,table_number')
            ->get();

        if ($alreadyAssigned->isNotEmpty()) {
            $tableNames = $alreadyAssigned->map(function ($assignment) {
                return "Table {$assignment->table->table_number} (assigned to {$assignment->waiter->name})";
            })->implode(', ');

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot assign: {$tableNames} already assigned to another waiter.",
            ]);

            return back();
        }

        // Deactivate old active assignments for this waiter
        WaiterTableAssignment::where('waiter_id', $validated['waiter_id'])
            ->whereIn('status', ['assigned', 'serving'])
            ->update(['status' => 'completed', 'completed_at' => now()]);

        // Create new assignments for each selected table
        foreach ($validated['table_ids'] as $tableId) {
            WaiterTableAssignment::create([
                'waiter_id' => $validated['waiter_id'],
                'table_id' => $tableId,
                'status' => 'assigned',
                'assigned_at' => now(),
            ]);
        }

        $count = count($validated['table_ids']);
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$count} table(s) assigned to waiter successfully."]);

        return back();
    }
}
