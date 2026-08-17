/**
 * ==================================
 * eLISAschool - FinancesTab — Detail etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    DollarSign, Receipt, Percent, AlertCircle, CreditCard,
    FileText, TrendingUp, ArrowUpRight, ArrowDownRight, Banknote,
} from 'lucide-react';
import { SectionCard } from './shared';
import type { FactureEtablissement, EtablissementConfig, ActiviteEtablissementResult } from '@/features/etablissements/types/etablissement.types';
import type { EvolutionPaiementMois } from '@/features/etablissements/types/etablissement.types';

export function FinancesTab({ factures, config, activite, evolutionPaiements }: {
    factures: FactureEtablissement[];
    config: EtablissementConfig;
    activite: ActiviteEtablissementResult;
    evolutionPaiements: EvolutionPaiementMois[];
}) {
    const { t } = useTranslation('admin');
    const finances = activite?.finances;

    // Calculs résumé
    const totalFacture = factures.reduce((sum, f) => sum + f.montantTotal, 0);
    const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);
    const totalEnAttente = totalFacture - totalPaye;
    const nbPayees = factures.filter(f => f.statut === 'PAYEE').length;
    const nbEnRetard = factures.filter(f => f.statut === 'EN_RETARD').length;
    const tauxRecouvrement = totalFacture > 0 ? Math.round((totalPaye / totalFacture) * 100) : 0;

    // Distribution des statuts
    const distributionStatuts = useMemo(() => {
        const counts = new Map<string, number>();
        for (const f of factures) {
            counts.set(f.statut, (counts.get(f.statut) || 0) + 1);
        }
        return Array.from(counts.entries())
            .map(([statut, count]) => ({ statut, count, pct: factures.length > 0 ? (count / factures.length) * 100 : 0 }))
            .sort((a, b) => b.count - a.count);
    }, [factures]);

    // Export CSV des factures
    const handleExportFacturesCSV = useCallback(() => {
        if (!factures.length) return;
        const headers = ['Date émission', 'Numéro', 'Montant HT', 'TVA', 'Montant total', 'Montant payé', 'Reste', 'Statut', 'Échéance'];
        const rows = factures.map((f) => [
            f.dateEmission ? new Date(f.dateEmission).toLocaleDateString('fr-FR') : '',
            f.numero || f.id?.substring(0, 8) || '',
            (f.montantHT ?? 0).toFixed(2),
            (f.montantTVA ?? 0).toFixed(2),
            (f.montantTotal ?? 0).toFixed(2),
            (f.montantPaye ?? 0).toFixed(2),
            ((f.montantTotal ?? 0) - (f.montantPaye ?? 0)).toFixed(2),
            f.statut || '',
            f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '',
        ]);
        const csv = [headers.join(';'), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\n');
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factures_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [factures]);

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* Bouton export */}
            {factures.length > 0 && (
                <div className="flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExportFacturesCSV}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                    >
                        <Download className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('etablissements.exporterFactures', 'Exporter factures (CSV)')}
                    </motion.button>
                </div>
            )}
            {/* ===== Section 1 — Résumé financier ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[var(--gap-md)]">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <DollarSign className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-success-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.totalFacture', 'Total facturé')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-texte)' }}>
                        {totalFacture.toLocaleString('fr-FR')} <span className="text-sm font-normal" style={{ color: 'var(--color-texte-muted)' }}>FCFA</span>
                    </span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <CheckCircle2 className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-dominant-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.totalPaye', 'Total payé')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-success-600)' }}>
                        {totalPaye.toLocaleString('fr-FR')} <span className="text-sm font-normal" style={{ color: 'var(--color-texte-muted)' }}>FCFA</span>
                    </span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <AlertCircle className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-warning-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.enAttente', 'En attente')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: totalEnAttente > 0 ? 'var(--color-warning-600)' : 'var(--color-texte)' }}>
                        {totalEnAttente.toLocaleString('fr-FR')} <span className="text-sm font-normal" style={{ color: 'var(--color-texte-muted)' }}>FCFA</span>
                    </span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border p-[clamp(1rem,0.8rem+0.5vw,1.5rem)] space-y-[var(--space-sm)]"
                    style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                >
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        <Receipt className="h-[var(--icon-md)] w-[var(--icon-md)]" style={{ color: 'var(--color-info-600)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.nbFactures', 'Factures')}
                        </span>
                    </div>
                    <span className="text-2xl font-bold" style={{ color: 'var(--color-texte)' }}>
                        {factures.length}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                        {nbPayees} {t('etablissements.detail.finances.payees', 'payées')}
                        {nbEnRetard > 0 && (
                            <span style={{ color: 'var(--color-danger-600)' }}> · {nbEnRetard} en retard</span>
                        )}
                    </span>
                </motion.div>
            </div>

            {/* ===== Taux de recouvrement + Distribution statuts ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
                {/* Taux de recouvrement */}
                <SectionCard title={t('etablissements.detail.finances.tauxRecouvrement', 'Taux de recouvrement')} icon={TrendingUp}>
                    <div className="space-y-[var(--space-sm)]">
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-bold" style={{ color: tauxRecouvrement >= 80 ? 'var(--color-success-600)' : tauxRecouvrement >= 50 ? 'var(--color-warning-600)' : 'var(--color-danger-600)' }}>
                                {tauxRecouvrement}%
                            </span>
                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                {totalPaye.toLocaleString('fr-FR')} / {totalFacture.toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bordure)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${tauxRecouvrement}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: tauxRecouvrement >= 80 ? 'var(--color-success-500)' : tauxRecouvrement >= 50 ? 'var(--color-warning-500)' : 'var(--color-danger-500)' }}
                            />
                        </div>
                        {totalEnAttente > 0 && (
                            <p className="text-xs" style={{ color: 'var(--color-warning-600)' }}>
                                <AlertCircle className="inline h-3 w-3 mr-1" />
                                {totalEnAttente.toLocaleString('fr-FR')} FCFA {t('etablissements.detail.finances.enAttenteReste', 'en attente de paiement')}
                            </p>
                        )}
                    </div>
                </SectionCard>

                {/* Distribution des statuts */}
                <SectionCard title={t('etablissements.detail.finances.distributionStatuts', 'Distribution des statuts')} icon={Receipt}>
                    {distributionStatuts.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center gap-[var(--gap-lg)]">
                            {/* Donut SVG animé */}
                            {(() => {
                                const colorMap: Record<string, string> = {
                                    PAYEE: 'var(--color-success-500)',
                                    EMISE: 'var(--color-info-500)',
                                    EN_RETARD: 'var(--color-danger-500)',
                                    PARTIELLEMENT_PAYEE: 'var(--color-warning-500)',
                                    BROUILLON: 'var(--color-texte-muted)',
                                    ANNULEE: 'var(--color-texte-muted)',
                                    EN_PAIEMENT: 'var(--color-accent-500)',
                                    AVOIR: 'var(--color-teal-500, #14b8a6)',
                                };
                                const R = 40;
                                const C = 2 * Math.PI * R;
                                let cumul = 0;
                                return (
                                    <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
                                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                            {/* Fond */}
                                            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-bordure)" strokeWidth="14" />
                                            {/* Segments */}
                                            {distributionStatuts.map(({ statut, pct }) => {
                                                const dashLen = (pct / 100) * C;
                                                const offset = -(cumul / 100) * C;
                                                cumul += pct;
                                                return (
                                                    <motion.circle
                                                        key={statut}
                                                        cx="60" cy="60" r={R}
                                                        fill="none"
                                                        strokeWidth="14"
                                                        strokeLinecap="butt"
                                                        style={{ stroke: colorMap[statut] || 'var(--color-texte-muted)' }}
                                                        initial={{ strokeDasharray: '0 ' + C, strokeDashoffset: '0' }}
                                                        animate={{ strokeDasharray: `${dashLen} ${C - dashLen}`, strokeDashoffset: `${offset}` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    />
                                                );
                                            })}
                                        </svg>
                                        {/* Centre — total */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-lg font-bold leading-none" style={{ color: 'var(--color-texte)' }}>{factures.length}</span>
                                            <span className="text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                                {t('etablissements.detail.finances.factures', 'factures')}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}
                            {/* Barres + légende */}
                            <div className="flex-1 min-w-0 space-y-[var(--space-sm)]">
                                {/* Barre empilée */}
                                <div className="h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: 'var(--color-bordure)' }}>
                                    {distributionStatuts.map(({ statut, pct }) => {
                                        const cfg = STATUT_FACTURE_LABELS[statut] || STATUT_FACTURE_LABELS.BROUILLON;
                                        const colorMap: Record<string, string> = {
                                            PAYEE: 'var(--color-success-500)',
                                            EMISE: 'var(--color-info-500)',
                                            EN_RETARD: 'var(--color-danger-500)',
                                            PARTIELLEMENT_PAYEE: 'var(--color-warning-500)',
                                            BROUILLON: 'var(--color-texte-muted)',
                                            ANNULEE: 'var(--color-texte-muted)',
                                            EN_PAIEMENT: 'var(--color-accent-500)',
                                            AVOIR: 'var(--color-teal-500, #14b8a6)',
                                        };
                                        return (
                                            <motion.div
                                                key={statut}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.5 }}
                                                className="h-full"
                                                style={{ backgroundColor: colorMap[statut] || 'var(--color-texte-muted)' }}
                                                title={`${cfg.label}: ${Math.round(pct)}%`}
                                            />
                                        );
                                    })}
                                </div>
                                {/* Légende */}
                                <div className="flex flex-wrap gap-x-[var(--gap-md)] gap-y-[var(--gap-xs)]">
                                    {distributionStatuts.map(({ statut, count }) => {
                                        const cfg = STATUT_FACTURE_LABELS[statut] || STATUT_FACTURE_LABELS.BROUILLON;
                                        return (
                                            <div key={statut} className="flex items-center gap-[var(--gap-xxs)]">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.bg} ${cfg.text}`} />
                                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                                    {cfg.label} ({count})
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.aucuneFacture', 'Aucune facture enregistrée')}
                        </p>
                    )}
                </SectionCard>
            </div>

            {/* ===== Section — Évolution mensuelle des paiements ===== */}
            {evolutionPaiements && evolutionPaiements.length > 0 && (() => {
                const rawMax = Math.max(...evolutionPaiements.map(m => Number.isFinite(m.montantTotal) ? m.montantTotal : 0), 1);
                const maxMontant = Number.isFinite(rawMax) ? rawMax : 1;
                const totalEvo = evolutionPaiements.reduce((s, m) => s + (Number.isFinite(m.montantTotal) ? m.montantTotal : 0), 0);
                const totalPayeEvo = evolutionPaiements.reduce((s, m) => s + (Number.isFinite(m.montantPaye) ? m.montantPaye : 0), 0);
                const tauxEvo = totalEvo > 0 ? Math.round((totalPayeEvo / totalEvo) * 100) : 0;
                return (
                <SectionCard title={t('etablissements.detail.finances.evolutionMensuelle', 'Évolution mensuelle (12 mois)')} icon={BarChart3} fullWidth>
                    <div className="space-y-[var(--space-sm)]">
                        {/* Graphique à barres groupées */}
                        <div className="w-full overflow-x-auto">
                            <div className="flex items-end gap-[clamp(2px,0.3vw,6px)]" style={{ minHeight: 'clamp(80px, 12vw, 160px)' }}>
                                {evolutionPaiements.map((mois, idx) => {
                                    const safeTotal = Number.isFinite(mois.montantTotal) ? mois.montantTotal : 0;
                                    const safePaye = Number.isFinite(mois.montantPaye) ? mois.montantPaye : 0;
                                    const rawHauteurTotal = (safeTotal / maxMontant) * 100;
                                    const rawHauteurPaye = (safePaye / maxMontant) * 100;
                                    const hauteurTotal = Number.isFinite(rawHauteurTotal) ? rawHauteurTotal : 0;
                                    const hauteurPaye = Number.isFinite(rawHauteurPaye) ? rawHauteurPaye : 0;
                                    const moisLabel = new Date(mois.mois + '-01').toLocaleDateString('fr-FR', { month: 'short' });
                                    const moisComplet = new Date(mois.mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                                    const reste = mois.montantTotal - mois.montantPaye;
                                    return (
                                        <div key={mois.mois} className="relative flex-1 flex flex-col items-center gap-0.5 min-w-[clamp(20px,3vw,40px)] group">
                                            {/* Barres */}
                                            <div className="w-full flex items-end gap-px" style={{ height: `clamp(60px, 10vw, 130px)` }}>
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${hauteurTotal}%` }}
                                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                                    className="flex-1 rounded-t-sm cursor-pointer"
                                                    style={{ backgroundColor: 'var(--color-bordure)', minWidth: '4px' }}
                                                />
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${hauteurPaye}%` }}
                                                    transition={{ duration: 0.5, delay: idx * 0.05 + 0.1 }}
                                                    className="flex-1 rounded-t-sm cursor-pointer"
                                                    style={{ backgroundColor: 'var(--color-success-500)', minWidth: '4px' }}
                                                />
                                            </div>
                                            {/* Tooltip au hover */}
                                            <div className="absolute z-10 hidden group-hover:block rounded-lg border px-2 py-1 text-xs shadow-lg pointer-events-none"
                                                style={{
                                                    backgroundColor: 'var(--color-surface)',
                                                    borderColor: 'var(--color-bordure)',
                                                    bottom: '100%',
                                                    marginBottom: '4px',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                <p className="font-semibold" style={{ color: 'var(--color-texte)' }}>{moisComplet}</p>
                                                <p style={{ color: 'var(--color-texte-muted)' }}>Total : {mois.montantTotal.toLocaleString('fr-FR')} FCFA</p>
                                                <p style={{ color: 'var(--color-success-600)' }}>Payé : {mois.montantPaye.toLocaleString('fr-FR')} FCFA</p>
                                                {reste > 0 && <p style={{ color: 'var(--color-warning-600)' }}>Reste : {reste.toLocaleString('fr-FR')} FCFA</p>}
                                                <p style={{ color: 'var(--color-texte-muted)' }}>{mois.nbFactures} facture(s)</p>
                                            </div>
                                            {/* Label mois */}
                                            <span className="text-xs truncate w-full text-center" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.55rem, 0.5rem + 0.2vw, 0.7rem)' }}>
                                                {moisLabel}
                                            </span>
                                            {/* Nb factures */}
                                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)', fontSize: 'clamp(0.5rem, 0.45rem + 0.15vw, 0.65rem)' }}>
                                                {mois.nbFactures}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Légende + stats */}
                        <div className="flex flex-wrap items-center gap-[var(--gap-md)] text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-bordure)' }} />
                                {t('etablissements.detail.finances.montantTotal', 'Montant total')}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--color-success-500)' }} />
                                {t('etablissements.detail.finances.montantPaye', 'Montant payé')}
                            </span>
                            <span>
                                {evolutionPaiements.length} {t('etablissements.detail.finances.moisDonnees', 'mois')} · {tauxEvo}% recouvré
                            </span>
                        </div>
                    </div>
                </SectionCard>
                );
            })()}

            {/* État vide — pas de données évolution */}
            {(!evolutionPaiements || evolutionPaiements.length === 0) && (
                <SectionCard title={t('etablissements.detail.finances.evolutionMensuelle', 'Évolution mensuelle (12 mois)')} icon={BarChart3} fullWidth>
                    <div className="flex flex-col items-center justify-center py-[var(--space-xl)] gap-[var(--space-sm)]">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                            <BarChart3 className="h-[var(--icon-lg)] w-[var(--icon-lg)]" style={{ color: 'var(--color-texte-muted)' }} />
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.aucuneEvolution', 'Aucune donnée de paiement sur les 12 derniers mois')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.finances.aucuneEvolutionHint', 'Les graphiques apparaîtront automatiquement dès la première facture enregistrée.')}
                        </p>
                    </div>
                </SectionCard>
            )}

            {/* ===== Section 2 — Abonnement ===== */}
            {config && (
                <SectionCard title={t('etablissements.detail.finances.abonnement', 'Abonnement')} icon={CreditCard}>
                    <InfoGrid>
                        <InfoField icon={CreditCard} label={t('etablissements.detail.config.plan', 'Plan')}
                            value={config.planAbonnement ? (PLAN_LABELS[config.planAbonnement] || config.planAbonnement) : undefined} />
                        <InfoField icon={Calendar} label={t('etablissements.detail.config.expiration', 'Expiration')}
                            value={config.dateExpirationAbonnement
                                ? new Date(config.dateExpirationAbonnement).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
                                : undefined} />
                        {finances?.abonnement?.montantMensuel !== undefined && (
                            <InfoField icon={DollarSign} label={t('etablissements.detail.finances.montantMensuel', 'Montant mensuel')}
                                value={`${finances.abonnement.montantMensuel.toLocaleString('fr-FR')} FCFA`} />
                        )}
                        {finances?.abonnement?.autoRenouvellement !== undefined && (
                            <InfoField icon={RefreshCw} label={t('etablissements.detail.finances.autoRenouvellement', 'Auto-renouvellement')}
                                value={finances.abonnement.autoRenouvellement ? 'Oui' : 'Non'} />
                        )}
                    </InfoGrid>
                </SectionCard>
            )}

            {/* ===== Section 3 — Historique des factures ===== */}
            <SectionCard title={t('etablissements.detail.finances.historique', 'Historique des factures')} icon={FileText} fullWidth>
                {factures.length > 0 ? (
                    <div className="space-y-[var(--space-sm)]">
                        {/* Tableau des factures */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--color-bordure)' }}>
                                        <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.numero', 'N°')}
                                        </th>
                                        <th className="text-left py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.dateEmission', 'Émission')}
                                        </th>
                                        <th className="text-right py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.montantTTC', 'Montant TTC')}
                                        </th>
                                        <th className="text-right py-2 px-2 text-xs font-medium hidden sm:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.montantPaye', 'Payé')}
                                        </th>
                                        <th className="text-center py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.statut', 'Statut')}
                                        </th>
                                        <th className="text-left py-2 px-2 text-xs font-medium hidden md:table-cell" style={{ color: 'var(--color-texte-muted)' }}>
                                            {t('etablissements.detail.finances.echeance', 'Échéance')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {factures.slice(0, 20).map((facture) => {
                                        const statutCfg = STATUT_FACTURE_LABELS[facture.statut] || STATUT_FACTURE_LABELS.BROUILLON;
                                        const reste = facture.montantTotal - facture.montantPaye;
                                        return (
                                            <tr key={facture.id} className="transition-colors hover:bg-[var(--color-surface-alt)]"
                                                style={{ borderBottom: '1px solid var(--color-bordure)' }}>
                                                <td className="py-2 px-2 text-xs font-medium" style={{ color: 'var(--color-texte)' }}>
                                                    {facture.numeroOHADA || facture.numero}
                                                </td>
                                                <td className="py-2 px-2 text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                                    {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                                                </td>
                                                <td className="py-2 px-2 text-xs text-right font-mono" style={{ color: 'var(--color-texte)' }}>
                                                    {facture.montantTotal.toLocaleString('fr-FR')}
                                                </td>
                                                <td className="py-2 px-2 text-xs text-right font-mono hidden sm:table-cell" style={{ color: reste <= 0 ? 'var(--color-success-600)' : 'var(--color-texte)' }}>
                                                    {facture.montantPaye.toLocaleString('fr-FR')}
                                                </td>
                                                <td className="py-2 px-2 text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statutCfg.bg} ${statutCfg.text}`}>
                                                        {statutCfg.label}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2 text-xs hidden md:table-cell" style={{ color: facture.dateEcheance && new Date(facture.dateEcheance) < new Date() && reste > 0 ? 'var(--color-danger-600)' : 'var(--color-texte-muted)' }}>
                                                    {facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {factures.length > 20 && (
                            <p className="text-xs text-center pt-2" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.finances.plusFactures', '{{count}} factures au total', { count: factures.length })}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                        {t('etablissements.detail.finances.aucuneFacture', 'Aucune facture enregistrée')}
                    </p>
                )}
            </SectionCard>
        </div>
    );
}
