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

    public function test_member_sees_unread_notification_and_can_mark_it_read(): void
    {
        $this->makeDiscount(['name' => 'Active']);
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'M',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $this->artisan('discounts:notify-members')->assertSuccessful();

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'notifications')
            ->assertJsonFragment(['name' => 'Active']);

        $notification = MemberDiscountNotification::first();
        $this->postJson('/customer/member-notifications/' . $notification->id . '/read', [
            'customer_phone' => $member->phone,
        ])
            ->assertOk()
            ->assertJsonPath('unread_count', 0);

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertJsonPath('unread_count', 0);
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

    public function test_member_cannot_mark_another_members_notification_read(): void
    {
        $this->makeDiscount(['name' => 'Active']);
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
        $this->artisan('discounts:notify-members');

        $notification = MemberDiscountNotification::where('customer_id', $member->id)->first();

        $this->postJson('/customer/member-notifications/' . $notification->id . '/read', [
            'customer_phone' => $other->phone,
        ])
            ->assertForbidden();

        $this->assertDatabaseHas('member_discount_notifications', [
            'id' => $notification->id,
            'read_at' => null,
        ]);
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
