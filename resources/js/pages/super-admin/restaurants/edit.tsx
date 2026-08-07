import RestaurantForm from './_form';

type Restaurant = {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    currency: string;
    tax_rate: string;
    timezone: string;
    description: string | null;
    owner_email: string | null;
    owner_phone: string | null;
    plan: string;
    is_active: boolean;
};

export default function EditRestaurant({ restaurant }: { restaurant: Restaurant }) {
    return <RestaurantForm restaurant={restaurant} />;
}

EditRestaurant.layout = {
    breadcrumbs: [
        { title: 'Super Admin', href: '/super-admin' },
        { title: 'Restaurants', href: '/super-admin/restaurants' },
        { title: 'Edit', href: '' },
    ],
};
