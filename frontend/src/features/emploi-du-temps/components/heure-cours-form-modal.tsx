import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Trash2, RefreshCw } from 'lucide-react';
import { useCreateHeureCours, useUpdateHeureCours, useDeleteHeureCours } from '../hooks/use-heure-cours';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useMatieres } from '@/features/matieres/hooks/use-matieres';
import { useSalles } from '@/features/salles/hooks/use-salles';
import { usePersonnel } from '@/features/personnel/hooks/use-personnel';
import type { CategorieFonction } from '@/lib/categorie-fonction';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { InlineSpinner } from '@/components/feedback';
import type { HeureCours } from '../hooks/use-heure-cours';

interface HeureCoursFormModalProps {
    mode: 'creation' | 'edition';
    enseignantId: string;
    cours?: HeureCours;
    onSuccess: () => void;
    onCancel: () => void;
}

const STATUT_VALUES = [
    { value: 'PLANIFIE', labelKey: 'heuresCours.planifie' },
    { value: 'EFFECTUE', labelKey: 'heuresCours.effectue' },
    { value: 'ANNULE', labelKey: 'heuresCours.annule' },
    { value: 'REMPLACE', labelKey: 'heuresCours.remplace' },
];

interface FormData {
    date: string;
    heureDebut: string;
    heureFin: string;
    classeAnneeId: string;
    matiereId: string;
    statutEffectue: string;
    salle: string;
    remplacantId: string;
    commentaire: string;
    mettreAJourCreneau: boolean;
}

const emptyForm: FormData = {
    date: '',
    heureDebut: '',
    heureFin: '',
    classeAnneeId: '',
    matiereId: '',
    statutEffectue: 'PLANIFIE',
    salle: '',
    remplacantId: '',
    commentaire: '',
    mettreAJourCreneau: false,
};

export function HeureCoursFormModal({ mode, enseignantId, cours, onSuccess, onCancel }: HeureCoursFormModalProps) {
    const { t } = useTranslation('personnel');
    const createMutation = useCreateHeureCours();
    const updateMutation = useUpdateHeureCours();
    const deleteMutation = useDeleteHeureCours();
    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    const { data: classesData } = useClasses({ limit: 100, actif: true });
    const { data: matieresData } = useMatieres({ limit: 100, actif: true });
    const { data: salles } = useSalles();
    const { data: enseignantsData } = usePersonnel({ categorie: 'ENSEIGNANT' as CategorieFonction, limit: 100, actif: true });

    const classesOptions = useMemo(() => {
        const items = classesData?.items ?? [];
        return items
            .filter(c => c.classeAnneeId)
            .map(c => ({ value: c.classeAnneeId!, label: `${c.code} — ${c.nom}` }));
    }, [classesData]);

    const matieresOptions = useMemo(() => {
        const items = matieresData?.items ?? [];
        return items.map(m => ({ value: m.id, label: m.nom }));
    }, [matieresData]);

    const sallesOptions = useMemo(() => {
        return (salles?.data ?? []).map(s => ({ value: s.id, label: `${s.nom} (${s.code})` }));
    }, [salles]);

    const enseignantsOptions = useMemo(() => {
        const items = enseignantsData?.items ?? [];
        return items
            .filter(e => e.id !== enseignantId)
            .map(e => {
                const prenom = e.utilisateur?.profil?.prenom ?? '';
                const nom = e.utilisateur?.profil?.nom ?? '';
                return { value: e.id, label: `${prenom} ${nom}`.trim() || e.matricule };
            });
    }, [enseignantsData, enseignantId]);

    const [form, setForm] = useState<FormData>(emptyForm);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        if (mode === 'edition' && cours) {
            setForm({
                date: cours.date?.split('T')[0] || '',
                heureDebut: cours.heureDebut || '',
                heureFin: cours.heureFin || '',
                classeAnneeId: cours.classeAnneeId || '',
                matiereId: cours.matiereId || '',
                statutEffectue: cours.statutEffectue || 'PLANIFIE',
                salle: cours.salleId || '',
                remplacantId: cours.remplacantId || '',
                commentaire: cours.commentaire || '',
                mettreAJourCreneau: false,
            });
        } else {
            setForm(emptyForm);
        }
    }, [mode, cours]);

    const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async () => {
        const payload: Partial<HeureCours> & { mettreAJourCreneau?: boolean } = {
            date: form.date,
            heureDebut: form.heureDebut,
            heureFin: form.heureFin,
            classeAnneeId: form.classeAnneeId,
            matiereId: form.matiereId,
            statutEffectue: form.statutEffectue as HeureCours['statutEffectue'],
            salleId: form.salle || undefined,
            remplacantId: form.remplacantId || undefined,
            commentaire: form.commentaire || undefined,
        };

        // Q6-C : case « mettre à jour aussi le créneau hebdo » — uniquement si l'instance
        // est liée à un créneau (jamais automatique).
        if (mode === 'edition' && cours?.creneauId && form.mettreAJourCreneau) {
            payload.mettreAJourCreneau = true;
        }

        if (mode === 'creation') {
            payload.enseignantId = enseignantId;
            createMutation.mutate(payload, { onSuccess });
        } else if (cours?.id) {
            updateMutation.mutate({ id: cours.id, ...payload }, { onSuccess });
        }
    };

    const handleDelete = () => {
        if (!confirmDelete) { setConfirmDelete(true); return; }
        if (cours?.id) {
            deleteMutation.mutate(cours.id, { onSuccess });
        }
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={mode === 'creation' ? t('heuresCours.ajouterCours') : t('heuresCours.modifierCours')}
            size="lg"
            footer={
                <div className="flex items-center justify-between w-full">
                    {mode === 'edition' && (
                        <ElisaButton
                            variant={confirmDelete ? 'danger' : 'outline'}
                            size="sm"
                            icon={<Trash2 className="h-4 w-4" />}
                            onClick={handleDelete}
                            disabled={isPending}
                        >
                            {confirmDelete ? t('heuresCours.confirmerSuppression') : t('detail.supprimer')}
                        </ElisaButton>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <ElisaButton variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
                            {t('form.annuler')}
                        </ElisaButton>
                        <ElisaButton size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSubmit} disabled={isPending || (form.statutEffectue === 'REMPLACE' && !form.remplacantId)} isLoading={isPending}>
                            {mode === 'creation' ? t('heuresCours.creer') : t('form.enregistrer')}
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {isPending && <InlineSpinner />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ElisaInput label={t('heuresCours.date')} type="date" value={form.date} onChange={set('date')} required />
                    <ElisaSelect label={t('statut')} value={form.statutEffectue} onValueChange={(v: string) => setForm(prev => ({ ...prev, statutEffectue: v }))} options={STATUT_VALUES.map(s => ({ value: s.value, label: t(s.labelKey) }))} />
                    <ElisaInput label={t('heuresCours.debut')} placeholder="08:00" value={form.heureDebut} onChange={set('heureDebut')} required />
                    <ElisaInput label={t('heuresCours.fin')} placeholder="09:00" value={form.heureFin} onChange={set('heureFin')} required />
                    <ElisaSelect label={t('heuresCours.classe')} value={form.classeAnneeId} onValueChange={(v: string) => setForm(prev => ({ ...prev, classeAnneeId: v }))} options={classesOptions} required />
                    <ElisaSelect label={t('heuresCours.matiere')} value={form.matiereId} onValueChange={(v: string) => setForm(prev => ({ ...prev, matiereId: v }))} options={matieresOptions} required />
                    <ElisaSelect label={t('heuresCours.salle')} value={form.salle} onValueChange={(v: string) => setForm(prev => ({ ...prev, salle: v }))} options={sallesOptions} />
                    <ElisaSelect label={t('heuresCours.remplacant')} value={form.remplacantId} onValueChange={(v: string) => setForm(prev => ({ ...prev, remplacantId: v }))} options={enseignantsOptions} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('heuresCours.commentaire')}</label>
                    <textarea
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)] min-h-[80px]"
                        value={form.commentaire}
                        onChange={set('commentaire')}
                        placeholder={t('heuresCours.placeholderCommentaire')}
                    />
                </div>

                {mode === 'edition' && cours?.creneauId && (
                    <label className="flex items-start gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 cursor-pointer hover:bg-[var(--color-surface-hover)]/50 transition-colors">
                        <input
                            type="checkbox"
                            checked={form.mettreAJourCreneau}
                            onChange={e => setForm(prev => ({ ...prev, mettreAJourCreneau: e.target.checked }))}
                            className="mt-0.5 h-4 w-4 accent-[var(--color-dominant-600)]"
                        />
                        <span className="text-sm">
                            <span className="flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                                <RefreshCw className="h-3.5 w-3.5" />
                                {t('heuresCours.mettreAJourCreneau')}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                                {t('heuresCours.mettreAJourCreneauAide')}
                            </span>
                        </span>
                    </label>
                )}

                {form.statutEffectue === 'REMPLACE' && !form.remplacantId && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                        {t('heuresCours.remplacantRequis')}
                    </div>
                )}
            </div>
        </CustomModal>
    );
}