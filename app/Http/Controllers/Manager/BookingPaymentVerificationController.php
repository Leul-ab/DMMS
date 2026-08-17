<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\BookingPayment;
use App\Models\RestaurantTable;
use App\Models\TableBooking;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingPaymentVerificationController extends Controller
{
    public function index(Request $request)
    {
        $query = BookingPayment::with(['booking.customer', 'booking.tables'])
            ->where('payment_type', 'original')
            ->where('payment_status', 'pending')
            ->orderBy('created_at', 'desc');

        if ($search = $request->get('search')) {
            $query->whereHas('booking.customer', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            })
            ->orWhereHas('booking', function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%");
            });
        }

        $payments = $query->paginate(15)->withQueryString();

        $extensionPayments = BookingPayment::with(['booking.customer', 'booking.tables'])
            ->where('payment_type', 'extension')
            ->where('payment_status', 'pending')
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return inertia('manager/booking-payment-verification/index', [
            'payments' => $payments,
            'extensionPayments' => $extensionPayments,
        ]);
    }

    public function verify(Request $request, BookingPayment $payment): JsonResponse
    {
        $payment->load('booking');

        if ($payment->payment_type === 'original') {
            $controller = new \App\Http\Controllers\BookingController();
            return $controller->verifyPayment($request, $payment);
        }

        if ($payment->payment_type === 'extension') {
            $controller = new \App\Http\Controllers\BookingController();
            return $controller->verifyExtensionPayment($request, $payment);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid payment type.',
        ], 422);
    }

    public function reject(Request $request, BookingPayment $payment): JsonResponse
    {
        $payment->load('booking');

        if ($payment->payment_type === 'original') {
            $controller = new \App\Http\Controllers\BookingController();
            return $controller->rejectPayment($request, $payment);
        }

        if ($payment->payment_type === 'extension') {
            $controller = new \App\Http\Controllers\BookingController();
            return $controller->rejectExtensionPayment($request, $payment);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid payment type.',
        ], 422);
    }
}
