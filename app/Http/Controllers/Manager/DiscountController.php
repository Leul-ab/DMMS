<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DiscountController extends Controller
{
    public function index(Request $request): Response
    {
        $discounts = Discount::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->discount_type, function ($query, $type) {
                $query->where('discount_type', $type);
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('manager/discounts/index', [
            'discounts' => $discounts,
            'filters' => $request->only(['search', 'discount_type', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('manager/discounts/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'percentage' => ['required_if:discount_type,percentage', 'nullable', 'numeric', 'min:0', 'max:100'],
            'fixed_amount' => ['required_if:discount_type,fixed', 'nullable', 'numeric', 'min:0', 'max:999999.99'],
            'status' => ['required', Rule::in(['active', 'inactive', 'expired', 'scheduled'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        Discount::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Discount created successfully.']);

        return to_route('manager.discounts.index');
    }

    public function edit(Discount $discount): Response
    {
        return Inertia::render('manager/discounts/edit', [
            'discount' => $discount,
        ]);
    }

    public function update(Request $request, Discount $discount): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'percentage' => ['required_if:discount_type,percentage', 'nullable', 'numeric', 'min:0', 'max:100'],
            'fixed_amount' => ['required_if:discount_type,fixed', 'nullable', 'numeric', 'min:0', 'max:999999.99'],
            'status' => ['required', Rule::in(['active', 'inactive', 'expired', 'scheduled'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
        ]);

        $discount->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Discount updated successfully.']);

        return to_route('manager.discounts.index');
    }

    public function destroy(Discount $discount): RedirectResponse
    {
        $discount->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Discount deleted successfully.']);

        return to_route('manager.discounts.index');
    }

    public function toggleStatus(Discount $discount): RedirectResponse
    {
        $newStatus = $discount->status === 'active' ? 'inactive' : 'active';
        $discount->update(['status' => $newStatus]);

        return back()->with('success', 'Discount status updated successfully.');
    }
}
