import { useMemo } from 'react';

interface PieSlice {
    label: string;
    value: number;
    color: string;
}

interface MiniPieChartProps {
    data: PieSlice[];
    size?: number;
    innerRadius?: number;
    showLegend?: boolean;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} L ${cx} ${cy} Z`;
}

export function MiniPieChart({ data, size = 180, innerRadius = 0, showLegend = true }: MiniPieChartProps) {
    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    const slices = useMemo(() => {
        if (total === 0) return [];
        let currentAngle = 0;
        return data.map(d => {
            const angle = (d.value / total) * 360;
            const slice = {
                ...d,
                startAngle: currentAngle,
                endAngle: currentAngle + angle,
                percentage: (d.value / total) * 100,
            };
            currentAngle += angle;
            return slice;
        });
    }, [data, total]);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 4;

    if (total === 0) {
        return (
            <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                <span className="text-xs text-gray-400">Aucune donnée</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {slices.map((s, i) => {
                    if (s.percentage === 0) return null;
                    if (innerRadius > 0) {
                        return (
                            <path
                                key={i}
                                d={describeArc(cx, cy, r, s.startAngle, s.endAngle)}
                                fill={s.color}
                                opacity={0.85}
                                stroke="white"
                                strokeWidth={1}
                            />
                        );
                    }
                    return (
                        <path
                            key={i}
                            d={describeArc(cx, cy, r, s.startAngle, s.endAngle)}
                            fill={s.color}
                            opacity={0.85}
                            stroke="white"
                            strokeWidth={2}
                        />
                    );
                })}
                {innerRadius > 0 && (
                    <circle cx={cx} cy={cy} r={innerRadius} fill="white" />
                )}
            </svg>
            {showLegend && (
                <div className="flex flex-wrap justify-center gap-3">
                    {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-gray-600">{d.label}</span>
                            <span className="font-medium text-gray-900">
                                {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
