import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type DonutDatum = {
    name: string;
    value: number;
};

type DonutChartProps = {
    data: DonutDatum[];
    colors: string[];
    centerLabel: string;
    centerValue: string;
    formatValue?: (value: number) => string;
};

export function DonutChart({
    data,
    colors,
    centerLabel,
    centerValue,
    formatValue = (value) => `${Number(value).toLocaleString()} ETB`,
}: DonutChartProps) {
    const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);

    return (
        <div className="flex flex-col items-center">
            <div className="relative h-56 w-full max-w-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={72}
                            outerRadius={98}
                            paddingAngle={3}
                            strokeWidth={0}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={entry.name}
                                    fill={colors[index % colors.length]}
                                />
                            ))}
                        </Pie>

                        <Tooltip
                            formatter={(value) => [
                                formatValue(Number(value)),
                                'Value',
                            ]}
                            contentStyle={{
                                borderRadius: 12,
                                border: '1px solid #fecaca',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-semibold text-red-600">
                        {centerLabel}
                    </span>
                    <span className="mt-1 text-2xl font-black text-stone-800">
                        {centerValue}
                    </span>
                </div>
            </div>

            <div className="mt-6 grid w-full gap-2">
                {data.map((item, index) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between rounded-xl border border-red-100/80 bg-white px-4 py-2.5 transition hover:border-red-200 hover:shadow-sm"
                    >
                        <div className="flex items-center gap-2.5">
                            <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                    backgroundColor:
                                        colors[index % colors.length],
                                }}
                            />
                            <span className="text-sm font-semibold text-stone-700 capitalize">
                                {item.name}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-stone-800">
                                {formatValue(Number(item.value))}
                            </span>
                            <span className="text-xs font-semibold text-red-600">
                                {total > 0
                                    ? Math.round(
                                          (Number(item.value) / total) * 100,
                                      )
                                    : 0}
                                %
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
