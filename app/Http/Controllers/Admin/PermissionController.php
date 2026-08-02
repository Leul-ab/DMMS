<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PermissionController extends Controller
{
    public function index(): Response
    {
        $permissions = Permission::orderBy('group')
            ->orderBy('name')
            ->get()
            ->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
                'group' => $permission->group,
            ]);

        return Inertia::render('admin/permissions/index', [
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
            'group' => ['nullable', 'string', 'max:255'],
        ]);

        Permission::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'group' => $validated['group'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permission created successfully.']);

        return back();
    }

    public function update(Request $request, Permission $permission): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('permissions', 'name')->ignore($permission->id)],
            'group' => ['nullable', 'string', 'max:255'],
        ]);

        $permission->update([
            'name' => $validated['name'],
            'group' => $validated['group'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permission updated successfully.']);

        return back();
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        if ($permission->roles()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'This permission is assigned to a role and cannot be deleted.']);

            return back();
        }

        $permission->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permission deleted successfully.']);

        return back();
    }
}
