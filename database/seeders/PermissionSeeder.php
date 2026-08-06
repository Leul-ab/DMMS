<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Permission names grouped by the sidebar/page they belong to.
     * Each entry is [permission name, action]. Actions are created for
     * every sidebar/page so roles can be composed button-by-button.
     */
    private array $permissions = [
        'Dashboard' => [
            ['view dashboard', 'view'],
        ],
        'Branches' => [
            ['view branches', 'view'],
            ['create branches', 'create'],
            ['show branches', 'show'],
            ['update branches', 'update'],
            ['delete branches', 'delete'],
            ['status branches', 'status'],
            ['switch branches', 'switch'],
        ],
        'Menu Categories' => [
            ['view menu categories', 'view'],
            ['create menu categories', 'create'],
            ['update menu categories', 'update'],
            ['delete menu categories', 'delete'],
            ['status menu categories', 'status'],
        ],
        'Menu Items' => [
            ['view menu items', 'view'],
            ['create menu items', 'create'],
            ['update menu items', 'update'],
            ['delete menu items', 'delete'],
            ['status menu items', 'status'],
        ],
        'Tables' => [
            ['view tables', 'view'],
            ['create tables', 'create'],
            ['update tables', 'update'],
            ['delete tables', 'delete'],
            ['status tables', 'status'],
        ],
        'Customers' => [
            ['view customers', 'view'],
            ['create customers', 'create'],
            ['update customers', 'update'],
            ['delete customers', 'delete'],
            ['status customers', 'status'],
        ],
        'Orders' => [
            ['view orders', 'view'],
            ['show orders', 'show'],
            ['update orders', 'update'],
            ['delete orders', 'delete'],
            ['status orders', 'status'],
        ],
        'Bookings' => [
            ['view bookings', 'view'],
            ['update bookings', 'update'],
            ['delete bookings', 'delete'],
            ['status bookings', 'status'],
        ],
        'Reports' => [
            ['view reports', 'view'],
        ],
        'Feedback' => [
            ['view feedback', 'view'],
        ],
        'Kitchen' => [
            ['view kitchen', 'view'],
            ['update kitchen', 'update'],
        ],
        'Serve' => [
            ['view serve', 'view'],
            ['update serve', 'update'],
        ],
        'Staff' => [
            ['view staff', 'view'],
            ['create staff', 'create'],
            ['update staff', 'update'],
            ['delete staff', 'delete'],
            ['status staff', 'status'],
        ],
        'Users' => [
            ['view users', 'view'],
            ['create users', 'create'],
            ['update users', 'update'],
            ['delete users', 'delete'],
            ['status users', 'status'],
        ],
        'Payments' => [
            ['view payments', 'view'],
            ['show payments', 'show'],
            ['update payments', 'update'],
            ['status payments', 'status'],
        ],
        'Payment Verification' => [
            ['view payment verification', 'view'],
            ['verify payments', 'verify'],
            ['reject payments', 'reject'],
        ],
        'Roles' => [
            ['view roles', 'view'],
            ['create roles', 'create'],
            ['update roles', 'update'],
            ['delete roles', 'delete'],
        ],
        'Permissions' => [
            ['view permissions', 'view'],
            ['create permissions', 'create'],
            ['update permissions', 'update'],
            ['delete permissions', 'delete'],
        ],
        'Menu' => [
            ['view menu', 'view'],
        ],
        'Discounts' => [
            ['view discounts', 'view'],
            ['create discounts', 'create'],
            ['update discounts', 'update'],
            ['delete discounts', 'delete'],
            ['toggle discount status', 'toggle'],
        ],
    ];

    public function run(): void
    {
        foreach ($this->permissions as $group => $items) {
            foreach ($items as [$name]) {
                Permission::updateOrCreate(
                    ['name' => $name, 'guard_name' => 'web'],
                    ['group' => $group],
                );
            }
        }
    }
}
