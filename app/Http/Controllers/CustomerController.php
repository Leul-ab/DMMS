<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Register a new customer as a member.
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
                'max:20',
                'unique:customers,phone',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:customers,email',
            ],
        ]);

        // Generate a unique random customer code
        $code = Customer::generateUniqueCode();

        $customer = Customer::create([
            'customer_code' => $code,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'is_member' => true,
        ]);

        // Store in session for order tracking
        session(['customer_code' => $customer->customer_code]);

        // Return JSON response for modal display
        return response()->json([
            'success' => true,
            'message' => 'Registration successful!',
            'customer_code' => $customer->customer_code,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ],
        ]);
    }

}
