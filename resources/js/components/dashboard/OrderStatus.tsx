import {
    CheckCircle2,
    Clock,
    TrendingUp,
    XCircle,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

type OrderStatusOverview = {
    status: string;
    count: number;
};

type OrderStatusProps = {
    statuses: OrderStatusOverview[];
};

export default function OrderStatus({
    statuses,
}: OrderStatusProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Order Status</CardTitle>
            </CardHeader>

            <CardContent>
                {statuses.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        No order data available.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {statuses.map((item) => (
                            <div
                                key={item.status}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    {item.status === 'completed' && (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    )}

                                    {item.status === 'pending' && (
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                    )}

                                    {item.status === 'cancelled' && (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    )}

                                    {item.status === 'received' && (
                                        <TrendingUp className="h-4 w-4 text-blue-600" />
                                    )}

                                    <span className="text-sm capitalize">
                                        {item.status}
                                    </span>
                                </div>

                                <Badge variant="secondary">
                                    {item.count}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}