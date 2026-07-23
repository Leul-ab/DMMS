import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, UtensilsCrossed, ListOrdered, UserCog, UserCheck, ChefHat, Shield, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { dashboard } from '@/routes';
import { index as usersIndex } from '@/routes/admin/users';
import { index as categoriesIndex } from '@/routes/manager/categories';
import { index as itemsIndex } from '@/routes/manager/items';
import { index as ordersIndex } from '@/routes/manager/orders';
import { index as staffIndex } from '@/routes/admin/staff';
import { index as rolesIndex } from '@/routes/admin/roles';
import { useCurrentUrl } from '@/hooks/use-current-url';
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
    {
    title: 'Orders',
    href: ordersIndex(),
    icon: ListOrdered,
},
];

const staffSubItems = [
    { title: 'All Staff', href: staffIndex(), icon: UserCheck },
    { title: 'Waiters', href: '/admin/staff/waiters', icon: Users },
    { title: 'Kitchen Staff', href: '/admin/staff/kitchen', icon: ChefHat },
    { title: 'Roles & Permissions', href: rolesIndex(), icon: Shield },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: { user: { role?: { slug: string } | null } } }>().props;
    const { isCurrentUrl } = useCurrentUrl();
    const isAdmin = auth.user?.role?.slug === 'super_admin';
    const isManager = isAdmin || auth.user?.role?.slug === 'manager';

    const isStaffActive = staffSubItems.some(item => isCurrentUrl(item.href));
    const [staffOpen, setStaffOpen] = useState(isStaffActive);

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

                {isAdmin && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Staff Management</SidebarGroupLabel>
                        <SidebarMenu>
                            <Collapsible
                                open={staffOpen}
                                onOpenChange={setStaffOpen}
                                className="group/collapsible"
                            >
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: 'Staff Management' }}
                                            isActive={isStaffActive}
                                            data-state={staffOpen ? 'open' : 'closed'}
                                        >
                                            <UserCog />
                                            <span>Staff Management</span>
                                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {staffSubItems.map((item) => (
                                                <SidebarMenuSubItem key={item.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isCurrentUrl(item.href)}
                                                    >
                                                        <Link href={item.href}>
                                                            {item.icon && <item.icon className="h-4 w-4" />}
                                                            <span>{item.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {isManager && <NavMain items={menuNavItems} label="Menu Management" />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
