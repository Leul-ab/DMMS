import re
import sys

filepath = r"c:\Users\hp OMEN\Desktop\DMMS\app/Http/Controllers/Manager/PaymentVerificationController.php"
with open(filepath, 'r') as f:
    content = f.read()

# Helper: do a regex replacement, report result
def do_replace(content, pattern, replacement, label, flags=re.DOTALL):
    m = re.search(pattern, content, flags)
    if m:
        content = re.sub(pattern, replacement, content, count=1, flags=flags)
        print(f"OK: {label}")
    else:
        print(f"WARN: {label} not found")
    return content

# ============================================================
# 1. Rewrite bookingVerification()
# ============================================================
bv_pattern = r'(    public function bookingVerification\(Request \$request\): Response\n    \{.*?\n    \}\n)'

new_bv = r'''    public function bookingVerification(Request $request): Response
    {
        $query = BookingVerificationNotification::with([
            'booking.customer',
            'booking.tables.section',
            'customer',
        ])->where('notification_type', 'booking_payment');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhere('payment_attempt_reference', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhereHas('booking', function ($bq) use ($search) {
                        $bq->where('id', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($cq) use ($search) {
                                $cq->where('name', 'like', "%{$search}%")
                                    ->orWhere('phone', 'like', "%{$search}%");
                            })
                            ->orWhereHas('tables', function ($tq) use ($search) {
                                $tq->where('table_number', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        } else {
            $query->whereIn('status', ['pending', 'read']);
        }

        if ($paymentMethod = $request->query('payment_method')) {
            if ($paymentMethod !== 'all') {
                $query->where('payment_method', $paymentMethod);
            }
        }

        $notifications = $query->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(function ($notification) {
                $tableNumbers = $notification->booking && $notification->booking->tables
                    ? $notification->booking->tables->pluck('table_number')->toArray()
                    : [];
                return (object) [
                    'id' => $notification->id,
                    'booking_id' => $notification->booking_id,
                    'customer_name' => $notification->customer?->name ?? 'Unknown',
                    'customer_phone' => $notification->customer?->phone ?? 'N/A',
                    'table_numbers' => $tableNumbers,
                    'payment_method' => $notification->payment_method,
                    'payment_account' => $notification->payment_account,
                    'payment_attempt_reference' => $notification->payment_attempt_reference,
                    'amount' => $notification->amount,
                    'status' => $notification->status,
                    'notification_type' => $notification->notification_type,
                    'read_at' => $notification->read_at,
                    'copied_at' => $notification->copied_at,
                    'verified_at' => $notification->verified_at,
                    'rejected_at' => $notification->rejected_at,
                    'rejection_reason' => $notification->rejection_reason,
                    'created_at' => $notification->created_at,
                ];
            });

        $stats = [
            'pending' => BookingVerificationNotification::whereIn('status', ['pending', 'read'])
                ->where('notification_type', 'booking_payment')
                ->count(),
            'verified' => BookingVerificationNotification::where('status', 'verified')
                ->where('notification_type', 'booking_payment')
                ->count(),
            'rejected' => BookingVerificationNotification::where('status', 'rejected')
                ->where('notification_type', 'booking_payment')
                ->count(),
            'expired' => BookingVerificationNotification::where('status', 'expired')
                ->where('notification_type', 'booking_payment')
                ->count(),
            'cancelled' => BookingVerificationNotification::where('status', 'cancelled')
                ->where('notification_type', 'booking_payment')
                ->count(),
        ];

        return Inertia::render('manager/verification/index', [
            'activeTab' => 'booking',
            'notifications' => $notifications,
            'stats' => $stats,
            'filters' => $request->only([
                'search', 'status', 'payment_method', 'verification_type',
            ]),
        ]);
    }
    '''
content = do_replace(content, bv_pattern, new_bv, "bookingVerification()")

# ============================================================
# 2. Replace verifyBooking() to accept notification and delegate
# ============================================================
vb_pattern = r"(    \*\n     \* Verify a booking payment by entering the transaction number\.\n     \*/\n    public function verifyBooking\(Request \$request, TableBooking \$booking\): RedirectResponse\n    \{.*?\n    \}\n)"

new_vb = r'''    /**
     * Verify a booking payment notification.
     */
    public function verifyBooking(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        return $this->approveBookingPayment($request, $notification);
    }
    '''
content = do_replace(content, vb_pattern, new_vb, "verifyBooking()")

# ============================================================
# 3. Replace rejectBooking() to accept notification and delegate
# ============================================================
rb_pattern = r"(    \*\n     \* Reject a pending booking payment\.\n     \*/\n    public function rejectBooking\(Request \$request, TableBooking \$booking\): RedirectResponse\n    \{.*?\n    \}\n)"

new_rb = r'''    /**
     * Reject a booking payment notification.
     */
    public function rejectBooking(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        return $this->rejectBookingPayment($request, $notification);
    }
    '''
content = do_replace(content, rb_pattern, new_rb, "rejectBooking()")

# ============================================================
# 4. Update approveBookingPayment()
# ============================================================
abp_pattern = r"(    public function approveBookingPayment\(Request \$request, BookingVerificationNotification \$notification\): RedirectResponse\n    \{.*?\n        return back\(\)->with\('success', 'Booking payment approved successfully.'\);\n    \}\n)"

new_abp = r'''    public function approveBookingPayment(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        if (in_array($notification->status, ['verified', 'rejected', 'expired', 'cancelled'])) {
            $msg = [
                'verified' => 'This booking payment has already been approved.',
                'rejected' => 'This booking payment has already been rejected.',
                'expired' => 'This booking payment has expired.',
                'cancelled' => 'This booking has been cancelled.',
            ][$notification->status];
            return back()->with('error', $msg);
        }

        if (! in_array($notification->status, ['pending', 'read'])) {
            return back()->with('error', 'This payment cannot be verified.');
        }

        $validated = $request->validate([
            'transaction_number' => ['nullable', 'string', 'max:255'],
        ]);

        $booking = $notification->booking;

        if (! $booking) {
            return back()->with('error', 'No booking found for this notification.');
        }

        if ($booking->payment_status === 'paid') {
            return back()->with('error', 'This booking has already been paid.');
        }

        if ($booking->status === 'cancelled' || $booking->status === 'expired') {
            return back()->with('error', 'This booking cannot be verified.');
        }

        try {
            DB::transaction(function () use ($validated, $notification, $booking) {
                $paymentAccountNumber = $validated['transaction_number'] ?? $notification->payment_method.'-'.now()->format('YmdHis');

                $booking->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                    'status' => 'active',
                    'transaction_reference' => $validated['transaction_number'] ?? $booking->transaction_reference,
                    'expires_at' => now()->addHours(2),
                ]);

                $tableIds = $booking->tables()->pluck('restaurant_tables.id');
                RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'reserved']);

                $notification->update([
                    'status' => 'verified',
                    'verified_at' => now(),
                    'verified_by' => auth()->id(),
                    'read_at' => $notification->read_at ?: now(),
                    'transaction_number' => $paymentAccountNumber,
                ]);

                Payment::create([
                    'branch_id' => $booking->branch_id,
                    'booking_id' => $booking->id,
                    'payment_method' => $notification->payment_method,
                    'payment_status' => 'paid',
                    'payment_type' => 'booking',
                    'amount' => $notification->amount,
                    'transaction_reference' => $paymentAccountNumber,
                    'transaction_number' => $paymentAccountNumber,
                    'verified_by' => auth()->id(),
                    'verified_at' => now(),
                    'paid_at' => now(),
                ]);

                $booking->customer?->notify(new \App\Notifications\BookingPaymentVerified($booking, $notification));
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Booking payment approved successfully.');
    }
    '''
content = do_replace(content, abp_pattern, new_abp, "approveBookingPayment()")

# ============================================================
# 5. Update rejectBookingPayment() - require reason
# ============================================================
rbp_pattern = r"(    public function rejectBookingPayment\(Request \$request, BookingVerificationNotification \$notification\): RedirectResponse\n    \{.*?\n        return back\(\)->with\('success', 'Booking payment rejected.'\);\n    \}\n)"

new_rbp = r'''    public function rejectBookingPayment(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        if (in_array($notification->status, ['verified', 'rejected', 'expired', 'cancelled'])) {
            $msg = [
                'verified' => 'This booking payment has already been approved.',
                'rejected' => 'This booking payment has already been rejected.',
                'expired' => 'This booking payment has expired.',
                'cancelled' => 'This booking has been cancelled.',
            ][$notification->status];
            return back()->with('error', $msg);
        }

        if (! in_array($notification->status, ['pending', 'read'])) {
            return back()->with('error', 'This payment cannot be rejected.');
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $booking = $notification->booking;

        if (! $booking) {
            return back()->with('error', 'No booking found for this notification.');
        }

        try {
            DB::transaction(function () use ($validated, $notification, $booking) {
                $booking->update([
                    'payment_status' => 'cancelled',
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

                $tableIds = $booking->tables()->pluck('restaurant_tables.id');
                RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'available']);

                $notification->update([
                    'status' => 'rejected',
                    'rejected_at' => now(),
                    'rejected_by' => auth()->id(),
                    'rejection_reason' => $validated['rejection_reason'],
                    'read_at' => $notification->read_at ?: now(),
                ]);

                $booking->customer?->notify(new \App\Notifications\BookingPaymentRejected($booking, $notification));
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Booking payment rejected.');
    }
    '''
content = do_replace(content, rbp_pattern, new_rbp, "rejectBookingPayment()")

# ============================================================
# 6. Update showBookingPayment() - add new fields
# ============================================================
sbp_old = """        return Inertia::render('manager/verification/booking-payment-show', [
            'notification' => (object) [
                'id' => $notification->id,
                'booking_id' => $notification->booking_id,
                'customer_name' => $notification->customer?->name ?? 'Unknown',
                'customer_phone' => $notification->customer?->phone ?? 'N/A',
                'tables' => $notification->booking->tables->map(fn ($t) => [
                    'id' => $t->id,
                    'table_number' => $t->table_number,
                    'section' => $t->section?->name ?? null,
                ]),
                'payment_method' => $notification->payment_method,
                'amount' => $notification->amount,
                'status' => $notification->status,
                'notification_type' => $notification->notification_type,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
                'booking' => $notification->booking ? [
                    'id' => $notification->booking->id,
                    'status' => $notification->booking->status,
                    'payment_status' => $notification->booking->payment_status,
                    'booked_at' => $notification->booking->booked_at,
                    'expires_at' => $notification->booking->expires_at,
                    'cancelled_at' => $notification->booking->cancelled_at,
                    'paid_at' => $notification->booking->paid_at,
                ] : null,
            ],
        ]);
    }"""

new_sbp = r'''        return Inertia::render('manager/verification/booking-payment-show', [
            'notification' => (object) [
                'id' => $notification->id,
                'booking_id' => $notification->booking_id,
                'customer_name' => $notification->customer?->name ?? 'Unknown',
                'customer_phone' => $notification->customer?->phone ?? 'N/A',
                'customer_email' => $notification->customer?->email ?? 'N/A',
                'tables' => $notification->booking->tables->map(fn ($t) => [
                    'id' => $t->id,
                    'table_number' => $t->table_number,
                    'section' => $t->section?->name ?? null,
                ]),
                'table_numbers' => $notification->booking ? $notification->booking->tables->pluck('table_number')->toArray() : [],
                'payment_method' => $notification->payment_method,
                'payment_account' => $notification->payment_account,
                'payment_attempt_reference' => $notification->payment_attempt_reference,
                'transaction_number' => $notification->transaction_number,
                'amount' => $notification->amount,
                'status' => $notification->status,
                'notification_type' => $notification->notification_type,
                'read_at' => $notification->read_at,
                'copied_at' => $notification->copied_at,
                'expired_at' => $notification->expired_at,
                'verified_at' => $notification->verified_at,
                'verified_by' => $notification->verifier ? $notification->verifier->name : null,
                'rejected_at' => $notification->rejected_at,
                'rejected_by' => $notification->rejector ? $notification->rejector->name : null,
                'rejection_reason' => $notification->rejection_reason,
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
                'booking' => $notification->booking ? [
                    'id' => $notification->booking->id,
                    'status' => $notification->booking->status,
                    'payment_status' => $notification->booking->payment_status,
                    'booked_at' => $notification->booking->booked_at,
                    'booking_amount' => $notification->booking->booking_amount,
                    'expires_at' => $notification->booking->expires_at,
                    'cancelled_at' => $notification->booking->cancelled_at,
                    'paid_at' => $notification->booking->paid_at,
                ] : null,
            ],
        ]);
    }'''

if sbp_old in content:
    content = content.replace(sbp_old, new_sbp, 1)
    print("OK: showBookingPayment() updated")
else:
    print("WARN: showBookingPayment() not found - skipping")

# ============================================================
# 7. Update bookingPayment() stats
# ============================================================
old_stats = """        $stats = [
            'pending' => BookingVerificationNotification::where('status', 'pending')->count(),
            'read' => BookingVerificationNotification::where('status', 'read')->count(),
            'verified' => BookingVerificationNotification::where('status', 'verified')->count(),
            'rejected' => BookingVerificationNotification::where('status', 'rejected')->count(),
        ];"""

new_stats = r'''        $stats = [
            'pending' => BookingVerificationNotification::whereIn('status', ['pending', 'read'])
                ->where('notification_type', 'booking_payment')
                ->count(),
            'verified' => BookingVerificationNotification::where('status', 'verified')
                ->where('notification_type', 'booking_payment')
                ->count(),
            'rejected' => BookingVerificationNotification::where('status', 'rejected')
                ->where('notification_type', 'booking_payment')
                ->count(),
            'expired' => BookingVerificationNotification::where('status', 'expired')
                ->where('notification_type', 'booking_payment')
                ->count(),
            'cancelled' => BookingVerificationNotification::where('status', 'cancelled')
                ->where('notification_type', 'booking_payment')
                ->count(),
        ];'''

if old_stats in content:
    content = content.replace(old_stats, new_stats, 1)
    print("OK: bookingPayment() stats updated")
else:
    print("WARN: bookingPayment() stats not found")

# ============================================================
# 8. Add verificationCount() method
# ============================================================
count_method = r'''
    /**
     * Return the global verification count as JSON.
     */
    public function verificationCount(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        $orderCount = $user?->can('view payments')
            ? Order::where('payment_status', 'pending')->whereHas('payment')->count()
            : 0;

        $bookingCount = $user?->can('view payments')
            ? BookingVerificationNotification::whereIn('status', ['pending', 'read'])
                ->where('notification_type', 'booking_payment')
                ->count()
            : 0;

        return response()->json([
            'paymentVerification' => $orderCount,
            'bookingPayment' => $bookingCount,
            'total' => $orderCount + $bookingCount,
        ]);
    }

'''

marker = "    /**\n     * Generate a unique receipt number"
if marker in content:
    idx = content.index(marker)
    content = content[:idx] + count_method + content[idx:]
    print("OK: verificationCount() method added")
else:
    print("WARN: verificationCount() insertion point not found")

# ============================================================
# 9. Add JsonResponse import if not present (needed for verificationCount)
# ============================================================
if 'use Illuminate\\Http\\JsonResponse;' not in content:
    # Add after the existing Illuminate imports
    content = content.replace(
        'use Illuminate\\Http\\RedirectResponse;',
        'use Illuminate\\Http\\JsonResponse;\nuse Illuminate\\Http\\RedirectResponse;',
        1
    )
    print("OK: JsonResponse import added")
else:
    print("OK: JsonResponse import already present")

with open(filepath, 'w') as f:
    f.write(content)

print("\n=== Controller updated ===")
