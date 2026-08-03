import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavMain({ items = [], label }: { items: NavItem[]; label?: string }) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
            <SidebarMenu>
                {items.map((item) => {
                    const href = toUrl(item.href);
                    const isActive =
                        item.isActive ??
                        (item.activePrefix
                            ? isCurrentOrParentUrl(item.activePrefix)
                            : isCurrentOrParentUrl(href));

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                tooltip={{ children: item.title }}
                                className={
                                    isActive
                                        ? 'bg-gradient-to-b from-orange-400/90 via-orange-500/85 to-orange-600/90 text-white data-[active=true]:text-white ring-1 ring-white/25 backdrop-blur-md shadow-[0_8px_24px_-8px_rgba(194,65,12,0.6),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.1)] hover:from-orange-500 hover:to-orange-700 hover:text-white'
                                        : 'text-sidebar-foreground/80 transition-all hover:bg-white/35 hover:text-orange-700 hover:backdrop-blur-lg hover:ring-1 hover:ring-white/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]'
                                }
                            >
                                <Link href={href} prefetch className="relative">
                                    {isActive && (
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-0 rounded-md bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.5),transparent_55%)]"
                                        />
                                    )}
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
