<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Customer submits that they have paid.
     */
    public function submit(Order $order)
    {
        // Only completed orders can be paid for.
        if ($order->status !== 'completed') {
            return back()->with(
                'error',
                'Payment is only available after your order is completed.'
            );
        }

        // Prevent submitting payment more than once.
        if ($order->payment_status !== 'unpaid') {
            return back()->with(
                'error',
                'Payment has already been submitted.'
            );
        }

        $order->update([
            'payment_status' => 'pending',
            'payment_submitted_at' => now(),
        ]);

        return back()->with(
            'success',
            'Payment submitted successfully. Please wait for confirmation.'
        );
    }
}