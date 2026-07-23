import { Head, Link } from '@inertiajs/react';
import { Users, UserCheck, UserX, Clock, UtensilsCrossed, ChefHat, ArrowRight, Calendar, Activity } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { index as staffIndex, create as staffCreate, waiters as waitersRoute, kitchen as kitchenRoute } from '@/routes/admin/staff';
import { index as shiftsIndex } from '@/routes/admin/shifts';

type StaffMember = {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    email: string;
    status: string;
    photo: string | null;
    role: { name: string } | null;
    shift: { name: string; start_time: string; end_time: string } | null;
};

type ShiftAssignment = {
    id: number;
    date: string;
    user: StaffMember;
    shift: { name: string; start_time: string; end_time: string };
};

type Props = {
    stats: {
        total_employees: number;
        active_staff: number;
        inactive_today: number;
        on_leave: number;
        waiters: number;
        kitchen_staff: number;
    };
    recentStaff: StaffMember[];
    newEmployees: number;
    todayShifts: ShiftAssignment[];
    upcomingShifts: ShiftAssignment[];
};

export default function StaffDashboard({ stats, recentStaff, newEmployees, todayShifts, upcomingShifts }: Props) {
    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active': return 'default' as const;
            case 'inactive': return 'secondary' as const;
            case 'suspended': return 'destructive' as const;
            default: return 'outline' as const;
        }
    };

    return (
        <>
            <Head title="Staff Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Staff Dashboard" description="Overview of your restaurant staff" />
                    <Button asChild>
                        <Link href={staffCreate.url()}>
                            <Users className="mr-2 h-4 w-4" /> Add Staff
                        </Link>
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Employees</p>
                                    <p className="text-3xl font-bold">{stats.total_employees}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Active Staff</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.active_staff}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <UserCheck className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Inactive Today</p>
                                    <p className="text-3xl font-bold text-amber-600">{stats.inactive_today}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                                    <UserX className="h-6 w-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">On Leave</p>
                                    <p className="text-3xl font-bold text-red-600">{stats.on_leave}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Waiters</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.waiters}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <UtensilsCrossed className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Kitchen Staff</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.kitchen_staff}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <ChefHat className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Staff & New Employees */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Recent Staff Activities</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={staffIndex.url()}>
                                    View All <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentStaff.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No recent staff activity.</p>
                            ) : (
                                <div className="space-y-4">
                                    {recentStaff.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                                    {member.photo ? (
                                                        <img src={member.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                                                    ) : (
                                                        member.first_name?.charAt(0)?.toUpperCase() || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{member.first_name} {member.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.role?.name} • {member.employee_id}</p>
                                                </div>
                                            </div>
                                            <Badge variant={getStatusBadgeVariant(member.status)}>
                                                {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">New Employees</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{newEmployees}</p>
                                    <p className="text-sm text-muted-foreground">New employees this week</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Attendance & Upcoming Shifts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Today's Attendance</CardTitle>
                            <Badge variant="outline">
                                <Activity className="mr-1 h-3 w-3" /> {todayShifts.length} shifts
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {todayShifts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No shifts scheduled for today.</p>
                            ) : (
                                <div className="space-y-3">
                                    {todayShifts.map((assignment) => (
                                        <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                                    {assignment.user.first_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{assignment.user.first_name} {assignment.user.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{assignment.shift.name}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline">
                                                {assignment.shift.start_time} - {assignment.shift.end_time}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Upcoming Shifts</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={shiftsIndex.url()}>
                                    Manage Shifts <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {upcomingShifts.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No upcoming shifts.</p>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingShifts.map((assignment) => (
                                        <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                                    {assignment.user.first_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{assignment.user.first_name} {assignment.user.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{assignment.shift.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{assignment.date}</p>
                                                <p className="text-xs text-muted-foreground">{assignment.shift.start_time} - {assignment.shift.end_time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

StaffDashboard.layout = {
    breadcrumbs: [
        { title: 'Staff Management', href: '/admin/staff' },
        { title: 'Dashboard', href: '/admin/staff/dashboard' },
    ],
};
