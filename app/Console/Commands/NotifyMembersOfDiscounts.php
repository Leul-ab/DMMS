<?php

namespace App\Console\Commands;

use App\Models\Customer;
use App\Models\Discount;
use App\Models\MemberDiscountNotification;
use Illuminate\Console\Command;

class NotifyMembersOfDiscounts extends Command
{
    protected $signature = 'discounts:notify-members';

    protected $description = 'Notify eligible members about member-only discounts that have become active.';

    public function handle(): int
    {
        // Bypass the branch global scope so every branch is processed.
        $discounts = Discount::withoutGlobalScope('branch')
            ->memberAvailable()
            ->get();

        $notifications = 0;

        foreach ($discounts as $discount) {
            // Notify members of the discount's branch. A member with no
            // assigned branch (the norm for members registered via the
            // customer flow) is treated as a global member and is eligible
            // for any branch-scoped discount. Branch isolation is still
            // respected: a member explicitly assigned to a different branch
            // is never notified.
            $members = Customer::where('is_member', true)
                ->when($discount->branch_id, function ($query) use ($discount) {
                    $query->where('branch_id', $discount->branch_id)
                        ->orWhereNull('branch_id');
                })
                ->get();

            foreach ($members as $member) {
                // firstOrCreate + the unique(customer_id, discount_id)
                // constraint guarantee no duplicate notifications.
                MemberDiscountNotification::firstOrCreate(
                    [
                        'customer_id' => $member->id,
                        'discount_id' => $discount->id,
                    ],
                    [
                        'branch_id' => $discount->branch_id,
                        'read_at' => null,
                    ],
                );

                $notifications++;
            }
        }

        $this->info("Processed {$discounts->count()} active member discount(s); ensured {$notifications} notification(s).");

        return self::SUCCESS;
    }
}
