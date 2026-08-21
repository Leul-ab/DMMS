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

        // Notifications are derived from the member-only discounts that are
        // currently within their active window, so they appear automatically
        // when a discount starts and vanish once it ends.
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
            ->get();

        $readStates = MemberDiscountNotification::where('customer_id', $customer->id)
            ->whereIn('discount_id', $discounts->pluck('id')->toArray())
            ->get()
            ->keyBy('discount_id');

        $discountsData = $discounts
            ->map(fn (Discount $discount) => $this->formatDiscount($discount))
            ->all();

        $notifications = $discounts
            ->map(function (Discount $discount) use ($readStates) {
                $row = $readStates->get($discount->id);

                return [
                    'id' => $discount->id,
                    'discount_id' => $discount->id,
                    'read_at' => $row?->read_at?->toDateTimeString(),
                    'discount' => $this->formatDiscount($discount),
                ];
            })
            ->all();

        // The badge count reflects the number of active member-only discounts.
        return response()->json([
            'success' => true,
            'discounts' => $discountsData,
            'notifications' => $notifications,
            'unread_count' => $discounts->count(),
        ]);
    }

    /**
     * Mark a single member discount's notification as read for the member who
     * owns it. Each discount keeps its own read flag, so marking one read
     * never affects another discount or another member.
     */
    public function markRead(Request $request, Discount $discount)
    {
        $phone = PhoneHelper::normalize($request->input('customer_phone'));
        $customer = $phone ? Customer::where('phone', $phone)->first() : null;

        if (! $customer || ! $customer->is_member) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied.',
            ], 403);
        }

        if ($discount->applies_to !== 'members') {
            return response()->json([
                'success' => false,
                'message' => 'Invalid discount.',
            ], 404);
        }

        // FirstOrCreate guarantees each member has exactly one read-state row
        // per discount (the unique(customer_id, discount_id) constraint
        // prevents duplicates), and markAsRead only touches this one row.
        $notification = MemberDiscountNotification::firstOrCreate(
            [
                'customer_id' => $customer->id,
                'discount_id' => $discount->id,
            ],
            [
                'branch_id' => $discount->branch_id,
                'read_at' => null,
            ],
        );

        $notification->markAsRead();

        // The badge count is the number of currently active member-only
        // discounts and does not depend on individual read state.
        $unreadCount = Discount::withoutGlobalScope('branch')
            ->memberAvailable()
            ->where(function ($query) use ($customer) {
                if ($customer->branch_id === null) {
                    return;
                }

                $query->where('branch_id', $customer->branch_id)
                    ->orWhereNull('branch_id');
            })
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
            'notification_id' => $notification->id,
            'read_at' => $notification->read_at?->toDateTimeString(),
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
