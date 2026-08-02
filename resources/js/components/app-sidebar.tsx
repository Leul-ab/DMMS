
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    UtensilsCrossed,
    ListOrdered,
    Eye,
    ChefHat,
    Table2,
    UserCog,
    Calendar,
    CreditCard,
    BarChart3,
    ShieldCheck,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { index as tablesIndex } from '@/routes/manager/tables';
import { useCan } from '@/hooks/use-can';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from '@/components/ui/sidebar';

import { dashboard, home } from '@/routes';
import { index as usersIndex } from '@/routes/admin/users';
import { index as rolesIndex } from '@/routes/admin/roles';
import { index as customersIndex } from '@/routes/manager/customers';
import { index as staffIndex } from '@/routes/admin/staff';
import { index as categoriesIndex } from '@/routes/manager/categories';
import { index as itemsIndex } from '@/routes/manager/items';
import { index as ordersIndex } from '@/routes/manager/orders';

import { index as menuIndex } from '@/routes/menu';
import { index as bookingsIndex } from '@/routes/manager/bookings';

import type { NavItem } from '@/types';

export function AppSidebar() {
    const { state, toggleSidebar } = useSidebar();
    const can = useCan();

    const mainNavItems: NavItem[] = [
        ...(can('view dashboard')
            ? [
                  {
                      title: 'Dashboard',
                      href: dashboard(),
                      icon: LayoutGrid,
                  },
              ]
            : []),

        ...(can('view menu categories')
            ? [
                  {
                      title: 'Menu Categories',
                      href: categoriesIndex(),
                      icon: ListOrdered,
                  },
              ]
            : []),

        ...(can('view menu items')
            ? [
                  {
                      title: 'Menu Items',
                      href: itemsIndex(),
                      icon: UtensilsCrossed,
                  },
              ]
            : []),

        ...(can('view tables')
            ? [
                  {
                      title: 'Tables',
                      href: tablesIndex(),
                      icon: Table2,
                  },
              ]
            : []),

        ...(can('view menu')
            ? [
                  {
                      title: 'Menu',
                      href: menuIndex(),
                      icon: Eye,
                  },
              ]
            : []),

        ...(can('view staff')
            ? [
                  {
                      title: 'Staff',
                      href: staffIndex(),
                      icon: UserCog,
                  },
              ]
            : []),

        ...(can('view orders')
            ? [
                  {
                      title: 'Orders',
                      href: ordersIndex(),
                      icon: ListOrdered,
                  },
              ]
            : []),

        ...(can('view bookings')
            ? [
                  {
                      title: 'Bookings',
                      href: bookingsIndex(),
                      icon: Calendar,
                  },
              ]
            : []),

        ...(can('view reports')
            ? [
                  {
                      title: 'Reports',
                      href: '/manager/reports',
                      icon: BarChart3,
                  },
              ]
            : []),

        ...(can('view kitchen')
            ? [
                  {
                      title: 'Kitchen',
                      href: '/kitchen/dashboard',
                      icon: ChefHat,
                  },
              ]
            : []),
    ];

    const hasAdminAccess =
        can('view customers') ||
        can('view users') ||
        can('view payments') ||
        can('view roles');

    const adminNavItems: NavItem[] = [
        ...(can('view customers')
            ? [
                  {
                      title: 'Customers',
                      href: customersIndex(),
                      icon: Users,
                  },
              ]
            : []),

        ...(can('view users')
            ? [
                  {
                      title: 'Users',
                      href: usersIndex(),
                      icon: Users,
                  },
              ]
            : []),

        ...(can('view payments')
            ? [
                  {
                      title: 'Payment',
                      href: '/admin/payments',
                      icon: CreditCard,
                  },
              ]
            : []),

        ...(can('view roles')
            ? [
                  {
                      title: 'Roles',
                      href: rolesIndex(),
                      icon: ShieldCheck,
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={home()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarSeparator />
            </SidebarHeader>

            <SidebarContent>
                {/* General Navigation */}
                {mainNavItems.length > 0 && (
                    <NavMain items={mainNavItems} label="Platform" />
                )}

                {/* Admin Navigation */}
                {hasAdminAccess && adminNavItems.length > 0 && (
                    <NavMain items={adminNavItems} />
                )}
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="sm"
                            onClick={toggleSidebar}
                            className="text-sidebar-foreground/80 hover:bg-orange-100/80 hover:text-orange-700"
                            tooltip={{ children: state === 'collapsed' ? 'Expand sidebar' : 'Collapse sidebar' }}
                        >
                            {state === 'collapsed' ? <PanelLeftOpen /> : <PanelLeftClose />}
                            <span>{state === 'collapsed' ? 'Expand' : 'Collapse'}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
