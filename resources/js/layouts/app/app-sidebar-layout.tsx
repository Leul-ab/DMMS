import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import type { AppLayoutProps } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function SidebarFloatingTrigger() {
    const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
    
    // Determine whether the sidebar is effectively expanded
    const isExpanded = isMobile ? openMobile : state === 'expanded';

    return (
        <button
            onClick={toggleSidebar}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className={[
                'fixed top-5 z-50 flex h-8 w-5 items-center justify-center',
                'rounded-r-full bg-orange-500 text-white shadow-lg shadow-orange-500/40',
                'transition-all duration-300 ease-in-out',
                'hover:w-6 hover:bg-orange-600 hover:shadow-orange-600/50',
                'active:scale-95',
                // Track the sidebar width via CSS transition matching sidebar
                isMobile
                    ? (isExpanded ? 'left-[calc(var(--sidebar-width,18rem)-2px)]' : 'left-0')
                    : (isExpanded ? 'left-[calc(var(--sidebar-width,16rem)-2px)]' : 'left-[calc(var(--sidebar-width-icon,3rem)+6px)]'),
            ].join(' ')}
            style={{
                // Use CSS var so it animates in sync with the sidebar transition
                transition: 'left 300ms ease-in-out, width 200ms, background-color 150ms, box-shadow 150ms',
            }}
        >
            {isExpanded ? (
                <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
            ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )}
        </button>
    );
}

export default function AppSidebarLayout({ children }: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <SidebarFloatingTrigger />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {children}
            </AppContent>
        </AppShell>
    );
}
