<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
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
     * Display menu items for the current branch only.
     */
    public function index(Request $request): Response
    {
        $branchId = $this->currentBranchId($request);

        $items = MenuItem::query()
            ->where('branch_id', $branchId)
            ->with('category')
            ->when($request->search, function ($query, $search) {
                $query->where(
                    'name',
                    'like',
                    "%{$search}%"
                );
            })
            ->when($request->category_id, function ($query, $categoryId) use ($branchId) {
                $query->where('category_id', $categoryId)
                    ->whereHas('category', function ($categoryQuery) use ($branchId) {
                        $categoryQuery->where(
                            'branch_id',
                            $branchId
                        );
                    });
            })
            ->when(
                $request->availability !== null,
                function ($query) use ($request) {
                    $query->where(
                        'is_available',
                        $request->boolean('availability')
                    );
                }
            )
            ->when(
                $request->featured !== null,
                function ($query) use ($request) {
                    $query->where(
                        'featured',
                        $request->boolean('featured')
                    );
                }
            )
            ->latest()
            ->paginate(10)
            ->withQueryString();

        // Only show categories belonging to the current branch.
        $categories = MenuCategory::query()
            ->where('branch_id', $branchId)
            ->ordered()
            ->get();

        return Inertia::render('manager/items/index', [
            'items' => $items,
            'categories' => $categories,
            'filters' => $request->only([
                'search',
                'category_id',
                'availability',
                'featured',
            ]),
        ]);
    }

    /**
     * Show the create menu item page.
     */
    public function create(Request $request): Response
    {
        $branchId = $this->currentBranchId($request);

        return Inertia::render('manager/items/create', [
            // Only categories from the current branch.
            'categories' => MenuCategory::query()
                ->where('branch_id', $branchId)
                ->ordered()
                ->get(),
        ]);
    }

    /**
     * Store a new menu item in the current branch.
     */
    public function store(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranchId($request);

        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('menu_categories', 'id')
                    ->where(
                        fn ($query) => $query->where(
                            'branch_id',
                            $branchId
                        )
                    ),
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('menu_items')
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
                'max:2000',
            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
                'max:999999.99',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'preparation_time' => [
                'nullable',
                'integer',
                'min:0',
                'max:1440',
            ],

            'is_available' => [
                'boolean',
            ],

            'featured' => [
                'boolean',
            ],
        ]);

        // Automatically assign the current branch.
        $validated['branch_id'] = $branchId;

        if ($request->hasFile('image')) {
            $validated['image'] = $request
                ->file('image')
                ->store('menu/items', 'public');
        }

        $validated['is_available'] = $request->boolean(
            'is_available',
            true
        );

        $validated['featured'] = $request->boolean(
            'featured',
            false
        );

        MenuItem::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Menu item created successfully.',
        ]);

        return to_route('manager.items.index');
    }

    /**
     * Show the edit page for a menu item
     * belonging to the current branch.
     */
    public function edit(
        Request $request,
        MenuItem $item
    ): Response {
        $branchId = $this->currentBranchId($request);

        // Prevent editing another branch's item.
        abort_unless(
            $item->branch_id === $branchId,
            404
        );

        return Inertia::render('manager/items/edit', [
            'item' => $item->load('category'),

            // Only categories from the current branch.
            'categories' => MenuCategory::query()
                ->where('branch_id', $branchId)
                ->ordered()
                ->get(),
        ]);
    }

    /**
     * Update a menu item belonging to the current branch.
     */
    public function update(
        Request $request,
        MenuItem $item
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent updating another branch's item.
        abort_unless(
            $item->branch_id === $branchId,
            404
        );

        $validated = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('menu_categories', 'id')
                    ->where(
                        fn ($query) => $query->where(
                            'branch_id',
                            $branchId
                        )
                    ),
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('menu_items')
                    ->ignore($item->id)
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
                'max:2000',
            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
                'max:999999.99',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'preparation_time' => [
                'nullable',
                'integer',
                'min:0',
                'max:1440',
            ],

            'is_available' => [
                'boolean',
            ],

            'featured' => [
                'boolean',
            ],
        ]);

        if ($request->hasFile('image')) {
            if ($item->image) {
                Storage::disk('public')->delete(
                    $item->image
                );
            }

            $validated['image'] = $request
                ->file('image')
                ->store('menu/items', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($item->image) {
                Storage::disk('public')->delete(
                    $item->image
                );
            }

            $validated['image'] = null;
        } else {
            // Keep existing image.
            unset($validated['image']);
        }

        $validated['is_available'] = $request->boolean(
            'is_available'
        );

        $validated['featured'] = $request->boolean(
            'featured'
        );

        // Keep the item assigned to the current branch.
        $validated['branch_id'] = $branchId;

        $item->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Menu item updated successfully.',
        ]);

        return to_route('manager.items.index');
    }

    /**
     * Delete a menu item belonging to the current branch.
     */
    public function destroy(
        Request $request,
        MenuItem $item
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent deleting another branch's item.
        abort_unless(
            $item->branch_id === $branchId,
            404
        );

        if ($item->image) {
            Storage::disk('public')->delete(
                $item->image
            );
        }

        $item->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Menu item deleted successfully.',
        ]);

        return to_route('manager.items.index');
    }

    /**
     * Toggle availability for the current branch's item.
     */
    public function toggleAvailability(
        Request $request,
        MenuItem $item
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent changing another branch's item.
        abort_unless(
            $item->branch_id === $branchId,
            404
        );

        $item->update([
            'is_available' => ! $item->is_available,
        ]);

        $status = $item->is_available
            ? 'available'
            : 'unavailable';

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Item marked as {$status}.",
        ]);

        return back();
    }

    /**
     * Update price for the current branch's item.
     */
    public function updatePrice(
        Request $request,
        MenuItem $item
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent changing another branch's item.
        abort_unless(
            $item->branch_id === $branchId,
            404
        );

        $validated = $request->validate([
            'price' => [
                'required',
                'numeric',
                'min:0',
                'max:999999.99',
            ],
        ]);

        $item->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Price updated successfully.',
        ]);

        return back();
    }

    /**
     * Upload an image for the current branch's item.
     */
    public function uploadImage(
        Request $request,
        MenuItem $item
    ): RedirectResponse {
        $branchId = $this->currentBranchId($request);

        // Prevent changing another branch's item.
        abort_unless(
            $item->branch_id === $branchId,
            404
        );

        $validated = $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        if ($item->image) {
            Storage::disk('public')->delete(
                $item->image
            );
        }

        $validated['image'] = $request
            ->file('image')
            ->store('menu/items', 'public');

        $item->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Image uploaded successfully.',
        ]);

        return back();
    }
}