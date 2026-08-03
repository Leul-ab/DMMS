<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Permissions granted to each role (by role slug).
     */
    private array $rolePermissions = [
        'super_admin' => '*',
        'manager' => [
            'view dashboard',
            'view menu categories',
            'create menu categories',
            'update menu categories',
            'delete menu categories',
            'status menu categories',
            'view menu items',
            'create menu items',
            'update menu items',
            'delete menu items',
            'status menu items',
            'view menu',
            'view tables',
            'create tables',
            'update tables',
            'delete tables',
            'status tables',
            'view customers',
            'create customers',
            'update customers',
            'delete customers',
            'status customers',
            'view orders',
            'show orders',
            'update orders',
            'delete orders',
            'status orders',
            'cancel orders',
            'verify payment',
            'view bookings',
            'create bookings',
            'update bookings',
            'delete bookings',
            'status bookings',
            'cancel bookings',
            'complete bookings',
            'view reports',
            'export reports',
            'view kitchen',
            'update kitchen',
            'view staff',
            'create staff',
            'update staff',
            'delete staff',
            'status staff',
            'assign staff',
            'view payments',
            'show payments',
            'update payments',
            'status payments',
            'verify payments',
            'switch branches',
        ],
        'kitchen_staff' => [
            'view kitchen',
            'update kitchen',
            'view menu',
            'view orders',
        ],
        'waiter' => [
            'view menu',
            'view orders',
            'show orders',
            'view tables',
        ],
        'customer' => [
            'view menu',
        ],
    ];

    public function run(): void
    {
        $roles = [
            ['name' => 'Super Admin', 'slug' => 'super_admin', 'description' => 'Full system access'],
            ['name' => 'Manager', 'slug' => 'manager', 'description' => 'Restaurant operations and statistics'],
            ['name' => 'Kitchen Staff', 'slug' => 'kitchen_staff', 'description' => 'View and manage kitchen orders'],
            ['name' => 'Waiter', 'slug' => 'waiter', 'description' => 'Serve orders to customers'],
            ['name' => 'Customer', 'slug' => 'customer', 'description' => 'Scan QR and place orders'],
        ];

        $allPermissions = Permission::pluck('name');

        foreach ($roles as $roleData) {
            $role = Role::updateOrCreate(
                ['slug' => $roleData['slug']],
                [
                    'name' => $roleData['name'],
                    'guard_name' => 'web',
                    'description' => $roleData['description'],
                ],
            );

            $permissions = $this->rolePermissions[$role->slug] ?? [];

            if ($permissions === '*') {
                $permissions = $allPermissions->all();
            }

            $role->syncPermissions($permissions);
        }
    }
}
