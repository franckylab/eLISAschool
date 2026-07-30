import { create } from 'zustand';
import { ConnectionState, ConnectionDetails, PingResponse } from '../types/network.types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const PING_URL = `${API_BASE}/api/network/ping`;
const INTERNET_PROBE_URL = 'https://1.1.1.1';
const INTERNET_PROBE_TIMEOUT = 5000;

interface ConnectionStoreState {
    state: ConnectionState;
    details: ConnectionDetails;
    bannerDismissed: boolean;
    dismissedAt: number | null;

    setState: (state: ConnectionState) => void;
    setDetails: (details: Partial<ConnectionDetails>) => void;
    dismissBanner: () => void;
    resetBanner: () => void;
    checkConnection: () => Promise<{ state: ConnectionState; details: ConnectionDetails }>;
}

function computeState(
    serverOk: boolean,
    serverDegraded: boolean,
    internetOk: boolean | null,
    networkOnline: boolean,
): ConnectionState {
    if (!networkOnline) return 'offline';
    if (internetOk === false) return 'lan-only';
    if (!serverOk) return 'server-down';
    return serverDegraded ? 'degraded' : 'connected';
}

export const useConnectionStore = create<ConnectionStoreState>((set, get) => ({
    state: navigator.onLine ? 'connected' : 'offline',
    details: {
        serverLatency: null,
        serverStatus: null,
        databaseConnected: null,
        memoryOk: null,
        freeMemoryMB: null,
        internetAccess: navigator.onLine ? null : false,
        lastChecked: null,
        lastServerResponse: null,
    },
    bannerDismissed: false,
    dismissedAt: null,

    setState: (state) => set({ state }),

    setDetails: (details) =>
        set((prev) => ({ details: { ...prev.details, ...details } })),

    dismissBanner: () => set({ bannerDismissed: true, dismissedAt: Date.now() }),

    resetBanner: () => set({ bannerDismissed: false, dismissedAt: null }),

    checkConnection: async () => {
        const networkOnline = navigator.onLine;
        let serverOk = false;
        let serverDegraded = false;
        let parseError = false;
        let pingResponse: PingResponse | null = null;
        let latencyMs: number | null = null;

        if (networkOnline) {
            const pingStart = Date.now();
            const pingController = new AbortController();
            const pingTimeout = setTimeout(() => pingController.abort(), 5000);
            try {
                const resp = await fetch(PING_URL, {
                    method: 'GET',
                    signal: pingController.signal,
                    headers: { Accept: 'application/json' },
                });
                clearTimeout(pingTimeout);
                latencyMs = Date.now() - pingStart;
                if (resp.ok) {
                    pingResponse = (await resp.json()) as PingResponse;
                    // Utiliser serverHealth (santé serveur) au lieu de status (global)
                    serverOk = pingResponse.serverHealth !== 'down';
                    serverDegraded = pingResponse.serverHealth === 'degraded';
                }
            } catch {
                parseError = true;
            }
        }

        // Determine internet access
        let internetOk: boolean | null = null;
        if (pingResponse?.details?.internet !== undefined && pingResponse.details.internet !== null) {
            internetOk = pingResponse.details.internet;
        } else if (!serverOk && networkOnline) {
            // Fallback: probe external when server is unreachable
            const probeController = new AbortController();
            const probeTimeout = setTimeout(() => probeController.abort(), INTERNET_PROBE_TIMEOUT);
            try {
                const probeResp = await fetch(INTERNET_PROBE_URL, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: probeController.signal,
                });
                clearTimeout(probeTimeout);
                internetOk = probeResp.type !== 'error';
            } catch {
                clearTimeout(probeTimeout);
                internetOk = false;
            }
        } else if (networkOnline && parseError) {
            internetOk = true; // Server reachable but response unexpected
        }

        const newState = computeState(
            serverOk,
            serverDegraded,
            internetOk,
            networkOnline,
        );

        const newDetails: ConnectionDetails = {
            serverLatency: latencyMs ?? get().details.serverLatency,
            // serverHealth reflète la santé serveur réelle (DB + mémoire, sans internet)
            serverStatus: pingResponse?.serverHealth ?? (networkOnline && !serverOk ? 'down' : get().details.serverStatus),
            databaseConnected: pingResponse?.details.database ?? get().details.databaseConnected,
            memoryOk: pingResponse?.details.memory ?? get().details.memoryOk,
            freeMemoryMB: pingResponse?.details.freeMemoryMB ?? get().details.freeMemoryMB,
            internetAccess: internetOk ?? get().details.internetAccess,
            lastChecked: new Date(),
            lastServerResponse: pingResponse ? new Date() : get().details.lastServerResponse,
        };

        set({ state: newState, details: newDetails });
        return { state: newState, details: newDetails };
    },
}));
