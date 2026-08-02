import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Briefcase, FileText, TrendingUp } from 'lucide-react';
import { useEnseignantContrats, useEnseignantBulletins } from '../../hooks/use-personnel-detail';
import { MiniLineChart } from '@/components/charts/MiniLineChart';
import { SchoolLoading } from '@/components/feedback';
import { formatDate } from '@/lib/date-utils';
import { formatMontant } from '@/lib/format-utils';
import type { ContratPersonnel, BulletinPaie } from '../../types/personnel.types';

const LABELS_CONTRAT: Record<string, string> = {
    cdi: 'CDI', cdd: 'CDD', CDI: 'CDI', CDD: 'CDD',
    vacataire: 'Vacataire', stage: 'Stage',
};

const COULEURS_CONTRAT: Record<string, string> = {
    ACTIF: 'bg-success/10 text-success',
    EXPIRE: 'bg-muted text-muted-foreground',
    ROMPU: 'bg-destructive/10 text-destructive',
    RENEGOCIE: 'bg-primary/10 text-primary',
};

const STATUT_CONTRAT_LABEL: Record<string, string> = {
    ACTIF: 'detail.statutActif',
    EXPIRE: 'detail.statutExpire',
    ROMPU: 'detail.statutRompu',
    RENEGOCIE: 'detail.statutRenegocie',
};

const STATUT_BULLETIN_LABEL: Record<string, string> = {
    paye: 'detail.statutBulletin_paye',
    en_attente: 'detail.statutBulletin_en_attente',
};

const MOIS_CLE = [
    'jan', 'fev', 'mar', 'avr', 'mai', 'jun',
    'jul', 'aou', 'sep', 'oct', 'nov', 'dec',
] as const;

export function OngletContrat({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { t } = useTranslation('personnel');
    const contrats = useEnseignantContrats(enseignantId);
    const bulletins = useEnseignantBulletins(enseignantId);

    const contratsData = isActive ? (contrats.data ?? []) : [];
    const bulletinsData = isActive ? (bulletins.data ?? []) : [];

    const salaireEvolution = useMemo(() => {
        return bulletinsData
            .map((b: BulletinPaie) => ({
                label: `${t(`mois.${MOIS_CLE[b.mois - 1]}`)} ${b.annee}`,
                value: b.salaireNet,
                _sortKey: b.annee * 100 + b.mois,
            }))
            .sort((a, b) => a._sortKey - b._sortKey)
            .map(({ _sortKey, ...rest }) => rest);
    }, [bulletinsData, t]);

    if ((contrats.isLoading || bulletins.isLoading) && isActive) {
        return <SchoolLoading variant="compact" message={t('detail.chargementContrats')} />;
    }

    return (
        <div className="space-y-6">
            {salaireEvolution.length > 1 && (
                <div className="rounded-xl border border-border bg-card p-5">
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                        <TrendingUp className="h-5 w-5 text-success" />
                        {t('detail.evolutionSalaireNet')}
                    </h3>
                    <MiniLineChart data={salaireEvolution} height={200} color="var(--color-success)" />
                </div>
            )}

            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {t('detail.contrats')}
                </h3>
                {contratsData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t('detail.aucunContratEnregistre')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-secondary">{t('detail.colType')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colMode')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colDebut')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colFin')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colSalaire')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colStatut')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {contratsData.map((c: ContratPersonnel) => (
                                    <tr key={c.id} className="hover:bg-muted/80">
                                        <td className="px-4 py-3 font-medium">
                                            {LABELS_CONTRAT[c.typeContrat] || c.typeContrat}
                                        </td>
                                        <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                                            {t(`modes.${c.modeRemuneration?.code}`) || c.modeRemuneration?.label || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center text-foreground">{formatDate(c.dateDebut)}</td>
                                        <td className="px-4 py-3 text-center text-foreground">{c.dateFin ? formatDate(c.dateFin) : '—'}</td>
                                        <td className="px-4 py-3 text-center font-semibold text-foreground">
                                            {c.salaireBase != null ? formatMontant(c.salaireBase) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COULEURS_CONTRAT[c.statut] || 'bg-muted text-foreground'}`}>
                                                {STATUT_CONTRAT_LABEL[c.statut] ? t(STATUT_CONTRAT_LABEL[c.statut]) : c.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                    <FileText className="h-5 w-5 text-success" />
                    {t('detail.bulletinsPaie')}
                </h3>
                {bulletinsData.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t('detail.aucunBulletinEmis')}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-secondary">{t('detail.colPeriode')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.salaireBaseLabel')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colPrimes')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colRetenues')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.netAPayer')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-secondary">{t('detail.colStatut')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {bulletinsData.map((b: BulletinPaie) => (
                                    <tr key={b.id} className="hover:bg-muted/80">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {t(`mois.${MOIS_CLE[b.mois - 1]}`)} {b.annee}
                                        </td>
                                        <td className="px-4 py-3 text-center text-foreground">{formatMontant(b.salaireBase)}</td>
                                        <td className="px-4 py-3 text-center text-success font-medium">+{formatMontant(b.primes)}</td>
                                        <td className="px-4 py-3 text-center text-destructive font-medium">-{formatMontant(b.deductions)}</td>
                                        <td className="px-4 py-3 text-center font-bold text-foreground">{formatMontant(b.salaireNet)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.statut === 'paye' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                                {STATUT_BULLETIN_LABEL[b.statut] ? t(STATUT_BULLETIN_LABEL[b.statut]) : b.statut}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
