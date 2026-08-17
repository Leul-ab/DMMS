import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type RevenueTrendPoint = {
    label: string;
    revenue: number;
    orders: number;
};

type FinanceAreaChartProps = {
    data: RevenueTrendPoint[];
};

export function FinanceAreaChart({ data }: FinanceAreaChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
                <defs>
                    <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor="#de1d1d"
                            stopOpacity={0.35}
                        />
                        <stop
                            offset="95%"
                            stopColor="#de1d1d"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>

                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#fecaca"
                    vertical={false}
                />

                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#a8a29e' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                />

                <YAxis
                    tick={{ fontSize: 12, fill: '#a8a29e' }}
                    axisLine={false}
                    tickLine={false}
                />

                <Tooltip
                    formatter={(value, name) =>
                        name === 'revenue'
                            ? [
                                  `ETB ${Number(value).toLocaleString()}`,
                                  'Revenue',
                              ]
                            : [value, 'Orders']
                    }
                    labelStyle={{ fontWeight: 700, color: '#44403c' }}
                    contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #fecaca',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    }}
                />

                <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#de1d1d"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                    activeDot={{ r: 5, fill: '#de1d1d' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
