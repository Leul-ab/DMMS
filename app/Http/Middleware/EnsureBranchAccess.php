<?php

namespace App\Http\Middleware;

use App\Models\User;
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

        $currentBranchId = $request->session()->get('current_branch_id');

        if ($currentBranchId && ! $user->canAccessBranch((int) $currentBranchId)) {
            $request->session()->forget('current_branch_id');
            $currentBranchId = null;
        }

        if (! $currentBranchId) {
            $defaultBranchId = $this->defaultBranchId($user);

            if ($defaultBranchId) {
                $request->session()->put(
                    'current_branch_id',
                    $defaultBranchId
                );
            }
        }

        return $next($request);
    }

    /**
     * Prefer the user's primary branch when accessible; otherwise first accessible.
     */
    private function defaultBranchId(User $user): ?int
    {
        $accessible = $user->accessibleBranches();

        if ($accessible->isEmpty()) {
            return null;
        }

        if (
            $user->branch_id &&
            $accessible->contains('id', (int) $user->branch_id)
        ) {
            return (int) $user->branch_id;
        }

        return (int) $accessible->first()->id;
    }
}
