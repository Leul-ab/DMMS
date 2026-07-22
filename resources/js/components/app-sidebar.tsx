import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    UtensilsCrossed,
    ListOrdered,
    Eye,
    ChefHat,
    Clock,
    CheckCircle,
    History,
} from 'lucide-react';

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
import { index as ordersIndex } from '@/routes/manager/orders';

import { index as menuIndex } from '@/routes/menu';

import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Digital Menu',
        href: menuIndex(),
        icon: Eye,
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
    {
        title: 'Orders',
        href: ordersIndex(),
        icon: ListOrdered,
    },
];

const kitchenNavItems: NavItem[] = [
    {
        title: 'Kitchen Dashboard',
        href: '/kitchen/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'New Orders',
        href: '/kitchen/orders/new',
        icon: ChefHat,
    },
    {
        title: 'Preparing',
        href: '/kitchen/orders/preparing',
        icon: Clock,
    },
    {
        title: 'Ready Orders',
        href: '/kitchen/orders/ready',
        icon: CheckCircle,
    },
    {
        title: 'Order History',
        href: '/kitchen/orders/history',
        icon: History,
    },
];
export function AppSidebar() {
    const { auth } = usePage<{
        auth: {
            user: {
                role?: {
                    slug: string;
                } | null;
            } | null;
        };
    }>().props;

    const role = auth.user?.role?.slug;

    const isAdmin = role === 'super_admin';
    const isManager = role === 'manager';
    const isKitchenStaff = role === 'kitchen_staff';

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
                {/* General Navigation */}
                <NavMain
                    items={mainNavItems}
                    label="Platform"
                />

                {/* Admin Navigation */}
                {isAdmin && (
                    <NavMain
                        items={adminNavItems}
                        label="Administration"
                    />
                )}

                {/* Manager Navigation */}
                {(isAdmin || isManager) && (
                    <NavMain
                        items={menuNavItems}
                        
                    />
                )}

                {/* Kitchen Staff Navigation */}
                {isKitchenStaff && (
                    <NavMain
                        items={kitchenNavItems}
                        label="Kitchen Management"
                    />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}