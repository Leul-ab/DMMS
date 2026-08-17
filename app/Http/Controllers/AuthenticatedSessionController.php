<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\LoginViewResponse;
use Laravel\Fortify\Contracts\LogoutResponse;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\TwoFactorAuthenticatable;

class AuthenticatedSessionController extends Controller
{
    /**
     * The guard implementation.
     *
     * @var StatefulGuard
     */
    protected $guard;

    /**
     * Create a new controller instance.
     */
    public function __construct(StatefulGuard $guard)
    {
        $this->guard = $guard;
    }

    /**
     * Show the login view.
     */
    public function create(Request $request): LoginViewResponse
    {
        return app(LoginViewResponse::class);
    }

    /**
     * Attempt to authenticate a new session.
     */
    public function store(LoginRequest $request)
    {
        $user = $request->authenticate();

        $hasTwoFactor = optional($user)->two_factor_secret &&
            in_array(TwoFactorAuthenticatable::class, class_uses_recursive($user)) &&
            (! Fortify::confirmsTwoFactorAuthentication() || ! is_null(optional($user)->two_factor_confirmed_at));

        if (Features::enabled(Features::twoFactorAuthentication()) && $hasTwoFactor) {
            $this->guard->logout();
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);

            return redirect()->route('two-factor.login');
        }

        $request->session()->regenerate();

        return app(LoginResponse::class);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request)
    {
        $this->guard->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return app(LogoutResponse::class);
    }
}
