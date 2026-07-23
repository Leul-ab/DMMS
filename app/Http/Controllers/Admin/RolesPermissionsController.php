<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RolesPermissionsController extends Controller
{
    public function index(): Response
    {
        $roles = Role::withCount('users')
            ->latest()
            ->paginate(10);

        return Inertia::render('admin/roles/index', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,slug'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        Role::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role created successfully.']);

        return to_route('admin.roles.index');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:roles,slug,' . $role->id],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $role->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role updated successfully.']);

        return to_route('admin.roles.index');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->users()->count() > 0) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete a role that has users assigned.']);
            return back();
        }

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Role deleted successfully.']);

        return to_route('admin.roles.index');
    }
}
