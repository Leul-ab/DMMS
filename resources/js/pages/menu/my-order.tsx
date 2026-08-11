import MyOrderView, { Props } from '@/pages/menu/my-order-view';

export default function MyOrderIndex({ table, order, orders }: Props) {
    return <MyOrderView table={table} order={order} orders={orders} menuPath="/menu" />;
}
