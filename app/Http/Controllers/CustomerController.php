<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Support\PhoneHelper;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Register a new customer as a member.
     */
    public function store(Request $request)
    {
        if ($request->filled('phone')) {
            $request->merge([
                'phone' => PhoneHelper::normalize($request->input('phone')),
            ]);
        }

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
                'regex:' . PhoneHelper::PATTERN,
                'unique:customers,phone',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
                'unique:customers,email',
            ],
        ], [
            'phone.regex' => 'The phone number must be in the format +251 followed by 9 digits starting with 9 (e.g. +251912345678).',
        ]);

        $customer = Customer::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'is_member' => true,
        ]);

        // Store phone in session for order tracking
        session(['customer_phone' => $customer->phone]);

        // Return JSON response for modal display
        return response()->json([
            'success' => true,
            'message' => 'Registration successful!',
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
            ],
        ]);
    }

    public function verifyMember(Request $request)
    {
        $request->validate([
            'phone' => ['required', 'string', 'max:20', 'regex:' . PhoneHelper::PATTERN],
        ], [
            'phone.regex' => 'The phone number must be in the format +251 followed by 9 digits starting with 9 (e.g. +251912345678).',
        ]);

        $phone = PhoneHelper::normalize($request->input('phone'));

        $customer = Customer::where('phone', $phone)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found. Please register first.',
            ]);
        }

        if (!$customer->is_member) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member yet. Join membership to unlock discounts.',
            ]);
        }

        session(['customer_phone' => $customer->phone]);

        return response()->json([
            'success' => true,
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'is_member' => $customer->is_member,
            ],
        ]);
    }
}
