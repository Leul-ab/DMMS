<?php

namespace App\Http\Middleware;

use App\Models\Branch;
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
        | Current Branch
        |--------------------------------------------------------------------------
        |
        | The selected branch is stored in the session.
        | If no branch has been selected yet, we use the user's branch.
        |
        */

        $currentBranchId = $request->session()->get('current_branch_id');

        $currentBranch = null;

        if ($currentBranchId) {
            $currentBranch = Branch::where('id', $currentBranchId)
                ->where('is_active', true)
                ->first();
        }

        /*
        |--------------------------------------------------------------------------
        | Fallback to User's Branch
        |--------------------------------------------------------------------------
        */

        if (! $currentBranch && $user?->branch_id) {
            $currentBranch = Branch::where('id', $user->branch_id)
                ->where('is_active', true)
                ->first();

            if ($currentBranch) {
                $request->session()->put(
                    'current_branch_id',
                    $currentBranch->id
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Available Branches
        |--------------------------------------------------------------------------
        |
        | Only super admins and managers can switch branches.
        |
        */

        $branches = [];

        if (
            $user &&
            ($user->hasRole('super_admin') || $user->hasRole('manager'))
        ) {
            $branches = Branch::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'name',
                    'address',
                    'phone',
                    'is_active',
                ]);
        }

        return [
            ...parent::share($request),

            'name' => config('app.name'),

            /*
            |--------------------------------------------------------------------------
            | Authentication
            |--------------------------------------------------------------------------
            */

            'auth' => [
                'user' => $user
                    ? $user->load([
                        'role',
                        'branch',
                    ])
                    : null,
            ],

            /*
            |--------------------------------------------------------------------------
            | Branch Context
            |--------------------------------------------------------------------------
            */

            'branches' => $branches,

            'currentBranch' => $currentBranch,

            /*
            |--------------------------------------------------------------------------
            | Sidebar
            |--------------------------------------------------------------------------
            */

            'sidebarOpen' =>
                ! $request->hasCookie('sidebar_state') ||
                $request->cookie('sidebar_state') === 'true',

            /*
            |--------------------------------------------------------------------------
            | Booking Data
            |--------------------------------------------------------------------------
            */

            'booking_success' => session(
                'booking_success',
                false
            ),

            'booking_data' => session(
                'booking_data'
            ),

            /*
            |--------------------------------------------------------------------------
            | Customer Data
            |--------------------------------------------------------------------------
            */

            'customer_code' => session(
                'customer_code',
                ''
            ),

            /*
            |--------------------------------------------------------------------------
            | Customer Order Count
            |--------------------------------------------------------------------------
            */

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

