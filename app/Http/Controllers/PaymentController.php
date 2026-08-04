<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    /**
     * Customer submits that they have paid.
     */
    public function submit(Request $request, Order $order)
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

        // Validate that a payment method was selected.
        $validated = $request->validate([
            'payment_method' => [
                'required',
                'string',
                'in:telebirr,cbe_birr',
            ],
        ]);

        $order->update([
            'payment_status' => 'pending',
            'payment_submitted_at' => now(),
        ]);

        // Create or update the payment record with the selected method.
        $payment = $order->payment;

        if (!$payment) {
            $payment = new Payment();
            $payment->order_id = $order->id;
            $payment->table_id = $order->table_id;
            $payment->subtotal = $order->total_amount;
            $payment->amount = $order->total_amount;
        }

        $payment->payment_method = $validated['payment_method'];
        $payment->payment_status = 'pending';
        $payment->save();

        return back()->with(
            'success',
            'Payment submitted successfully. Please wait for confirmation.'
        );
    }
}
