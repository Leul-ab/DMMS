import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Pencil, Shield, Key, Mail, Phone, MapPin, Calendar, Clock, Star, Percent, UtensilsCrossed, CheckCircle } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { edit as editRoute, index as staffIndex, destroy as destroyRoute } from '@/routes/admin/staff';

type Role = { id: number; name: string; slug: string };
type ShiftAssignment = { id: number; date: string; shift: { name: string; start_time: string; end_time: string } };

type StaffMember = {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    email: string;
    phone: string | null;
    gender: string | null;
    address: string | null;
    photo: string | null;
    role: Role | null;
    shiftAssignments: ShiftAssignment[];
};

type Props = {
    staff: StaffMember;
    stats: {
        attendance_percentage: number;
        orders_served: number;
        hours_worked: number;
        performance_rating: number;
        completed_shifts: number;
    };
    recentShifts: ShiftAssignment[];
};

export default function ShowStaff({ staff, stats, recentShifts }: Props) {
    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete ${staff.first_name} ${staff.last_name}?`)) {
            router.delete(destroyRoute.url(staff.id));
        }
    };

    return (
        <>
            <Head title={`${staff.first_name} ${staff.last_name} - Profile`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Staff Profile" description={`${staff.first_name} ${staff.last_name}`} />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href={staffIndex.url()}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={editRoute.url(staff.id)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Profile Header */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-medium shrink-0">
                                {staff.photo ? (
                                    <img src={staff.photo} alt="" className="h-24 w-24 rounded-full object-cover" />
                                ) : (
                                    staff.first_name?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">{staff.first_name} {staff.last_name}</h2>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Badge variant="secondary">{staff.role?.name || 'No role'}</Badge>
                                    <span>•</span>
                                    <span className="text-sm">ID: {staff.employee_id}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Percent className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stats.attendance_percentage}%</p>
                            <p className="text-xs text-muted-foreground">Attendance</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <UtensilsCrossed className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stats.orders_served}</p>
                            <p className="text-xs text-muted-foreground">Orders Served</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Clock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stats.hours_worked}</p>
                            <p className="text-xs text-muted-foreground">Hours Worked</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stats.performance_rating}</p>
                            <p className="text-xs text-muted-foreground">Rating</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold">{stats.completed_shifts}</p>
                            <p className="text-xs text-muted-foreground">Completed Shifts</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Full Name</p>
                                    <p className="text-sm font-medium">{staff.first_name} {staff.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Employee ID</p>
                                    <p className="text-sm font-medium">{staff.employee_id || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Gender</p>
                                    <p className="text-sm font-medium capitalize">{staff.gender || '—'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium">{staff.phone || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{staff.email}</p>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Address</p>
                                    <p className="text-sm font-medium">{staff.address || 'Not provided'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Employment</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Position</p>
                                    <p className="text-sm font-medium">{staff.role?.name || '—'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Shifts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Shift History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentShifts.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No shift history available.</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="px-4 py-3 font-medium">Date</th>
                                        <th className="px-4 py-3 font-medium">Shift</th>
                                        <th className="px-4 py-3 font-medium">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentShifts.map((assignment) => (
                                        <tr key={assignment.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 text-sm">{assignment.date}</td>
                                            <td className="px-4 py-3 text-sm font-medium">{assignment.shift.name}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {assignment.shift.start_time} - {assignment.shift.end_time}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ShowStaff.layout = {
    breadcrumbs: [
        { title: 'Staff Management', href: '/admin/staff' },
        { title: 'Staff Profile', href: '/admin/staff/show' },
    ],
};
