<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    /**
     * Display all registered members.
     */
    public function index(): Response
    {
        $customers = Customer::where('is_member', true)
            ->latest()
            ->get();

        return Inertia::render('manager/customers/index', [
            'customers' => $customers,
        ]);
    }
}