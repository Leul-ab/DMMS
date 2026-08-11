<?php

namespace App\Actions\Fortify;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\RegisterResponse;

class HomeRedirectResponse implements LoginResponse, RegisterResponse
{
    public function toResponse($request)
    {
        $user = $request->user();

        if ($user->can('view dashboard')) {
            return redirect()->route('dashboard');
        }

        if ($user->can('view kitchen')) {
            return redirect()->route('kitchen.dashboard');
        }

        if ($user->can('view serve')) {
            return redirect()->route('serve.index');
        }

        return redirect()->route('menu.index');
    }
}
