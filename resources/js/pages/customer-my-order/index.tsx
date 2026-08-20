import MyOrderView from '@/pages/menu/my-order-view';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Receipt = {
    id: number;
    receipt_number: string;
    transaction_number: string | null;
    payment_method: string | null;
    amount: string;
    subtotal: string;
    tax: string;
    service_charge: string;
    discount: string;
    generated_at: string | null;
};

type Payment = {
    id: number;
    payment_method: string | null;
    payment_status: string;
    verified_at: string | null;
    paid_at: string | null;
    verifier: { id: number; name: string } | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: 'unpaid' | 'pending' | 'paid';
    payment_submitted_at: string | null;
    total_amount: string;
    customer_name: string | null;
    estimated_minutes: number | null;
    queue_estimated_minutes: number | null;
    preparation_time: number | null;
    preparation_started_at: string | null;
    preparation_status: string;
    special_instructions: string | null;
    table_id: number;
    created_at: string;
    updated_at: string;
    order_items: {
        id: number;
        quantity: number;
        price: string;
        status: string;
        special_preferences?: string[];
        menu_item: {
            id: number;
            name: string;
        };
    }[];
    table: RestaurantTable;
    receipt: Receipt | null;
    payment: Payment | null;
    feedback: {
        id: number;
        overall_rating: number;
        comment: string | null;
        anonymous: boolean;
        created_at: string;
    } | null;
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
    orders: Order[];
};

export default function CustomerMyOrderIndex({ table, order, orders }: Props) {
    return (
        <MyOrderView
            table={table}
            order={order}
            orders={orders}
            menuPath="/customer-menu"
        />
    );
}
