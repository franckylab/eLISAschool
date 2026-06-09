# 🎨 Guide d'Intégration Frontend - Dashboard eLISAschool

## 📋 Vue d'Ensemble

Ce guide explique comment intégrer le système de dashboard dynamique côté frontend (React/Vue/Angular).

---

## 🚀 Installation & Configuration

### 1. Hook React personnalisé

```typescript
// hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';

interface UseDashboardOptions {
    etablissementId?: string;
    autoRefresh?: boolean;
    refreshInterval?: number; // ms
}

export function useDashboard(options: UseDashboardOptions = {}) {
    const {
        etablissementId,
        autoRefresh = false,
        refreshInterval = 300000, // 5 min
    } = options;

    const [widgets, setWidgets] = useState<any[]>([]);
    const [layout, setLayout] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [widgetData, setWidgetData] = useState<Record<string, any>>({});

    const fetchWidgets = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (etablissementId) {
                params.set('etablissementId', etablissementId);
            }

            const response = await fetch(`/api/dashboard/widgets?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Erreur chargement widgets');

            const data = await response.json();
            setWidgets(data.data.widgets);
            setLayout(data.data.layout);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [etablissementId]);

    // Charger les widgets
    useEffect(() => {
        fetchWidgets();
    }, [fetchWidgets]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(fetchWidgets, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchWidgets]);

    // Charger les données d'un widget
    const loadWidgetData = async (widgetId: string, filters?: any) => {
        try {
            const params = new URLSearchParams({
                etablissementId: etablissementId || '',
                ...filters,
            });

            const response = await fetch(`/api/dashboard/widget/${widgetId}/data?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error(`Erreur widget ${widgetId}`);

            const data = await response.json();
            setWidgetData(prev => ({
                ...prev,
                [widgetId]: data.data,
            }));

            return data.data;
        } catch (err) {
            console.error(`Erreur chargement widget ${widgetId}:`, err);
            return null;
        }
    };

    // Sauvegarder le layout
    const saveLayout = async (newLayout: any[]) => {
        try {
            const response = await fetch('/api/dashboard/layout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    nom: 'Mon Dashboard',
                    widgets: newLayout,
                    actif: true,
                }),
            });

            if (!response.ok) throw new Error('Erreur sauvegarde layout');

            const data = await response.json();
            setLayout(data.data.widgets);
            return true;
        } catch (err) {
            console.error('Erreur sauvegarde layout:', err);
            return false;
        }
    };

    // Rafraîchir un widget
    const refreshWidget = async (widgetId: string) => {
        try {
            await fetch(`/api/dashboard/widget/${widgetId}/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            // Recharger les données
            return loadWidgetData(widgetId);
        } catch (err) {
            console.error(`Erreur refresh widget ${widgetId}:`, err);
        }
    };

    return {
        widgets,
        layout,
        widgetData,
        loading,
        error,
        fetchWidgets,
        loadWidgetData,
        saveLayout,
        refreshWidget,
    };
}
```

### 2. Composant Widget Renderer

```typescript
// components/Dashboard/WidgetRenderer.tsx
import React from 'react';
import { StatsCardWidget } from './widgets/StatsCardWidget';
import { ChartLineWidget } from './widgets/ChartLineWidget';
import { ChartBarWidget } from './widgets/ChartBarWidget';
import { ChartPieWidget } from './widgets/ChartPieWidget';
import { ListWidget } from './widgets/ListWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { ProgressWidget } from './widgets/ProgressWidget';

interface WidgetRendererProps {
    widget: any;
    data: any;
    onRefresh: () => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
    widget,
    data,
    onRefresh,
}) => {
    const widgetComponents: Record<string, React.FC<any>> = {
        'stats-cards': StatsCardWidget,
        'chart-line': ChartLineWidget,
        'chart-bar': ChartBarWidget,
        'chart-pie': ChartPieWidget,
        'list': ListWidget,
        'quick-actions': QuickActionsWidget,
        'progress': ProgressWidget,
    };

    const WidgetComponent = widgetComponents[widget.type];

    if (!WidgetComponent) {
        return (
            <div className="widget-error">
                <p>Type de widget non supporté: {widget.type}</p>
            </div>
        );
    }

    return (
        <div
            className="widget-container"
            style={{
                gridColumn: `span ${widget.taille?.width || 1}`,
                gridRow: `span ${widget.taille?.height || 1}`,
            }}
        >
            <WidgetComponent
                widget={widget}
                data={data}
                onRefresh={onRefresh}
            />
        </div>
    );
};
```

### 3. Composant Dashboard Principal

```typescript
// components/Dashboard/Dashboard.tsx
import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { WidgetRenderer } from './WidgetRenderer';
import { DashboardSkeleton } from './DashboardSkeleton';

interface DashboardProps {
    etablissementId?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ etablissementId }) => {
    const {
        widgets,
        widgetData,
        loading,
        error,
        loadWidgetData,
        refreshWidget,
    } = useDashboard({
        etablissementId,
        autoRefresh: true,
        refreshInterval: 300000, // 5 min
    });

    // Charger les données des widgets visibles
    React.useEffect(() => {
        const visibleWidgets = widgets.filter(w => w.visible);
        
        visibleWidgets.forEach(widget => {
            if (!widgetData[widget.id]) {
                loadWidgetData(widget.id);
            }
        });
    }, [widgets]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <h2>Erreur de chargement</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Réessayer
                </button>
            </div>
        );
    }

    const visibleWidgets = widgets.filter(w => w.visible);

    return (
        <div className="dashboard-grid">
            {visibleWidgets.map(widget => (
                <WidgetRenderer
                    key={widget.id}
                    widget={widget}
                    data={widgetData[widget.id]}
                    onRefresh={() => refreshWidget(widget.id)}
                />
            ))}
        </div>
    );
};
```

### 4. Hook SSE pour temps réel

```typescript
// hooks/useDashboardSSE.ts
import { useEffect, useRef, useCallback, useState } from 'react';

export function useDashboardSSE(onUpdate: (event: string, data: any) => void) {
    const eventSourceRef = useRef<EventSource | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const eventSource = new EventSource('/api/dashboard/stream', {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setConnected(true);
            console.log('SSE connecté');
        };

        eventSource.addEventListener('connected', (event) => {
            const data = JSON.parse(event.data);
            onUpdate('connected', data);
        });

        eventSource.addEventListener('heartbeat', (event) => {
            const data = JSON.parse(event.data);
            onUpdate('heartbeat', data);
        });

        eventSource.addEventListener('widget:update', (event) => {
            const data = JSON.parse(event.data);
            onUpdate('widget:update', data);
        });

        eventSource.addEventListener('dashboard:refresh', (event) => {
            const data = JSON.parse(event.data);
            onUpdate('dashboard:refresh', data);
        });

        eventSource.onerror = (error) => {
            console.error('SSE erreur:', error);
            setConnected(false);
            
            // Reconnexion automatique après 5s
            setTimeout(() => {
                eventSource.close();
                // Le useEffect se réexécutera automatiquement
            }, 5000);
        };

        return () => {
            eventSource.close();
            setConnected(false);
        };
    }, []);

    return { connected };
}
```

### 5. Exemple d'intégration complète

```typescript
// pages/DashboardPage.tsx
import React from 'react';
import { Dashboard } from '../components/Dashboard/Dashboard';
import { useDashboardSSE } from '../hooks/useDashboardSSE';
import { useDashboard } from '../hooks/useDashboard';

export const DashboardPage: React.FC = () => {
    const { loadWidgetData } = useDashboard();
    const { connected } = useDashboardSSE((event, data) => {
        switch (event) {
            case 'widget:update':
                // Mettre à jour le widget spécifique
                loadWidgetData(data.widgetId);
                break;
            
            case 'dashboard:refresh':
                // Rafraîchir tout le dashboard
                window.location.reload();
                break;
        }
    });

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>Tableau de Bord</h1>
                <div className="connection-status">
                    {connected ? (
                        <span className="status-connected">
                            ● Connecté (temps réel)
                        </span>
                    ) : (
                        <span className="status-disconnected">
                            ○ Déconnecté
                        </span>
                    )}
                </div>
            </div>

            <Dashboard etablissementId="uuid-etablissement" />
        </div>
    );
};
```

---

## 🎨 Styles CSS (Grid Layout)

```css
/* components/Dashboard/Dashboard.css */

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
}

.widget-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.widget-container:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.widget-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

.widget-refresh-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: background 0.2s;
}

.widget-refresh-btn:hover {
    background: #f0f0f0;
}

/* Skeleton Loading */
.dashboard-skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
}

.skeleton-widget {
    background: #f0f0f0;
    border-radius: 12px;
    height: 200px;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

/* Responsive */
@media (max-width: 768px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px;
    }
}
```

---

## 📊 Exemples de Widgets

### StatsCardWidget

```typescript
// components/Dashboard/widgets/StatsCardWidget.tsx
import React from 'react';
import { Users, TrendingUp, AlertCircle } from 'lucide-react';

interface StatsCardWidgetProps {
    widget: any;
    data: any;
}

export const StatsCardWidget: React.FC<StatsCardWidgetProps> = ({ widget, data }) => {
    if (!data?.data) {
        return <div>Chargement...</div>;
    }

    const stats = data.data;

    const icons: Record<string, React.ReactNode> = {
        'eleves-stats-general': <Users size={24} />,
        'notes-moyennes-generales': <TrendingUp size={24} />,
        'absences-retards-jour': <AlertCircle size={24} />,
    };

    return (
        <div className="stats-cards-widget">
            <div className="widget-header">
                <h3 className="widget-title">{widget.nom}</h3>
                {icons[widget.id]}
            </div>

            <div className="stats-grid">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="stat-card">
                        <div className="stat-value">
                            {typeof value === 'object' ? JSON.stringify(value) : value}
                        </div>
                        <div className="stat-label">{key}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

---

## 🔧 Configuration Avancée

### 1. Service API

```typescript
// services/dashboard.service.ts
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

class DashboardService {
    private getToken(): string {
        return localStorage.getItem('token') || '';
    }

    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`,
        };
    }

    async getWidgets(etablissementId?: string) {
        const params = etablissementId ? `?etablissementId=${etablissementId}` : '';
        const response = await fetch(`${API_BASE}/dashboard/widgets${params}`, {
            headers: this.getHeaders(),
        });
        return response.json();
    }

    async getWidgetData(widgetId: string, filters?: any) {
        const params = new URLSearchParams(filters);
        const response = await fetch(
            `${API_BASE}/dashboard/widget/${widgetId}/data?${params}`,
            { headers: this.getHeaders() }
        );
        return response.json();
    }

    async saveLayout(layout: any) {
        const response = await fetch(`${API_BASE}/dashboard/layout`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(layout),
        });
        return response.json();
    }

    async refreshWidget(widgetId: string) {
        const response = await fetch(
            `${API_BASE}/dashboard/widget/${widgetId}/refresh`,
            {
                method: 'POST',
                headers: this.getHeaders(),
            }
        );
        return response.json();
    }

    async getPerformanceStats() {
        const response = await fetch(`${API_BASE}/dashboard/performance`, {
            headers: this.getHeaders(),
        });
        return response.json();
    }

    async getCacheStats() {
        const response = await fetch(`${API_BASE}/dashboard/cache/stats`, {
            headers: this.getHeaders(),
        });
        return response.json();
    }
}

export const dashboardService = new DashboardService();
```

---

## 🎯 Bonnes Pratiques Frontend

1. **Lazy Loading** : Charger les widgets uniquement quand visibles
2. **Cache Local** : Stocker les données dans localStorage/sessionStorage
3. **Error Boundaries** : Gérer les erreurs par widget
4. **Optimistic Updates** : UI réactive avant confirmation serveur
5. **Debouncing** : Éviter les appels API trop fréquents
6. **Virtual Scrolling** : Pour les listes longues
7. **Image Optimization** : Compression icônes et graphiques
8. **Code Splitting** : Charger les widgets à la demande

---

## 📱 Responsive Design

```css
/* Mobile First */
.dashboard-grid {
    grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) {
    .dashboard-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

/* Desktop */
@media (min-width: 1024px) {
    .dashboard-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Large Desktop */
@media (min-width: 1440px) {
    .dashboard-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}
```

---

## 🚀 Prochaines Étapes

1. **Drag & Drop** : Réorganiser les widgets (react-grid-layout)
2. **Personnalisation** : Modal de configuration par widget
3. **Export PDF** : Générer des rapports (jsPDF)
4. **Thèmes** : Dark mode, couleurs personnalisables
5. **Animations** : Transitions fluides (framer-motion)
6. **Charts** : Intégrer Recharts ou Chart.js
7. **PWA** : Mode hors ligne avec Service Workers

---

**Version** : 1.0.0  
**Dernière Mise à Jour** : 2026-06-06  
**Auteur** : franck arlos chendjou
