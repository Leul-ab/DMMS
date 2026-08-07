<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(Request $request): Response
    {
        $branches = Branch::withCount([
            'users',
            'tables',
            'menuCategories',
            'menuItems',
            'orders',
        ])
            ->when(auth()->user()->restaurant_id, function ($query, $restaurantId) {
                $query->where('restaurant_id', $restaurantId);
            })
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('is_active', $status === 'active' ? 1 : 0);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/branches/index', [
            'branches' => $branches,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show(Branch $branch): Response
    {
        $branch->loadCount([
            'users',
            'tables',
            'menuCategories',
            'menuItems',
            'orders',
            'customers',
        ]);

        return Inertia::render('admin/branches/show', [
            'branch' => $branch,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $branch = Branch::create([
            ...$validated,
            'restaurant_id' => auth()->user()->restaurant_id,
            'is_active' => $request->boolean('is_active'),
        ]);

        // Switch to the newly created branch so the admin immediately starts
        // working with the new branch's (empty) data set.
        Branch::setCurrent($branch->id);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Branch created successfully.',
        ]);

        return to_route('admin.branches.index');
    }

    public function update(Request $request, Branch $branch): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $branch->update([
            ...$validated,
            'is_active' => $request->boolean('is_active'),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Branch updated successfully.',
        ]);

        return to_route('admin.branches.index');
    }

    public function destroy(Branch $branch): RedirectResponse
    {
        $hasData = $branch->users()->exists()
            || $branch->tables()->exists()
            || $branch->menuCategories()->exists()
            || $branch->menuItems()->exists()
            || $branch->orders()->exists();

        if ($hasData) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'This branch has data (staff, tables, menu items, or orders) and cannot be deleted.',
            ]);

            return back();
        }

        $branch->delete();

        if (session('current_branch_id') === $branch->id) {
            session()->forget('current_branch_id');
            Branch::setCurrent(null);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Branch deleted successfully.',
        ]);

        return to_route('admin.branches.index');
    }

    public function toggleStatus(Branch $branch): RedirectResponse
    {
        $branch->update([
            'is_active' => ! $branch->is_active,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $branch->is_active
                ? 'Branch activated successfully.'
                : 'Branch deactivated successfully.',
        ]);

        return back();
    }

    public function switch(Branch $branch): RedirectResponse
    {
        if (! $branch->is_active) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'You cannot switch to a deactivated branch.',
            ]);

            return back();
        }

        Branch::setCurrent($branch->id);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Switched to {$branch->name}.",
        ]);

        return back();
    }
}
