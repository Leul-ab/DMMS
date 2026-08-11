import MyOrderView, { Props } from '@/pages/menu/my-order-view';

export default function CustomerMyOrderIndex({ table, order, orders }: Props) {
    return <MyOrderView table={table} order={order} orders={orders} menuPath="/customer-menu" />;
}
