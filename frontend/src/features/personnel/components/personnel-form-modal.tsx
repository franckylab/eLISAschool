/**
 * ==================================
 * eLISAschool - Formulaire Personnel
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useCreerPersonnel, useModifierPersonnel } from '../hooks/use-personnel';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { MembrePersonnel, CreerPersonnelDto } from '../types/personnel.types';

interface PersonnelFormModalProps {
    mode: 'creation' | 'edition';
    membre?: MembrePersonnel;
    onSuccess: () => void;
    onCancel: () => void;
}

export function PersonnelFormModal({ mode, membre, onSuccess, onCancel }: PersonnelFormModalProps) {
    const creerPersonnel = useCreerPersonnel();
    const modifierPersonnel = useModifierPersonnel();
    const isLoading = creerPersonnel.isPending || modifierPersonnel.isPending;

    const [formData, setFormData] = useState<Partial<CreerPersonnelDto>>({
        nom: membre?.nom || '',
        prenom: membre?.prenom || '',
        dateNaissance: membre?.dateNaissance?.split('T')[0] || '',
        sexe: membre?.sexe || 'M',
        email: membre?.email || '',
        telephone: membre?.telephone || '',
        adresse: membre?.adresse || '',
        poste: membre?.poste || '',
        departement: membre?.departement || '',
        typeContrat: membre?.typeContrat || 'cdi',
        dateEntree: membre?.dateEntree?.split('T')[0] || new Date().toISOString().split('T')[0],
        statut: membre?.statut || 'actif',
        specialite: membre?.specialite || '',
        qualification: membre?.qualification || '',
    });

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (membre && mode === 'edition') {
            setFormData({
                nom: membre.nom,
                prenom: membre.prenom,
                dateNaissance: membre.dateNaissance?.split('T')[0],
                sexe: membre.sexe,
                email: membre.email,
                telephone: membre.telephone,
                adresse: membre.adresse,
                poste: membre.poste,
                departement: membre.departement,
                typeContrat: membre.typeContrat,
                dateEntree: membre.dateEntree?.split('T')[0],
                statut: membre.statut,
                specialite: membre.specialite,
                qualification: membre.qualification,
            });
        }
    }, [membre, mode]);

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

        if (!formData.poste?.trim()) {
            nouvellesErreurs.poste = 'Le poste est requis';
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
            } else if (membre) {
                await modifierPersonnel.mutateAsync({
                    id: membre.id,
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
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                        onClick={handleSubmit}
                    >
                        {mode === 'creation' ? 'Ajouter' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Identité */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Nom"
                        value={formData.nom || ''}
                        onChange={(value: any) => handleChange('nom', value)}
                        error={erreurs.nom}
                        placeholder="Nom de famille"
                        required
                    />
                    <ElisaInput
                        label="Prénom"
                        value={formData.prenom || ''}
                        onChange={(value: any) => handleChange('prenom', value)}
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
                        onChange={(value: any) => handleChange('dateNaissance', value)}
                        error={erreurs.dateNaissance}
                        required
                    />
                    <ElisaSelect
                        label="Sexe"
                        value={formData.sexe || 'M'}
                        onChange={(value: any) => handleChange('sexe', value)}
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
                        onChange={(value: any) => handleChange('email', value)}
                        error={erreurs.email}
                        placeholder="email@exemple.com"
                    />
                    <ElisaInput
                        label="Téléphone"
                        value={formData.telephone || ''}
                        onChange={(value: any) => handleChange('telephone', value)}
                        placeholder="+237 6XX XXX XXX"
                    />
                </div>

                {/* Poste et Département */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Poste"
                        value={formData.poste || ''}
                        onChange={(value: any) => handleChange('poste', value)}
                        error={erreurs.poste}
                        placeholder="Ex: Enseignant, Secrétaire..."
                        required
                    />
                    <ElisaInput
                        label="Département"
                        value={formData.departement || ''}
                        onChange={(value: any) => handleChange('departement', value)}
                        placeholder="Ex: Sciences, Administration..."
                    />
                </div>

                {/* Type de contrat et Statut */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaSelect
                        label="Type de contrat"
                        value={formData.typeContrat || 'cdi'}
                        onChange={(value: any) => handleChange('typeContrat', value)}
                        options={[
                            { value: 'cdi', label: 'CDI' },
                            { value: 'cdd', label: 'CDD' },
                            { value: 'vacataire', label: 'Vacataire' },
                            { value: 'stage', label: 'Stage' },
                        ]}
                    />
                    <ElisaSelect
                        label="Statut"
                        value={formData.statut || 'actif'}
                        onChange={(value: any) => handleChange('statut', value)}
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
                    onChange={(value: any) => handleChange('dateEntree', value)}
                    error={erreurs.dateEntree}
                    required
                />

                {/* Qualification et Spécialité */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Qualification"
                        value={formData.qualification || ''}
                        onChange={(value: any) => handleChange('qualification', value)}
                        placeholder="Ex: Master, Licence..."
                    />
                    <ElisaInput
                        label="Spécialité"
                        value={formData.specialite || ''}
                        onChange={(value: any) => handleChange('specialite', value)}
                        placeholder="Ex: Mathématiques, Français..."
                    />
                </div>

                {/* Adresse */}
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
            </form>
        </CustomModal>
    );
}
