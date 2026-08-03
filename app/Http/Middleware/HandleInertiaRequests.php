<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | Available Branches (assignment-aware)
        |--------------------------------------------------------------------------
        |
        | Super admins see all active branches.
        | Managers/staff see only branches assigned by an admin.
        |
        */

        $branches = collect();

        if ($user) {
            $branches = $user->accessibleBranches()->values();
        }

        /*
        |--------------------------------------------------------------------------
        | Current Branch
        |--------------------------------------------------------------------------
        */

        $currentBranchId = $request->session()->get('current_branch_id');
        $currentBranch = null;

        if ($currentBranchId) {
            $currentBranch = $branches->firstWhere(
                'id',
                (int) $currentBranchId
            );

            // Session points at a branch the user cannot access.
            if (! $currentBranch) {
                $request->session()->forget('current_branch_id');
                $currentBranchId = null;
            }
        }

        if (! $currentBranch && $branches->isNotEmpty()) {
            $currentBranch = $branches->first();

            $request->session()->put(
                'current_branch_id',
                $currentBranch->id
            );
        }

        return [
            ...parent::share($request),

            'name' => config('app.name'),

            'auth' => [
                'user' => $user
                    ? $user->load([
                        'role',
                        'branch',
                        'assignedBranches',
                    ])
                    : null,
            ],

            'branches' => $branches->map(fn ($branch) => [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'phone' => $branch->phone,
                'is_active' => $branch->is_active,
            ])->values(),

            'currentBranch' => $currentBranch
                ? [
                    'id' => $currentBranch->id,
                    'name' => $currentBranch->name,
                    'address' => $currentBranch->address,
                    'phone' => $currentBranch->phone,
                    'is_active' => $currentBranch->is_active,
                ]
                : null,

            'sidebarOpen' =>
                ! $request->hasCookie('sidebar_state') ||
                $request->cookie('sidebar_state') === 'true',

            'booking_success' => session(
                'booking_success',
                false
            ),

            'booking_data' => session(
                'booking_data'
            ),

            'customer_code' => session(
                'customer_code',
                ''
            ),

            'order_count' => function () use ($request) {
                if (
                    $request->session()->has(
                        'customer_code'
                    )
                ) {
                    $customerCode =
                        $request->session()->get(
                            'customer_code'
                        );

                    $customer = Customer::where(
                        'customer_code',
                        $customerCode
                    )->first();

                    if ($customer) {
                        return Order::where(
                            'customer_id',
                            $customer->id
                        )
                            ->whereIn(
                                'status',
                                [
                                    'pending',
                                    'received',
                                    'confirmed',
                                    'preparing',
                                    'ready',
                                    'served',
                                ]
                            )
                            ->count();
                    }
                }

                return 0;
            },
        ];
    }
}
