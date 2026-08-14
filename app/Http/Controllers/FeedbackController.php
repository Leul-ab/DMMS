<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Feedback;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackController extends Controller
{
    /**
     * Display the feedback form for a completed, paid order.
     */
    public function create(Request $request, Order $order): Response|RedirectResponse
    {
        // Verify the order is completed.
        if ($order->status !== 'completed') {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'Feedback is only available after your order is completed.');
        }

        // Verify the payment is completed.
        if ($order->payment_status !== 'paid') {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'Feedback is only available after your payment is confirmed.');
        }

        // Check if feedback already exists.
        if ($order->feedback) {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'You have already submitted feedback for this order.');
        }

        // Resolve customer from session, or fall back to the order's customer.
        $customer = $this->resolveCustomer($order);

        $order->load(['orderItems.menuItem', 'table']);

        return Inertia::render('customer-feedback/create', [
            'order' => $order,
            'customer' => $customer,
        ]);
    }

    /**
     * Save the customer feedback.
     */
    public function store(Request $request, Order $order): RedirectResponse
    {
        // Verify the order is completed.
        if ($order->status !== 'completed') {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'Feedback is only available after your order is completed.');
        }

        // Verify the payment is completed.
        if ($order->payment_status !== 'paid') {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'Feedback is only available after your payment is confirmed.');
        }

        // Prevent duplicate reviews.
        if ($order->feedback) {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'You have already submitted feedback for this order.');
        }

        // Resolve customer from session, or fall back to the order's customer.
        $customer = $this->resolveCustomer($order);

        $validated = $request->validate([
            'overall_rating' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'anonymous' => ['nullable', 'boolean'],
        ]);

        Feedback::create([
            'order_id' => $order->id,
            'customer_id' => $customer?->id,
            'overall_rating' => $validated['overall_rating'],
            'comment' => $validated['comment'] ?? null,
            'anonymous' => $validated['anonymous'] ?? false,
        ]);

        return redirect()
            ->route('menu.customer-my-order')
            ->with('success', 'Thank you! Your feedback has been submitted successfully.');
    }

    /**
     * Display the submitted customer feedback for a specific order.
     */
    public function show(Request $request, Order $order): Response|RedirectResponse
    {
        // Verify the order is completed.
        if ($order->status !== 'completed') {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'Feedback is only available after your order is completed.');
        }

        // Verify the payment is completed.
        if ($order->payment_status !== 'paid') {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'Feedback is only available after your payment is confirmed.');
        }

        // Check if feedback exists.
        if (!$order->feedback) {
            return redirect()
                ->route('menu.customer-my-order')
                ->with('error', 'No feedback has been submitted for this order yet.');
        }

        $order->load(['orderItems.menuItem', 'table', 'feedback.customer']);

        return Inertia::render('customer-feedback/view', [
            'order' => $order,
            'feedback' => $order->feedback,
        ]);
    }

    /**
     * Resolve the customer from the session customer_phone,
     * falling back to the order's customer_id.
     */
    protected function resolveCustomer(Order $order): ?Customer
    {
        // First try the session customer_phone
        $customerPhone = session('customer_phone');

        if ($customerPhone) {
            $customer = Customer::where('phone', $customerPhone)->first();
            if ($customer) {
                return $customer;
            }
        }

        // Fall back to the order's customer relationship
        if ($order->customer_id) {
            return $order->customer;
        }

        return null;
    }
}
