<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

        do {
            $code = 'CUS-' . str_pad((string) mt_rand(1, 999999), 6, '0', STR_PAD_LEFT);
        } while (Customer::where('customer_code', $code)->exists());

        $customer = Customer::create([
            'customer_code' => $code,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'is_member' => true,
        ]);

        return redirect()->back()->with([
            'customer_registered' => true,
            'customer_code' => $customer->customer_code,
            'customer_name' => $customer->name,
        ]);
    }
}
