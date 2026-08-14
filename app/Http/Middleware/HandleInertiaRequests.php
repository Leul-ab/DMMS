<?php

namespace App\Http\Middleware;

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
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user() ? $request->user()->load('role') : null,
            ],
            'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name')->values()->all() : [],
            'allBranches' => fn () => ($request->user()?->can('switch branches'))
                ? \App\Models\Branch::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'currentBranch' => fn () => \App\Models\Branch::current()
                ?->only(['id', 'name']),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'booking_success' => session('booking_success', false),
            'booking_data' => session('booking_data'),
            'customer_phone' => session('customer_phone', ''),
            'order_count' => function () use ($request) {
                if ($request->session()->has('customer_phone')) {
                    $customerPhone = $request->session()->get('customer_phone');
                    $customer = \App\Models\Customer::where('phone', $customerPhone)->first();
                    if ($customer) {
                        return \App\Models\Order::where('customer_id', $customer->id)
                            ->whereIn('status', ['pending', 'received', 'confirmed', 'preparing', 'ready', 'served'])
                            ->count();
                    }
                }
                return 0;
            },
            'notifications' => function () use ($request) {
                $user = $request->user();

                return [
                    'kitchen' => $user?->can('view kitchen')
                        ? Order::where('status', 'pending')->count()
                        : 0,
                    'serve' => $user?->can('view serve')
                        ? Order::where('status', 'ready')->count()
                        : 0,
                    'paymentVerification' => $user?->can('view payments')
                        ? Order::where('payment_status', 'pending')->whereHas('payment')->count()
                        : 0,
                ];
            },
        ];
    }
}
