<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
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
     * Ensure the customer belongs to the current branch.
     */
    private function assertSameBranch(Request $request, Customer $customer): void
    {
        abort_unless(
            (int) $customer->branch_id === $this->currentBranchId($request),
            404
        );
    }

    /**
     * Display customers for the current branch only.
     */
    public function index(Request $request): Response
    {
        $branchId = $this->currentBranchId($request);

        $customers = Customer::query()
            ->where('branch_id', $branchId)
            ->latest()
            ->get();

        return Inertia::render('manager/customers/index', [
            'customers' => $customers,
        ]);
    }

    /**
     * Show the create customer form.
     */
    public function create(Request $request): Response
    {
        $this->currentBranchId($request);

        return Inertia::render('manager/customers/create');
    }

    /**
     * Store a new customer in the current branch.
     */
    public function store(Request $request)
    {
        $branchId = $this->currentBranchId($request);

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
                Rule::unique('customers', 'phone')
                    ->where(fn ($query) => $query->where('branch_id', $branchId)),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers', 'email')
                    ->where(fn ($query) => $query->where('branch_id', $branchId)),
            ],
            'is_member' => [
                'boolean',
            ],
        ]);

        $validated['branch_id'] = $branchId;
        $validated['customer_code'] = Customer::generateUniqueCode();

        Customer::create($validated);

        return redirect()
            ->route('manager.customers.index')
            ->with('success', 'Customer created successfully.');
    }

    /**
     * Show the edit customer form.
     */
    public function edit(Request $request, Customer $customer): Response
    {
        $this->assertSameBranch($request, $customer);

        return Inertia::render('manager/customers/edit', [
            'customer' => $customer,
        ]);
    }

    /**
     * Update an existing customer in the current branch.
     */
    public function update(Request $request, Customer $customer)
    {
        $branchId = $this->currentBranchId($request);
        $this->assertSameBranch($request, $customer);

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
                Rule::unique('customers', 'phone')
                    ->ignore($customer->id)
                    ->where(fn ($query) => $query->where('branch_id', $branchId)),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers', 'email')
                    ->ignore($customer->id)
                    ->where(fn ($query) => $query->where('branch_id', $branchId)),
            ],
            'is_member' => [
                'boolean',
            ],
        ]);

        // Keep customer in the current branch. Customer code is not changed.
        $validated['branch_id'] = $branchId;

        $customer->update($validated);

        return redirect()
            ->route('manager.customers.index')
            ->with('success', 'Customer updated successfully.');
    }

    /**
     * Delete a customer belonging to the current branch.
     */
    public function destroy(Request $request, Customer $customer)
    {
        $this->assertSameBranch($request, $customer);

        $customer->delete();

        return redirect()
            ->route('manager.customers.index')
            ->with('success', 'Customer deleted successfully.');
    }

    /**
     * Toggle the membership status of a customer in the current branch.
     */
    public function toggleMembership(Request $request, Customer $customer)
    {
        $this->assertSameBranch($request, $customer);

        $customer->update([
            'is_member' => ! $customer->is_member,
        ]);

        return back()->with('success', 'Membership status updated successfully.');
    }
}
