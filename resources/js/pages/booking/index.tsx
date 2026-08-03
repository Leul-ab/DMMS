import BookingView from '@/pages/booking/booking-view';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Props = {
    availableTables: RestaurantTable[];
};

export default function BookingIndex({ availableTables }: Props) {
    return <BookingView availableTables={availableTables} basePath="/booking" menuPath="/menu" />;
}
