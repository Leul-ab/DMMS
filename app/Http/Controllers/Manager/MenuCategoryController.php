<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MenuCategoryController extends Controller
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
     * Display categories for the current branch only.
     */
    public function index(Request $request): Response
    {
        $branchId = $this->currentBranchId($request);

        $categories = MenuCategory::query()
            ->where('branch_id', $branchId)
            ->withCount('menuItems')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->ordered()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('manager/categories/index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show create category page.
     */
    public function create(Request $request): Response
    {
        // Make sure a branch is selected.
        $this->currentBranchId($request);

        return Inertia::render('manager/categories/create');
    }

    /**
     * Store a category in the current branch.
     */
    public function store(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranchId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('menu_categories')
                    ->where(
                        fn ($query) => $query->where(
                            'branch_id',
                            $branchId
                        )
                    ),
            ],

            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        // Automatically assign the selected branch.
        $validated['branch_id'] = $branchId;

        if ($request->hasFile('image')) {
            $validated['image'] = $request
                ->file('image')
                ->store('menu/categories', 'public');
        }

        $validated['is_active'] = $request->boolean(
            'is_active',
            true
        );

        MenuCategory::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Category created successfully.',
        ]);

        return to_route('manager.categories.index');
    }

    /**
     * Show edit page for a category belonging to the current branch.
     */
    public function edit(
        Request $request,
        MenuCategory $category
    ): Response {
        $branchId = $this->currentBranchId($request);

        // Prevent editing another branch's category.
        abort_unless(
            $category->branch_id === $branchId,
            404
        );

        return Inertia::render('manager/categories/edit', [
            'category' => $category,
        ]);
    }

    /**
     * Update a category belonging to the current branch.
     */
    public function update(
        Request $request,
        MenuCategory $category
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent updating another branch's category.
        abort_unless(
            $category->branch_id === $branchId,
            404
        );

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('menu_categories')
                    ->ignore($category->id)
                    ->where(
                        fn ($query) => $query->where(
                            'branch_id',
                            $branchId
                        )
                    ),
            ],

            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'boolean',
            ],
        ]);

        if ($request->hasFile('image')) {
            // Delete old image.
            if ($category->image) {
                Storage::disk('public')->delete(
                    $category->image
                );
            }

            $validated['image'] = $request
                ->file('image')
                ->store('menu/categories', 'public');
        } else {
            // Keep existing image.
            unset($validated['image']);
        }

        $validated['is_active'] = $request->boolean(
            'is_active'
        );

        // Keep category in the current branch.
        $validated['branch_id'] = $branchId;

        $category->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Category updated successfully.',
        ]);

        return to_route('manager.categories.index');
    }

    /**
     * Delete a category belonging to the current branch.
     */
    public function destroy(
        Request $request,
        MenuCategory $category
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent deleting another branch's category.
        abort_unless(
            $category->branch_id === $branchId,
            404
        );

        if ($category->menuItems()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Cannot delete category with menu items. Remove items first.',
            ]);

            return back();
        }

        if ($category->image) {
            Storage::disk('public')->delete(
                $category->image
            );
        }

        $category->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Category deleted successfully.',
        ]);

        return to_route('manager.categories.index');
    }

    /**
     * Toggle category status for the current branch.
     */
    public function toggleStatus(
        Request $request,
        MenuCategory $category
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent changing another branch's category.
        abort_unless(
            $category->branch_id === $branchId,
            404
        );

        $category->update([
            'is_active' => ! $category->is_active,
        ]);

        return back()->with(
            'success',
            'Category status updated successfully.'
        );
    }
}