<?php

namespace App\Http\Requests\Auth;

use App\Support\PhoneHelper;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Fortify;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, \Illuminate\Validation\ValidationRule|array<mixed>|string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['nullable', 'string', 'email', 'required_without:phone'],
            'phone' => ['nullable', 'string', 'required_without:email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Determine which username field is being used.
     */
    public function username(): string
    {
        if ($this->filled('phone')) {
            return 'phone';
        }

        return Fortify::username();
    }

    /**
     * Attempt to authenticate the request's credentials.
     */
    public function authenticate()
    {
        $this->ensureIsNotRateLimited();

        $user = null;

        if (Fortify::$authenticateThroughCallback) {
            $user = call_user_func(Fortify::$authenticateThroughCallback, $this);
        } else {
            $credentials = $this->credentials();
            if (Auth::attempt($credentials, $this->boolean('remember'))) {
                $user = Auth::user();
            }
        }

        if (! $user) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                $this->username() => trans('auth.failed'),
            ]);
        }

        Auth::login($user, $this->boolean('remember'));
        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    /**
     * Ensure the login request is not rate limited.
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            $this->username() => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the authentication credentials from the request.
     *
     * @return array<string, string>
     */
    protected function credentials(): array
    {
        if ($this->filled('phone')) {
            return [
                'phone' => PhoneHelper::normalize($this->input('phone')),
                'password' => $this->input('password'),
            ];
        }

        return [
            $this->username() => $this->input($this->username()),
            'password' => $this->input('password'),
        ];
    }

    /**
     * Normalize the phone number to a consistent E.164-like format.
     */
    protected function normalizePhone(string $phone): string
    {
        return PhoneHelper::normalize($phone) ?? $phone;
    }

    /**
     * Get the throttle key for the request.
     */
    public function throttleKey(): string
    {
        $loginId = $this->filled('phone')
            ? PhoneHelper::normalize($this->input('phone'))
            : Str::lower($this->input(Fortify::username(), $this->input('email', '')));

        return Str::transliterate($loginId.'|'.$this->ip());
    }
}

