<?php

namespace App\Http\Controllers\Serve;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\RestaurantTable;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ServeController extends Controller
{
    /**
     * Show orders that are ready to be served.
     *
     * Kitchen marks orders as "ready"; servers pick them up from here
     * and complete them once the food has been delivered to the table.
     */
    public function index()
    {
        $user = auth()->user();

        // Tables directly assigned to this waiter
        // (waiter -> table assignment relationship).
        $assignedTableIds = $user
            ->tableAssignments()
            ->whereNotNull('table_id')
            ->pluck('table_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        // Sections that those assigned tables belong to
        // (table -> table section relationship).
        $assignedSectionIds = RestaurantTable::query()
            ->whereIn('id', $assignedTableIds)
            ->whereNotNull('table_section_id')
            ->pluck('table_section_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        // Allowed tables = directly assigned tables plus every other table
        // that belongs to one of the assigned sections.
        $allowedTableIds = RestaurantTable::query()
            ->where(function ($query) use ($assignedTableIds, $assignedSectionIds) {
                $query->whereIn('id', $assignedTableIds);

                if (! empty($assignedSectionIds)) {
                    $query->orWhereIn('table_section_id', $assignedSectionIds);
                }
            })
            ->pluck('id')
            ->all();

        // Waiters with no assigned tables/sections see no table orders.
        if (empty($allowedTableIds)) {
            $orders = collect();
        } else {
            $orders = Order::with([
                'table',
                'orderItems.menuItem',
                'customer',
            ])
                ->where('status', 'ready')
                ->whereIn('table_id', $allowedTableIds)
                ->latest()
                ->get();
        }

        return Inertia::render('serve/index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Show orders that have been served by the current user.
     */
    public function history()
    {
        $orders = Order::with([
            'table',
            'orderItems.menuItem',
            'customer',
        ])
            ->where('status', 'completed')
            ->where('served_by', auth()->id())
            ->latest()
            ->paginate(10);

        return Inertia::render('serve/history', [
            'orders' => $orders,
        ]);
    }

    /**
     * Mark a ready order as completed once it has been served.
     */
    public function completeOrder(Order $order)
    {
        if ($order->status !== 'ready') {
            return back()->with('error', 'Order cannot be completed.');
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'status' => 'completed',
                'preparation_status' => 'completed',
                'served_by' => auth()->id(),
            ]);

            $table = $order->table;
            if ($table && $table->current_order_id === $order->id) {
                $table->update([
                    'status' => 'available',
                    'current_order_id' => null,
                ]);
            }
        });

        return back()->with('success', 'Order served successfully.');
    }
}
