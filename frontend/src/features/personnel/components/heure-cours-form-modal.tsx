import { useState, useEffect } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { useCreateHeureCours, useUpdateHeureCours, useDeleteHeureCours } from '../hooks/use-heure-cours';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { LoadingState } from '@/components/feedback';
import type { HeureCours } from '../hooks/use-heure-cours';

interface HeureCoursFormModalProps {
    mode: 'creation' | 'edition';
    enseignantId: string;
    cours?: HeureCours;
    onSuccess: () => void;
    onCancel: () => void;
}

const STATUTS = [
    { value: 'PLANIFIE', label: 'Planifié' },
    { value: 'EFFECTUE', label: 'Effectué' },
    { value: 'ANNULE', label: 'Annulé' },
    { value: 'REMPLACE', label: 'Remplacé' },
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
};

export function HeureCoursFormModal({ mode, enseignantId, cours, onSuccess, onCancel }: HeureCoursFormModalProps) {
    const createMutation = useCreateHeureCours();
    const updateMutation = useUpdateHeureCours();
    const deleteMutation = useDeleteHeureCours();
    const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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
            });
        } else {
            setForm(emptyForm);
        }
    }, [mode, cours]);

    const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async () => {
        const payload: any = {
            date: form.date,
            heureDebut: form.heureDebut,
            heureFin: form.heureFin,
            classeAnneeId: form.classeAnneeId,
            matiereId: form.matiereId,
            statutEffectue: form.statutEffectue,
            salle: form.salle || undefined,
            remplacantId: form.remplacantId || undefined,
            commentaire: form.commentaire || undefined,
        };

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
            title={mode === 'creation' ? 'Ajouter un cours' : 'Modifier le cours'}
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
                            {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
                        </ElisaButton>
                    )}
                    <div className="flex gap-3 ml-auto">
                        <ElisaButton variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
                            Annuler
                        </ElisaButton>
                        <ElisaButton size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSubmit} disabled={isPending} isLoading={isPending}>
                            {mode === 'creation' ? 'Créer' : 'Enregistrer'}
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {isPending && <LoadingState />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ElisaInput label="Date" type="date" value={form.date} onChange={set('date')} required />
                    <ElisaSelect label="Statut" value={form.statutEffectue} onValueChange={(v: string) => setForm(prev => ({ ...prev, statutEffectue: v }))} options={STATUTS} />
                    <ElisaInput label="Début (HH:MM)" placeholder="08:00" value={form.heureDebut} onChange={set('heureDebut')} required />
                    <ElisaInput label="Fin (HH:MM)" placeholder="09:00" value={form.heureFin} onChange={set('heureFin')} required />
                    <ElisaInput label="Classe (UUID)" placeholder="ID de la classe-année" value={form.classeAnneeId} onChange={set('classeAnneeId')} required />
                    <ElisaInput label="Matière (UUID)" placeholder="ID de la matière" value={form.matiereId} onChange={set('matiereId')} required />
                    <ElisaInput label="Salle" placeholder="Nom ou ID de la salle" value={form.salle} onChange={set('salle')} />
                    <ElisaInput label="Remplaçant (UUID)" placeholder="ID du remplaçant" value={form.remplacantId} onChange={set('remplacantId')} />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
                    <textarea
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        value={form.commentaire}
                        onChange={set('commentaire')}
                        placeholder="Commentaire optionnel"
                    />
                </div>
            </div>
        </CustomModal>
    );
}