import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BookOpen, CheckCircle, XCircle, Users, Clock, Plus,
    Edit, Trash2, Filter, LayoutList, Columns3, CalendarDays,
} from 'lucide-react';
import { useEnseignantAffectationsMatiere, useCreerAffectationEnseignant, useModifierAffectationEnseignant, useSupprimerAffectationEnseignant, useToggleActifAffectation } from '../../hooks/use-personnel-detail';
import { AffectationFormModal } from './affectation-form-modal';
import { OngletMatieresKanban } from './onglet-matieres-kanban';
import { OngletMatieresPlanning } from './onglet-matieres-planning';
import { LoadingState } from '@/components/feedback';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Badge } from '@/components/ui/Badge';
import type { AffectationEnseignant, AffectationPayload } from '../../types/personnel.types';
import { formatVolumeMinutesToHours } from '@/lib/format-utils';
import { formatDate } from '@/lib/date-utils';

export function OngletMatieres({ enseignantId, isActive }: { enseignantId: string; isActive: boolean }) {
    const { t } = useTranslation('personnel');
    const { data, isLoading } = useEnseignantAffectationsMatiere(enseignantId);
    const affectations = isActive ? (data ?? []) : [];

    const creerAffectation = useCreerAffectationEnseignant();
    const modifierAffectation = useModifierAffectationEnseignant();
    const supprimerAffectation = useSupprimerAffectationEnseignant();
    const toggleActif = useToggleActifAffectation();

    const [mode, setMode] = useState<'table' | 'kanban' | 'planning'>('table');
    const [formOpen, setFormOpen] = useState(false);
    const [editingAffectation, setEditingAffectation] = useState<AffectationEnseignant | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<AffectationEnseignant | null>(null);
    const [filterClasse, setFilterClasse] = useState<string>('');

    const filtered = useMemo(() => {
        if (!filterClasse) return affectations;
        return affectations.filter(a => a.classeAnnee?.classe?.nom === filterClasse);
    }, [affectations, filterClasse]);

    const classesUniques = useMemo(() => {
        const set = new Set<string>();
        affectations.forEach(a => { if (a.classeAnnee?.classe?.nom) set.add(a.classeAnnee.classe.nom); });
        return Array.from(set).sort();
    }, [affectations]);

    const totalEffectif = affectations.reduce((s, a) => s + (a.effectifActuel ?? 0), 0);
    const totalVolMinutes = affectations.reduce((s, a) => s + (a.volumeHoraireHebdo ?? 0), 0);
    const minutesMax = 24 * 60;
    const tauxCharge = Math.min(totalVolMinutes / minutesMax, 1);

    const handleAdd = () => {
        setEditingAffectation(null);
        setFormOpen(true);
    };

    const handleEdit = (a: AffectationEnseignant) => {
        setEditingAffectation(a);
        setFormOpen(true);
    };

    const handleSave = async (payload: AffectationPayload) => {
        try {
            if (editingAffectation) {
                await modifierAffectation.mutateAsync({
                    id: editingAffectation.id,
                    enseignantId,
                    dateDebut: payload.dateDebut,
                    dateFin: payload.dateFin,
                    actif: payload.actif,
                    coefficient: payload.coefficient,
                });
            } else {
                await creerAffectation.mutateAsync(payload);
            }
            setFormOpen(false);
        } catch { /* handled by hooks */ }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await supprimerAffectation.mutateAsync({ id: deleteTarget.id, enseignantId });
            setDeleteTarget(null);
        } catch { /* handled by hooks */ }
    };

    const handleToggleActif = async (a: AffectationEnseignant) => {
        try {
            await toggleActif.mutateAsync({ id: a.id, actif: !a.actif, enseignantId });
        } catch { /* handled by hooks */ }
    };

    const isPending = creerAffectation.isPending || modifierAffectation.isPending || supprimerAffectation.isPending || toggleActif.isPending;

    if (isLoading && isActive) {
        return <div className="py-12"><LoadingState message={t('affectations.chargementMatières', 'Chargement des matières...')} /></div>;
    }

    return (
        <div className="space-y-5">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label={t('affectations.matieres', 'Matières')} value={affectations.length} tone="primary" />
                <MiniStat label={t('affectations.classes', 'Classes')} value={classesUniques.length} tone="secondary" />
                <MiniStat label={t('affectations.effectifTotal', 'Effectif total')} value={totalEffectif} tone="success" />
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-medium text-muted-foreground">{t('affectations.chargeHoraire', 'Charge horaire')}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{formatVolumeMinutesToHours(totalVolMinutes)}</span>
                        <span className="text-sm text-muted-foreground">/ 24h</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                tauxCharge > 0.85 ? 'bg-destructive' : tauxCharge > 0.65 ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${tauxCharge * 100}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {tauxCharge > 0.85 ? t('affectations.chargeElevee', 'Charge élevée') : tauxCharge > 0.65 ? t('affectations.chargeModeree', 'Charge modérée') : t('affectations.chargeNormale', 'Charge normale')}
                    </p>
                </div>
            </div>

            {/* View toggle + Actions bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                    <div className="flex overflow-hidden rounded-lg border border-border">
                        <button
                            onClick={() => setMode('table')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                                mode === 'table' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <LayoutList className="h-4 w-4" /> {t('affectations.vueTableau', 'Tableau')}
                        </button>
                        <button
                            onClick={() => setMode('kanban')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                                mode === 'kanban' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <Columns3 className="h-4 w-4" /> {t('affectations.vueKanban', 'Kanban')}
                        </button>
                        <button
                            onClick={() => setMode('planning')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors ${
                                mode === 'planning' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                            }`}
                        >
                            <CalendarDays className="h-4 w-4" /> {t('affectations.vuePlanning', 'Planning')}
                        </button>
                    </div>
                    {mode === 'table' && (
                        <>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select
                                value={filterClasse}
                                onChange={(e) => setFilterClasse(e.target.value)}
                                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground"
                            >
                                <option value="">{t('affectations.toutesClasses', 'Toutes les classes')}</option>
                                {classesUniques.map((nom) => (
                                    <option key={nom} value={nom}>{nom}</option>
                                ))}
                            </select>
                            <span className="text-xs text-muted-foreground">
                                {filtered.length} / {affectations.length} {t('affectations.affectations', 'affectations')}
                            </span>
                        </>
                    )}
                </div>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleAdd}>
                    {t('affectations.ajouterMatiere', 'Ajouter une matière')}
                </ElisaButton>
            </div>

            {mode === 'planning' ? (
                <OngletMatieresPlanning
                    enseignantId={enseignantId}
                    isActive={isActive}
                />
            ) : mode === 'table' ? (
                filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
                        <BookOpen className="mb-3 h-12 w-12 text-muted-foreground/50" />
                        <p className="font-medium text-secondary">
                            {affectations.length === 0 ? t('affectations.aucuneMatiere', 'Aucune matière assignée') : t('affectations.aucuneMatiereFiltre', 'Aucune affectation pour ce filtre')}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {affectations.length === 0
                                ? t('affectations.aucuneMatiereDesc', 'Cliquez sur "Ajouter une matière" pour assigner un enseignement.')
                                : t('affectations.autreFiltre', 'Essayez un autre filtre.')}
                        </p>
                        {affectations.length === 0 && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleAdd} className="mt-4">
                                {t('affectations.ajouterMatiere', 'Ajouter une matière')}
                            </ElisaButton>
                        )}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-secondary">{t('affectations.colMatiere', 'Matière')}</th>
                                        <th className="px-4 py-3 text-left font-medium text-secondary">{t('affectations.colClasse', 'Classe')}</th>
                                        <th className="px-4 py-3 text-left font-medium text-secondary">{t('affectations.colAnneeScolaire', 'Année scolaire')}</th>
                                        <th className="px-4 py-3 text-center font-medium text-secondary">
                                            <span className="inline-flex items-center gap-1">
                                                {t('affectations.colCoeff', 'Coeff.')}
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium text-secondary">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {t('affectations.colVolume', 'Vol.')}
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium text-secondary">
                                            <span className="inline-flex items-center gap-1">
                                                <Users className="h-3 w-3" /> {t('affectations.colEffectif', 'Eff.')}
                                            </span>
                                        </th>
                                        <th className="px-4 py-3 text-center font-medium text-secondary">{t('affectations.colPeriode', 'Période')}</th>
                                        <th className="px-4 py-3 text-center font-medium text-secondary">{t('affectations.colStatut', 'Statut')}</th>
                                        <th className="px-4 py-3 text-center font-medium text-secondary">{t('affectations.colActions', 'Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filtered.map((a: AffectationEnseignant) => (
                                        <tr key={a.id} className={`hover:bg-muted/50 transition-colors ${!a.actif ? 'opacity-60' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: a.matiere?.couleur || '#6b7280' }}
                                                    />
                                                    <span className="font-medium">{a.matiere?.nom || a.matiereId.slice(0, 8)}</span>
                                                    {a.matiere?.code && (
                                                        <span className="font-mono text-xs text-muted-foreground">({a.matiere.code})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-foreground">{a.classeAnnee?.classe?.nom || '-'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{a.classeAnnee?.anneeScolaire?.libelle || '-'}</td>
                                            <td className="px-4 py-3 text-center font-semibold">
                                                <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                                    {a.coefficient ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-foreground">{a.volumeHoraireHebdo != null ? formatVolumeMinutesToHours(a.volumeHoraireHebdo) : '—'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-foreground">{a.effectifActuel ?? '—'}</td>
                                            <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                                                <span className="whitespace-nowrap">{a.dateDebut ? formatDate(a.dateDebut, 'MMM yyyy') : '-'}</span>
                                                {a.dateFin && (
                                                    <span className="whitespace-nowrap"> → {formatDate(a.dateFin, 'MMM yyyy')}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {a.actif ? (
                                                    <Badge variant="success" dot>{t('affectations.actif', 'Actif')}</Badge>
                                                ) : (
                                                    <Badge variant="secondary" dot>{t('affectations.inactif', 'Inactif')}</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(a)}
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                                        title={t('affectations.modifier', 'Modifier')}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActif(a)}
                                                        className={`rounded-lg p-1.5 transition-colors ${
                                                            a.actif
                                                                ? 'text-muted-foreground hover:bg-warning/10 hover:text-warning'
                                                                : 'text-success hover:bg-success/10 hover:text-success'
                                                        }`}
                                                        title={a.actif ? t('affectations.desactiver', 'Désactiver') : t('affectations.activer', 'Activer')}
                                                    >
                                                        {a.actif ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(a)}
                                                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                        title={t('affectations.supprimer', 'Supprimer')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : (
                <OngletMatieresKanban
                    enseignantId={enseignantId}
                    isActive={isActive}
                    onRequestAdd={handleAdd}
                />
            )}

            {/* Form modal */}
            <AffectationFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                enseignantId={enseignantId}
                affectation={editingAffectation}
                onSave={handleSave}
                isLoading={isPending}
            />

            {/* Delete confirmation */}
            <ConfirmationModal
                isOpen={!!deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                isLoading={supprimerAffectation.isPending}
                title={t('affectations.supprimerAffectation', 'Supprimer l\'affectation')}
                message={
                    deleteTarget
                        ? t('affectations.confirmSuppression', 'Retirer {{matiere}} pour la classe {{classe}} ?', {
                            matiere: deleteTarget.matiere?.nom || t('affectations.cetteMatiere', 'cette matière'),
                            classe: deleteTarget.classeAnnee?.classe?.nom || '?',
                        })
                        : ''
                }
                variant="danger"
                confirmLabel={t('affectations.supprimer', 'Supprimer')}
            />
        </div>
    );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone: 'primary' | 'secondary' | 'success' | 'warning' }) {
    const toneClasses: Record<string, string> = {
        primary: 'bg-primary/5 text-primary border-primary/20',
        secondary: 'bg-secondary/5 text-secondary-foreground border-secondary/20',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
    };
    return (
        <div className={`rounded-xl border p-4 ${toneClasses[tone] || toneClasses.primary}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
    );
}