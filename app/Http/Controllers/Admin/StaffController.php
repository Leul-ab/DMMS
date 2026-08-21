<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Role;
use App\Models\User;
use App\Models\WaiterTableAssignment;
use App\Support\PhoneHelper;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(Request $request): Response
    {
        $waiters = User::with(['role', 'activeTableAssignments.table'])
            ->where('is_waiter', true)
            ->when(Branch::current(), function ($query, Branch $branch) {
                $query->where('branch_id', $branch->id);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/staff/index', [
            'waiters' => $waiters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $roleId = $request->input('role_id');

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
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => $phoneRules,
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'role_id' => ['required', 'exists:roles,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'is_active' => ['boolean'],
            'is_waiter' => ['boolean'],
        ]);

        if (Role::find($validated['role_id'])?->slug === 'super_admin') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Super Admin accounts can only be created through the seeding system.']);

            return back();
        }

        $validated['name'] = $validated['first_name'].' '.$validated['last_name'];
        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $request->boolean('is_active');
        $validated['is_waiter'] = $request->boolean('is_waiter');
        $validated['email_verified_at'] = now();

        unset($validated['first_name'], $validated['last_name']);

        User::create($validated);

        $roleLabel = Role::find($roleId)?->name ?? 'Staff';
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$roleLabel} created successfully."]);

        return back();
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Staff member updated successfully.']);

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        $user->load('role');

        if ($user->role?->slug === 'super_admin') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'The Super Admin account cannot be deleted.']);

            return back();
        }

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
