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
    ShieldCheck,
    Building2,
    Check,
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

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

type Branch = {
    id: number;
    name: string;
    address?: string | null;
    phone?: string | null;
    is_active: boolean;
};

type PageProps = {
    branches: Branch[];
    currentBranch: Branch | null;
};

export function AppSidebar() {
    const { state, toggleSidebar } = useSidebar();
    const can = useCan();
    const { branches = [], currentBranch } = usePage<PageProps>().props;

    const switchBranch = (branchId: number) => {
        if (currentBranch?.id === branchId) {
            return;
        }

        router.post(
            '/manager/branches/switch',
            { branch_id: branchId },
            {
                preserveScroll: false,
                preserveState: false,
                onSuccess: () => {
                    const { pathname } = window.location;

                    if (
                        pathname === '/menu' ||
                        pathname === '/dashboard' ||
                        pathname === '/booking' ||
                        pathname.startsWith('/manager/bookings')
                    ) {
                        router.visit(pathname, {
                            replace: true,
                            preserveState: false,
                        });

                        return;
                    }

                    router.reload({ preserveState: false });
                },
            },
        );
    };

    const canSwitchBranches =
        can('switch branches') || can('view branches');

    const mainNavItems: NavItem[] = [
        ...(can('view dashboard')
            ? [{ title: 'Dashboard', href: dashboard(), icon: LayoutGrid }]
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
                      activePrefix: '/manager/tables',
                  },
              ]
            : []),

        ...(can('view branches')
            ? [
                  {
                      title: 'Branches',
                      href: '/manager/branches',
                      icon: Building2,
                      activePrefix: '/manager/branches',
                  },
              ]
            : []),

        ...(can('view menu')
            ? [{ title: 'Menu', href: menuIndex(), icon: Eye }]
            : []),

        ...(can('view staff')
            ? [{ title: 'Staff', href: staffIndex(), icon: UserCog }]
            : []),

        ...(can('view orders')
            ? [{ title: 'Orders', href: ordersIndex(), icon: ListOrdered }]
            : []),

        ...(can('view bookings')
            ? [{ title: 'Bookings', href: bookingsIndex(), icon: Calendar }]
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
            ? [{ title: 'Customers', href: customersIndex(), icon: Users }]
            : []),
        ...(can('view users')
            ? [{ title: 'Users', href: usersIndex(), icon: Users }]
            : []),
        ...(can('view payments')
            ? [{ title: 'Payment', href: '/admin/payments', icon: CreditCard }]
            : []),
        ...(can('view roles')
            ? [{ title: 'Roles', href: rolesIndex(), icon: ShieldCheck }]
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

                    {canSwitchBranches && currentBranch && (
                        <SidebarMenuItem>
                            {branches.length > 1 ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip="Switch Branch"
                                            className="h-auto min-h-12"
                                        >
                                            <Building2 className="size-5 shrink-0" />
                                            <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                                                <span className="text-xs text-muted-foreground">
                                                    Current Branch
                                                </span>
                                                <span className="w-full truncate font-medium">
                                                    {currentBranch.name}
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
                                            Switch Branch
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        {branches.map((branch) => (
                                            <DropdownMenuItem
                                                key={branch.id}
                                                onClick={() =>
                                                    switchBranch(branch.id)
                                                }
                                                className="cursor-pointer"
                                            >
                                                <Building2 className="mr-2 size-4" />
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
                                                {currentBranch.id ===
                                                    branch.id && (
                                                    <Check className="ml-2 size-4" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <SidebarMenuButton
                                    tooltip={currentBranch.name}
                                    className="pointer-events-none h-auto min-h-12"
                                >
                                    <Building2 className="size-5 shrink-0" />
                                    <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                                        <span className="text-xs text-muted-foreground">
                                            Current Branch
                                        </span>
                                        <span className="w-full truncate font-medium">
                                            {currentBranch.name}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
                <SidebarSeparator />
            </SidebarHeader>

            <SidebarContent>
                {mainNavItems.length > 0 && (
                    <NavMain items={mainNavItems} label="Platform" />
                )}

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
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
