/**
 * ==================================
 * eLISAschool - Formulaire Personnel
 * ==================================
 * Version: 3.0.0
 *
 * NOTE: Poste, Fonction, Type de contrat et rémunération sont gérés
 * via l'interface contrat (ContratWizardModal). Ce formulaire ne
 * gère que les informations d'identité et de contact du membre.
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useCreerPersonnel, useModifierPersonnel, useMembrePersonnel } from '../hooks/use-personnel';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { LoadingState } from '@/components/feedback';
import type { MembrePersonnel, CreerPersonnelDto } from '../types/personnel.types';

interface PersonnelFormModalProps {
    mode: 'creation' | 'edition';
    membre?: MembrePersonnel;
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
    specialite: (m?: MembrePersonnel) => m?.specialite || m?.specialites?.[0] || m?.specialitePrincipale || '',
    qualification: (m?: MembrePersonnel) => m?.qualification || m?.educationNiveau || m?.diplomes || '',
    dateEntree: (m?: MembrePersonnel) => m?.dateEntree?.split('T')[0] || (m?.dateEmbauche ? new Date(m.dateEmbauche).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
};

function buildFormData<M extends MembrePersonnel | undefined>(m: M): Partial<CreerPersonnelDto> {
    return {
        nom: m?.utilisateur?.profil?.nom || m?.nom || '',
        prenom: m?.utilisateur?.profil?.prenom || m?.prenom || '',
        dateNaissance: (m?.utilisateur?.profil?.dateNaissance || m?.dateNaissance)?.split('T')[0] || '',
        sexe: formNormalizer.sexe(m?.utilisateur?.profil?.genre || m?.sexe),
        email: m?.utilisateur?.email || m?.email || '',
        telephone: m?.utilisateur?.profil?.telephone || m?.telephone || '',
        adresse: m?.utilisateur?.profil?.adresse || m?.adresse || '',
        dateEntree: formNormalizer.dateEntree(m),
        statut: formNormalizer.statut(m?.statut),
        specialite: formNormalizer.specialite(m),
        qualification: formNormalizer.qualification(m),
    };
}

export function PersonnelFormModal({ mode, membre, onSuccess, onCancel }: PersonnelFormModalProps) {
    const creerPersonnel = useCreerPersonnel();
    const modifierPersonnel = useModifierPersonnel();
    const isMutating = creerPersonnel.isPending || modifierPersonnel.isPending;

    const editId = mode === 'edition' ? membre?.id ?? '' : '';
    const { data: apiResponse, isLoading: isFetching } = useMembrePersonnel(editId);
    const apiData = apiResponse?.data;
    const source = mode === 'edition' && apiData ? apiData : membre;

    const [formData, setFormData] = useState<Partial<CreerPersonnelDto>>(buildFormData(source));

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(buildFormData(source));
    }, [source, mode]);

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.nom?.trim()) {
            nouvellesErreurs.nom = 'Le nom est requis';
        }

        if (!formData.prenom?.trim()) {
            nouvellesErreurs.prenom = 'Le prénom est requis';
        }

        if (!formData.dateNaissance) {
            nouvellesErreurs.dateNaissance = 'La date de naissance est requise';
        }

        if (!formData.dateEntree) {
            nouvellesErreurs.dateEntree = 'La date d\'entrée est requise';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nouvellesErreurs.email = 'Format d\'email invalide';
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valider()) return;

        try {
            if (mode === 'creation') {
                await creerPersonnel.mutateAsync(formData as CreerPersonnelDto);
            } else if (source) {
                await modifierPersonnel.mutateAsync({
                    id: source.id,
                    ...formData,
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire personnel:', error);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field]) {
            setErreurs(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const titre = mode === 'creation' ? 'Ajouter un membre du personnel' : 'Modifier le membre du personnel';

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={titre}
            description="Renseignez les informations du membre du personnel"
            size="3xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onCancel} type="button">
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        type="submit"
                        isLoading={isMutating}
                        icon={<Save className="h-4 w-4" />}
                    >
                        {mode === 'creation' ? 'Ajouter' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            {isFetching ? (
                <div className="py-12"><LoadingState message="Chargement des données..." /></div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identité */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Nom"
                        value={formData.nom || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nom', e.target.value)}
                        error={erreurs.nom}
                        placeholder="Nom de famille"
                        required
                    />
                    <ElisaInput
                        label="Prénom"
                        value={formData.prenom || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('prenom', e.target.value)}
                        error={erreurs.prenom}
                        placeholder="Prénom"
                        required
                    />
                </div>

                {/* Date de naissance et Sexe */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Date de naissance"
                        type="date"
                        value={formData.dateNaissance || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dateNaissance', e.target.value)}
                        error={erreurs.dateNaissance}
                        required
                    />
                    <ElisaSelect
                        label="Sexe"
                        value={formData.sexe || 'M'}
                        onValueChange={(value: string) => handleChange('sexe', value)}
                        options={[
                            { value: 'M', label: 'Masculin' },
                            { value: 'F', label: 'Féminin' },
                        ]}
                    />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
                        error={erreurs.email}
                        placeholder="email@exemple.com"
                    />
                    <ElisaInput
                        label="Téléphone"
                        value={formData.telephone || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('telephone', e.target.value)}
                        placeholder="+237 6XX XXX XXX"
                    />
                </div>

                {/* Adresse et Statut */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">Adresse</label>
                        <textarea
                            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                            value={formData.adresse || ''}
                            onChange={(e) => handleChange('adresse', e.target.value)}
                            placeholder="Adresse complète..."
                            rows={2}
                        />
                    </div>
                    <ElisaSelect
                        label="Statut"
                        value={formData.statut || 'actif'}
                        onValueChange={(value: string) => handleChange('statut', value)}
                        options={[
                            { value: 'actif', label: 'Actif' },
                            { value: 'inactif', label: 'Inactif' },
                            { value: 'en_conge', label: 'En congé' },
                            { value: 'demission', label: 'Démission' },
                        ]}
                    />
                </div>

                {/* Date d'entrée */}
                <ElisaInput
                    label="Date d'entrée"
                    type="date"
                    value={formData.dateEntree || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('dateEntree', e.target.value)}
                    error={erreurs.dateEntree}
                    required
                />

                {/* Qualification et Spécialité */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Qualification"
                        value={formData.qualification || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('qualification', e.target.value)}
                        placeholder="Ex: Master, Licence..."
                    />
                    <ElisaInput
                        label="Spécialité"
                        value={formData.specialite || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('specialite', e.target.value)}
                        placeholder="Ex: Mathématiques, Français..."
                    />
                </div>
            </form>
            )}
        </CustomModal>
    );
}
