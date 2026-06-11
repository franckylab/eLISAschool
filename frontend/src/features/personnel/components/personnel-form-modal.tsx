/**
 * ==================================
 * eLISAschool - Formulaire Personnel
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useCreerPersonnel, useModifierPersonnel } from '../hooks/use-personnel';
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
    const { t } = useTranslation('personnel');
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {mode === 'creation' ? 'Ajouter un membre du personnel' : 'Modifier le membre du personnel'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Identité */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput
                            label="Nom"
                            value={formData.nom || ''}
                            onChange={(value) => handleChange('nom', value)}
                            erreur={erreurs.nom}
                            placeholder="Nom de famille"
                            required
                        />
                        <ElisaInput
                            label="Prénom"
                            value={formData.prenom || ''}
                            onChange={(value) => handleChange('prenom', value)}
                            erreur={erreurs.prenom}
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
                            onChange={(value) => handleChange('dateNaissance', value)}
                            erreur={erreurs.dateNaissance}
                            required
                        />
                        <ElisaSelect
                            label="Sexe"
                            value={formData.sexe || 'M'}
                            onChange={(value) => handleChange('sexe', value)}
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
                            onChange={(value) => handleChange('email', value)}
                            erreur={erreurs.email}
                            placeholder="email@exemple.com"
                        />
                        <ElisaInput
                            label="Téléphone"
                            value={formData.telephone || ''}
                            onChange={(value) => handleChange('telephone', value)}
                            placeholder="+237 6XX XXX XXX"
                        />
                    </div>

                    {/* Poste et Département */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput
                            label="Poste"
                            value={formData.poste || ''}
                            onChange={(value) => handleChange('poste', value)}
                            erreur={erreurs.poste}
                            placeholder="Ex: Enseignant, Secrétaire..."
                            required
                        />
                        <ElisaInput
                            label="Département"
                            value={formData.departement || ''}
                            onChange={(value) => handleChange('departement', value)}
                            placeholder="Ex: Sciences, Administration..."
                        />
                    </div>

                    {/* Type de contrat et Statut */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect
                            label="Type de contrat"
                            value={formData.typeContrat || 'cdi'}
                            onChange={(value) => handleChange('typeContrat', value)}
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
                            onChange={(value) => handleChange('statut', value)}
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
                        onChange={(value) => handleChange('dateEntree', value)}
                        erreur={erreurs.dateEntree}
                        required
                    />

                    {/* Qualification et Spécialité */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput
                            label="Qualification"
                            value={formData.qualification || ''}
                            onChange={(value) => handleChange('qualification', value)}
                            placeholder="Ex: Master, Licence..."
                        />
                        <ElisaInput
                            label="Spécialité"
                            value={formData.specialite || ''}
                            onChange={(value) => handleChange('specialite', value)}
                            placeholder="Ex: Mathématiques, Français..."
                        />
                    </div>

                    {/* Adresse */}
                    <ElisaInput
                        label="Adresse"
                        type="textarea"
                        value={formData.adresse || ''}
                        onChange={(value) => handleChange('adresse', value)}
                        placeholder="Adresse complète..."
                        rows={2}
                    />

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <ElisaButton
                            variant="outline"
                            onClick={onCancel}
                            type="button"
                        >
                            Annuler
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            type="submit"
                            isLoading={isLoading}
                            icon={Save}
                        >
                            {mode === 'creation' ? 'Ajouter' : 'Enregistrer'}
                        </ElisaButton>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
