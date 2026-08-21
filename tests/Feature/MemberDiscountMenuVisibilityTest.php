<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\RestaurantTable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemberDiscountMenuVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branch;
    private RestaurantTable $table;
    private MenuItem $item;
    private Discount $memberDiscount;
    private Discount $allDiscount;

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

        $this->table = RestaurantTable::create([
            'branch_id' => $this->branch->id,
            'table_number' => 5,
            'qr_code' => 'T5',
            'status' => 'available',
        ]);

        $category = MenuCategory::create([
            'branch_id' => $this->branch->id,
            'name' => 'Mains',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->item = MenuItem::create([
            'branch_id' => $this->branch->id,
            'category_id' => $category->id,
            'name' => 'Pizza',
            'price' => 100,
            'is_available' => true,
        ]);

        $this->memberDiscount = Discount::create([
            'branch_id' => $this->branch->id,
            'name' => 'Member Only',
            'discount_type' => 'percentage',
            'applies_to' => 'members',
            'percentage' => 10,
            'status' => 'active',
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
        ]);

        $this->allDiscount = Discount::create([
            'branch_id' => $this->branch->id,
            'name' => 'All Customers',
            'discount_type' => 'percentage',
            'applies_to' => 'all',
            'percentage' => 5,
            'status' => 'active',
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addDay()->toDateString(),
            'start_time' => '00:00:00',
            'end_time' => '23:59:59',
        ]);

        $this->item->discounts()->attach([
            $this->memberDiscount->id,
            $this->allDiscount->id,
        ]);
    }

    private function menuDiscountIdsForItem(?string $customerPhone = null): array
    {
        $url = "/menu?table={$this->table->table_number}";
        if ($customerPhone !== null) {
            $url .= '&customer_phone=' . urlencode($customerPhone);
        }

        $captured = [];

        $this->get($url)->assertInertia(function (Assert $page) use (&$captured) {
            $props = $page->toArray()['props'];
            $captured['menuItems'] = $props['menuItems'] ?? [];
            $captured['isMember'] = $props['isMember'] ?? false;
        });

        $item = collect($captured['menuItems'])->firstWhere('id', $this->item->id);

        return [
            'ids' => $item ? collect($item['discounts'] ?? [])->pluck('id')->all() : [],
            'isMember' => $captured['isMember'],
        ];
    }

    public function test_members_only_discount_hidden_without_member_code(): void
    {
        $result = $this->menuDiscountIdsForItem();

        $this->assertNotContains($this->memberDiscount->id, $result['ids']);
        $this->assertContains($this->allDiscount->id, $result['ids']);
        $this->assertFalse($result['isMember']);
    }

    public function test_members_only_discount_visible_with_valid_member_code(): void
    {
        $member = Customer::create([
            'branch_id' => $this->branch->id,
            'name' => 'Member',
            'phone' => '+251911111111',
            'is_member' => true,
        ]);

        $result = $this->menuDiscountIdsForItem($member->phone);

        $this->assertContains($this->memberDiscount->id, $result['ids']);
        $this->assertContains($this->allDiscount->id, $result['ids']);
        $this->assertTrue($result['isMember']);
    }
}
