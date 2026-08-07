import RestaurantForm from './_form';

export default function CreateRestaurant() {
    return <RestaurantForm />;
}

CreateRestaurant.layout = {
    breadcrumbs: [
        { title: 'Super Admin', href: '/super-admin' },
        { title: 'Restaurants', href: '/super-admin/restaurants' },
        { title: 'Create', href: '' },
    ],
};
