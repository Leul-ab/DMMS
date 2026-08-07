import type { Order } from '@/components/order-card';
import MyOrderView from '@/pages/menu/my-order-view';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Props = {
    table: RestaurantTable;
    order: Order | null;
    orders: Order[];
};

export default function MyOrderIndex({ table, order, orders }: Props) {
    return <MyOrderView table={table} order={order} orders={orders} menuPath="/menu" />;
}
