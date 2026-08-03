<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Permission names grouped by module.
     */
    private array $permissions = [
        'Dashboard' => [
            ['view dashboard', 'view'],
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
        'Menu' => [
            ['view menu', 'view'],
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
            ['cancel orders', 'cancel'],
            ['verify payment', 'verify'],
        ],
        'Bookings' => [
            ['view bookings', 'view'],
            ['create bookings', 'create'],
            ['update bookings', 'update'],
            ['delete bookings', 'delete'],
            ['status bookings', 'status'],
            ['cancel bookings', 'cancel'],
            ['complete bookings', 'complete'],
        ],
        'Reports' => [
            ['view reports', 'view'],
            ['export reports', 'export'],
        ],
        'Kitchen' => [
            ['view kitchen', 'view'],
            ['update kitchen', 'update'],
        ],
        'Staff' => [
            ['view staff', 'view'],
            ['create staff', 'create'],
            ['update staff', 'update'],
            ['delete staff', 'delete'],
            ['status staff', 'status'],
            ['assign staff', 'assign'],
        ],
        'Users' => [
            ['view users', 'view'],
            ['create users', 'create'],
            ['update users', 'update'],
            ['delete users', 'delete'],
            ['status users', 'status'],
            ['assign users', 'assign'],
        ],
        'Payments' => [
            ['view payments', 'view'],
            ['show payments', 'show'],
            ['update payments', 'update'],
            ['status payments', 'status'],
            ['verify payments', 'verify'],
        ],
        'Roles' => [
            ['view roles', 'view'],
            ['create roles', 'create'],
            ['update roles', 'update'],
            ['delete roles', 'delete'],
            ['assign permissions', 'assign'],
        ],
        'Permissions' => [
            ['view permissions', 'view'],
            ['create permissions', 'create'],
            ['update permissions', 'update'],
            ['delete permissions', 'delete'],
        ],
        'Branches' => [
            ['view branches', 'view'],
            ['create branches', 'create'],
            ['update branches', 'update'],
            ['delete branches', 'delete'],
            ['assign branches', 'assign'],
            ['switch branches', 'switch'],
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
