/**
 * ==================================
 * eLISAschool - Modal Édition HeureCours
 * ==================================
 * Statut (effectué/annulé/remplacé), remplaçant, commentaire, salle override
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, User, MessageSquare, MapPin } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export type StatutEffectue = 'PLANIFIE' | 'EFFECTUE' | 'ANNULE' | 'REMPLACE';

interface HeureCours {
    id: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    enseignantId: string;
    classeAnneeId: string;
    matiereId: string;
    salleId?: string;
    statutEffectue: StatutEffectue;
    remplacantId?: string;
    commentaire?: string;
    creneauId?: string;
    etablissementId: string;
    enseignant?: { id: string; nom: string; prenom: string };
    matiere?: { id: string; nom: string };
    remplacant?: { id: string; nom: string; prenom: string };
}

interface EDTHeureCoursModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    heureCours?: HeureCours | null;
    onSuccess?: () => void;
}

const STATUTS: { value: StatutEffectue; label: string; color: string }[] = [
    { value: 'PLANIFIE', label: 'Planifié', color: 'bg-info/20 text-info' },
    { value: 'EFFECTUE', label: 'Effectué', color: 'bg-success/20 text-success' },
    { value: 'ANNULE', label: 'Annulé', color: 'bg-destructive/20 text-destructive' },
    { value: 'REMPLACE', label: 'Remplacé', color: 'bg-warning/20 text-warning' },
];

const FORM_INIT = {
    statutEffectue: 'PLANIFIE' as StatutEffectue,
    remplacantId: '',
    commentaire: '',
    salleId: '',
};

export function EDTHeureCoursModal({ open, onOpenChange, heureCours, onSuccess }: EDTHeureCoursModalProps) {
    const { t } = useTranslation('emplois');
    const qc = useQueryClient();
    const [form, setForm] = useState(FORM_INIT);

    const updateMutation = useMutation({
        mutationFn: async (dto: Partial<HeureCours> & { id: string }) => {
            const res = await apiClient.patch<{ data: HeureCours }>(`/api/personnel/heures-cours/${dto.id}`, dto);
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['emploi-du-temps'] });
            toast.success('Heure de cours mise à jour');
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });

    useEffect(() => {
        if (open && heureCours) {
            setForm({
                statutEffectue: heureCours.statutEffectue,
                remplacantId: heureCours.remplacantId ?? '',
                commentaire: heureCours.commentaire ?? '',
                salleId: heureCours.salleId ?? '',
            });
        } else if (open) {
            setForm(FORM_INIT);
        }
    }, [open, heureCours]);

    const handleSubmit = () => {
        if (!heureCours) return;
        updateMutation.mutate({
            id: heureCours.id,
            statutEffectue: form.statutEffectue,
            remplacantId: form.remplacantId || undefined,
            commentaire: form.commentaire || undefined,
            salleId: form.salleId || undefined,
        });
    };

    const update = (partial: Partial<typeof FORM_INIT>) => setForm(prev => ({ ...prev, ...partial }));

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('heureCours.modal.titre')}
            description={heureCours ? `${heureCours.matiere?.nom ?? ''} — ${heureCours.date}` : ''}
            size="lg"
        >
            <div className="space-y-6">
                {/* Statut */}
                <div>
                    <SectionSeparator title={t('heureCours.modal.statut')} icon={<CalendarCheck className="h-4 w-4" />} />
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {STATUTS.map(s => (
                            <button
                                key={s.value}
                                onClick={() => update({ statutEffectue: s.value })}
                                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                    form.statutEffectue === s.value
                                        ? `${s.color} border-current`
                                        : 'border-[var(--color-bordure)] text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-alt)]'
                                }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Remplaçant */}
                {form.statutEffectue === 'REMPLACE' && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                            <User className="inline h-3.5 w-3.5 mr-1" />
                            {t('heureCours.modal.remplacant')}
                        </label>
                        <input
                            type="text"
                            value={form.remplacantId}
                            onChange={e => update({ remplacantId: e.target.value })}
                            className="w-full rounded-lg border border-[var(--color-bordure)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-texte)]"
                            placeholder="ID du remplaçant"
                        />
                    </div>
                )}

                {/* Salle override */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                        <MapPin className="inline h-3.5 w-3.5 mr-1" />
                        {t('heureCours.modal.salleOverride')}
                    </label>
                    <input
                        type="text"
                        value={form.salleId}
                        onChange={e => update({ salleId: e.target.value })}
                        className="w-full rounded-lg border border-[var(--color-bordure)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-texte)]"
                        placeholder={t('heureCours.modal.sallePlaceholder')}
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{t('heureCours.modal.salleAide')}</p>
                </div>

                {/* Commentaire */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">
                        <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
                        {t('heureCours.modal.commentaire')}
                    </label>
                    <textarea
                        value={form.commentaire}
                        onChange={e => update({ commentaire: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-[var(--color-bordure)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-texte)]"
                        placeholder={t('heureCours.modal.commentairePlaceholder')}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-bordure)]">
                    <ElisaButton variant="ghost" onClick={() => onOpenChange(false)}>
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending}
                    >
                        {t('enregistrer')}
                    </ElisaButton>
                </div>
            </div>
        </CustomModal>
    );
}
