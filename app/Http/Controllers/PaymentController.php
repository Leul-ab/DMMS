<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;

class PaymentController extends Controller
{
    /**
     * Customer submits a payment.
     */
    public function submit(Order $order): RedirectResponse
    {
        // Payment can only be submitted for completed orders.
        if ($order->status !== 'completed') {
            return back()->with(
                'error',
                'Payment is only available after your order is completed.'
            );
        }

        // Prevent duplicate payment submission.
        if (
            $order->payment_status !== null &&
            $order->payment_status !== 'unpaid'
        ) {
            return back()->with(
                'error',
                'Payment has already been submitted or processed.'
            );
        }

        // Change order payment status to pending.
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