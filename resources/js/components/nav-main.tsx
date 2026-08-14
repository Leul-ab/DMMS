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

export function NavMain({
    items = [],
    label,
}: {
    items: NavItem[];
    label?: string;
}) {
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
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 font-bold text-white shadow-lg shadow-red-500/25 hover:from-red-500 hover:to-red-600 hover:text-white data-[active=true]:text-white'
                                        : 'text-sidebar-foreground transition-all hover:bg-white/35 hover:text-black hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:ring-1 hover:ring-white/40 hover:backdrop-blur-lg dark:hover:bg-white/10 dark:hover:text-white dark:hover:ring-white/15'
                                }
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    className="relative"
                                >
                                    {item.icon && (
                                        <item.icon className="relative" />
                                    )}
                                    <span className="relative truncate">
                                        {item.title}
                                    </span>
                                    {typeof item.badge === 'number' &&
                                        item.badge > 0 && (
                                            <span className="relative ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] leading-none font-semibold text-white ring-2 ring-sidebar">
                                                {item.badge > 99
                                                    ? '99+'
                                                    : item.badge}
                                            </span>
                                        )}
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
