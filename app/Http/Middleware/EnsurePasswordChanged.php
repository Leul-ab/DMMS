<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Routes a user may reach without first changing their password.
     *
     * @var array<int, string>
     */
    protected array $allowedRoutes = [
        'password.change',
        'password.change.update',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->requiresPasswordChange()) {
            $routeName = $request->route()?->getName();

            if (! in_array($routeName, $this->allowedRoutes, true)) {
                return redirect()->route('password.change');
            }
        }

        return $next($request);
    }
}
