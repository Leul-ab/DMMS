<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MenuItemController extends Controller
{
    public function index(Request $request): Response
    {
        $items = MenuItem::with('category')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->category_id, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($request->availability !== null, function ($query) use ($request) {
                $query->where('is_available', $request->boolean('availability'));
            })
            ->when($request->featured !== null, function ($query) use ($request) {
                $query->where('featured', $request->boolean('featured'));
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('manager/items/index', [
            'items' => $items,
            'categories' => MenuCategory::ordered()->get(),
            'filters' => $request->only(['search', 'category_id', 'availability', 'featured']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('manager/items/create', [
            'categories' => MenuCategory::ordered()->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'preparation_time' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'is_available' => ['boolean'],
            'featured' => ['boolean'],
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('menu/items', 'public');
        }

        $validated['is_available'] = $request->boolean('is_available', true);
        $validated['featured'] = $request->boolean('featured', false);

        MenuItem::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu item created successfully.']);

        return to_route('manager.items.index');
    }

    public function edit(MenuItem $item): Response
    {
        return Inertia::render('manager/items/edit', [
            'item' => $item->load('category'),
            'categories' => MenuCategory::ordered()->get(),
        ]);
    }

    public function update(Request $request, MenuItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'exists:menu_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'preparation_time' => ['nullable', 'integer', 'min:0', 'max:1440'],
            'is_available' => ['boolean'],
            'featured' => ['boolean'],
        ]);

        if ($request->hasFile('image')) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $validated['image'] = $request->file('image')->store('menu/items', 'public');
        } elseif ($request->boolean('remove_image')) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $validated['image'] = null;
        } else {
            unset($validated['image']);
        }

        $validated['is_available'] = $request->boolean('is_available');
        $validated['featured'] = $request->boolean('featured');

        $item->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu item updated successfully.']);

        return to_route('manager.items.index');
    }

    public function destroy(MenuItem $item): RedirectResponse
    {
        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }

        $item->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Menu item deleted successfully.']);

        return to_route('manager.items.index');
    }

    public function toggleAvailability(MenuItem $item): RedirectResponse
    {
        $item->update(['is_available' => ! $item->is_available]);

        $status = $item->is_available ? 'available' : 'unavailable';
        Inertia::flash('toast', ['type' => 'success', 'message' => "Item marked as {$status}."]);

        return back();
    }

    public function updatePrice(Request $request, MenuItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ]);

        $item->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Price updated successfully.']);

        return back();
    }

    public function uploadImage(Request $request, MenuItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }

        $validated['image'] = $request->file('image')->store('menu/items', 'public');
        $item->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Image uploaded successfully.']);

        return back();
    }
}
