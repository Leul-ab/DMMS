import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, UtensilsCrossed, ListOrdered } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as usersIndex } from '@/routes/admin/users';
import { index as categoriesIndex } from '@/routes/manager/categories';
import { index as itemsIndex } from '@/routes/manager/items';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'User Management',
        href: usersIndex(),
        icon: Users,
    },
];

const menuNavItems: NavItem[] = [
    {
        title: 'Menu Categories',
        href: categoriesIndex(),
        icon: ListOrdered,
    },
    {
        title: 'Menu Items',
        href: itemsIndex(),
        icon: UtensilsCrossed,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role?: { slug: string } | null } } }>().props;
    const isAdmin = auth.user?.role?.slug === 'super_admin';
    const isManager = isAdmin || auth.user?.role?.slug === 'manager';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Platform" />
                {isAdmin && <NavMain items={adminNavItems} />}
                {isManager && <NavMain items={menuNavItems} label="Menu Management" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
