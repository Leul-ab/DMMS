<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function index(Request $request): Response
    {
        $shifts = Shift::withCount(['shiftAssignments as staff_count'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $today = now()->toDateString();
        $todaysAssignments = ShiftAssignment::with(['user:id,name,first_name,last_name', 'shift'])
            ->whereDate('date', $today)
            ->get()
            ->groupBy(fn($a) => $a->shift->name);

        $staff = User::with('role')
            ->where('role_id', '!=', Role::where('slug', 'customer')->value('id'))
            ->where('status', 'active')
            ->get(['id', 'name', 'first_name', 'last_name', 'role_id']);

        return Inertia::render('admin/shifts/index', [
            'shifts' => $shifts,
            'todaysAssignments' => $todaysAssignments,
            'staff' => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'string'],
            'end_time' => ['required', 'string', 'after:start_time'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        Shift::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift created successfully.']);

        return to_route('admin.shifts.index');
    }

    public function update(Request $request, Shift $shift): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_time' => ['required', 'string'],
            'end_time' => ['required', 'string', 'after:start_time'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);

        $shift->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift updated successfully.']);

        return to_route('admin.shifts.index');
    }

    public function destroy(Shift $shift): RedirectResponse
    {
        $shift->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift deleted successfully.']);

        return to_route('admin.shifts.index');
    }

    public function assign(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'shift_id' => ['required', 'exists:shifts,id'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        ShiftAssignment::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'shift_id' => $validated['shift_id'],
                'date' => $validated['date'],
            ],
            ['notes' => $validated['notes'] ?? null]
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift assigned successfully.']);

        return to_route('admin.shifts.index');
    }

    public function removeAssignment(ShiftAssignment $assignment): RedirectResponse
    {
        $assignment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Shift assignment removed.']);

        return to_route('admin.shifts.index');
    }

    public function todaySchedule(): Response
    {
        $today = now()->toDateString();
        $assignments = ShiftAssignment::with(['user:id,name,first_name,last_name', 'shift'])
            ->whereDate('date', $today)
            ->get()
            ->groupBy(fn($a) => $a->shift->name);

        return Inertia::render('admin/shifts/today', [
            'assignments' => $assignments,
            'date' => $today,
        ]);
    }
}
