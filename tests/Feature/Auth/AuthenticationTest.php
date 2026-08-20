<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Fortify\Features;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered()
    {
        $response = $this->get(route('login'));

        $response->assertOk();
    }

    public function test_users_can_authenticate_using_the_login_screen()
    {
        $user = User::factory()->create();
        Permission::findOrCreate('view dashboard');
        $user->givePermissionTo('view dashboard');

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_authenticate_using_phone_number()
    {
        $user = User::factory()->create([
            'phone' => '+251911234567',
        ]);
        Permission::findOrCreate('view dashboard');
        $user->givePermissionTo('view dashboard');

        $response = $this->post(route('login.store'), [
            'phone' => '0911234567',
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_phone()
    {
        $user = User::factory()->create([
            'phone' => '+251911234567',
        ]);

        $response = $this->post(route('login.store'), [
            'phone' => '0999999999',
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    public function test_users_with_two_factor_enabled_are_redirected_to_two_factor_challenge()
    {
        $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

        Features::twoFactorAuthentication([
            'confirm' => true,
            'confirmPassword' => true,
        ]);

        $user = User::factory()->withTwoFactor()->create();

        $response = $this->post(route('login'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('two-factor.login'));
        $response->assertSessionHas('login.id', $user->id);
        $this->assertGuest();
    }

    public function test_users_can_not_authenticate_with_invalid_password()
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_duplicate_phone_registration_fails_validation()
    {
        User::factory()->create([
            'phone' => '+251911234567',
        ]);

        $response = $this->post(route('register.store'), [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'phone' => '0911234567',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertSessionHasErrors(['phone']);
    }

    public function test_database_rejects_duplicate_non_null_phone_numbers()
    {
        User::factory()->create([
            'phone' => '+251911234567',
        ]);

        $this->expectException(QueryException::class);

        User::factory()->create([
            'phone' => '+251911234567',
        ]);
    }

    public function test_users_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('logout'));

        $response->assertRedirect('/login');

        $this->assertGuest();
    }

    public function test_users_are_rate_limited()
    {
        $user = User::factory()->create();

        RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

        $response = $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertTooManyRequests();
    }
}
