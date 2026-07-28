import type { Position } from 'reactflow';
import type { Waypoint } from './types';
import type { LayoutNode } from '../../features/organisation/components/organigramme/utils/layout';

export interface BezierInput {
    sourceX: number;
    sourceY: number;
    sourcePosition: Position;
    targetX: number;
    targetY: number;
    targetPosition: Position;
    side: 'left' | 'right';
    waypoints?: Waypoint[];
    direction: 'TB' | 'LR';
    /** Row bounding box (y min/max, x min/max) of the level when source and target are at same depth */
    rowBounds?: { yMin: number; yMax: number; xMin: number; xMax: number } | null;
}

export interface BezierResult {
    edgePath: string;
    labelX: number;
    labelY: number;
}

const ARC_HEIGHT_MIN = 80;
const SIDE_OFFSET = 50;
const DESCENDING_THRESHOLD = 60;

function straightLine(
    x1: number, y1: number,
    x2: number, y2: number,
    labelX: number, labelY: number,
): [string, number, number] {
    return [`M${x1},${y1} L${x2},${y2}`, labelX, labelY];
}

function cubicBezier(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    labelOffset: { x: number; y: number },
): [string, number, number] {
    const d = `M${p0.x},${p0.y} C${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
    return [d, p3.x + labelOffset.x, p3.y + labelOffset.y];
}

function computeBezier(
    sourceX: number, sourceY: number,
    targetX: number, targetY: number,
    side: 'left' | 'right',
    direction: 'TB' | 'LR',
    waypoints: Waypoint[],
    rowBounds: { yMin: number; yMax: number; xMin: number; xMax: number } | null,
): [string, number, number] {
    const sideSign = side === 'right' ? 1 : -1;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (waypoints.length > 0) {
        return routeViaWaypoints(sourceX, sourceY, targetX, targetY, waypoints, side);
    }

    const sameLevel = direction === 'TB' ? Math.abs(dy) < DESCENDING_THRESHOLD : Math.abs(dx) < DESCENDING_THRESHOLD;

    // Même niveau → arc au-dessus de la rangée
    if (sameLevel && rowBounds) {
        const targetRowY = rowBounds.yMin - ARC_HEIGHT_MIN;
        const p0 = { x: sourceX, y: sourceY };
        const p3 = { x: targetX, y: targetY };
        const p1 = { x: sourceX + sideSign * dist * 0.15, y: sourceY + (targetRowY - sourceY) * 0.5 };
        const p2 = { x: targetX - sideSign * dist * 0.15, y: targetY + (targetRowY - targetY) * 0.5 };
        return cubicBezier(p0, p1, p2, p3, { x: 0, y: -targetRowY > 0 ? -20 : 20 });
    }

    if (sameLevel) {
        const midY = (sourceY + targetY) / 2 - sideSign * ARC_HEIGHT_MIN;
        const p0 = { x: sourceX, y: sourceY };
        const p3 = { x: targetX, y: targetY };
        const p1 = { x: sourceX + dx * 0.15, y: sourceY + (midY - sourceY) * 0.6 };
        const p2 = { x: targetX - dx * 0.15, y: targetY + (midY - targetY) * 0.6 };
        return cubicBezier(p0, p1, p2, p3, { x: 0, y: -20 });
    }

    // Relation descendante (cible en dessous ou à droite) → ligne droite diagonale
    const isDescending = direction === 'TB' ? dy > DESCENDING_THRESHOLD : dx > DESCENDING_THRESHOLD;

    if (isDescending) {
        const offsetX = direction === 'TB' ? sideSign * SIDE_OFFSET : 0;
        const offsetY = direction === 'LR' ? sideSign * SIDE_OFFSET : 0;
        const x1 = sourceX + offsetX;
        const y1 = sourceY + offsetY;
        const x2 = targetX + offsetX;
        const y2 = targetY + offsetY;
        const lx = (x1 + x2) / 2;
        const ly = (y1 + y2) / 2;
        return straightLine(x1, y1, x2, y2, lx, ly);
    }

    // Relation montante (cas rare) → courbe latérale
    if (direction === 'TB') {
        const bendX = (sourceX + targetX) / 2 + sideSign * SIDE_OFFSET * (1 + Math.abs(dx) / 300);
        const p0 = { x: sourceX, y: sourceY };
        const p3 = { x: targetX, y: targetY };
        const p1 = { x: sourceX + (bendX - sourceX) * 0.35, y: sourceY + (targetY - sourceY) * 0.15 };
        const p2 = { x: targetX + (bendX - targetX) * 0.35, y: targetY - (targetY - sourceY) * 0.15 };
        return cubicBezier(p0, p1, p2, p3, { x: sideSign * 10, y: 0 });
    }

    const bendY = (sourceY + targetY) / 2 + sideSign * SIDE_OFFSET;
    const p0 = { x: sourceX, y: sourceY };
    const p3 = { x: targetX, y: targetY };
    const p1 = { x: sourceX + (targetX - sourceX) * 0.15, y: sourceY + (bendY - sourceY) * 0.35 };
    const p2 = { x: targetX - (targetX - sourceX) * 0.15, y: targetY + (bendY - targetY) * 0.35 };
    return cubicBezier(p0, p1, p2, p3, { x: 0, y: sideSign * 10 });
}

function routeViaWaypoints(
    sourceX: number, sourceY: number,
    targetX: number, targetY: number,
    waypoints: Waypoint[],
    side: 'left' | 'right',
): [string, number, number] {
    const pts = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
    if (pts.length < 3) {
        return computeBezier(sourceX, sourceY, targetX, targetY, side, 'TB', [], null);
    }
    const segs: string[] = [];
    let lastLabelPt = { x: 0, y: 0 };

    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p3 = pts[i + 1];
        segs.push(`L${p3.x},${p3.y}`);
        if (i === Math.floor((pts.length - 2) / 2)) {
            lastLabelPt = { x: (p0.x + p3.x) / 2, y: (p0.y + p3.y) / 2 };
        }
    }

    return [`M${pts[0].x},${pts[0].y} ${segs.join(' ')}`, lastLabelPt.x, lastLabelPt.y];
}

export function computeRowBounds(
    sourceNode: LayoutNode,
    targetNode: LayoutNode,
    allNodes: LayoutNode[],
    direction: 'TB' | 'LR',
): { yMin: number; yMax: number; xMin: number; xMax: number } | null {
    const sourceDepth = sourceNode.data.depth;
    const targetDepth = targetNode.data.depth;
    if (sourceDepth !== targetDepth) return null;

    const margin = 40;
    let yMin = Infinity, yMax = -Infinity, xMin = Infinity, xMax = -Infinity;

    for (const n of allNodes) {
        if (n.data.depth !== sourceDepth) continue;
        yMin = Math.min(yMin, n.position.y);
        yMax = Math.max(yMax, n.position.y + n.height);
        xMin = Math.min(xMin, n.position.x);
        xMax = Math.max(xMax, n.position.x + n.width);
    }

    if (direction === 'TB') {
        return { yMin: yMin - margin, yMax: yMax + margin, xMin: xMin - margin * 2, xMax: xMax + margin * 2 };
    }
    return { yMin: yMin - margin * 2, yMax: yMax + margin * 2, xMin: xMin - margin, xMax: xMax + margin };
}

export function computeWaypoints(
    sourceNode: LayoutNode,
    targetNode: LayoutNode,
    allNodes: LayoutNode[],
    side: 'left' | 'right',
    direction: 'TB' | 'LR',
): Waypoint[] {
    const sLeft = sourceNode.position.x;
    const sRight = sourceNode.position.x + sourceNode.width;
    const sTop = sourceNode.position.y;
    const sBottom = sourceNode.position.y + sourceNode.height;
    const tLeft = targetNode.position.x;
    const tRight = targetNode.position.x + targetNode.width;
    const tTop = targetNode.position.y;
    const tBottom = targetNode.position.y + targetNode.height;
    const sideSign = side === 'right' ? 1 : -1;

    const sourceDepth = sourceNode.data.depth;
    const targetDepth = targetNode.data.depth;
    const depthDiff = Math.abs(sourceDepth - targetDepth);

    if (depthDiff < 3) return [];

    if (direction === 'TB') {
        const minY = Math.min(sBottom, tBottom);
        const maxY = Math.max(sTop, tTop);
        const corridorX = sideSign === 1
            ? Math.max(sRight, tRight) + 40
            : Math.min(sLeft, tLeft) - 40;

        const blocking = allNodes.filter(n => {
            if (n.id === sourceNode.id || n.id === targetNode.id) return false;
            const nTop = n.position.y;
            const nBottom = n.position.y + n.height;
            const overlaps = nTop < maxY && nBottom > minY;
            const inCorridor = sideSign === 1
                ? n.position.x > Math.min(sRight, tRight)
                : n.position.x + n.width < Math.max(sLeft, tLeft);
            return overlaps && inCorridor;
        });

        if (blocking.length === 0) return [];

        return blocking.map(n => ({
            x: corridorX,
            y: n.position.y + n.height / 2,
        }));
    }

    const minX = Math.min(sRight, tRight);
    const maxX = Math.max(sLeft, tLeft);
    const corridorY = sideSign === 1
        ? Math.max(sBottom, tBottom) + 40
        : Math.min(sTop, tTop) - 40;

    const blocking = allNodes.filter(n => {
        if (n.id === sourceNode.id || n.id === targetNode.id) return false;
        const nLeft = n.position.x;
        const nRight = n.position.x + n.width;
        const overlaps = nLeft < maxX && nRight > minX;
        const inCorridor = sideSign === 1
            ? n.position.y > Math.min(sBottom, tBottom)
            : n.position.y + n.height < Math.max(sTop, tTop);
        return overlaps && inCorridor;
    });

    if (blocking.length === 0) return [];

    return blocking.map(n => ({
        x: n.position.x + n.width / 2,
        y: corridorY,
    }));
}

export function useBezierPath(input: BezierInput): BezierResult {
    const [edgePath, labelX, labelY] = computeBezier(
        input.sourceX,
        input.sourceY,
        input.targetX,
        input.targetY,
        input.side,
        input.direction,
        input.waypoints ?? [],
        input.rowBounds ?? null,
    );
    return { edgePath, labelX, labelY };
}
