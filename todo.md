# Verification System Implementation - TODO

## Backend
- [ ] 1. Create config/payment_accounts.php (CBE + Telebirr accounts)
- [ ] 2. Create migration for new BookingVerificationNotification fields
- [ ] 3. Update BookingVerificationNotification model
- [ ] 4. Fix BookingController::copyAccount() (store fields, handle duplicates, new attempts)
- [ ] 5. Update HandleInertiaRequests count (include 'read' status)
- [ ] 6. Rewrite PaymentVerificationController::bookingVerification() (return notifications)
- [ ] 7. Update approveBookingPayment() (2hr expiry, customer notification, expired check)
- [ ] 8. Update rejectBookingPayment() (required reason, customer notification)
- [ ] 9. Add VerificationCountController + route endpoint
- [ ] 10. Handle expiration in getActiveBooking() and copyAccount()
- [ ] 11. Handle cancellation in cancel() (mark notification cancelled)

## Frontend
- [ ] 12. Rewrite booking-verification.tsx tab (show notifications, View/Verify/Reject)
- [ ] 13. Update verification/index.tsx (tab labels, prop names)
- [ ] 14. Update my-booking.tsx (success message, polling, customer notifications)
- [ ] 15. Update app-sidebar.tsx (real-time polling for count)
- [ ] 16. Create useVerificationCount hook
- [ ] 17. Update booking-payment-show.tsx (new fields, required reason)
- [ ] 18. Update booking-payment.tsx (status options)
- [ ] 19. Update booking-notifications.tsx (status options)
