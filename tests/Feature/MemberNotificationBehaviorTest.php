<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Discount;
use App\Models\MemberDiscountNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * These tests exercise the Members Only discount notification behavior
 * (count, dynamic show/hide by start/end, per-discount read tracking, and
 * timezone correctness) using a hand-built schema for just the tables the
 * MemberDiscountController touches. They intentionally do NOT run the project
 * migrations, which contain MySQL-only syntax that does not run on the SQLite
 * in-memory test database.
 */
class MemberNotificationBehaviorTest extends TestCase
{
    private ?Carbon $now = null;

    protected function setUp(): void
    {
        parent::setUp();

        // Match how Laravel boots: the application timezone is set as the
        // process default timezone so that now() (used by the discount
        // active-window scope) is formatted in the application timezone.
        date_default_timezone_set('Africa/Addis_Ababa');
        config(['app.timezone' => 'Africa/Addis_Ababa']);
        $this->now = Carbon::create(2026, 8, 20, 12, 0, 0, 'Africa/Addis_Ababa');
        Carbon::setTestNow($this->now);

        $this->buildSchema();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function buildSchema(): void
    {
        Schema::dropIfExists('member_discount_notifications');
        Schema::dropIfExists('discounts');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('branches');

        Schema::create('branches', function ($table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('is_active')->default(true);
            $table->string('currency')->default('ETB');
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('customers', function ($table) {
            $table->id();
            $table->foreignId('branch_id')->nullable();
            $table->string('name');
            $table->string('phone')->unique();
            $table->string('email')->nullable()->unique();
            $table->boolean('is_member')->default(true);
            $table->timestamps();
        });

        Schema::create('discounts', function ($table) {
            $table->id();
            $table->foreignId('branch_id')->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('discount_type');
            $table->decimal('percentage', 8, 2)->nullable();
            $table->decimal('fixed_amount', 12, 2)->nullable();
            $table->string('status')->default('active');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('applies_to')->default('all');
            $table->timestamps();
        });

        Schema::create('member_discount_notifications', function ($table) {
            $table->id();
            $table->foreignId('customer_id');
            $table->foreignId('discount_id');
            $table->foreignId('branch_id')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            $table->unique(['customer_id', 'discount_id']);
        });
    }

    private function makeMember(string $phone = '+251911111111'): Customer
    {
        return Customer::create([
            'branch_id' => null,
            'name' => 'Member',
            'phone' => $phone,
            'is_member' => true,
        ]);
    }

    private function makeDiscount(array $attributes): Discount
    {
        // Insert raw so the time columns hold exactly "H:i:s" (SQLite has no
        // real TIME type and the model's datetime cast would otherwise store a
        // full timestamp, which would break the active-window concatenation).
        $row = array_merge([
            'branch_id' => null,
            'name' => 'Discount',
            'description' => null,
            'discount_type' => 'percentage',
            'applies_to' => 'members',
            'percentage' => 10,
            'fixed_amount' => null,
            'status' => 'active',
            'start_date' => $this->now->copy()->subDay()->toDateString(),
            'end_date' => $this->now->copy()->addDay()->toDateString(),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
            'created_at' => $this->now->copy(),
            'updated_at' => $this->now->copy(),
        ], $attributes);

        $id = \Illuminate\Support\Facades\DB::table('discounts')->insertGetId($row);

        return Discount::withoutGlobalScope('branch')->find($id);
    }

    public function test_notification_count_matches_active_member_discounts(): void
    {
        $member = $this->makeMember();

        // 1 active discount => count 1.
        $this->makeDiscount(['name' => 'One']);
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'notifications');

        // 2 active discounts => count 2.
        $this->makeDiscount(['name' => 'Two']);
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 2)
            ->assertJsonCount(2, 'notifications');

        // 3 active discounts => count 3.
        $this->makeDiscount(['name' => 'Three']);
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 3)
            ->assertJsonCount(3, 'notifications');
    }

    public function test_future_discount_hidden_until_start_and_removed_after_end(): void
    {
        $member = $this->makeMember();

        // Starts tomorrow, so it must not appear yet.
        $future = $this->makeDiscount([
            'name' => 'Future',
            'start_date' => $this->now->copy()->addDay()->toDateString(),
            'end_date' => $this->now->copy()->addDays(5)->toDateString(),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
        ]);

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 0)
            ->assertJsonCount(0, 'notifications');

        // Travel to the middle of its active window: it should appear.
        Carbon::setTestNow($this->now->copy()->addDays(2)->setTime(12, 0, 0));
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonCount(1, 'notifications')
            ->assertJsonFragment(['name' => 'Future']);

        // Travel past its end: it should disappear again.
        Carbon::setTestNow($this->now->copy()->addDays(6)->setTime(12, 0, 0));
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 0)
            ->assertJsonCount(0, 'notifications');

        // And it must not have leaked an unread notification row.
        $this->assertDatabaseMissing('member_discount_notifications', [
            'customer_id' => $member->id,
            'discount_id' => $future->id,
        ]);
    }

    public function test_reading_one_notification_does_not_mark_others_read(): void
    {
        $member = $this->makeMember();
        $discountA = $this->makeDiscount(['name' => 'A']);
        $discountB = $this->makeDiscount(['name' => 'B']);

        $this->postJson('/customer/member-notifications/' . $discountA->id . '/read', [
            'customer_phone' => $member->phone,
        ])->assertOk();

        $this->assertNotNull(
            MemberDiscountNotification::where('customer_id', $member->id)
                ->where('discount_id', $discountA->id)
                ->first()
                ->read_at,
        );
        $this->assertNull(
            MemberDiscountNotification::where('customer_id', $member->id)
                ->where('discount_id', $discountB->id)
                ->first(),
        );

        // Badge still reflects both active discounts.
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertJsonPath('unread_count', 2);
    }

    public function test_read_state_persists_across_refresh(): void
    {
        $member = $this->makeMember();
        $discount = $this->makeDiscount(['name' => 'Persist']);

        $this->postJson('/customer/member-notifications/' . $discount->id . '/read', [
            'customer_phone' => $member->phone,
        ])->assertOk();

        // A second request (simulating a page refresh) keeps the read state.
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertJsonPath('notifications.0.read_at', fn ($value) => $value !== null);
    }

    public function test_non_member_receives_no_notifications(): void
    {
        $this->makeDiscount(['name' => 'Active']);
        $nonMember = Customer::create([
            'branch_id' => null,
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

    public function test_mark_read_requires_member(): void
    {
        $discount = $this->makeDiscount(['name' => 'Active']);
        $nonMember = Customer::create([
            'branch_id' => null,
            'name' => 'N',
            'phone' => '+251922222222',
            'is_member' => false,
        ]);

        $this->postJson('/customer/member-notifications/' . $discount->id . '/read', [
            'customer_phone' => $nonMember->phone,
        ])->assertForbidden();
    }

    public function test_timezone_aware_active_window(): void
    {
        // Discount window expressed in the application timezone (UTC+3).
        // With "now" fixed to 12:00 in that timezone it is active.
        $member = $this->makeMember();
        $this->makeDiscount([
            'name' => 'Tz',
            'start_date' => $this->now->copy()->toDateString(),
            'end_date' => $this->now->copy()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '14:00:00',
        ]);

        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 1);

        // Outside the time window (early morning) it is hidden.
        Carbon::setTestNow($this->now->copy()->setTime(6, 0, 0));
        $this->getJson('/customer/member-discounts?customer_phone=' . urlencode($member->phone))
            ->assertOk()
            ->assertJsonPath('unread_count', 0);
    }
}
