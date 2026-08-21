<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\MemberDiscountNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberDiscountNotificationTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Main',
            'slug' => 'main',
            'is_active' => true,
            'currency' => 'ETB',
            'tax_rate' => '0',
        ]);
    }

    private function makeDiscount(array $attributes): Discount
    {
        return Discount::create(array_merge([
            'branch_id' => $this->branch->id,
            'name' => 'Discount',
            'discount_type' => 'percentage',
            'applies_to' => 'members',
            'percentage' => 10,
            'status' => 'active',
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
        ], $attributes));
    }

    public function test_future_member_discount_creates_no_notification(): void
    {
        $this->makeDiscount([
            'name' => 'Future',
            'start_date' => now()->addDay()->toDateString(),
            'end_date' => now()->addDays(5)->toDateString(),
        ]);
        Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseCount('member_discount_notifications', 0);
    }

    public function test_discount_with_future_start_time_today_does_not_notify(): void
    {
        $this->makeDiscount([
            'name' => 'Later Today',
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'start_time' => now()->addHour()->format('H:i:s'),
            'end_time' => now()->addHours(2)->format('H:i:s'),
        ]);
        Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseCount('member_discount_notifications', 0);
    }

    public function test_discount_ending_before_now_does_not_notify(): void
    {
        $this->makeDiscount([
            'name' => 'Ended',
            'status' => 'active',
            'start_date' => now()->subDays(2)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
        ]);
        Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseCount('member_discount_notifications', 0);
    }

    public function test_discount_within_window_notifies(): void
    {
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);
        $this->makeDiscount([
            'name' => 'Within',
            'start_date' => now()->subHour()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'start_time' => now()->subHour()->format('H:i:s'),
            'end_time' => now()->addHour()->format('H:i:s'),
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseHas('member_discount_notifications', ['customer_id' => $member->id]);
    }

    public function test_active_member_discount_notifies_only_members(): void
    {
        $this->makeDiscount(['name' => 'Active']);
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);
        $nonMember = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'N',
            'phone' => '+251922222222',
            'is_member' => false,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseHas('member_discount_notifications', ['customer_id' => $member->id]);
        $this->assertDatabaseMissing('member_discount_notifications', ['customer_id' => $nonMember->id]);
    }

    public function test_member_in_other_branch_is_not_notified(): void
    {
        $this->makeDiscount(['name' => 'Active']);
        $otherBranch = Branch::create([
            'name' => 'Other',
            'slug' => 'other',
            'is_active' => true,
            'currency' => 'ETB',
            'tax_rate' => '0',
        ]);
        Customer::create([
            'branch_id' => $otherBranch->id,
            'name' => 'M2',
            'phone' => '+251933333333',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseCount('member_discount_notifications', 0);
    }

    public function test_all_customers_discount_does_not_notify_members(): void
    {
        $this->makeDiscount(['name' => 'All', 'applies_to' => 'all']);
        Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseCount('member_discount_notifications', 0);
    }

    public function test_no_duplicate_notifications_for_same_member_and_discount(): void
    {
        $this->makeDiscount(['name' => 'Active']);
        Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();
        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseCount('member_discount_notifications', 1);
    }

    public function test_expired_discount_is_not_available_or_notified(): void
    {
        $this->makeDiscount([
            'name' => 'Expired',
            'end_date' => now()->subDay()->toDateString(),
            'status' => 'expired',
        ]);
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->assertDatabaseCount('member_discount_notifications', 0);

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonCount(0, 'discounts')
            ->assertJsonCount(0, 'notifications');
    }

    public function test_member_sees_member_discount_notification_and_can_mark_it_read(): void
    {
        $discount = $this->makeDiscount(['name' => 'Active']);
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'notifications')
            ->assertJsonFragment(['name' => 'Active']);

        // Marking the discount's notification read is keyed by discount id.
        $this->postJson('/customer/member-notifications/' . $discount->id . '/read', [
            'customer_phone' => $member->phone,
        ])
            ->assertOk()
            ->assertJsonPath('unread_count', 1); // badge reflects active discounts

        // The individual notification is now read and persists.
        $this->assertNotNull(
            MemberDiscountNotification::where('customer_id', $member->id)
                ->where('discount_id', $discount->id)
                ->first()
                ->read_at,
        );

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertJsonPath('notifications.0.read_at', fn ($value) => $value !== null);
    }

    public function test_non_member_receives_no_notifications(): void
    {
        $this->makeDiscount(['name' => 'Active']);
        Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);
        $this->artisan('discounts:notify-members');

        $nonMember = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'N',
            'phone' => '+251922222222',
            'is_member' => false,
        ]);

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($nonMember->phone))
            ->assertOk()
            ->assertJsonPath('success', false)
            ->assertJsonPath('unread_count', 0)
            ->assertJsonCount(0, 'notifications');
    }

    public function test_marking_one_notification_does_not_affect_others_or_other_members(): void
    {
        $discountA = $this->makeDiscount(['name' => 'A']);
        $discountB = $this->makeDiscount(['name' => 'B']);
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);
        $other = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'O',
            'phone' => '+251944444444',
            'is_member' => true,
        ]);

        // The member marks only discount A's notification as read.
        $this->postJson('/customer/member-notifications/' . $discountA->id . '/read', [
            'customer_phone' => $member->phone,
        ])->assertOk();

        // Discount B (same member) is still unread.
        $this->assertNull(
            MemberDiscountNotification::where('customer_id', $member->id)
                ->where('discount_id', $discountB->id)
                ->first()
                ?->read_at,
        );

        // The other member has no read state affected for discount A.
        $this->assertNull(
            MemberDiscountNotification::where('customer_id', $other->id)
                ->where('discount_id', $discountA->id)
                ->first(),
        );

        // Only the member's discount A is marked read.
        $this->assertNotNull(
            MemberDiscountNotification::where('customer_id', $member->id)
                ->where('discount_id', $discountA->id)
                ->first()
                ->read_at,
        );
    }

    public function test_menu_page_includes_member_notification_props(): void
    {
        $this->makeDiscount(['name' => 'Active']);
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);
        $this->artisan('discounts:notify-members');

        $this->get('/menu?customer_phone=' . urlencode($member->phone))
            ->assertInertia(fn ($page) => $page
                ->where('isMember', true)
                ->where('memberUnreadCount', 1)
                ->has('memberNotifications', 1)
                ->has('memberAvailableDiscounts', 1));
    }
}
