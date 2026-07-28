export type RoutingSide = 'left' | 'right' | 'auto';

export interface Waypoint {
    x: number;
    y: number;
}

export interface BezierRoutingConfig {
    side: RoutingSide;
    curvature: number;
    waypoints?: Waypoint[];
}

export interface CorridorKey {
    source: string;
    target: string;
}

export interface SideAssignment {
    direct: RoutingSide;
    fonctionnel: RoutingSide;
}
