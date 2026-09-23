/**
 * ==================================
 * eLISAschool — Platform Groupes · Vue Consolidée
 * ==================================
 * Remplace l'ancien onglet Abonnement (facturation groupe supprimée).
 * Affiche : stats consolidées, dégressivité appliquée, export CSV/PDF.
 * Lecture seule — la dégressivité est appliquée automatiquement sur les factures individuelles.
 */

import { useTranslation } from 'react-i18next';
import { CreditCard, Download, FileText, Calculator, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SchoolLoading } from '@/components/feedback/SchoolLoading';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { formatRelative } from '@/lib/date-utils';
import { useGroupesStats } from '../use-groupes-saas';

export function ConsolidatedViewTab({ groupe }: { groupe: { id: string; nom: string; code: string } }) {
    const { t } = useTranslation('admin');

    const { data: stats, isLoading, isError, error, refetch } = useGroupesStats(groupe.id);

    const handleExportCSV = () => {
        if (!stats) return;
        const echapper = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
        const lignes = [
            `# ${t('groupes.vueConsolidee.titre', { nom: groupe.nom })} — ${new Date().toLocaleDateString('fr-FR')}`,
            `${t('groupes.vueConsolidee.kpi.facturesMois')};${stats.facturesMois}`,
            `${t('groupes.vueConsolidee.kpi.montantHT')};${stats.montantTotalHT}`,
            `${t('groupes.vueConsolidee.kpi.economieMois')};${stats.economieMois}`,
            `${t('groupes.vueConsolidee.kpi.degressivite')};${stats.degressivite}%`,
            '',
            [
                t('groupes.vueConsolidee.facturesRecentes.colonnes.numero'),
                t('groupes.vueConsolidee.facturesRecentes.colonnes.etablissement'),
                t('groupes.vueConsolidee.facturesRecentes.colonnes.date'),
                t('groupes.vueConsolidee.facturesRecentes.colonnes.montant'),
                t('groupes.vueConsolidee.facturesRecentes.colonnes.statut'),
            ].join(';'),
            ...(stats.facturesRecentes ?? []).map((f) =>
                [f.numero, f.etablissement, f.date, f.montant, f.statut].map(echapper).join(';'),
            ),
        ].join('\n');
        const blob = new Blob(['\uFEFF' + lignes], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `groupe-${groupe.code}-consolidee-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <SchoolLoading variant="compact" message={t('groupes.vueConsolidee.chargement')} />
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorMessage
                title={t('groupes.vueConsolidee.erreurChargement')}
                message={error?.message ?? t('groupes.vueConsolidee.erreurChargementDetail')}
                onRetry={() => refetch()}
                retryLabel={t('groupes.reessayer')}
            />
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
                <BarChart3 className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-texte-muted)]" aria-hidden />
                <p className="text-sm text-[var(--color-texte-secondaire)]">{t('groupes.vueConsolidee.aucuneDonnee')}</p>
            </div>
        );
    }

    const degressivitePct = stats.degressivite;
    const degressiviteColor = degressivitePct === 0 ? 'muted' : degressivitePct <= 10 ? 'info' : degressivitePct <= 20 ? 'success' : 'warning';

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* En-tête avec actions */}
            <div className="flex flex-col gap-[var(--gap-sm)] sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-[var(--text-lg)] font-semibold flex items-center gap-2">
                        <BarChart3 className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominante)]" aria-hidden />
                        {t('groupes.vueConsolidee.titre', { nom: groupe.nom })}
                    </h3>
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {t('groupes.vueConsolidee.sousTitre', { code: groupe.code })}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        onClick={handleExportCSV}
                        icon={<Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    >
                        {t('groupes.vueConsolidee.export.bouton')}
                    </ElisaButton>
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        isLoading={isLoading}
                        icon={<RefreshCw className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    >
                        {t('groupes.actualiser')}
                    </ElisaButton>
                </div>
            </div>

            {/* KPIs principaux */}
            <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={FileText}
                    label={t('groupes.vueConsolidee.kpi.facturesMois')}
                    value={stats.facturesMois}
                    tone="accent"
                />
                <StatCard
                    icon={CreditCard}
                    label={t('groupes.vueConsolidee.kpi.montantHT')}
                    value={`${stats.montantTotalHT.toLocaleString('fr-FR')} F`}
                    tone="dominant"
                />
                <StatCard
                    icon={Calculator}
                    label={t('groupes.vueConsolidee.kpi.economieMois')}
                    value={`${stats.economieMois.toLocaleString('fr-FR')} F`}
                    tone="success"
                    trend={{ value: stats.economieMois, isPositive: true }}
                />
                <StatCard
                    icon={TrendingUp}
                    label={t('groupes.vueConsolidee.kpi.degressivite')}
                    value={`${degressivitePct}%`}
                    tone={degressiviteColor}
                    trend={{ value: degressivitePct, isPositive: degressivitePct > 0 }}
                />
            </div>

            {/* Détail dégressivité */}
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                <h4 className="text-[var(--text-base)] font-semibold mb-[var(--space-sm)] flex items-center gap-2">
                    <Calculator className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominante)]" aria-hidden />
                    {t('groupes.vueConsolidee.degressivite.titre')}
                </h4>
                <p className="text-sm text-[var(--color-texte-secondaire)] mb-[var(--space-sm)]">
                    {t('groupes.vueConsolidee.degressivite.description', { 
                        nombreMembres: stats.repartitionParPlan?.reduce((a, b) => a + b.count, 0) ?? 0,
                        degressivite: degressivitePct 
                    })}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-[var(--color-surface-hover)]">
                        <span className="text-[var(--color-texte-secondaire)]">{t('groupes.vueConsolidee.degressivite.montantAvant')}</span>
                        <span className="font-semibold text-[var(--color-texte)]">{stats.montantTotalHT.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-[var(--color-success)]/10 text-success">
                        <span className="text-[var(--color-texte-secondaire)]">{t('groupes.vueConsolidee.degressivite.economie')}</span>
                        <span className="font-semibold">{stats.economieMois.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-[var(--color-dominante)]/10 text-dominant">
                        <span className="text-[var(--color-texte-secondaire)]">{t('groupes.vueConsolidee.degressivite.montantApres')}</span>
                        <span className="font-semibold text-[var(--color-texte)]">{(stats.montantTotalHT - stats.economieMois).toLocaleString('fr-FR')} F</span>
                    </div>
                </div>
            </div>

            {/* Répartition par plan */}
            {stats.repartitionParPlan?.length && (
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <h4 className="text-[var(--text-base)] font-semibold mb-[var(--space-sm)] flex items-center gap-2">
                        <CreditCard className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominante)]" aria-hidden />
                        {t('groupes.vueConsolidee.repartition.titre')}
                    </h4>
                    <div className="space-y-2">
                        {stats.repartitionParPlan.map((item) => (
                            <div key={item.plan} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--color-surface-hover)]">
                                <span className="text-sm font-medium text-[var(--color-texte)]">{item.plan}</span>
                                <Badge variant="default" size="sm">{item.count} {t('groupes.membres')}</Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Factures récentes */}
            {stats.facturesRecentes?.length && (
                <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
                    <div className="flex items-center justify-between mb-[var(--space-sm)]">
                        <h4 className="text-[var(--text-base)] font-semibold flex items-center gap-2">
                            <FileText className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominante)]" aria-hidden />
                            {t('groupes.vueConsolidee.facturesRecentes.titre')}
                        </h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[var(--color-texte-muted)] border-b border-[var(--color-bordure)]">
                                    <th className="pb-2 px-3 font-medium">{t('groupes.vueConsolidee.facturesRecentes.colonnes.numero')}</th>
                                    <th className="pb-2 px-3 font-medium">{t('groupes.vueConsolidee.facturesRecentes.colonnes.etablissement')}</th>
                                    <th className="pb-2 px-3 font-medium">{t('groupes.vueConsolidee.facturesRecentes.colonnes.date')}</th>
                                    <th className="pb-2 px-3 font-medium text-right">{t('groupes.vueConsolidee.facturesRecentes.colonnes.montant')}</th>
                                    <th className="pb-2 px-3 font-medium">{t('groupes.vueConsolidee.facturesRecentes.colonnes.statut')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-bordure)]/50">
                                {stats.facturesRecentes.slice(0, 10).map((f) => (
                                    <tr key={f.id} className="hover:bg-[var(--color-surface-hover)]/50">
                                        <td className="py-2 px-3 font-mono text-xs text-[var(--color-texte)]">{f.numero}</td>
                                        <td className="py-2 px-3 text-sm text-[var(--color-texte)] truncate max-w-[12rem]">{f.etablissement}</td>
                                        <td className="py-2 px-3 text-sm text-[var(--color-texte-secondaire)]">{formatRelative(f.date)}</td>
                                        <td className="py-2 px-3 text-sm font-mono text-right text-[var(--color-texte)]">{f.montant.toLocaleString('fr-FR')} F</td>
                                        <td className="py-2 px-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                f.statut === 'PAYEE' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' :
                                                f.statut === 'EN_RETARD' ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]' :
                                                f.statut === 'EMISE' ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' :
                                                'bg-[var(--color-texte-muted)]/10 text-[var(--color-texte-muted)]'
                                            }`}>
                                                {f.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {stats.facturesRecentes.length > 10 && (
                        <p className="mt-3 text-xs text-[var(--color-texte-muted)] text-center">
                            {t('groupes.vueConsolidee.facturesRecentes.etAutres', { count: stats.facturesRecentes.length - 10 })}
                        </p>
                    )}
                </div>
            )}

            {/* Note explicative */}
            <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5 p-[var(--space-md)]">
                <p className="text-sm text-[var(--color-texte-secondaire)]">
                    <strong className="text-[var(--color-accent)]">{t('groupes.vueConsolidee.note.titre')} :</strong>
                    {' '}{t('groupes.vueConsolidee.note.description')}
                </p>
            </div>
        </div>
    );
}