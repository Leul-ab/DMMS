import { router, usePage } from '@inertiajs/react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

import { switchMethod as branchesSwitch } from '@/routes/admin/branches';

type BranchOption = {
    id: number;
    name: string;
};

type SwitcherProps = {
    allBranches: BranchOption[];
    currentBranch: BranchOption | null;
};

export default function BranchSwitcher() {
    const { allBranches, currentBranch } = usePage<SwitcherProps>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();

    const branches = Array.isArray(allBranches) ? allBranches : [];

    if (branches.length === 0) {
        return null;
    }

    const activeBranch =
        currentBranch ??
        branches.find((branch) => branch.id === branches[0].id) ??
        branches[0];

    const handleSwitch = (branchId: number) => {
        if (branchId === activeBranch.id) {
            return;
        }

        router.post(
            branchesSwitch.url(branchId),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="group rounded-xl border border-orange-200/50 bg-orange-50/40 text-sidebar-accent-foreground data-[state=open]:bg-orange-100 data-[state=open]:text-orange-700"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-white">
                                <Building2 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {activeBranch.name}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    Branch
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={
                            isMobile
                                ? 'bottom'
                                : state === 'collapsed'
                                  ? 'left'
                                  : 'bottom'
                        }
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Branches
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {branches.map((branch) => (
                            <DropdownMenuItem
                                key={branch.id}
                                onClick={() => handleSwitch(branch.id)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-sm border border-orange-200 bg-orange-50">
                                    <Building2 className="size-3.5 text-orange-500" />
                                </div>
                                {branch.name}
                                {branch.id === activeBranch.id && (
                                    <Check className="ml-auto size-4 text-orange-500" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
