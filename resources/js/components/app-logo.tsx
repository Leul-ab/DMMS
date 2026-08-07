import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { RestaurantBranding } from '@/components/theme-provider';

export default function AppLogo() {
    const { restaurant } = usePage<{ restaurant: RestaurantBranding }>().props;

    if (restaurant?.logoUrl) {
        return (
            <>
                <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden shadow-lg">
                    <img
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                        className="size-8 object-cover"
                    />
                </div>
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-tight font-display font-black tracking-tight">
                        {restaurant.name}
                    </span>
                    <span className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">
                        Restaurant
                    </span>
                </div>
            </>
        );
    }

    return (
        <>
            <div
                className="flex aspect-square size-8 items-center justify-center rounded-md text-sidebar-primary-foreground shadow-lg"
                style={{ background: `linear-gradient(135deg, ${restaurant?.primaryColor ?? '#e85d04'}, ${restaurant?.secondaryColor ?? '#f48c06'})` }}
            >
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-display font-black tracking-tight">
                    {restaurant?.name ?? 'DINE'}
                    <span style={{ color: restaurant?.primaryColor ?? '#e85d04' }}>.</span>
                </span>
                <span
                    className="truncate text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: restaurant?.accentColor ?? '#ffb703' }}
                >
                    Digital Menu
                </span>
            </div>
        </>
    );
}
