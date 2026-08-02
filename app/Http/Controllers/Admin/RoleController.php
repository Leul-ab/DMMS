<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        $roles = Role::with('permissions')
            ->orderBy('id')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'permissions_count' => $role->permissions->count(),
                'permissions' => $role->permissions->pluck('name')->all(),
            ])
            ->values();

        $permissionGroups = Permission::orderBy('group')
            ->orderBy('name')
            ->get()
            ->groupBy('group')
            ->map(fn ($group, $groupName) => [
                'group' => $groupName ?: 'Other',
                'permissions' => $group
                    ->map(fn (Permission $permission) => [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'group' => $permission->group,
                    ])
                    ->values(),
            ])
            ->values();

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
            'permissionGroups' => $permissionGroups,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $slug = Str::slug($validated['name']);

        if (Role::where('slug', $slug)->exists()) {
            return back()->withErrors(['name' => 'A role with this name already exists.']);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'guard_name' => 'web',
            'description' => $validated['description'] ?? null,
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role created successfully.']);

        return back();
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        if ($role->slug === 'super_admin') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'The Super Admin role cannot be modified.']);

            return back();
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $slug = Str::slug($validated['name']);

        if (Role::where('slug', $slug)->where('id', '!=', $role->id)->exists()) {
            return back()->withErrors(['name' => 'A role with this name already exists.']);
        }

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role updated successfully.']);

        return back();
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->slug === 'super_admin') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'The Super Admin role cannot be deleted.']);

            return back();
        }

        if (User::where('role_id', $role->id)->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'This role is assigned to users and cannot be deleted.']);

            return back();
        }

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role deleted successfully.']);

        return back();
    }
}
