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
    public function index(Request $request): Response
    {
        $categories = MenuCategory::withCount('menuItems')
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

    public function create(): Response
    {
        return Inertia::render('manager/categories/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menu/categories', 'public');
        }

        $validated['is_active'] = $request->boolean('is_active', true);

        MenuCategory::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Category created successfully.']);

        return to_route('manager.categories.index');
    }

    public function edit(MenuCategory $category): Response
    {
        return Inertia::render('manager/categories/edit', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, MenuCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        if ($request->hasFile('image')) {
            // Delete old image
            if ($category->image) {
                Storage::disk('public')->delete($category->image);
            }
            $validated['image'] = $request->file('image')->store('menu/categories', 'public');
        } else {
            // Keep existing image if not replacing
            unset($validated['image']);
        }

        $validated['is_active'] = $request->boolean('is_active');

        $category->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Category updated successfully.']);

        return to_route('manager.categories.index');
    }

    public function destroy(MenuCategory $category): RedirectResponse
    {
        if ($category->menuItems()->exists()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Cannot delete category with menu items. Remove items first.']);

            return back();
        }

        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Category deleted successfully.']);

        return to_route('manager.categories.index');
    }

    public function toggleStatus(MenuCategory $category): RedirectResponse
    {
        $category->update([
            'is_active' => !$category->is_active,
        ]);

        return back()->with('success', 'Category status updated successfully.');
    }
}
