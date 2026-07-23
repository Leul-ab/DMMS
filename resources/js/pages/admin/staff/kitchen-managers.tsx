import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { managers as managersRoute } from '@/routes/admin/staff/kitchen';
import type { PaginatedData } from '@/types';

type Manager = { id: number; first_name: string; last_name: string; employee_id: string; email: string; role: { name: string } | null };
type Props = { managers: PaginatedData<Manager> };

export default function KitchenManagers({ managers }: Props) {
    return (
        <>
            <Head title="Kitchen Managers" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Kitchen Managers" description="Manage kitchen management staff" />
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Employee ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managers.data.length === 0 ? (
                                    <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-muted-foreground">No kitchen managers found.</td></tr>
                                ) : managers.data.map((m) => (
                                    <tr key={m.id} className="border-b last:border-0">
                                        <td className="px-4 py-3 text-sm font-medium">{m.first_name} {m.last_name}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{m.employee_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
                {managers.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {managers.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
KitchenManagers.layout = { breadcrumbs: [{ title: 'Kitchen Managers', href: '/admin/staff/kitchen/managers' }] };
