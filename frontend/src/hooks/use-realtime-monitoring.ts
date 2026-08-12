/**
 * ==================================
 * eLISAschool - Hook Realtime Monitoring
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase M.2 — Refonte SaaS v3
 * V2 — Migration WebSocket natif → Socket.IO client
 *      (compatibilité protocole avec le backend MonitoringGateway)
 *
 * Hook React pour recevoir les événements monitoring en temps réel
 * via Socket.IO (protocole compatible avec le gateway backend).
 *
 * Usage :
 *   const { alerts, metrics, noisyNeighbors, connected } = useRealtimeMonitoring();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';

// =============================================
// Types
// =============================================

interface MonitoringAlert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    rule: string;
    etablissementId?: string;
    timestamp: string;
}

interface MonitoringMetrics {
    platform: {
        totalEtablissements: number;
        totalUtilisateurs: number;
        totalEleves: number;
    };
    health: Array<{
        service: string;
        status: 'healthy' | 'degraded' | 'unhealthy';
        latency?: number;
    }>;
    timestamp: string;
}

interface NoisyNeighborUpdate {
    etablissementId: string;
    nomEtablissement?: string;
    scoreCharge: number;
    statut: 'normal' | 'warning' | 'critique';
    timestamp: string;
}

interface UseRealtimeMonitoringResult {
    /** Alertes reçues en temps réel */
    alerts: MonitoringAlert[];
    /** Dernières métriques reçues */
    latestMetrics: MonitoringMetrics | null;
    /** Mises à jour noisy neighbor */
    noisyNeighbors: NoisyNeighborUpdate[];
    /** État de connexion Socket.IO */
    connected: boolean;
    /** Vider les alertes */
    clearAlerts: () => void;
}

// =============================================
// Hook
// =============================================

/**
 * Hook de monitoring temps réel via Socket.IO.
 * Se connecte au gateway monitoring backend et reçoit les événements.
 * Invalide automatiquement les queries TanStack pour rafraîchir les données.
 *
 * Compatibilité protocole : Socket.IO client ↔ Socket.IO server (backend).
 * Reconnexion automatique gérée par Socket.IO (retry avec backoff exponentiel).
 */
export function useRealtimeMonitoring(): UseRealtimeMonitoringResult {
    const { utilisateur: user, etablissementId } = useAuth();
    const queryClient = useQueryClient();

    const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
    const [latestMetrics, setLatestMetrics] = useState<MonitoringMetrics | null>(null);
    const [noisyNeighbors, setNoisyNeighbors] = useState<NoisyNeighborUpdate[]>([]);
    const [connected, setConnected] = useState(false);

    const socketRef = useRef<Socket | null>(null);

    const clearAlerts = useCallback(() => setAlerts([]), []);

    useEffect(() => {
        // Seulement pour SUPER_ADMIN et ADMIN
        if (!user || !['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:7000';

        // Connexion Socket.IO avec le path /monitoring (match le backend)
        const socket = io(apiUrl, {
            path: '/monitoring',
            transports: ['websocket', 'polling'],
            query: {
                userId: user.id,
                role: user.role,
                ...(etablissementId ? { etablissementId } : {}),
            },
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
        });

        socketRef.current = socket;

        // ── Événements de connexion ──
        socket.on('connect', () => {
            setConnected(true);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('connect_error', () => {
            setConnected(false);
        });

        // ── Événements monitoring ──
        socket.on('monitoring:alert', (data: any) => {
            setAlerts(prev => [{
                id: data.id,
                severity: data.severity,
                message: data.message,
                rule: data.rule,
                etablissementId: data.etablissementId,
                timestamp: new Date().toISOString(),
            }, ...prev].slice(0, 50)); // Max 50 alertes en mémoire
            queryClient.invalidateQueries({ queryKey: ['monitoring-alerts'] });
        });

        socket.on('monitoring:metrics', (data: any) => {
            setLatestMetrics({
                platform: data.platform,
                health: data.health,
                timestamp: new Date().toISOString(),
            });
            queryClient.invalidateQueries({ queryKey: ['monitoring-metrics'] });
        });

        socket.on('monitoring:health', () => {
            queryClient.invalidateQueries({ queryKey: ['monitoring-health'] });
        });

        socket.on('monitoring:noisy-neighbor', (data: any) => {
            setNoisyNeighbors(prev => [{
                etablissementId: data.etablissementId,
                nomEtablissement: data.nomEtablissement,
                scoreCharge: data.scoreCharge,
                statut: data.statut,
                timestamp: new Date().toISOString(),
            }, ...prev].slice(0, 20));
            queryClient.invalidateQueries({ queryKey: ['monitoring-tenants-usage'] });
            queryClient.invalidateQueries({ queryKey: ['monitoring-tenants-alerts'] });
        });

        socket.on('monitoring:payment', () => {
            queryClient.invalidateQueries({ queryKey: ['platform-factures'] });
            queryClient.invalidateQueries({ queryKey: ['platform-abonnements'] });
        });

        // ── Cleanup ──
        return () => {
            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, etablissementId, queryClient]);

    return {
        alerts,
        latestMetrics,
        noisyNeighbors,
        connected,
        clearAlerts,
    };
}
