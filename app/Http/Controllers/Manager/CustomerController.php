<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display all customers.
     */
    public function index(): Response
    {
        $customers = Customer::latest()->get();

        return Inertia::render('manager/customers/index', [
            'customers' => $customers,
        ]);
    }

    /**
     * Show the create customer form.
     */
    public function create(): Response
    {
        return Inertia::render('manager/customers/create');
    }

    /**
     * Store a new customer.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'phone' => [
                'required',
                'string',
                'max:255',
                'unique:customers,phone',
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:customers,email',
            ],
            'is_member' => [
                'boolean',
            ],
        ]);

        Customer::create($validated);

        return redirect()
            ->route('manager.customers.index')
            ->with('success', 'Customer created successfully.');
    }

    /**
     * Show the edit customer form.
     */
    public function edit(Customer $customer): Response
    {
        return Inertia::render('manager/customers/edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update an existing customer.
     */
    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'phone' => [
                'required',
                'string',
                'max:255',
                'unique:customers,phone,' . $customer->id,
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:customers,email,' . $customer->id,
            ],
            'is_member' => [
                'boolean',
            ],
        ]);

        // Customer code is NOT changed during editing
        $customer->update($validated);

        return redirect()
            ->route('manager.customers.index')
            ->with('success', 'Customer updated successfully.');
    }

    /**
     * Delete a customer.
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();

        return redirect()
            ->route('manager.customers.index')
            ->with('success', 'Customer deleted successfully.');
    }

    /**
     * Toggle the membership status of a customer.
     */
    public function toggleMembership(Customer $customer)
    {
        $customer->update([
            'is_member' => !$customer->is_member,
        ]);

        return back()->with('success', 'Membership status updated successfully.');
    }
}