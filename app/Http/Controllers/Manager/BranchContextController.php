<?php
namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BranchContextController extends Controller
{
    /**
     * Switch the current branch.
     */
    public function switch (Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
        ]);

        $user = $request->user();

        // Only super admins and managers can switch branches.
        if (
            ! $user ||
            (! $user->hasRole('super_admin') && ! $user->hasRole('manager'))
        ) {
            abort(403, 'You are not authorized to switch branches.');
        }

        $branch = Branch::query()
            ->where('id', $validated['branch_id'])
            ->where('is_active', true)
            ->firstOrFail();

        // Store the selected branch in the session.
        $request->session()->put(
            'current_branch_id',
            $branch->id
        );

        // Clear table context so the menu reflects the switched branch.
        $request->session()->forget([
            'scanned_table_id',
            'scanned_table_number',
            'active_booking_id',
        ]);

        return back()->with(
            'success',
            "Switched to {$branch->name} successfully."
        );
    }
}

