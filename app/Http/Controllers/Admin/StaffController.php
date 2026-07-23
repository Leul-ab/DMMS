<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function dashboard(): Response
    {
        $customerRoleId = Role::where('slug', 'customer')->value('id');
        $waiterRoleId = Role::where('slug', 'waiter')->value('id');
        $kitchenRoles = Role::whereIn('slug', ['chef', 'kitchen_manager', 'kitchen_staff'])->pluck('id');

        $totalEmployees = User::where('role_id', '!=', $customerRoleId)->count();
        $activeStaff = User::where('role_id', '!=', $customerRoleId)->where('status', 'active')->count();
        $inactiveStaff = User::where('role_id', '!=', $customerRoleId)->where('status', 'inactive')->count();
        $onLeave = User::where('role_id', '!=', $customerRoleId)->where('status', 'suspended')->count();
        $waitersCount = User::where('role_id', $waiterRoleId)->count();
        $kitchenCount = User::whereIn('role_id', $kitchenRoles)->count();

        $recentStaff = User::with(['role'])
            ->where('role_id', '!=', $customerRoleId)
            ->latest()
            ->take(5)
            ->get();

        $newEmployees = User::with(['role'])
            ->where('role_id', '!=', $customerRoleId)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $todayShifts = ShiftAssignment::with(['user', 'shift'])
            ->whereDate('date', today())
            ->get();

        $upcomingShifts = ShiftAssignment::with(['user', 'shift'])
            ->whereDate('date', '>', today())
            ->whereDate('date', '<=', today()->addDays(7))
            ->orderBy('date')
            ->take(10)
            ->get();

        return Inertia::render('admin/staff/dashboard', [
            'stats' => [
                'total_employees' => $totalEmployees,
                'active_staff' => $activeStaff,
                'inactive_today' => $inactiveStaff,
                'on_leave' => $onLeave,
                'waiters' => $waitersCount,
                'kitchen_staff' => $kitchenCount,
            ],
            'recentStaff' => $recentStaff,
            'newEmployees' => $newEmployees,
            'todayShifts' => $todayShifts,
            'upcomingShifts' => $upcomingShifts,
        ]);
    }

    public function index(Request $request): Response
    {
        $staff = User::with(['role'])
            ->where('role_id', '!=', Role::where('slug', 'customer')->value('id'))
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role_id', $role);
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/staff/index', [
            'staff' => $staff,
            'roles' => Role::where('slug', '!=', 'customer')->get(),
            'filters' => $request->only(['search', 'role']),
        ]);
    }

    public function show(User $user): Response
    {
        $user->load(['role', 'shiftAssignments']);

        $stats = [
            'attendance_percentage' => 92,
            'orders_served' => 145,
            'hours_worked' => 160,
            'performance_rating' => 4.5,
            'completed_shifts' => $user->shiftAssignments()->count(),
        ];

        return Inertia::render('admin/staff/show', [
            'staff' => $user,
            'stats' => $stats,
            'recentShifts' => $user->shiftAssignments()
                ->with('shift')
                ->latest('date')
                ->take(10)
                ->get(),
        ]);
    }

    public function waiters(Request $request): Response
    {
        $waiterRole = Role::where('slug', 'waiter')->value('id');
        $waiters = User::with(['role'])
            ->where('role_id', $waiterRole)
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/staff/waiters', [
            'waiters' => $waiters,
            'filters' => $request->only(['search']),
        ]);
    }

    public function kitchenStaff(Request $request): Response
    {
        $kitchenRoles = Role::whereIn('slug', ['chef', 'kitchen_manager', 'kitchen_staff'])->pluck('id');
        $kitchenStaff = User::with(['role'])
            ->whereIn('role_id', $kitchenRoles)
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/staff/kitchen-staff', [
            'kitchenStaff' => $kitchenStaff,
            'roles' => Role::whereIn('slug', ['chef', 'kitchen_manager', 'kitchen_staff'])->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function kitchenManagers(Request $request): Response
    {
        $kitchenManagerRole = Role::where('slug', 'kitchen_manager')->value('id');
        $managers = User::with(['role'])
            ->where('role_id', $kitchenManagerRole)
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/staff/kitchen-managers', [
            'managers' => $managers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function chefs(Request $request): Response
    {
        $chefRole = Role::where('slug', 'chef')->value('id');
        $chefs = User::with(['role'])
            ->where('role_id', $chefRole)
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/staff/chefs', [
            'chefs' => $chefs,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        $lastEmployee = User::whereNotNull('employee_id')
            ->orderByRaw('CAST(SUBSTRING(employee_id, 9) AS UNSIGNED) DESC')
            ->value('employee_id');

        $nextNumber = $lastEmployee ? (int) substr($lastEmployee, 8) + 1 : 1;
        $nextEmployeeId = 'emp_id' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        return Inertia::render('admin/staff/create', [
            'roles' => Role::where('slug', '!=', 'customer')->get(),
            'nextEmployeeId' => $nextEmployeeId,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $lastEmployee = User::whereNotNull('employee_id')
            ->orderByRaw('CAST(SUBSTRING(employee_id, 9) AS UNSIGNED) DESC')
            ->value('employee_id');
        $nextNumber = $lastEmployee ? (int) substr($lastEmployee, 8) + 1 : 1;
        $employeeId = 'emp_id' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'role_id' => ['required', 'exists:roles,id'],
            'address' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $validated['employee_id'] = $employeeId;

        $validated['name'] = $validated['first_name'] . ' ' . $validated['last_name'];
        $validated['password'] = Hash::make($validated['password']);
        $validated['email_verified_at'] = now();

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('staff-photos', 'public');
        }

        User::create($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Staff member created successfully.']);

        return to_route('admin.staff.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('admin/staff/edit', [
            'staff' => $user->load(['role']),
            'roles' => Role::where('slug', '!=', 'customer')->get(),
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'role_id' => ['required', 'exists:roles,id'],
            'address' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'password' => ['nullable', 'string', 'confirmed', Password::defaults()],
        ]);

        $validated['name'] = $validated['first_name'] . ' ' . $validated['last_name'];

        if (empty($validated['password'])) {
            unset($validated['password']);
        } else {
            $validated['password'] = Hash::make($validated['password']);
        }

        if ($request->hasFile('photo')) {
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }
            $validated['photo'] = $request->file('photo')->store('staff-photos', 'public');
        }

        $user->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Staff member updated successfully.']);

        return to_route('admin.staff.edit', $user->id);
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'You cannot delete your own account.']);
            return back();
        }

        if ($user->photo) {
            Storage::disk('public')->delete($user->photo);
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Staff member deleted successfully.']);

        return to_route('admin.staff.index');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $user->update(['password' => Hash::make($validated['password'])]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Password reset successfully.']);

        return back();
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        if ($user->id === auth()->id()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'You cannot change your own status.']);
            return back();
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Staff member {$user->name} has been {$newStatus}.",
        ]);

        return back();
    }
}
