/**
 * ==================================
 * eLISAschool - Synthèse Organigramme
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Vue synthèse avec 10 cartes KPI :
 * - Unités (total, actives, sans postes)
 * - Postes (total, occupés, vacants, taux occupation)
 * - Hiérarchies actives
 * - Membres, Profondeur max
 *
 * Utilise StatCard + CardGrid (composants réutilisables du design system).
 */

import { useMemo } from 'react';
import {
    Building2,
    Building,
    Briefcase,
    UserCheck,
    UserX,
    CheckCircle,
    GitBranch,
    Users,
    AlertTriangle,
    Layers,
} from 'lucide-react';
import { StatCard, CardGrid } from '@/components/ui';
import type { CardTone } from '@/components/ui/card-variants';
import type { OrganigrammeNode, StatistiquesOrganisation } from '../../../types/organisation.types';
import { useTranslation } from 'react-i18next';

interface OrganigrammeSyntheseProps {
    data: OrganigrammeNode[];
    statsApi?: StatistiquesOrganisation;
}

interface StatsCalculees {
    totalMembres: number;
    profondeurMax: number;
    parEchelon: Array<{ label: string; couleur?: string; count: number }>;
}

function calculerStats(arbre: OrganigrammeNode[]): StatsCalculees {
    let totalMembres = 0;
    let profondeurMax = 0;
    const echelonMap = new Map<string, { label: string; couleur?: string; count: number }>();

    // totalMembres est déjà agrégé (descendants inclus) sur chaque noeud.
    // Sommer sur TOUS les noeuds → double-comptage. On prend donc la somme des racines.
    for (const racine of arbre) {
        totalMembres += racine.totalMembres || 0;
    }

    const parcourir = (noeuds: OrganigrammeNode[]) => {
        for (const noeud of noeuds) {
            if (noeud.depth > profondeurMax) profondeurMax = noeud.depth;
            // Distribution par échelon
            const key = noeud.echelonStructurelLabel || 'Sans échelon';
            const existing = echelonMap.get(key);
            if (existing) {
                existing.count++;
            } else {
                echelonMap.set(key, { label: key, couleur: noeud.echelonStructurelCouleur, count: 1 });
            }
            if (noeud.enfants?.length) parcourir(noeud.enfants);
        }
    };

    parcourir(arbre);
    return {
        totalMembres,
        profondeurMax,
        parEchelon: Array.from(echelonMap.values()).sort((a, b) => b.count - a.count),
    };
}

/** Détermine le tone conditionnel pour le taux d'occupation */
function getToneTauxOccupation(taux: number): CardTone {
    if (taux >= 80) return 'success';
    if (taux >= 50) return 'warning';
    return 'danger';
}

export function OrganigrammeSynthese({ data, statsApi }: OrganigrammeSyntheseProps) {
    const { t } = useTranslation('organisation');

    const statsCalc = useMemo(() => calculerStats(data), [data]);

    // Valeurs depuis l'API (préférées) ou fallback calcul local
    const totalUnites = statsApi?.totalUnites ?? data.length;
    const unitesActives = statsApi?.unitesActives ?? 0;
    const unitesSansPostes = statsApi?.unitesSansPostes ?? 0;
    const totalPostes = statsApi?.totalPostes ?? 0;
    const postesOccupes = statsApi?.postesOccupes ?? 0;
    const postesVacants = statsApi?.postesVacants ?? 0;
    const tauxOccupation = statsApi?.tauxOccupation ?? 0;
    const totalHierarchies = statsApi?.totalHierarchies ?? 0;
    const hierarchiesActives = statsApi?.hierarchiesActives ?? 0;
    const totalMembres = statsCalc.totalMembres;
    const profondeurMax = statsApi?.profondeurMax ?? statsCalc.profondeurMax;

    // Distribution par échelon : préférer les données API (avec labels/couleurs) ou fallback calcul local
    const parEchelon = statsApi?.parEchelonDetails?.length
        ? statsApi.parEchelonDetails.map(e => ({
            label: e.label,
            couleur: e.couleur,
            count: e.count,
        }))
        : statsCalc.parEchelon;

    return (
        <>
        <CardGrid
            columns={{ default: 1, xs: 2, lg: 3, '2xl': 5 }}
            loading={!statsApi && data.length === 0}
            skeletonCount={10}
        >
            {/* 1. Unités organisationnelles */}
            <StatCard
                icon={Building2}
                label={t('organigramme.stats.totalUnites', 'Unités organisationnelles')}
                value={totalUnites}
                tone="dominant"
            />

            {/* 2. Unités actives */}
            <StatCard
                icon={Building}
                label={t('organigramme.stats.unitesActives', 'Unités actives')}
                value={unitesActives}
                subtitle={`${totalUnites}`}
                tone="success"
            />

            {/* 3. Total postes */}
            <StatCard
                icon={Briefcase}
                label={t('organigramme.stats.totalPostes', 'Total postes')}
                value={totalPostes}
                tone="info"
            />

            {/* 4. Postes occupés */}
            <StatCard
                icon={UserCheck}
                label={t('organigramme.stats.postesOccupes', 'Postes occupés')}
                value={postesOccupes}
                subtitle={`${totalPostes}`}
                tone="success"
            />

            {/* 5. Postes vacants */}
            <StatCard
                icon={UserX}
                label={t('organigramme.stats.postesVacants', 'Postes vacants')}
                value={postesVacants}
                subtitle={`${totalPostes}`}
                tone="danger"
            />

            {/* 6. Taux d'occupation */}
            <StatCard
                icon={CheckCircle}
                label={t('organigramme.stats.tauxOccupation', 'Taux d\'occupation')}
                value={`${tauxOccupation}%`}
                subtitle={`${postesOccupes}/${totalPostes}`}
                tone={getToneTauxOccupation(tauxOccupation)}
            />

            {/* 7. Hiérarchies actives */}
            <StatCard
                icon={GitBranch}
                label={t('organigramme.stats.hierarchiesActives', 'Hiérarchies actives')}
                value={hierarchiesActives}
                subtitle={`${totalHierarchies}`}
                tone="accent"
            />

            {/* 8. Membres (total) */}
            <StatCard
                icon={Users}
                label={t('organigramme.stats.totalMembres', 'Membres (total)')}
                value={totalMembres}
                tone="purple"
            />

            {/* 9. Unités sans postes */}
            <StatCard
                icon={AlertTriangle}
                label={t('organigramme.stats.unitesSansPostes', 'Unités sans postes')}
                value={unitesSansPostes}
                subtitle={`${totalUnites}`}
                tone="warning"
            />

            {/* 10. Profondeur max */}
            <StatCard
                icon={Layers}
                label={t('organigramme.stats.profondeurMax', 'Profondeur max')}
                value={profondeurMax}
                tone="muted"
            />
        </CardGrid>

        {/* Distribution par échelon */}
        {parEchelon.length > 0 && (
            <div style={{ marginTop: 'var(--space-lg)' }}>
                <h3
                    className="font-medium"
                    style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)', color: 'var(--color-text)', marginBottom: 'var(--gap-sm)' }}
                >
                    {t('organigramme.stats.repartitionEchelon', 'Répartition par échelon')}
                </h3>
                <div className="flex flex-col" style={{ gap: 'var(--gap-xs)' }}>
                    {parEchelon.map((echelon) => {
                        const total = parEchelon.reduce((s, e) => s + e.count, 0);
                        const pct = total > 0 ? Math.round((echelon.count / total) * 100) : 0;
                        return (
                            <div key={echelon.label} className="flex items-center gap-3">
                                <span
                                    className="w-24 sm:w-32 text-xs truncate flex-shrink-0"
                                    style={{ color: 'var(--color-text-secondary)' }}
                                    title={echelon.label}
                                >
                                    {echelon.label}
                                </span>
                                <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-dominant-50)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                                        style={{
                                            width: `${Math.max(pct, 4)}%`,
                                            backgroundColor: echelon.couleur || 'var(--color-dominant-400)',
                                        }}
                                    >
                                        {pct >= 15 && (
                                            <span className="text-[9px] font-medium text-white/90">{pct}%</span>
                                        )}
                                    </div>
                                </div>
                                <span
                                    className="text-xs font-medium w-8 text-right flex-shrink-0"
                                    style={{ color: 'var(--color-text-muted)' }}
                                >
                                    {echelon.count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
    </>
    );
}
