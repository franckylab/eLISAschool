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
    sexe: (v?: string) => v === 'MASCULIN' ? 'M' : v === 'FEMININ' ? 'F' : v || 'M',
    statut: (v?: string) => {
        if (!v) return 'actif';
        const map: Record<string, string> = { ACTIF: 'actif', INACTIF: 'inactif', CONGE: 'en_conge', DEMISSION: 'demission' };
        return map[v] || v;
    },
    specialite: (e?: Enseignant) => e?.specialite || e?.specialites?.[0] || e?.specialitePrincipale || '',
    qualification: (e?: Enseignant) => e?.qualification || e?.educationNiveau || e?.diplomes || '',
    dateEntree: (e?: Enseignant) => e?.dateEntree?.split('T')[0] || (e?.dateEmbauche ? new Date(e.dateEmbauche).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
};

function buildFormData(e: Enseignant | undefined): Partial<CreerPersonnelDto> {
    return {
        nom: e?.utilisateur?.profil?.nom || e?.nom || '',
        prenom: e?.utilisateur?.profil?.prenom || e?.prenom || '',
        dateNaissance: e?.utilisateur?.profil?.dateNaissance?.split('T')[0] || e?.dateNaissance || '',
        sexe: formNormalizer.sexe(e?.utilisateur?.profil?.genre) || e?.sexe || '',
        email: e?.utilisateur?.email || e?.email || '',
        telephone: e?.utilisateur?.profil?.telephone || e?.telephone || '',
        adresse: e?.utilisateur?.profil?.adresse || e?.adresse || '',
        dateEntree: formNormalizer.dateEntree(e),
        statut: formNormalizer.statut(e?.statut),
        specialite: formNormalizer.specialite(e),
        qualification: formNormalizer.qualification(e),
    };
}

export function EnseignantFormModal({ mode, enseignant, onSuccess, onCancel }: EnseignantFormModalProps) {
    const creerPersonnel = useCreerPersonnel();
    const modifierPersonnel = useModifierPersonnel();
    const isMutating = creerPersonnel.isPending || modifierPersonnel.isPending;

    const editId = mode === 'edition' ? enseignant?.id ?? '' : '';
    const { data: apiData, isLoading: isFetching } = useEnseignant(editId);
    const source = mode === 'edition' && apiData ? apiData : enseignant;

    const [formData, setFormData] = useState<Partial<CreerPersonnelDto>>(buildFormData(source));

    useEffect(() => {
        setFormData(buildFormData(source));
    }, [source]);

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};
        if (!formData.nom?.trim()) nouvellesErreurs.nom = 'Le nom est requis';
        if (!formData.prenom?.trim()) nouvellesErreurs.prenom = 'Le prénom est requis';
        if (!formData.dateNaissance) nouvellesErreurs.dateNaissance = 'La date de naissance est requise';
        if (!formData.dateEntree) nouvellesErreurs.dateEntree = "La date d'entrée est requise";
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nouvellesErreurs.email = "Format d'email invalide";
        }
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
                        <ElisaInput label="Nom" value={formData.nom || ''} onChange={(e) => handleChange('nom', e.target.value)} error={erreurs.nom} placeholder="Nom de famille" required />
                        <ElisaInput label="Prénom" value={formData.prenom || ''} onChange={(e) => handleChange('prenom', e.target.value)} error={erreurs.prenom} placeholder="Prénom" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Date de naissance" type="date" value={formData.dateNaissance || ''} onChange={(e) => handleChange('dateNaissance', e.target.value)} error={erreurs.dateNaissance} required />
                        <ElisaSelect label="Sexe" value={formData.sexe || 'M'} onValueChange={(value) => handleChange('sexe', value)} options={[
                            { value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' },
                        ]} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Email" type="email" value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} error={erreurs.email} placeholder="email@exemple.com" />
                        <ElisaInput label="Téléphone" value={formData.telephone || ''} onChange={(e) => handleChange('telephone', e.target.value)} placeholder="+237 6XX XXX XXX" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Spécialité" value={formData.specialite || ''} onChange={(e) => handleChange('specialite', e.target.value)} placeholder="Ex: Mathématiques, Français..." />
                        <ElisaInput label="Qualification" value={formData.qualification || ''} onChange={(e) => handleChange('qualification', e.target.value)} placeholder="Ex: Master, Licence..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Date d'entrée" type="date" value={formData.dateEntree || ''} onChange={(e) => handleChange('dateEntree', e.target.value)} error={erreurs.dateEntree} required />
                        <ElisaSelect label="Statut" value={formData.statut || 'actif'} onValueChange={(value) => handleChange('statut', value)} options={[
                            { value: 'actif', label: 'Actif' }, { value: 'inactif', label: 'Inactif' },
                            { value: 'en_conge', label: 'En congé' }, { value: 'demission', label: 'Démission' },
                        ]} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">Adresse</label>
                        <textarea className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent" value={formData.adresse || ''} onChange={(e) => handleChange('adresse', e.target.value)} placeholder="Adresse complète..." rows={2} />
                    </div>
                </form>
            )}
        </CustomModal>
    );
}
