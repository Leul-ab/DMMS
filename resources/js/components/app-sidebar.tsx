import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    UtensilsCrossed,
    ListOrdered,
    Eye,
    ChefHat,
    Table2,
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
import { index as categoriesIndex } from '@/routes/manager/categories';
import { index as itemsIndex } from '@/routes/manager/items';
import { index as ordersIndex } from '@/routes/manager/orders';

import { index as menuIndex } from '@/routes/menu';

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
              title: 'Table Management',
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
                      title: 'Orders',
                      href: ordersIndex(),
                      icon: ListOrdered,
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
                  title: 'Users',
                  href: usersIndex(),
                  icon: Users,
              },
          ]
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