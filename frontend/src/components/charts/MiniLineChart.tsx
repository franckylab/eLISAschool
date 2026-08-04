import {} from 'react';

interface LineDataPoint {
    label: string;
    value: number;
}

interface MiniLineChartProps {
    data: LineDataPoint[];
    height?: number;
    color?: string;
    showDots?: boolean;
    showGrid?: boolean;
}

export function MiniLineChart({
    data, height = 200, color = '#3B82F6',
    showDots = true, showGrid = true,
}: MiniLineChartProps) {
    if (data.length === 0) return null;

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartW = Math.max(300, data.length * 70);

    const values = data.map(d => d.value);
    const minVal = Math.min(...values, 0);
    const maxVal = Math.max(...values, 1);
    const range = maxVal - minVal || 1;

    const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * (chartW - padding.left - padding.right);
    const yScale = (v: number) => height - padding.bottom - ((v - minVal) / range) * (height - padding.top - padding.bottom);

    const linePath = data.map((d, i) => {
        const x = xScale(i);
        const y = yScale(d.value);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = height - padding.bottom - pct * (height - padding.top - padding.bottom);
        const v = minVal + pct * range;
        return { y, label: Math.round(v * 10) / 10 };
    }) : [];

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${chartW} ${height}`} className="overflow-visible">
            {showGrid && gridLines.map((g, i) => (
                <g key={i}>
                    <line
                        x1={padding.left} y1={g.y}
                        x2={chartW - padding.right} y2={g.y}
                        stroke="#E5E7EB" strokeWidth={1}
                    />
                    <text x={padding.left - 8} y={g.y + 4} textAnchor="end" className="text-xs fill-gray-400" fontSize="10">
                        {g.label}
                    </text>
                </g>
            ))}

            <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

            {showDots && data.map((d, i) => {
                const cx = xScale(i);
                const cy = yScale(d.value);
                return (
                    <g key={i}>
                        <circle cx={cx} cy={cy} r={4} fill="white" stroke={color} strokeWidth={2} />
                        <title>{`${d.label}: ${d.value}`}</title>
                    </g>
                );
            })}

            {data.map((d, i) => (
                <text
                    key={`lbl-${i}`}
                    x={xScale(i)} y={height - 8}
                    textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                    className="text-xs fill-gray-500"
                    fontSize="10"
                >
                    {d.label}
                </text>
            ))}
        </svg>
    );
}
