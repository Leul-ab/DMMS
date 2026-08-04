<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::where('slug', 'super_admin')->first();
        $branch = Branch::where('slug', 'main-branch')->first();

        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role_id' => $role?->id,
                'branch_id' => $branch?->id,
            ]
        );

        if ($role) {
            $admin->syncRoles([$role->name]);
            $admin->syncPermissions(Permission::pluck('name'));
        }
    }
}
