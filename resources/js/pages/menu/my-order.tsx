import MyOrderView from '@/pages/menu/my-order-view';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_submitted_at: string | null;
    total_amount: string;
    estimated_minutes: number | null;
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    special_instructions: string | null;
    table_id: number;
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
    table: RestaurantTable;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    status: string;
    menu_item: {
        id: number;
        name: string;
    };
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
};

export default function MyOrderIndex({ table, order }: Props) {
    return <MyOrderView table={table} order={order} menuPath="/menu" />;
}
