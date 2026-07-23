import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Save, X, Users } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index as shiftsIndex, store as shiftsStore, update as shiftsUpdate, destroy as shiftsDestroy, assign as shiftsAssign } from '@/routes/admin/shifts';
import { index as staffIndex } from '@/routes/admin/staff';
import type { PaginatedData } from '@/types';

type Shift = { id: number; name: string; start_time: string; end_time: string; is_active: boolean; description: string | null; staff_count: number };
type StaffMember = { id: number; first_name: string; last_name: string; employee_id: string; role: { name: string } | null };

type Props = {
    shifts: PaginatedData<Shift>;
    staff: StaffMember[];
};

export default function ShiftIndex({ shifts, staff }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [form, setForm] = useState({ name: '', start_time: '', end_time: '', description: '', is_active: true });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [showAssign, setShowAssign] = useState(false);
    const [assignForm, setAssignForm] = useState({ user_id: '', shift_id: '', date: '' });
    const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

    const resetForm = () => {
        setForm({ name: '', start_time: '', end_time: '', description: '', is_active: true });
        setErrors({});
    };

    const openCreate = () => {
        resetForm();
        setEditingShift(null);
        setShowCreate(true);
    };

    const openEdit = (shift: Shift) => {
        setForm({ name: shift.name, start_time: shift.start_time, end_time: shift.end_time, description: shift.description || '', is_active: shift.is_active });
        setEditingShift(shift);
        setErrors({});
        setShowCreate(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingShift) {
            router.put(shiftsUpdate.url(editingShift.id), form, {
                onError: (err) => setErrors(err as Record<string, string>),
                onSuccess: () => { setShowCreate(false); resetForm(); },
            });
        } else {
            router.post(shiftsStore.url(), form, {
                onError: (err) => setErrors(err as Record<string, string>),
                onSuccess: () => { setShowCreate(false); resetForm(); },
            });
        }
    };

    const handleDelete = (shift: Shift) => {
        if (confirm(`Are you sure you want to delete the shift "${shift.name}"?`)) {
            router.delete(shiftsDestroy.url(shift.id), {
                onError: (err) => alert(err.message || 'Cannot delete this shift.'),
            });
        }
    };

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(shiftsAssign.url(), assignForm, {
            onError: (err) => setAssignErrors(err as Record<string, string>),
            onSuccess: () => {
                setShowAssign(false);
                setAssignForm({ user_id: '', shift_id: '', date: '' });
                setAssignErrors({});
            },
        });
    };

    return (
        <>
            <Head title="Shift Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Shift Management" description="Manage work shifts and assignments" />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setShowAssign(true)}>
                            <Users className="mr-2 h-4 w-4" /> Assign Shift
                        </Button>
                        <Button onClick={openCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Add Shift
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Shift Name</th>
                                    <th className="px-4 py-3 font-medium">Start Time</th>
                                    <th className="px-4 py-3 font-medium">End Time</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 font-medium text-center">Staff Count</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shifts.data.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No shifts found.</td></tr>
                                ) : shifts.data.map((shift) => (
                                    <tr key={shift.id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="px-4 py-3 text-sm font-medium">{shift.name}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{shift.start_time}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{shift.end_time}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{shift.description || '—'}</td>
                                        <td className="px-4 py-3 text-center text-sm">{shift.staff_count}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={shift.is_active ? 'default' : 'secondary'}>
                                                {shift.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(shift)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(shift)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {shifts.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {shifts.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Create/Edit Shift Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingShift ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Shift Name</Label>
                                <Input id="name" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Start Time</Label>
                                    <Input id="start_time" type="time" value={form.start_time} onChange={(e) => setForm(prev => ({ ...prev, start_time: e.target.value }))} />
                                    {errors.start_time && <p className="text-sm text-destructive">{errors.start_time}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_time">End Time</Label>
                                    <Input id="end_time" type="time" value={form.end_time} onChange={(e) => setForm(prev => ({ ...prev, end_time: e.target.value }))} />
                                    {errors.end_time && <p className="text-sm text-destructive">{errors.end_time}</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" /> {editingShift ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Assign Shift Dialog */}
                <Dialog open={showAssign} onOpenChange={setShowAssign}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Shift to Staff</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAssign} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="assign_staff">Staff Member</Label>
                                <Select value={assignForm.user_id} onValueChange={(v) => setAssignForm(prev => ({ ...prev, user_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select staff member" /></SelectTrigger>
                                    <SelectContent>
                                        {staff.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.first_name} {s.last_name} ({s.role?.name || 'No role'})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {assignErrors.user_id && <p className="text-sm text-destructive">{assignErrors.user_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assign_shift">Shift</Label>
                                <Select value={assignForm.shift_id} onValueChange={(v) => setAssignForm(prev => ({ ...prev, shift_id: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                                    <SelectContent>
                                        {shifts.data.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.start_time} - {s.end_time})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {assignErrors.shift_id && <p className="text-sm text-destructive">{assignErrors.shift_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assign_date">Date</Label>
                                <Input id="assign_date" type="date" value={assignForm.date} onChange={(e) => setAssignForm(prev => ({ ...prev, date: e.target.value }))} />
                                {assignErrors.date && <p className="text-sm text-destructive">{assignErrors.date}</p>}
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => { setShowAssign(false); setAssignForm({ user_id: '', shift_id: '', date: '' }); setAssignErrors({}); }}>
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button type="submit">
                                    <Users className="mr-2 h-4 w-4" /> Assign
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

ShiftIndex.layout = {
    breadcrumbs: [
        { title: 'Staff Management', href: '/admin/staff' },
        { title: 'Shift Management', href: '/admin/shifts' },
    ],
};
