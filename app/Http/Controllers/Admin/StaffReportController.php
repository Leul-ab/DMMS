<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffReportController extends Controller
{
    public function index(Request $request): Response
    {
        $customerRoleId = Role::where('slug', 'customer')->value('id');

        $totalStaff = User::where('role_id', '!=', $customerRoleId)->count();
        $activeStaff = User::where('role_id', '!=', $customerRoleId)->where('status', 'active')->count();
        $inactiveStaff = User::where('role_id', '!=', $customerRoleId)->where('status', 'inactive')->count();
        $suspendedStaff = User::where('role_id', '!=', $customerRoleId)->where('status', 'suspended')->count();

        $staffByRole = Role::withCount(['users' => function ($query) use ($customerRoleId) {
            $query->where('role_id', '!=', $customerRoleId);
        }])->where('slug', '!=', 'customer')->get();

        $staffByDepartment = Department::withCount(['users' => function ($query) use ($customerRoleId) {
            $query->where('role_id', '!=', $customerRoleId);
        }])->get();

        $recentHires = User::with(['role', 'department'])
            ->where('role_id', '!=', $customerRoleId)
            ->whereNotNull('hire_date')
            ->latest('hire_date')
            ->take(10)
            ->get();

        return Inertia::render('admin/staff/reports', [
            'totalStaff' => $totalStaff,
            'activeStaff' => $activeStaff,
            'inactiveStaff' => $inactiveStaff,
            'suspendedStaff' => $suspendedStaff,
            'staffByRole' => $staffByRole,
            'staffByDepartment' => $staffByDepartment,
            'recentHires' => $recentHires,
        ]);
    }
}
