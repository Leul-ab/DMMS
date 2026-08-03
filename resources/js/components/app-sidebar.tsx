
import { Link, router, usePage } from '@inertiajs/react';
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
    GitBranch,
    Building2,
    Check,
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

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

type Branch = {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    is_active: boolean;
};

type PageProps = {
    auth: {
        user: {
            id: number;
            name: string;
            role?: {
                slug: string;
            } | null;
            branch?: Branch | null;
        } | null;
    };

    branches: Branch[];

    currentBranch: Branch | null;
};

export function AppSidebar() {
    const {
        auth,
        branches = [],
        currentBranch,
    } = usePage<PageProps>().props;

    const role = auth.user?.role?.slug;

    const isAdmin = role === 'super_admin';
    const isManager = role === 'manager';
    const isKitchenStaff = role === 'kitchen_staff';

    /**
     * Switch to another branch.
     */
    const switchBranch = (branchId: number) => {
        router.post(
            '/manager/branches/switch',
            {
                branch_id: branchId,
            },
            {
                preserveScroll: false,
                preserveState: false,
                onSuccess: () => {
                    const { pathname } = window.location;

                    if (pathname === '/menu') {
                        router.visit('/menu', {
                            replace: true,
                            preserveState: false,
                        });

                        return;
                    }

                    router.reload({
                        preserveState: false,
                    });
                },
            },
        );
    };

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
                  {
                      title: 'Branches',
                      href: '/manager/branches',
                      icon: Building2,
                      activePrefix: '/manager/branches',
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
              },
          ]
        : [];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                        >
                            <Link
                                href={dashboard()}
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Branch Switcher */}
                    {(isAdmin || isManager) &&
                        branches.length > 0 && (
                            <SidebarMenuItem>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip="Switch Branch"
                                            className="h-auto min-h-12"
                                        >
                                            <GitBranch className="size-5 shrink-0" />

                                            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                                                <span className="text-xs text-muted-foreground">
                                                    Current Branch
                                                </span>

                                                <span className="w-full truncate font-medium">
                                                    {currentBranch?.name ??
                                                        'Select Branch'}
                                                </span>
                                            </div>
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent
                                        align="start"
                                        side="right"
                                        className="w-64"
                                    >
                                        <DropdownMenuLabel>
                                            Select Branch
                                        </DropdownMenuLabel>

                                        <DropdownMenuSeparator />

                                        {branches.map((branch) => (
                                            <DropdownMenuItem
                                                key={branch.id}
                                                onClick={() =>
                                                    switchBranch(
                                                        branch.id,
                                                    )
                                                }
                                                className="cursor-pointer"
                                            >
                                                <GitBranch className="mr-2 size-4" />

                                                <div className="flex min-w-0 flex-1 flex-col">
                                                    <span className="truncate">
                                                        {branch.name}
                                                    </span>

                                                    {branch.address && (
                                                        <span className="truncate text-xs text-muted-foreground">
                                                            {branch.address}
                                                        </span>
                                                    )}
                                                </div>

                                                {currentBranch?.id ===
                                                    branch.id && (
                                                    <Check className="ml-2 size-4" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </SidebarMenuItem>
                        )}
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

