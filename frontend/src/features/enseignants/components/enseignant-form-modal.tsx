import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useCreerPersonnel, useModifierPersonnel } from '@/features/personnel/hooks/use-personnel';
import { useEnseignant } from '../hooks/use-enseignants';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { LoadingState } from '@/components/feedback';
import type { Enseignant } from '../types/enseignant.types';
import type { CreerPersonnelDto } from '@/features/personnel/types/personnel.types';

interface EnseignantFormModalProps {
    mode: 'creation' | 'edition';
    enseignant?: Enseignant;
    onSuccess: () => void;
    onCancel: () => void;
}

const formNormalizer = {
    statut: (v?: string) => {
        if (!v) return 'actif';
        const map: Record<string, string> = { ACTIF: 'actif', INACTIF: 'inactif', CONGE: 'en_conge', DEMISSION: 'demission' };
        return map[v] || v;
    },
    specialite: (e?: Enseignant) => e?.specialites?.[0] || e?.specialitePrincipale || '',
    diplomes: (e?: Enseignant) => e?.diplomes || '',
    dateEmbauche: (e?: Enseignant) => e?.dateEmbauche?.split('T')[0] || new Date().toISOString().split('T')[0],
};

function buildFormData(e: Enseignant | undefined): Partial<CreerPersonnelDto> & Record<string, any> {
    return {
        dateEmbauche: formNormalizer.dateEmbauche(e),
        statut: formNormalizer.statut(e?.statut),
        specialitePrincipale: formNormalizer.specialite(e),
        diplomes: formNormalizer.diplomes(e),
    };
}

export function EnseignantFormModal({ mode, enseignant, onSuccess, onCancel }: EnseignantFormModalProps) {
    const creerPersonnel = useCreerPersonnel();
    const modifierPersonnel = useModifierPersonnel();
    const isMutating = creerPersonnel.isPending || modifierPersonnel.isPending;

    const editId = mode === 'edition' ? enseignant?.id ?? '' : '';
    const { data: apiData, isLoading: isFetching } = useEnseignant(editId);
    const source = mode === 'edition' && apiData ? apiData : enseignant;

    const [formData, setFormData] = useState<Record<string, any>>(buildFormData(source));

    useEffect(() => {
        setFormData(buildFormData(source));
    }, [source]);

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};
        if (!formData.dateEmbauche) nouvellesErreurs.dateEmbauche = "La date d'entrée est requise";
        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!valider()) return;
        try {
            if (mode === 'creation') {
                await creerPersonnel.mutateAsync(formData as CreerPersonnelDto);
            } else if (source) {
                await modifierPersonnel.mutateAsync({ id: source.id, ...formData });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire enseignant:', error);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value } as Partial<CreerPersonnelDto>));
        if (erreurs[field]) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={mode === 'creation' ? 'Ajouter un enseignant' : "Modifier l'enseignant"}
            description="Renseignez les informations de l'enseignant"
            size="3xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onCancel} type="button">Annuler</ElisaButton>
                    <ElisaButton variant="primary" type="submit" isLoading={isMutating} icon={<Save className="h-4 w-4" />}>
                        {mode === 'creation' ? 'Ajouter' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            {isFetching ? (
                <div className="py-12"><LoadingState message="Chargement des données..." /></div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect label="Statut" value={formData.statut || 'actif'} onValueChange={(value) => handleChange('statut', value)} options={[
                            { value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' },
                            { value: 'en_conge', label: 'En congé' }, { value: 'demission', label: 'Démission' },
                        ]} />
                        <ElisaInput label="Date d'entrée" type="date" value={formData.dateEmbauche || ''} onChange={(e) => handleChange('dateEmbauche', e.target.value)} error={erreurs.dateEmbauche} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Spécialité" value={formData.specialitePrincipale || ''} onChange={(e) => handleChange('specialitePrincipale', e.target.value)} placeholder="Ex: Mathématiques, Français..." />
                        <ElisaInput label="Qualification" value={formData.diplomes || ''} onChange={(e) => handleChange('diplomes', e.target.value)} placeholder="Ex: Master, Licence..." />
                    </div>
                </form>
            )}
        </CustomModal>
    );
}
