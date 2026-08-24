<?php

namespace App\Notifications;

use App\Models\BookingVerificationNotification;
use App\Models\TableBooking;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingPaymentVerified extends Notification
{
    use Queueable;

    public function __construct(protected TableBooking $booking, protected BookingVerificationNotification $notification) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'booking_id' => $this->booking->id,
            'notification_id' => $this->notification->id,
            'message' => 'Your booking payment has been approved. Your tables are now reserved.',
            'status' => 'approved',
        ];
    }
}
