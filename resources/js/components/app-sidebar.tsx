
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
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { index as tablesIndex } from '@/routes/manager/tables';

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
import { index as customersIndex } from '@/routes/manager/customers';
import { index as staffIndex } from '@/routes/admin/staff';
import { index as categoriesIndex } from '@/routes/manager/categories';
import { index as itemsIndex } from '@/routes/manager/items';
import { index as ordersIndex } from '@/routes/manager/orders';

import { index as menuIndex } from '@/routes/menu';
import { index as bookingsIndex } from '@/routes/manager/bookings';

import type { NavItem } from '@/types';

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

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },

        ...(isAdmin || isManager
            ? [
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
                      title: 'Tables',
                      href: tablesIndex(),
                      icon: Table2,
                  },
              ]
            : []),

        {
            title: 'Menu',
            href: menuIndex(),
            icon: Eye,
        },

        ...(isAdmin || isManager
            ? [
                  {
                      title: 'Staff',
                      href: staffIndex(),
                      icon: UserCog,
                  },
                  {
                      title: 'Orders',
                      href: ordersIndex(),
                      icon: ListOrdered,
                  },
                  {
                      title: 'Bookings',
                      href: bookingsIndex(),
                      icon: Calendar,
                  },
                  {
                      title: 'Reports',
                      href: '/manager/reports',
                      icon: BarChart3,
                  },
              ]
            : []),

        ...(isAdmin || isManager || isKitchenStaff
            ? [
                  {
                      title: 'Kitchen',
                      href: '/kitchen/dashboard',
                      icon: ChefHat,
                  },
              ]
            : []),
    ];

    const adminNavItems: NavItem[] = isAdmin
        ? [
              {
                  title: 'Customers',
                  href: customersIndex(),
                  icon: Users,
              },
              {
                  title: 'Users',
                  href: usersIndex(),
                  icon: Users,
              },
          {
              title: 'Payment',
              href: '/admin/payments',
              icon: CreditCard,
          },          ]
        : [];

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
                    />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

