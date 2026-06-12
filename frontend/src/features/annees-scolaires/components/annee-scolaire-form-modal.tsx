/**
 * ==================================
 * eLISAschool - Formulaire Année Scolaire
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useCreerAnneeScolaire, useModifierAnneeScolaire } from '../hooks/use-annees-scolaires';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { AnneeScolaire, CreerAnneeScolaireDto } from '../types/annee-scolaire.types';

interface AnneeScolaireFormModalProps {
    mode: 'creation' | 'edition';
    annee?: AnneeScolaire;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AnneeScolaireFormModal({ mode, annee, onSuccess, onCancel }: AnneeScolaireFormModalProps) {
    const creerAnnee = useCreerAnneeScolaire();
    const modifierAnnee = useModifierAnneeScolaire();
    const isLoading = creerAnnee.isPending || modifierAnnee.isPending;

    const [formData, setFormData] = useState<Partial<CreerAnneeScolaireDto>>({
        libelle: annee?.libelle || '',
        code: annee?.code || '',
        dateDebut: annee?.dateDebut?.split('T')[0] || '',
        dateFin: annee?.dateFin?.split('T')[0] || '',
        statut: annee?.statut || 'future',
        estActuelle: annee?.estActuelle || false,
    });

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (annee && mode === 'edition') {
            setFormData({
                libelle: annee.libelle,
                code: annee.code,
                dateDebut: annee.dateDebut?.split('T')[0],
                dateFin: annee.dateFin?.split('T')[0],
                statut: annee.statut,
                estActuelle: annee.estActuelle,
            });
        }
    }, [annee, mode]);

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.libelle?.trim()) {
            nouvellesErreurs.libelle = 'Le libellé est requis';
        }

        if (!formData.code?.trim()) {
            nouvellesErreurs.code = 'Le code est requis';
        }

        if (!formData.dateDebut) {
            nouvellesErreurs.dateDebut = 'La date de début est requise';
        }

        if (!formData.dateFin) {
            nouvellesErreurs.dateFin = 'La date de fin est requise';
        }

        if (formData.dateDebut && formData.dateFin) {
            const debut = new Date(formData.dateDebut);
            const fin = new Date(formData.dateFin);
            
            if (fin <= debut) {
                nouvellesErreurs.dateFin = 'La date de fin doit être après la date de début';
            }
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valider()) return;

        try {
            if (mode === 'creation') {
                await creerAnnee.mutateAsync(formData as CreerAnneeScolaireDto);
            } else if (annee) {
                await modifierAnnee.mutateAsync({
                    id: annee.id,
                    ...formData,
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire année scolaire:', error);
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

    // Calcul automatique du libellé si vide
    const handleDateChange = (field: string, value: string) => {
        handleChange(field, value);
        
        // Auto-générer le libellé si les deux dates sont renseignées
        if (field === 'dateDebut' || field === 'dateFin') {
            const newData = { ...formData, [field]: value };
            if (newData.dateDebut && newData.dateFin && !formData.libelle) {
                const anneeDebut = newData.dateDebut.split('-')[0];
                const anneeFin = newData.dateFin.split('-')[0];
                handleChange('libelle', `Année scolaire ${anneeDebut}-${anneeFin}`);
                handleChange('code', `${anneeDebut}-${anneeFin}`);
            }
        }
    };

    const titre = mode === 'creation' ? 'Créer une année scolaire' : 'Modifier l\'année scolaire';

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={titre}
            description="Définissez les dates et le statut de l'année scolaire"
            size="2xl"
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
                        {mode === 'creation' ? 'Créer' : 'Enregistrer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Libellé et Code */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Libellé"
                        value={formData.libelle || ''}
                        onChange={(value) => handleChange('libelle', value)}
                        erreur={erreurs.libelle}
                        placeholder="Ex: Année scolaire 2024-2025"
                        required
                    />
                    <ElisaInput
                        label="Code"
                        value={formData.code || ''}
                        onChange={(value) => handleChange('code', value)}
                        erreur={erreurs.code}
                        placeholder="Ex: 2024-2025"
                        required
                    />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Date de début"
                        type="date"
                        value={formData.dateDebut || ''}
                        onChange={(value) => handleDateChange('dateDebut', value)}
                        erreur={erreurs.dateDebut}
                        required
                    />
                    <ElisaInput
                        label="Date de fin"
                        type="date"
                        value={formData.dateFin || ''}
                        onChange={(value) => handleDateChange('dateFin', value)}
                        erreur={erreurs.dateFin}
                        required
                    />
                </div>

                {/* Statut */}
                <ElisaSelect
                    label="Statut"
                    value={formData.statut || 'future'}
                    onChange={(value) => handleChange('statut', value)}
                    options={[
                        { value: 'active', label: 'Active' },
                        { value: 'inactive', label: 'Inactive' },
                        { value: 'future', label: 'Future' },
                        { value: 'archivee', label: 'Archivée' },
                    ]}
                />

                {/* Année actuelle */}
                <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <input
                        type="checkbox"
                        id="estActuelle"
                        checked={formData.estActuelle || false}
                        onChange={(e) => handleChange('estActuelle', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="estActuelle" className="text-sm font-medium text-blue-900 cursor-pointer">
                        Définir comme année scolaire actuelle
                    </label>
                </div>

                {/* Informations */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                        <strong>ℹ️ Information :</strong> Si vous définissez cette année comme "actuelle", 
                        l'année scolaire actuelle sera automatiquement désactivée.
                    </p>
                </div>
            </form>
        </CustomModal>
    );
}
