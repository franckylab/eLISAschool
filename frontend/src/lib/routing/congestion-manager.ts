import type { RoutingSide, CorridorKey } from './types';

const SIDE_WEIGHTS: Record<RoutingSide, number> = { left: 0, right: 0, auto: 0 };

function corridorKey(source: string, target: string): CorridorKey {
    return { source, target };
}

function corridorKeyStr(key: CorridorKey): string {
    return `${key.source}::${key.target}`;
}

export class CongestionManager {
    private leftCount = 0;
    private rightCount = 0;
    private corridors = new Map<string, { left: number; right: number }>();

    reset(): void {
        this.leftCount = 0;
        this.rightCount = 0;
        this.corridors.clear();
    }

    registerEdge(source: string, target: string, side: RoutingSide): void {
        if (side === 'left') this.leftCount++;
        else if (side === 'right') this.rightCount++;
        const key = corridorKeyStr(corridorKey(source, target));
        const entry = this.corridors.get(key) || { left: 0, right: 0 };
        if (side === 'left') entry.left++;
        else if (side === 'right') entry.right++;
        this.corridors.set(key, entry);
    }

    assignSide(
        source: string,
        target: string,
        preferRight?: boolean,
    ): RoutingSide {
        const key = corridorKeyStr(corridorKey(source, target));
        const entry = this.corridors.get(key);

        const leftWeight = this.leftCount + SIDE_WEIGHTS.left + (entry?.left ?? 0) * 2;
        const rightWeight = this.rightCount + SIDE_WEIGHTS.right + (entry?.right ?? 0) * 2;

        if (preferRight) {
            return rightWeight <= leftWeight ? 'right' : 'left';
        }
        return leftWeight <= rightWeight ? 'left' : 'right';
    }

    assignPair(
        source: string,
        target: string,
        sourceX: number,
        targetX: number,
    ): { direct: 'left' | 'right'; fonctionnel: 'left' | 'right' } {
        const preferRight = targetX > sourceX;
        const direct = this.assignSide(source, target, preferRight) as 'left' | 'right';
        const fonctionnel: 'left' | 'right' = direct === 'left' ? 'right' : 'left';
        this.registerEdge(source, target, direct);
        this.registerEdge(source, target, fonctionnel);
        return { direct, fonctionnel };
    }
}
