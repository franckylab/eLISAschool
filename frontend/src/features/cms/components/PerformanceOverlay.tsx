/**
 * ==================================
 * eLISAschool - Canvas Performance Overlay
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Affiche les statistiques de performance du canvas en temps réel :
 * FPS, nombre de sections, zoom, temps de rendu.
 * Mode développeur — activable via les raccourcis clavier.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Cpu, Monitor, Layers, Timer, Zap } from 'lucide-react';

// ==================================
// Types
// ==================================

export interface PerformanceOverlayProps {
    visible: boolean;
    sectionCount: number;
    zoom: number;
    dark?: boolean;
}

interface PerfStats {
    fps: number;
    avgFps: number;
    frameTime: number;
    sectionCount: number;
    zoom: number;
    memoryUsage: number;
    domNodes: number;
}

// ==================================
// FPS Counter Hook
// ==================================

function useFpsCounter() {
    const [fps, setFps] = useState(60);
    const [avgFps, setAvgFps] = useState(60);
    const [frameTime, setFrameTime] = useState(16.67);
    const frameTimesRef = useRef<number[]>([]);
    const lastTimeRef = useRef(performance.now());
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const measure = (now: number) => {
            const delta = now - lastTimeRef.current;
            lastTimeRef.current = now;

            if (delta > 0) {
                const currentFps = 1000 / delta;
                frameTimesRef.current.push(currentFps);

                // Garder les 60 dernières mesures
                if (frameTimesRef.current.length > 60) {
                    frameTimesRef.current.shift();
                }

                // FPS instantané (lissé sur 5 frames)
                const recentFrames = frameTimesRef.current.slice(-5);
                const instantFps = recentFrames.reduce((a, b) => a + b, 0) / recentFrames.length;
                setFps(Math.round(instantFps));
                setFrameTime(Math.round(1000 / instantFps * 100) / 100);

                // FPS moyen (toutes les mesures)
                const allFrames = frameTimesRef.current;
                const average = allFrames.reduce((a, b) => a + b, 0) / allFrames.length;
                setAvgFps(Math.round(average));
            }

            rafRef.current = requestAnimationFrame(measure);
        };

        rafRef.current = requestAnimationFrame(measure);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return { fps, avgFps, frameTime };
}

// ==================================
// Composant principal
// ==================================

export function PerformanceOverlay({
    visible,
    sectionCount,
    zoom,
    dark = false,
}: PerformanceOverlayProps) {
    const { fps, avgFps, frameTime } = useFpsCounter();
    const [domNodes, setDomNodes] = useState(0);
    const [memoryUsage, setMemoryUsage] = useState(0);

    // Compter les nœuds DOM et la mémoire périodiquement
    useEffect(() => {
        if (!visible) return;

        const interval = setInterval(() => {
            // Compter les nœuds DOM dans le canvas
            const canvas = document.querySelector('.cms-canvas-workspace');
            if (canvas) {
                const count = canvas.querySelectorAll('*').length;
                setDomNodes(count);
            }

            // Mémoire (si disponible)
            if ('memory' in performance) {
                const mem = (performance as any).memory;
                setMemoryUsage(Math.round(mem.usedJSHeapSize / 1048576));
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [visible]);

    if (!visible) return null;

    // Déterminer la classe de couleur FPS
    const fpsClass = fps >= 50
        ? 'cms-perf-overlay__fps'
        : fps >= 30
            ? 'cms-perf-overlay__fps cms-perf-overlay__fps--warn'
            : 'cms-perf-overlay__fps cms-perf-overlay__fps--bad';

    return (
        <div className="cms-perf-overlay" role="status" aria-label="Performance du canvas">
            {/* FPS */}
            <span className={fpsClass}>
                <Zap className="cms-icon--xs" style={{ display: 'inline', marginRight: '2px' }} />
                {fps} FPS
            </span>

            <div className="cms-perf-overlay__sep" />

            {/* Frame time */}
            <span>
                <span className="cms-perf-overlay__label">Frame </span>
                <span className="cms-perf-overlay__value">{frameTime}ms</span>
            </span>

            <div className="cms-perf-overlay__sep" />

            {/* Sections */}
            <span>
                <span className="cms-perf-overlay__label">Sections </span>
                <span className="cms-perf-overlay__value">{sectionCount}</span>
            </span>

            <div className="cms-perf-overlay__sep" />

            {/* Zoom */}
            <span>
                <span className="cms-perf-overlay__label">Zoom </span>
                <span className="cms-perf-overlay__value">{zoom}%</span>
            </span>

            {/* DOM nodes (si > 0) */}
            {domNodes > 0 && (
                <>
                    <div className="cms-perf-overlay__sep" />
                    <span>
                        <span className="cms-perf-overlay__label">DOM </span>
                        <span className="cms-perf-overlay__value">{domNodes}</span>
                    </span>
                </>
            )}

            {/* Memory (si disponible) */}
            {memoryUsage > 0 && (
                <>
                    <div className="cms-perf-overlay__sep" />
                    <span>
                        <span className="cms-perf-overlay__label">Mem </span>
                        <span className="cms-perf-overlay__value">{memoryUsage}MB</span>
                    </span>
                </>
            )}
        </div>
    );
}

export default PerformanceOverlay;
