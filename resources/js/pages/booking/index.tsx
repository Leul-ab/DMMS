import BookingView from '@/pages/booking/booking-view';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
    table_section_id: number | null;
};

type Section = {
    id: number;
    name: string;
    description: string | null;
    status: string;
};

type Props = {
    availableTables: RestaurantTable[];
    allTables: RestaurantTable[];
    sections: Section[];
};

export default function BookingIndex({ availableTables, allTables, sections }: Props) {
    return <BookingView availableTables={availableTables} allTables={allTables} sections={sections} basePath="/booking" menuPath="/menu" />;
}
