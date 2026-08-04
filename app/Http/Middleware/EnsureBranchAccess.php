<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBranchAccess
{
    /**
     * Ensure the session branch is valid for the authenticated user.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->role?->slug === 'super_admin') {
            return $next($request);
        }

        $currentBranchId = $request->session()->get('current_branch_id');

        if ($currentBranchId && ! $user->canAccessBranch((int) $currentBranchId)) {
            $request->session()->forget('current_branch_id');
            $currentBranchId = null;
        }

        if (! $currentBranchId) {
            $firstBranch = $user->accessibleBranches()->first();

            if ($firstBranch) {
                $request->session()->put(
                    'current_branch_id',
                    $firstBranch->id
                );
            }
        }

        return $next($request);
    }
}
