import { useEffect, useRef, useCallback } from 'react';
import { useConnectionStore } from '../stores/connection.store';

const POLL_INTERVAL_MS = 15000;

export function useConnectionStatus() {
    const state = useConnectionStore((s) => s.state);
    const details = useConnectionStore((s) => s.details);
    const checkConnection = useConnectionStore((s) => s.checkConnection);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startPolling = useCallback(() => {
        if (intervalRef.current) return;
        checkConnection();
        intervalRef.current = setInterval(() => {
            checkConnection();
        }, POLL_INTERVAL_MS);
    }, [checkConnection]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        startPolling();

        // Re-check on browser online/offline events
        const handleOnline = () => {
            checkConnection();
            startPolling();
        };
        const handleOffline = () => {
            useConnectionStore.setState({
                state: 'offline',
                details: {
                    internetAccess: false,
                    lastChecked: new Date(),
                    serverLatency: null,
                    serverStatus: null,
                    databaseConnected: null,
                    memoryOk: null,
                    freeMemoryMB: null,
                    lastServerResponse: null,
                },
            });
        };

        // Re-check on visibility change (tab becomes active)
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                checkConnection();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            stopPolling();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [startPolling, stopPolling, checkConnection]);

    return { state, details, refresh: checkConnection };
}
