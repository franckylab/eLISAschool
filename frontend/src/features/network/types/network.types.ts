export type ConnectionState = 'connected' | 'lan-only' | 'server-down' | 'offline' | 'degraded';

export interface PingResponse {
    /** Statut global agrégé (DB + mémoire + internet) */
    status: 'ok' | 'degraded' | 'down';
    /** Santé serveur uniquement (DB + mémoire, ignore internet) */
    serverHealth: 'ok' | 'degraded' | 'down';
    timestamp: string;
    version?: string;
    details: {
        database: boolean;
        memory: boolean;
        freeMemoryMB: number;
        internet: boolean | null;
    };
    latencyMs?: number;
}

export type NetworkRingColor = 'green' | 'orange' | 'red';
export type NetworkDotColor = 'green' | 'yellow' | 'red' | 'grey';

export interface ConnectionInfo {
    state: ConnectionState;
    ringColor: NetworkRingColor;
    dotColor: NetworkDotColor;
    labelKey: string;
    descriptionKey: string;
    pulseSpeed: number | null;
}

export interface ConnectionDetails {
    serverLatency: number | null;
    serverStatus: string | null;
    databaseConnected: boolean | null;
    memoryOk: boolean | null;
    freeMemoryMB: number | null;
    internetAccess: boolean | null;
    lastChecked: Date | null;
    lastServerResponse: Date | null;
}
