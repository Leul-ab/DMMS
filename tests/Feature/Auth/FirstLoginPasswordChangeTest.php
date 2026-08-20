<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class FirstLoginPasswordChangeTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        $user = User::factory()->create([
            'must_change_password' => true,
            'password' => Hash::make('12345678'),
        ]);

        Permission::findOrCreate('view dashboard');
        $user->givePermissionTo('view dashboard');

        return $user;
    }

    public function test_password_change_screen_renders(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->get(route('password.change'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page->component('auth/PasswordChange'),
            );
    }

    public function test_login_redirects_to_forced_password_change(): void
    {
        $user = $this->adminUser();

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => '12345678',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('password.change', absolute: false));
    }

    public function test_blocked_routes_redirect_to_password_change(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('password.change', absolute: false));
    }

    public function test_cannot_update_with_wrong_current_password(): void
    {
        $user = $this->adminUser();

        $response = $this->actingAs($user)
            ->from(route('password.change'))
            ->put(route('password.change.update'), [
                'current_password' => 'wrong-password',
                'password' => 'new-secret-password',
                'password_confirmation' => 'new-secret-password',
            ]);

        $response->assertSessionHasErrors('current_password');
        $this->assertTrue($user->refresh()->requiresPasswordChange());
        $this->assertTrue(Hash::check('12345678', $user->password));
    }

    public function test_successful_change_clears_flag_and_redirects_home(): void
    {
        $user = $this->adminUser();

        $response = $this->actingAs($user)
            ->put(route('password.change.update'), [
                'current_password' => '12345678',
                'password' => 'new-secret-password',
                'password_confirmation' => 'new-secret-password',
            ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('dashboard', absolute: false));

        $user->refresh();
        $this->assertFalse($user->requiresPasswordChange());
        $this->assertTrue(Hash::check('new-secret-password', $user->password));
    }

    public function test_subsequent_logins_are_not_forced(): void
    {
        $user = $this->adminUser();

        // First login -> forced change.
        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => '12345678',
        ]);

        $this->actingAs($user)
            ->put(route('password.change.update'), [
                'current_password' => '12345678',
                'password' => 'new-secret-password',
                'password_confirmation' => 'new-secret-password',
            ]);

        auth()->logout();

        // Second login -> normal home, no forced change.
        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'new-secret-password',
        ]);

        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_logout_is_allowed_while_forced(): void
    {
        $user = $this->adminUser();

        $this->actingAs($user)
            ->post(route('logout'))
            ->assertRedirect('/login');

        $this->assertGuest();
    }

    public function test_admin_create_assigns_default_password_and_forces_change(): void
    {
        $admin = User::factory()->create();
        Permission::findOrCreate('create users');
        $admin->givePermissionTo('create users');

        $role = \App\Models\Role::create([
            'name' => 'manager',
            'slug' => 'manager',
            'guard_name' => 'web',
        ]);
        $branch = \App\Models\Branch::create(['name' => 'Main']);

        $response = $this->actingAs($admin)
            ->post(route('admin.users.store'), [
                'name' => 'New Manager',
                'email' => 'newmanager@example.com',
                'role_id' => $role->id,
                'branch_id' => $branch->id,
                'is_active' => true,
                'is_waiter' => false,
            ]);

        $response->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'newmanager@example.com',
            'must_change_password' => true,
        ]);

        $created = User::where('email', 'newmanager@example.com')->first();
        $this->assertNotNull($created);
        $this->assertTrue(Hash::check('12345678', $created->password));

        // Log out the admin, then perform the new user's first login.
        $this->post(route('logout'));

        // First login with the default password forces the change screen.
        $this->post(route('login.store'), [
            'email' => 'newmanager@example.com',
            'password' => '12345678',
        ])->assertRedirect(route('password.change', absolute: false));
    }
}
