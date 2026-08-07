<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantController extends Controller
{
    public function index(Request $request): Response
    {
        $restaurants = Restaurant::withCount(['branches', 'users'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('owner_email', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('is_active', $status === 'active' ? 1 : 0);
            })
            ->when($request->plan, function ($query, $plan) {
                $query->where('plan', $plan);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $stats = [
            'total'    => Restaurant::count(),
            'active'   => Restaurant::active()->count(),
            'pro'      => Restaurant::where('plan', 'pro')->count(),
            'users'    => User::count(),
        ];

        return Inertia::render('super-admin/restaurants/index', [
            'restaurants' => $restaurants,
            'stats'       => $stats,
            'filters'     => $request->only(['search', 'status', 'plan']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('super-admin/restaurants/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'owner_email'     => ['nullable', 'email', 'max:255'],
            'owner_phone'     => ['nullable', 'string', 'max:30'],
            'owner_password'  => ['nullable', 'string', 'min:8'],
            'description'     => ['nullable', 'string'],
            'primary_color'   => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color'    => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'font_family'     => ['required', 'string', 'max:100'],
            'currency'        => ['required', 'string', 'max:10'],
            'tax_rate'        => ['required', 'numeric', 'min:0', 'max:100'],
            'timezone'        => ['required', 'string', 'max:100'],
            'plan'            => ['required', 'in:starter,pro,enterprise'],
            'is_active'       => ['boolean'],
            'logo'            => ['nullable', 'image', 'max:2048'],
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('restaurant-logos', 'public');
        }

        $restaurant = Restaurant::create([
            ...$validated,
            'logo'      => $logoPath,
            'is_active' => $request->boolean('is_active', true),
        ]);

        if ($request->filled('owner_email') && $request->filled('owner_password')) {
            $role = \App\Models\Role::where('slug', 'main_role')->first();
            if ($role) {
                User::create([
                    'name'          => $restaurant->name . ' Admin',
                    'email'         => $request->owner_email,
                    'phone'         => $request->owner_phone,
                    'password'      => \Illuminate\Support\Facades\Hash::make($request->owner_password),
                    'restaurant_id' => $restaurant->id,
                    'role_id'       => $role->id,
                    'is_active'     => true,
                ]);
            }
        }

        Inertia::flash('toast', [
            'type'    => 'success',
            'message' => "Restaurant \"{$restaurant->name}\" created successfully.",
        ]);

        return to_route('super-admin.restaurants.index');
    }

    public function edit(Restaurant $restaurant): Response
    {
        return Inertia::render('super-admin/restaurants/edit', [
            'restaurant' => $restaurant,
        ]);
    }

    public function update(Request $request, Restaurant $restaurant): RedirectResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'owner_email'     => ['nullable', 'email', 'max:255'],
            'owner_phone'     => ['nullable', 'string', 'max:30'],
            'description'     => ['nullable', 'string'],
            'primary_color'   => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color'    => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'font_family'     => ['required', 'string', 'max:100'],
            'currency'        => ['required', 'string', 'max:10'],
            'tax_rate'        => ['required', 'numeric', 'min:0', 'max:100'],
            'timezone'        => ['required', 'string', 'max:100'],
            'plan'            => ['required', 'in:starter,pro,enterprise'],
            'is_active'       => ['boolean'],
            'logo'            => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($restaurant->logo) {
                Storage::disk('public')->delete($restaurant->logo);
            }
            $validated['logo'] = $request->file('logo')->store('restaurant-logos', 'public');
        }

        $restaurant->update([
            ...$validated,
            'is_active' => $request->boolean('is_active', true),
        ]);

        Inertia::flash('toast', [
            'type'    => 'success',
            'message' => "Restaurant \"{$restaurant->name}\" updated successfully.",
        ]);

        return to_route('super-admin.restaurants.index');
    }

    public function destroy(Restaurant $restaurant): RedirectResponse
    {
        if ($restaurant->branches()->exists() || $restaurant->users()->exists()) {
            Inertia::flash('toast', [
                'type'    => 'error',
                'message' => 'This restaurant has branches or users and cannot be deleted.',
            ]);

            return back();
        }

        if ($restaurant->logo) {
            Storage::disk('public')->delete($restaurant->logo);
        }

        $restaurant->delete();

        Inertia::flash('toast', [
            'type'    => 'success',
            'message' => 'Restaurant deleted successfully.',
        ]);

        return to_route('super-admin.restaurants.index');
    }

    public function toggleStatus(Restaurant $restaurant): RedirectResponse
    {
        $restaurant->update(['is_active' => ! $restaurant->is_active]);

        Inertia::flash('toast', [
            'type'    => 'success',
            'message' => $restaurant->is_active
                ? "Restaurant \"{$restaurant->name}\" activated."
                : "Restaurant \"{$restaurant->name}\" deactivated.",
        ]);

        return back();
    }
}
