/**
 * ==================================
 * eLISAschool - Dashboard Page
 * ==================================
 * Grille de widgets avec chargement depuis l'API
 */

import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    GraduationCap,
    BookOpen,
    CreditCard,
    TrendingUp,
    TrendingDown,
    MessageSquare,
    Calendar,
    Bell,
    ClipboardList,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { formatMontant, nombreFormate, formatPourcentage } from '@/lib/format-utils';
import { cn } from '@/lib/cn';

interface WidgetData {
    title: string;
    value: string | number;
    icon: React.ElementType | string;
    trend?: { value: number; positive: boolean };
    color: string;
}

// Mapping des noms d'icônes (string) vers les composants Lucide
const ICON_MAP: Record<string, React.ElementType> = {
    Users, GraduationCap, BookOpen, CreditCard, TrendingUp, TrendingDown,
    MessageSquare, Calendar, Bell, ClipboardList,
};

function WidgetCard({ widget }: { widget: WidgetData }) {
    // Résoudre l'icône : composant React ou nom de chaîne
    const Icon = typeof widget.icon === 'string'
        ? (ICON_MAP[widget.icon] || ClipboardList)
        : widget.icon;
    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[var(--color-texte-secondaire)]">{widget.title}</p>
                    <p className="mt-2 text-2xl font-bold text-[var(--color-texte)]">{widget.value}</p>
                </div>
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', widget.color)}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {widget.trend && (
                <div className={cn('mt-3 flex items-center gap-1 text-sm', widget.trend.positive ? 'text-green-600' : 'text-[var(--color-error)]')}>
                    {widget.trend.positive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span>{Math.abs(widget.trend.value)}%</span>
                </div>
            )}
        </div>
    );
}

export function DashboardPage() {
    const { t } = useTranslation('dashboard');
    const utilisateur = useAuthStore((s) => s.utilisateur);

    // Charger les widgets depuis l'API
    const { data: widgetsResponse, isLoading } = useQuery({
        queryKey: ['dashboard', 'widgets'],
        queryFn: () => apiClient.get('/api/dashboard/widgets'),
        retry: 1,
    });

    // Widgets par défaut si l'API n'est pas disponible
    const defaultWidgets: WidgetData[] = [
        {
            title: t('widgets.effectifs.eleves'),
            value: '—',
            icon: Users,
            color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        },
        {
            title: t('widgets.effectifs.enseignants'),
            value: '—',
            icon: GraduationCap,
            color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        },
        {
            title: t('widgets.effectifs.classes'),
            value: '—',
            icon: BookOpen,
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        },
        {
            title: t('widgets.finances.recettes'),
            value: '—',
            icon: CreditCard,
            color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        },
        {
            title: t('widgets.academique.moyenneGenerale'),
            value: '—',
            icon: ClipboardList,
            color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        },
        {
            title: t('widgets.communication.messagesNonLus'),
            value: '—',
            icon: MessageSquare,
            color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
        },
        {
            title: t('widgets.communication.evenements'),
            value: '—',
            icon: Calendar,
            color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        },
        {
            title: t('widgets.communication.notifications'),
            value: '—',
            icon: Bell,
            color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        },
    ];

    // Utiliser les données API si disponibles, sinon fallback par défaut
    const apiData = widgetsResponse?.data;
    const widgets: WidgetData[] = Array.isArray(apiData)
        ? apiData
        : Array.isArray(apiData?.widgets)
        ? apiData.widgets
        : defaultWidgets;

    return (
        <div>
            <PageHeader
                title={t('titre')}
                description={t('bienvenue', { nom: utilisateur?.prenom || '' })}
                showBreadcrumbs={false}
            />

            {isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6">
                            <div className="h-4 w-24 rounded bg-[var(--color-surface-hover)]" />
                            <div className="mt-3 h-8 w-16 rounded bg-[var(--color-surface-hover)]" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {widgets.map((widget, i) => (
                        <WidgetCard key={i} widget={widget} />
                    ))}
                </div>
            )}

            {/* Actions rapides */}
            <div className="mt-8">
                <h2 className="mb-4 text-lg font-semibold text-[var(--color-texte)]">
                    {t('raccourcis.titre')}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        { label: t('raccourcis.nouvelEleve'), icon: Users },
                        { label: t('raccourcis.nouvelleNote'), icon: ClipboardList },
                        { label: t('raccourcis.nouveauPaiement'), icon: CreditCard },
                        { label: t('raccourcis.envoiMessage'), icon: MessageSquare },
                    ].map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.label}
                                className="flex items-center gap-3 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:border-[var(--color-dominante)]/30 hover:bg-[var(--color-surface-hover)]"
                            >
                                <Icon className="h-5 w-5 text-[var(--color-dominante)]" />
                                <span className="text-sm font-medium text-[var(--color-texte)]">{action.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
