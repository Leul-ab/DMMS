<?php

namespace App\Http\Middleware;

use App\Models\Branch;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentBranch
{
    /**
     * Resolve the active branch for the request.
     *
     * - Users with branch-management rights (e.g. `view branches`) can switch
     *   branches via the session; their assigned branch is the default.
     * - Everyone else is locked to their assigned branch.
     * - Guests follow the branch stored in the session (e.g. a scanned table),
     *   then fall back to the main (first active) branch.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $branchId = null;

        if ($user) {
            $canSwitch = $user->can('view branches');

            $branchId = $canSwitch
                ? (session('current_branch_id') ?? $user->branch_id)
                : $user->branch_id;
        } else {
            $branchId = session('current_branch_id');
        }

        if ($branchId) {
            Branch::setCurrent($branchId);
        } else {
            // Fall back to the main branch (first active one) and persist the
            // selection so it stays the default across requests.
            $branch = Branch::current();

            if ($branch) {
                session(['current_branch_id' => $branch->id]);
            }
        }

        return $next($request);
    }
}
