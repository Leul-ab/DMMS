<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Fortify\HomeRedirectResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordChangeController extends Controller
{
    /**
     * Show the forced first-login password change screen.
     */
    public function edit(Request $request): Response
    {
        abort_unless($request->user()?->requiresPasswordChange(), 403);

        return Inertia::render('auth/PasswordChange');
    }

    /**
     * Update the password and clear the first-login requirement.
     */
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $user->update([
            'password' => $request->password,
            'must_change_password' => false,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Password changed. Welcome!',
        ]);

        return app(HomeRedirectResponse::class)->toResponse($request);
    }
}
