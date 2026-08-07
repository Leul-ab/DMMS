import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

type RestaurantBranding = {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
};

const GOOGLE_FONTS = [
    'Inter',
    'Poppins',
    'Outfit',
    'Raleway',
    'Nunito',
    'Montserrat',
    'Lato',
    'Roboto',
    'Merriweather',
    'Playfair Display',
];

function hexToHsl(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return [0, 0, 0];
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { restaurant } = usePage<{ restaurant: RestaurantBranding }>().props;

    useEffect(() => {
        if (!restaurant) return;

        const root = document.documentElement;

        // Apply primary color as CSS custom properties (used in sidebar, buttons, etc.)
        const [ph, ps, pl] = hexToHsl(restaurant.primaryColor);
        const [sh, ss, sl] = hexToHsl(restaurant.secondaryColor);
        const [ah, as_, al] = hexToHsl(restaurant.accentColor);

        root.style.setProperty('--brand-primary', restaurant.primaryColor);
        root.style.setProperty('--brand-secondary', restaurant.secondaryColor);
        root.style.setProperty('--brand-accent', restaurant.accentColor);
        root.style.setProperty('--brand-primary-h', String(ph));
        root.style.setProperty('--brand-primary-s', `${ps}%`);
        root.style.setProperty('--brand-primary-l', `${pl}%`);
        root.style.setProperty('--brand-secondary-h', String(sh));
        root.style.setProperty('--brand-secondary-s', `${ss}%`);
        root.style.setProperty('--brand-secondary-l', `${sl}%`);
        root.style.setProperty('--brand-accent-h', String(ah));
        root.style.setProperty('--brand-accent-s', `${as_}%`);
        root.style.setProperty('--brand-accent-l', `${al}%`);
        root.style.setProperty('--brand-font', `'${restaurant.fontFamily}', sans-serif`);

        // Load Google Font if not already loaded
        const font = restaurant.fontFamily;
        if (font && GOOGLE_FONTS.includes(font)) {
            const fontId = `google-font-${font.replace(/\s+/g, '-').toLowerCase()}`;
            if (!document.getElementById(fontId)) {
                const link = document.createElement('link');
                link.id = fontId;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@300;400;500;600;700;800;900&display=swap`;
                document.head.appendChild(link);
            }
        }

        // Update body font
        document.body.style.fontFamily = `'${font}', sans-serif`;

        // Update page title if desired
        if (restaurant.name) {
            const titleEl = document.querySelector('title');
            if (titleEl && !titleEl.textContent?.includes(restaurant.name)) {
                // Don't override the page-specific title, just set a dataset attr for reference
                document.documentElement.dataset.restaurantName = restaurant.name;
            }
        }
    }, [restaurant?.primaryColor, restaurant?.secondaryColor, restaurant?.accentColor, restaurant?.fontFamily]);

    return <>{children}</>;
}

export { GOOGLE_FONTS };
export type { RestaurantBranding };
