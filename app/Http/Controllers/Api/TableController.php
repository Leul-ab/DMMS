<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use App\Models\WaiterTableAssignment;
use Illuminate\Http\JsonResponse;

class TableController extends Controller
{
    public function index(): JsonResponse
    {
        $tables = RestaurantTable::select('id', 'table_number', 'status')
            ->orderBy('table_number')
            ->get();

        // Get the currently assigned waiter for each table (active assignments only)
        $activeAssignments = WaiterTableAssignment::whereIn('status', ['assigned', 'serving'])
            ->with('waiter:id,name')
            ->get()
            ->keyBy('table_id');

        $tables = $tables->map(function ($table) use ($activeAssignments) {
            $assignment = $activeAssignments->get($table->id);

            return [
                'id' => $table->id,
                'table_number' => $table->table_number,
                'status' => $table->status,
                'assigned_waiter' => $assignment ? [
                    'id' => $assignment->waiter_id,
                    'name' => $assignment->waiter->name,
                ] : null,
                'is_assigned' => $assignment !== null,
            ];
        });

        return response()->json($tables);
    }
}
