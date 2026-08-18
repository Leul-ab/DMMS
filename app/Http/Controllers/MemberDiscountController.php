<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Discount;
use App\Models\MemberDiscountNotification;
use App\Support\PhoneHelper;
use Illuminate\Http\Request;

class MemberDiscountController extends Controller
{
    /**
     * Return the member's currently available member-only discounts and
     * their related (unread) notifications. Only authenticated members
     * (identified by their verified phone number) may access this.
     */
    public function index(Request $request)
    {
        $phone = PhoneHelper::normalize($request->query('customer_phone'));
        $customer = $phone ? Customer::where('phone', $phone)->first() : null;

        if (! $customer || ! $customer->is_member) {
            return response()->json([
                'success' => false,
                'message' => 'Member authentication required.',
                'discounts' => [],
                'notifications' => [],
                'unread_count' => 0,
            ]);
        }

        $discounts = Discount::withoutGlobalScope('branch')
            ->memberAvailable()
            ->where(function ($query) use ($customer) {
                // A member without an assigned branch (the norm for
                // customer-registered members) sees every member discount.
                if ($customer->branch_id === null) {
                    return;
                }

                $query->where('branch_id', $customer->branch_id)
                    ->orWhereNull('branch_id');
            })
            ->orderByDesc('start_date')
            ->get()
            ->map(fn (Discount $discount) => $this->formatDiscount($discount))
            ->all();

        $notifications = MemberDiscountNotification::with('discount')
            ->where('customer_id', $customer->id)
            ->whereHas('discount', fn ($query) => $query->where('applies_to', 'members'))
            ->orderByDesc('created_at')
            ->get()
            ->map(function (MemberDiscountNotification $notification) {
                return [
                    'id' => $notification->id,
                    'read_at' => $notification->read_at?->toDateTimeString(),
                    'discount' => $notification->discount
                        ? $this->formatDiscount($notification->discount)
                        : null,
                ];
            })
            ->all();

        $unreadCount = collect($notifications)
            ->filter(fn ($notification) => $notification['read_at'] === null)
            ->count();

        return response()->json([
            'success' => true,
            'discounts' => $discounts,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark a single member notification as read. Access is restricted to
     * the member who owns the notification.
     */
    public function markRead(Request $request, MemberDiscountNotification $notification)
    {
        $phone = PhoneHelper::normalize($request->input('customer_phone'));
        $customer = $phone ? Customer::where('phone', $phone)->first() : null;

        if (! $customer || ! $customer->is_member || $notification->customer_id !== $customer->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        $notification->markAsRead();

        $unreadCount = MemberDiscountNotification::where('customer_id', $customer->id)
            ->whereNull('read_at')
            ->whereHas('discount', fn ($query) => $query->where('applies_to', 'members'))
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
        ]);
    }

    protected function formatDiscount(Discount $discount): array
    {
        return [
            'id' => $discount->id,
            'name' => $discount->name,
            'description' => $discount->description,
            'discount_type' => $discount->discount_type,
            'percentage' => $discount->percentage,
            'fixed_amount' => $discount->fixed_amount,
            'start_date' => $discount->start_date?->toDateString(),
            'end_date' => $discount->end_date?->toDateString(),
            'start_time' => $discount->start_time?->format('H:i:s'),
            'end_time' => $discount->end_time?->format('H:i:s'),
        ];
    }
}
