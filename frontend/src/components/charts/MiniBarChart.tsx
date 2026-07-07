import { useMemo } from 'react';

interface BarData {
    label: string;
    value: number;
    color?: string;
}

interface MiniBarChartProps {
    data: BarData[];
    height?: number;
    barRadius?: number;
    showValues?: boolean;
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function MiniBarChart({ data, height = 200, barRadius = 4, showValues = true }: MiniBarChartProps) {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const padding = { top: 20, right: 10, bottom: 30, left: 10 };

    const chartWidth = useMemo(() => Math.max(300, data.length * 60), [data.length]);

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} className="overflow-visible">
            {data.map((d, i) => {
                const barHeight = (d.value / maxValue) * (height - padding.top - padding.bottom);
                const x = padding.left + i * (chartWidth / data.length) + 4;
                const barWidth = Math.max(20, chartWidth / data.length - 8);
                const y = height - padding.bottom - barHeight;
                const color = d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];

                return (
                    <g key={i}>
                        <rect
                            x={x} y={y}
                            width={barWidth} height={barHeight}
                            rx={barRadius} ry={barRadius}
                            fill={color}
                            opacity={0.85}
                            className="transition-opacity hover:opacity-100"
                        />
                        {showValues && (
                            <text
                                x={x + barWidth / 2} y={y - 6}
                                textAnchor="middle"
                                className="text-xs fill-gray-600"
                                fontSize="11"
                            >
                                {d.value}
                            </text>
                        )}
                        <text
                            x={x + barWidth / 2} y={height - 8}
                            textAnchor="middle"
                            className="text-xs fill-gray-500"
                            fontSize="10"
                        >
                            {d.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
