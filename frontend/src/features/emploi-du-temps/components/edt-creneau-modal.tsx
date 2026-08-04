/**
 * ==================================
 * eLISAschool - Modal Édition CréneauHoraire
 * ==================================
 * 3 étapes :
 *  1. Identification (matière, enseignant, type)
 *  2. Planification (jour, heures, salle)
 *  3. Résumé + validation conflits temps réel
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Calendar, Clock, MapPin, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, Trash2, ShieldCheck } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';
import type { CreneauHoraire, JourSemaine, TypeCreneau, DonneesVerification } from '../types/edt.types';
import { useVerifierConflits, useCreerCreneau, useUpdateCreneau, useSupprimerCreneau, useValiderCreneau } from '../hooks/use-emploi-du-temps';

interface AffectationOption {
    id: string;
    matiere?: { nom: string; code?: string };
    enseignant?: { nom: string; prenom: string };
}

interface SalleOption {
    id: string;
    nom: string;
    code?: string;
}

interface EDTCreneauModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    creneau?: CreneauHoraire | null;
    affectationMatiereId?: string;
    etablissementId: string;
    affectations?: AffectationOption[];
    salles?: SalleOption[];
    onSuccess?: () => void;
}

const JOURS: JourSemaine[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const TYPES_CRENEAU: TypeCreneau[] = ['COURS', 'TD', 'TP', 'RECREATION', 'PERMANENCE', 'ETUDE', 'AUTRE'];

interface FormData {
    affectationMatiereId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    typeCreneau: TypeCreneau;
    salleId: string;
    notes: string;
    couleur: string;
    genereAutomatiquement: boolean;
}

const FORM_INIT: FormData = {
    affectationMatiereId: '',
    jour: 'LUNDI',
    heureDebut: '08:00',
    heureFin: '09:00',
    typeCreneau: 'COURS',
    salleId: '',
    notes: '',
    couleur: '',
    genereAutomatiquement: true,
};

export function EDTCreneauModal({ open, onOpenChange, creneau, affectationMatiereId, etablissementId: _etablissementId, affectations = [], salles = [], onSuccess }: EDTCreneauModalProps) {
    const { t } = useTranslation('emplois');
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormData>(FORM_INIT);
    const [confirmSuppression, setConfirmSuppression] = useState(false);

    const verifierConflits = useVerifierConflits();
    const creerCreneau = useCreerCreneau();
    const updateCreneau = useUpdateCreneau();
    const supprimerCreneau = useSupprimerCreneau();
    const validerCreneau = useValiderCreneau();

    const isEdit = !!creneau;
    const estPlanifie = creneau?.statut === 'PLANIFIE';

    // Initialiser le formulaire
    useEffect(() => {
        if (open) {
            if (creneau) {
                setForm({
                    affectationMatiereId: creneau.affectationMatiereId,
                    jour: creneau.jour,
                    heureDebut: creneau.heureDebut,
                    heureFin: creneau.heureFin,
                    typeCreneau: creneau.typeCreneau,
                    salleId: creneau.salleId ?? '',
                    notes: creneau.notes ?? '',
                    couleur: creneau.couleur ?? '',
                    genereAutomatiquement: creneau.genereAutomatiquement ?? true,
                });
            } else {
                setForm({ ...FORM_INIT, affectationMatiereId: affectationMatiereId ?? '' });
            }
            setStep(1);
        }
    }, [open, creneau, affectationMatiereId]);

    // Vérification conflits en temps réel (étape 2)
    const conflits = useMemo(() => {
        return verifierConflits.data ?? [];
    }, [verifierConflits.data]);

    const hasConflitsBloquants = conflits.some(c => c.severite === 'BLOQUANT');

    useEffect(() => {
        if (step === 2 && form.affectationMatiereId && form.jour && form.heureDebut && form.heureFin) {
            const donnees: DonneesVerification = {
                affectationMatiereId: form.affectationMatiereId,
                jour: form.jour,
                heureDebut: form.heureDebut,
                heureFin: form.heureFin,
                salleId: form.salleId || undefined,
                excludeCreneauId: creneau?.id,
            };
            verifierConflits.mutate(donnees);
        }
    }, [step, form.affectationMatiereId, form.jour, form.heureDebut, form.heureFin, form.salleId, creneau?.id]);

    const handleSubmit = () => {
        if (!form.affectationMatiereId) {
            toast.error(t('creneau.modal.erreurAffectationRequise'));
            setStep(1);
            return;
        }
        const dto = {
            affectationMatiereId: form.affectationMatiereId,
            jour: form.jour,
            heureDebut: form.heureDebut,
            heureFin: form.heureFin,
            typeCreneau: form.typeCreneau,
            salleId: form.salleId || undefined,
            notes: form.notes || undefined,
            couleur: form.couleur || undefined,
            ...(isEdit ? {} : { genereAutomatiquement: form.genereAutomatiquement }),
        };

        if (isEdit && creneau) {
            updateCreneau.mutate(
                { id: creneau.id, ...dto },
                {
                    onSuccess: () => { onOpenChange(false); onSuccess?.(); },
                    onError: (err: unknown) => {
                        const e = err as { code?: string; message?: string };
                        if (e?.code === 'CONFLITS_PROPAGATION' && e.message) {
                            toast.error(e.message);
                        }
                    },
                }
            );
        } else {
            creerCreneau.mutate(dto, {
                onSuccess: () => { onOpenChange(false); onSuccess?.(); }
            });
        }
    };

    const update = (partial: Partial<FormData>) => setForm(prev => ({ ...prev, ...partial }));

    /** Validation par étape — empêche navigation et soumission si champs requis absents */
    const etapeValidee = (etape: number): boolean => {
        if (etape === 1) return !!form.affectationMatiereId;
        if (etape === 2) return !!form.heureDebut && !!form.heureFin;
        return true;
    };

    const avancer = () => {
        if (!etapeValidee(step)) {
            if (step === 1 && !form.affectationMatiereId) {
                toast.error(t('creneau.modal.erreurAffectationRequise'));
            }
            return;
        }
        setStep(s => Math.min(3, s + 1));
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEdit ? t('creneau.modal.titreModifier') : t('creneau.modal.titreCreer')}
            description={t('creneau.modal.description', { step })}
            size="2xl"
        >
            <div className="space-y-6">
                {/* Stepper */}
                <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3].map(s => (
                        <button
                            key={s}
                            onClick={() => { if (s <= step || etapeValidee(step)) setStep(s); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                s === step
                                    ? 'bg-[var(--color-dominant-600)] text-white'
                                    : s < step
                                    ? 'bg-success/20 text-success'
                                    : !etapeValidee(step) && s > step
                                    ? 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
                                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]'
                            }`}
                        >
                            {s < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                            {t(`creneau.modal.etape${s}`)}
                        </button>
                    ))}
                </div>

                {/* Étape 1 : Identification */}
                {step === 1 && (
                    <div className="space-y-4">
                        <SectionSeparator title={t('creneau.modal.identification')} icon={<BookOpen className="h-4 w-4" />} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    {t('creneau.modal.affectation')}
                                </label>
                                <select
                                    value={form.affectationMatiereId}
                                    onChange={e => update({ affectationMatiereId: e.target.value })}
                                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                >
                                    <option value="">{t('creneau.modal.selectionnerAffectation')}</option>
                                    {affectations.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.matiere?.nom ?? a.id.substring(0, 8)}
                                            {a.enseignant ? ` — ${a.enseignant.prenom} ${a.enseignant.nom}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    {t('creneau.modal.typeCreneau')}
                                </label>
                                <select
                                    value={form.typeCreneau}
                                    onChange={e => update({ typeCreneau: e.target.value as TypeCreneau })}
                                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                >
                                    {TYPES_CRENEAU.map(type => (
                                        <option key={type} value={type}>{t(`creneau.types.${type.toLowerCase()}`)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                {t('creneau.modal.couleur')}
                            </label>
                            <input
                                type="color"
                                value={form.couleur || '#3b82f6'}
                                onChange={e => update({ couleur: e.target.value })}
                                className="h-10 w-20 rounded-lg border border-[var(--color-border)] cursor-pointer"
                            />
                        </div>

                        <div className="md:col-span-2 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="genere-automatiquement"
                                checked={form.genereAutomatiquement}
                                onChange={e => update({ genereAutomatiquement: e.target.checked })}
                                className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                            />
                            <label htmlFor="genere-automatiquement" className="text-sm text-[var(--color-text-primary)] cursor-pointer">
                                {t('creneau.modal.genereAutomatiquement')}
                            </label>
                        </div>
                    </div>
                )}

                {/* Étape 2 : Planification */}
                {step === 2 && (
                    <div className="space-y-4">
                        <SectionSeparator title={t('creneau.modal.planification')} icon={<Calendar className="h-4 w-4" />} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    {t('creneau.modal.jour')}
                                </label>
                                <select
                                    value={form.jour}
                                    onChange={e => update({ jour: e.target.value as JourSemaine })}
                                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                >
                                    {JOURS.map(j => (
                                        <option key={j} value={j}>{t(`jours.${j.toLowerCase()}`)}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    {t('creneau.modal.salle')}
                                </label>
                                <select
                                    value={form.salleId}
                                    onChange={e => update({ salleId: e.target.value })}
                                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                >
                                    <option value="">{t('creneau.modal.aucuneSalle')}</option>
                                    {salles.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.nom}{s.code ? ` (${s.code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    <Clock className="inline h-3.5 w-3.5 mr-1" />
                                    {t('creneau.modal.heureDebut')}
                                </label>
                                <input
                                    type="time"
                                    value={form.heureDebut}
                                    onChange={e => update({ heureDebut: e.target.value })}
                                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                    <Clock className="inline h-3.5 w-3.5 mr-1" />
                                    {t('creneau.modal.heureFin')}
                                </label>
                                <input
                                    type="time"
                                    value={form.heureFin}
                                    onChange={e => update({ heureFin: e.target.value })}
                                    className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                />
                            </div>
                        </div>

                        {/* Conflits détectés */}
                        {conflits.length > 0 && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    {t('creneau.modal.conflitsDetectes', { count: conflits.length })}
                                </div>
                                {conflits.map((c, i) => (
                                    <div key={i} className={`text-xs ${c.severite === 'BLOQUANT' ? 'text-destructive' : 'text-warning'}`}>
                                        {c.severite === 'BLOQUANT' ? '🔴' : '🟠'} {c.message}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Étape 3 : Résumé */}
                {step === 3 && (
                    <div className="space-y-4">
                        <SectionSeparator title={t('creneau.modal.resume')} icon={<CheckCircle2 className="h-4 w-4" />} />

                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-secondary)]">{t('creneau.modal.jour')} :</span>
                                <span className="font-medium">{t(`jours.${form.jour.toLowerCase()}`)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-secondary)]">{t('creneau.modal.horaire')} :</span>
                                <span className="font-mono font-medium">{form.heureDebut} — {form.heureFin}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-secondary)]">{t('creneau.modal.typeCreneau')} :</span>
                                <span className="font-medium">{t(`creneau.types.${form.typeCreneau.toLowerCase()}`)}</span>
                            </div>
                            {form.salleId && (
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">{t('creneau.modal.salle')} :</span>
                                    <span className="font-medium flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" /> {form.salleId.substring(0, 8)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {hasConflitsBloquants && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                                <AlertTriangle className="inline h-4 w-4 mr-1" />
                                {t('creneau.modal.conflitsBloquants')}
                            </div>
                        )}

                        {conflits.filter(c => c.severite === 'AVERTISSEMENT').length > 0 && (
                            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                                <AlertTriangle className="inline h-4 w-4 mr-1" />
                                {t('creneau.modal.avertissements', { count: conflits.filter(c => c.severite === 'AVERTISSEMENT').length })}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                {t('creneau.modal.notes')}
                            </label>
                            <textarea
                                value={form.notes}
                                onChange={e => update({ notes: e.target.value })}
                                rows={3}
                                className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                                placeholder={t('creneau.modal.notesPlaceholder')}
                            />
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-2">
                        {isEdit && estPlanifie && (
                            <ElisaButton
                                variant="secondary"
                                onClick={async () => {
                                    if (!creneau) return;
                                    await validerCreneau.mutateAsync(creneau.id);
                                    onSuccess?.();
                                }}
                                disabled={validerCreneau.isPending}
                            >
                                <ShieldCheck className="h-4 w-4 mr-1" /> {t('valider')}
                            </ElisaButton>
                        )}
                        {isEdit && (
                            <ElisaButton
                                variant="danger"
                                onClick={() => setConfirmSuppression(true)}
                                disabled={supprimerCreneau.isPending}
                            >
                                <Trash2 className="h-4 w-4 mr-1" /> {t('supprimer')}
                            </ElisaButton>
                        )}
                        <ElisaButton
                            variant="ghost"
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> {t('precedent')}
                        </ElisaButton>
                    </div>

                    {step < 3 ? (
                        <ElisaButton variant="primary" onClick={avancer}>
                            {t('suivant')} <ChevronRight className="h-4 w-4 ml-1" />
                        </ElisaButton>
                    ) : (
                        <ElisaButton
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={hasConflitsBloquants || creerCreneau.isPending || updateCreneau.isPending}
                        >
                            {isEdit ? t('modifier') : t('creer')}
                        </ElisaButton>
                    )}
                </div>
            </div>

            {/* Q2 : confirmation suppression — avertissement instances futures annulées */}
            <ConfirmationModal
                isOpen={confirmSuppression}
                title={t('propagation.supprimerTitre')}
                message={t('propagation.supprimerMessage')}
                details={t('propagation.supprimerDetails')}
                variant="danger"
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                isLoading={supprimerCreneau.isPending}
                onConfirm={async () => {
                    if (!creneau) return;
                    await supprimerCreneau.mutateAsync(creneau.id);
                    setConfirmSuppression(false);
                    onOpenChange(false);
                    onSuccess?.();
                }}
                onCancel={() => setConfirmSuppression(false)}
            />
        </CustomModal>
    );
}
