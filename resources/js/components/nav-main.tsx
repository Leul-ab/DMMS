import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useRefreshOnNavigate } from '@/hooks/use-refresh-on-navigate';
import type { NavItem } from '@/types';

export function NavMain({ items = [], label }: { items: NavItem[]; label?: string }) {
    const { isCurrentUrl } = useCurrentUrl();
    useRefreshOnNavigate();

    return (
        <SidebarGroup className="px-2 py-0">
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => {
                    const isActive = isCurrentUrl(item.href);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className={
                                    isActive
                                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold data-[active=true]:text-white shadow-lg shadow-orange-500/25 hover:from-orange-500 hover:to-orange-600 hover:text-white'
                                        : 'text-sidebar-foreground transition-all hover:bg-white/35 dark:hover:bg-white/10 hover:text-black dark:hover:text-white hover:backdrop-blur-lg hover:ring-1 hover:ring-white/40 dark:hover:ring-white/15 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
                                }
                            >
                                <Link href={item.href} prefetch className="relative">
                                    {item.icon && <item.icon className="relative" />}
                                    <span className="relative truncate">{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
