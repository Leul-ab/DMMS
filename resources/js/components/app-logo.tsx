import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-orange-600 text-sidebar-primary-foreground shadow-lg shadow-orange-500/30">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-black tracking-tight">
                    DINE<span className="text-orange-500">.</span>
                </span>
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-500">
                    Digital Menu
                </span>
            </div>
        </>
    );
}
