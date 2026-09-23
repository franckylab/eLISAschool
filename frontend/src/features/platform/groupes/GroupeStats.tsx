/**
 * ==================================
 * eLISAschool — Platform Groupes · Stats
 * ==================================
 * 4 StatCards sobres calculés côté client (aucun endpoint stats dédié).
 */

import { useMemo } from 'react';
import { Network, Building2, CheckCircle2, Percent } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import type { GroupeSaaS } from './types';
import { DEFAUT_PALIERS_GROUPE, nbMembres, tauxPourPaliers } from './types';

interface GroupeStatsProps {
    groupes: GroupeSaaS[];
    /** Paliers effectifs globaux (approximation si overrides par groupe). */
    paliers?: Array<{ minMembres: number; remisePct: number }>;
    loading?: boolean;
}

export function GroupeStats({ groupes, paliers, loading }: GroupeStatsProps) {
    const stats = useMemo(() => {
        const actifs = groupes.filter((g) => g.actif).length;
        const membres = groupes.reduce((sum, g) => sum + nbMembres(g), 0);
        const paliersEffectifs = paliers ?? DEFAUT_PALIERS_GROUPE;
        const avecRemise = groupes.filter(
            (g) => g.actif && tauxPourPaliers(paliersEffectifs, nbMembres(g)) > 0,
        ).length;
        return { total: groupes.length, actifs, membres, avecRemise };
    }, [groupes, paliers]);

    return (
        <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Network} label="Groupes" value={stats.total} tone="accent" loading={loading} />
            <StatCard icon={CheckCircle2} label="Groupes actifs" value={stats.actifs} tone="success" loading={loading} />
            <StatCard
                icon={Building2}
                label="Établissements rattachés"
                value={stats.membres}
                tone="dominant"
                loading={loading}
            />
            <StatCard
                icon={Percent}
                label="Groupes avec remise"
                value={stats.avecRemise}
                tone="purple"
                loading={loading}
            />
        </div>
    );
}
