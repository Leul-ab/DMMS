import re

filepath = r"c:\Users\hp OMEN\Desktop\DMMS\app/Http/Controllers/Manager/PaymentVerificationController.php"
with open(filepath, 'r') as f:
    content = f.read()

# ============================================================
# 1. Rewrite bookingVerification() to query BookingVerificationNotification
# ============================================================
old_bv_start = "    public function bookingVerification(Request $request): Response\n    {"
old_bv_end = "    }\n\n    /**\n     * Verify a booking payment by entering the transaction number.\n     */\n    public function verifyBooking"

# Find the bookingVerification method
bv_pattern = r'(    public function bookingVerification\(Request \$request\): Response\n    \{.*?\n    \}\n)'
bv_match = re.search(bv_pattern, content, re.DOTALL)
if bv_match:
    new_bv = '''    public function bookingVerification(Request $request): Response
    {
        $query = BookingVerificationNotification::with([
            'booking.customer',
            'booking.tables.section',
            'customer',
        ])->where('notification_type', 'booking_payment');

        // Search by booking ID, customer name, phone, table number, payment method, payment attempt reference
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

        // Filter by status
        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        } else {
            $query->whereIn('status', ['pending', 'read']);
        }

        // Filter by payment method
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
                    'tables' => $notification->booking ? $notification->booking->tables->map(fn ($t) => [
                        'id' => $t->id,
                        'table_number' => $t->table_number,
                        'section' => $t->section?->name ?? null,
                    ]) : [],
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
                    'booking' => $notification->booking ? [
                        'id' => $notification->booking->id,
                        'status' => $notification->booking->status,
                        'payment_status' => $notification->booking->payment_status,
                        'booked_at' => $notification->booking->booked_at,
                        'expires_at' => $notification->booking->expires_at,
                        'paid_at' => $notification->booking->paid_at,
                    ] : null,
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
    content = re.sub(bv_pattern, new_bv, content, count=1, flags=re.DOTALL)
    print("OK: bookingVerification() rewritten")
else:
    print("WARN: bookingVerification() not found")

# ============================================================
# 2. Replace verifyBooking() to accept notification and delegate
# ============================================================
vb_pattern = r'(    \*\n     \* Verify a booking payment by entering the transaction number\.\n     \*/\n    public function verifyBooking\(Request \$request, TableBooking \$booking\): RedirectResponse\n    \{.*?\n    \}\n)'
vb_match = re.search(vb_pattern, content, re.DOTALL)
if vb_match:
    new_vb = '''    /**
     * Verify a booking payment notification.
     */
    public function verifyBooking(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        // Delegate to approveBookingPayment using the same request data.
        return $this->approveBookingPayment($request, $notification);
    }
    '''
    content = re.sub(vb_pattern, new_vb, content, count=1, flags=re.DOTALL)
    print("OK: verifyBooking() updated")
else:
    print("WARN: verifyBooking() not found")

# ============================================================
# 3. Replace rejectBooking() to accept notification and delegate
# ============================================================
rb_pattern = r'(    \*\n     \* Reject a pending booking payment\.\n     \*/\n    public function rejectBooking\(Request \$request, TableBooking \$booking\): RedirectResponse\n    \{.*?\n    \}\n)'
rb_match = re.search(rb_pattern, content, re.DOTALL)
if rb_match:
    new_rb = '''    /**
     * Reject a booking payment notification.
     */
    public function rejectBooking(Request $request, BookingVerificationNotification $notification): RedirectResponse
    {
        // Delegate to rejectBookingPayment using the same request data.
        return $this->rejectBookingPayment($request, $notification);
    }
    '''
    content = re.sub(rb_pattern, new_rb, content, count=1, flags=re.DOTALL)
    print("OK: rejectBooking() updated")
else:
    print("WARN: rejectBooking() not found")

# ============================================================
# 4. Update approveBookingPayment() - add expired/cancelled check, 2hr expiry, customer notification
# ============================================================
abp_pattern = r'(    public function approveBookingPayment\(Request \$request, BookingVerificationNotification \$notification\): RedirectResponse\n    \{.*?\n        return back\(\)->with\(\'success\', \'Booking payment approved successfully\'\);\n    \}\n)'
abp_match = re.search(abp_pattern, content, re.DOTALL)
if abp_match:
    new_abp = '''    public function approveBookingPayment(Request $request, BookingVerificationNotification $notification): RedirectResponse
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

        if ($booking->status === 'cancelled') {
            return back()->with('error', 'This booking has been cancelled.');
        }

        try {
            DB::transaction(function () use ($validated, $notification, $booking) {
                $paymentAccountNumber = $validated['transaction_number'] ?? $notification->payment_method.'-'.now()->format('YmdHis');

                // Update booking: mark payment as paid, confirm reservation, 2-hour window
                $booking->update([
                    'payment_status' => 'paid',
                    'paid_at' => now(),
                    'status' => 'active',
                    'transaction_reference' => $validated['transaction_number'] ?? $booking->transaction_reference,
                    'expires_at' => now()->addHours(2),
                ]);

                // Keep tables reserved for the customer
                $tableIds = $booking->tables()->pluck('restaurant_tables.id');
                RestaurantTable::whereIn('id', $tableIds)->update(['status' => 'reserved']);

                // Update verification notification
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

                // Notify the customer
                $booking->customer?->notify(new \App\Notifications\BookingPaymentVerified($booking, $notification));
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Booking payment approved successfully.');
    }
    '''
    content = re.sub(abp_pattern, new_abp, content, count=1, flags=re.DOTALL)
    print("OK: approveBookingPayment() updated")
else:
    print("WARN: approveBookingPayment() not found")

# ============================================================
# 5. Update rejectBookingPayment() - require reason, add customer notification
# ============================================================
rbp_pattern = r'(    public function rejectBookingPayment\(Request \$request, BookingVerificationNotification \$notification\): RedirectResponse\n    \{.*?\n        return back\(\)->with\(\'success\', \'Booking payment rejected\'\);\n    \}\n)'
rbp_match = re.search(rbp_pattern, content, re.DOTALL)
if rbp_match:
    new_rbp = '''    public function rejectBookingPayment(Request $request, BookingVerificationNotification $notification): RedirectResponse
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

                // Notify the customer
                $booking->customer?->notify(new \App\Notifications\BookingPaymentRejected($booking, $notification));
            });
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Booking payment rejected.');
    }
    '''
    content = re.sub(rbp_pattern, new_rbp, content, count=1, flags=re.DOTALL)
    print("OK: rejectBookingPayment() updated")
else:
    print("WARN: rejectBookingPayment() not found")

# ============================================================
# 6. Update showBookingPayment() - add new fields
# ============================================================
sbp_pattern = r'(        return Inertia::render\(\'manager/verification/booking-payment-show\', \[\n            \'notification\' => \(object\) \[\n                \'id\' => \$notification->id,\n                \'booking_id\' => \$notification->booking_id,\n                \'customer_name\' => \$notification->customer\?->name \?\? \'Unknown\',\n                \'customer_phone\' => \$notification->customer\?->phone \?\? \'N/A\',\n                \'tables\' => \$notification->booking->tables->map\(fn \(\$t\) => \[\n                    \'id\' => \$t->id,\n                    \'table_number\' => \$t->table_number,\n                    \'section\' => \$t->section\?->name \?\? null,\n                \]\),\n                \'payment_method\' => \$notification->payment_method,\n                \'amount\' => \$notification->amount,\n                \'status\' => \$notification->status,\n                \'notification_type\' => \$notification->notification_type,\n                \'read_at\' => \$notification->read_at,\n                \'created_at\' => \$notification->created_at,\n                \'booking\' => \$notification->booking \? \[\n                    \'id\' => \$notification->booking->id,\n                    \'status\' => \$notification->booking->status,\n                    \'payment_status\' => \$notification->booking->payment_status,\n                    \'booked_at\' => \$notification->booking->booked_at,\n                    \'expires_at\' => \$notification->booking->expires_at,\n                    \'cancelled_at\' => \$notification->booking->cancelled_at,\n                    \'paid_at\' => \$notification->booking->paid_at,\n                \] : null,\n            \]\);\n    \}\n)'
sbp_match = re.search(sbp_pattern, content, re.DOTALL)
if sbp_match:
    new_sbp = '''        return Inertia::render('manager/verification/booking-payment-show', [
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
    }
    '''
    content = re.sub(sbp_pattern, new_sbp, content, count=1, flags=re.DOTALL)
    print("OK: showBookingPayment() updated")
else:
    print("WARN: showBookingPayment() not found - trying broader match")
    # Try broader match
    sbp_pattern2 = r"(        return Inertia::render\('manager/verification/booking-payment-show'"
    idx = content.find("        return Inertia::render('manager/verification/booking-payment-show'")
    if idx >= 0:
        # Find the end of the method (the closing brace)
        end_idx = content.find("    }\n", idx)
        end_idx = content.find("    }\n", end_idx + 4)  # Find the NEXT closing brace
        old_sbp = content[idx:end_idx+5]
        new_sbp_start = '''        return Inertia::render('manager/verification/booking-payment-show', [
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
        content = content[:idx] + new_sbp_start + content[end_idx+5:]
        print("OK: showBookingPayment() updated (broad match)")
    else:
        print("WARN: showBookingPayment() could not be found at all")

# ============================================================
# 7. Update bookingPayment() stats - add expired/cancelled
# ============================================================
old_stats = """        $stats = [
            'pending' => BookingVerificationNotification::where('status', 'pending')->count(),
            'read' => BookingVerificationNotification::where('status', 'read')->count(),
            'verified' => BookingVerificationNotification::where('status', 'verified')->count(),
            'rejected' => BookingVerificationNotification::where('status', 'rejected')->count(),
        ];"""

new_stats = """        $stats = [
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
        ];"""

if old_stats in content:
    content = content.replace(old_stats, new_stats, 1)
    print("OK: bookingPayment() stats updated")
else:
    print("WARN: bookingPayment() stats not found")

# ============================================================
# 8. Add verificationCount() method and markNotificationRead needs read_at
# ============================================================
# Add verificationCount before generateReceiptNumber
count_method = '''
    /**
     * Return the global verification count API response.
     */
    public function verificationCount(Request $request): JsonResponse
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

# Insert before the generateReceiptNumber method
marker = "    /**\n     * Generate a unique receipt number"
if marker in content:
    idx = content.index(marker)
    content = content[:idx] + count_method + content[idx:]
    print("OK: verificationCount() method added")
else:
    print("WARN: verificationCount() insertion point not found")

# ============================================================
# Fix markNotificationRead to also set expired_at if needed
# ============================================================

# Add 'read_at' to markNotificationRead's update if not present
# Actually it already sets read_at, so no change needed

with open(filepath, 'w') as f:
    f.write(content)

print("\n=== Done writing controller ===")
