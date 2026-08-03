<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * Display a listing of branches.
     */
    public function index()
    {
        $branches = Branch::query()
            ->withCount('users')
            ->withCount('restaurantTables')
            ->withCount('menuItems')
            ->withCount('orders')
            ->latest()
            ->get();

        return Inertia::render('manager/branches/index', [
            'branches' => $branches,
        ]);
    }

    /**
     * Store a newly created branch.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        Branch::create([
            ...$validated,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return redirect()
            ->route('manager.branches.index')
            ->with('success', 'Branch created successfully.');
    }

    /**
     * Display the specified branch.
     */
    public function show(Branch $branch)
    {
        $branch->loadCount([
            'users',
            'restaurantTables',
            'menuItems',
            'orders',
        ]);

        return response()->json($branch);
    }

    /**
     * Update the specified branch.
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        $branch->update($validated);

        return redirect()
            ->route('manager.branches.index')
            ->with('success', 'Branch updated successfully.');
    }

    /**
     * Remove the specified branch.
     */
    public function destroy(Branch $branch)
    {
        $branch->delete();

        return redirect()
            ->route('manager.branches.index')
            ->with('success', 'Branch deleted successfully.');
    }
}