<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user() || ! $request->user()->role) {
            abort(403, 'Unauthorized. No role assigned.');
        }

        if (in_array($request->user()->role->slug, $roles)) {
            return $next($request);
        }

        abort(403, 'Unauthorized. Insufficient permissions.');
    }
}
