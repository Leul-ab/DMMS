import { Link, usePage } from '@inertiajs/react';
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
    Store,
    Percent,
    Utensils,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import BranchSwitcher from '@/components/branch-switcher';
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
    SidebarSeparator,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCan } from '@/hooks/use-can';

import { dashboard, home } from '@/routes';
import { index as branchesIndex } from '@/routes/admin/branches';
import { index as rolesIndex } from '@/routes/admin/roles';
import { index as staffIndex } from '@/routes/admin/staff';
import { index as usersIndex } from '@/routes/admin/users';
import { index as bookingsIndex } from '@/routes/manager/bookings';
import { index as categoriesIndex } from '@/routes/manager/categories';
import { index as customersIndex } from '@/routes/manager/customers';
import { index as discountsIndex } from '@/routes/manager/discounts';
import { index as itemsIndex } from '@/routes/manager/items';
import { index as ordersIndex } from '@/routes/manager/orders';

import { index as tablesIndex } from '@/routes/manager/tables';
import { index as menuIndex } from '@/routes/menu';

import type { NavItem } from '@/types';

export function AppSidebar() {
    const { state, toggleSidebar } = useSidebar();
    const can = useCan();
    const { notifications } = usePage<{
        notifications?: {
            kitchen: number;
            serve: number;
            paymentVerification: number;
        };
    }>().props;

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

        ...(can('view branches')
            ? [
                  {
                      title: 'Branches',
                      href: branchesIndex(),
                      icon: Store,
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

        ...(can('view discounts')
            ? [
                  {
                      title: 'Discounts',
                      href: discountsIndex(),
                      icon: Percent,
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

        ...(can('view orders')
            ? [
                  {
                      title: 'Orders',
                      href: ordersIndex(),
                      icon: ListOrdered,
                  },
              ]
            : []),

        ...(can('view kitchen')
            ? [
                  {
                      title: 'Kitchen',
                      href: '/kitchen/dashboard',
                      icon: ChefHat,
                      badge: notifications?.kitchen ?? 0,
                  },
              ]
            : []),

        ...(can('view serve')
            ? [
                  {
                      title: 'Serve',
                      href: '/serve',
                      icon: Utensils,
                      badge: notifications?.serve ?? 0,
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

        ...(can('view payments')
            ? [
                  {
                      title: 'Payment Verification',
                      href: '/manager/payment-verification',
                      icon: ShieldCheck,
                      badge: notifications?.paymentVerification ?? 0,
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

        ...(can('view staff')
            ? [
                  {
                      title: 'Staff',
                      href: staffIndex(),
                      icon: UserCog,
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

        ...(can('view users')
            ? [
                  {
                      title: 'Users',
                      href: usersIndex(),
                      icon: Users,
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

                {can('view branches') && (
                    <>
                        <BranchSwitcher />
                        <SidebarSeparator />
                    </>
                )}
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
                        {/* <SidebarMenuButton
                            size="sm"
                            onClick={toggleSidebar}
                            className="text-sidebar-foreground hover:bg-red-100/80 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                            tooltip={{
                                children:
                                    state === 'collapsed'
                                        ? 'Expand sidebar'
                                        : 'Collapse sidebar',
                            }}
                        >
                            {state === 'collapsed' ? (
                                <PanelLeftOpen />
                            ) : (
                                <PanelLeftClose />
                            )}
                            <span>
                                {state === 'collapsed' ? 'Expand' : 'Collapse'}
                            </span>
                        </SidebarMenuButton> */}
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
