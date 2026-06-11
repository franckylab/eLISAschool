/**
 * ==================================
 * eLISAschool - Formulaire Matière
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useCreerMatiere, useModifierMatiere } from '../hooks/use-matieres';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { Matiere, CreerMatiereDto } from '../types/matiere.types';

interface MatiereFormModalProps {
    mode: 'creation' | 'edition';
    matiere?: Matiere;
    onSuccess: () => void;
    onCancel: () => void;
}

export function MatiereFormModal({ mode, matiere, onSuccess, onCancel }: MatiereFormModalProps) {
    const { t } = useTranslation('matieres');
    const creerMatiere = useCreerMatiere();
    const modifierMatiere = useModifierMatiere();
    const isLoading = creerMatiere.isPending || modifierMatiere.isPending;

    const [formData, setFormData] = useState<Partial<CreerMatiereDto>>({
        nom: matiere?.nom || '',
        code: matiere?.code || '',
        description: matiere?.description || '',
        coefficient: matiere?.coefficient || 1,
        couleur: matiere?.couleur || '#3B82F6',
        statut: matiere?.statut || 'actif',
        nombreHeures: matiere?.nombreHeures || 0,
        programme: matiere?.programme || '',
    });

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (matiere && mode === 'edition') {
            setFormData({
                nom: matiere.nom,
                code: matiere.code,
                description: matiere.description,
                coefficient: matiere.coefficient,
                couleur: matiere.couleur,
                statut: matiere.statut,
                nombreHeures: matiere.nombreHeures,
                programme: matiere.programme,
            });
        }
    }, [matiere, mode]);

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.nom?.trim()) {
            nouvellesErreurs.nom = 'Le nom de la matière est requis';
        }

        if (!formData.code?.trim()) {
            nouvellesErreurs.code = 'Le code de la matière est requis';
        }

        if ((formData.coefficient || 0) < 0.5) {
            nouvellesErreurs.coefficient = 'Le coefficient doit être ≥ 0.5';
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valider()) return;

        try {
            if (mode === 'creation') {
                await creerMatiere.mutateAsync(formData as CreerMatiereDto);
            } else if (matiere) {
                await modifierMatiere.mutateAsync({
                    id: matiere.id,
                    ...formData,
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire matière:', error);
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
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {mode === 'creation' ? 'Créer une matière' : 'Modifier la matière'}
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
                    {/* Nom et Code */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput
                            label="Nom de la matière"
                            value={formData.nom || ''}
                            onChange={(value) => handleChange('nom', value)}
                            erreur={erreurs.nom}
                            placeholder="Ex: Mathématiques"
                            required
                        />
                        <ElisaInput
                            label="Code"
                            value={formData.code || ''}
                            onChange={(value) => handleChange('code', value)}
                            erreur={erreurs.code}
                            placeholder="Ex: MATH"
                            required
                        />
                    </div>

                    {/* Coefficient et Nombre d'heures */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput
                            label="Coefficient"
                            type="number"
                            value={formData.coefficient?.toString() || '1'}
                            onChange={(value) => handleChange('coefficient', parseFloat(value))}
                            erreur={erreurs.coefficient}
                            min="0.5"
                            max="10"
                            step="0.5"
                        />
                        <ElisaInput
                            label="Nombre d'heures/semaine"
                            type="number"
                            value={formData.nombreHeures?.toString() || '0'}
                            onChange={(value) => handleChange('nombreHeures', parseInt(value))}
                            min="0"
                            max="20"
                        />
                    </div>

                    {/* Couleur et Statut */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Couleur
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={formData.couleur || '#3B82F6'}
                                    onChange={(e) => handleChange('couleur', e.target.value)}
                                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <span className="text-sm text-gray-600 font-mono">
                                    {formData.couleur || '#3B82F6'}
                                </span>
                            </div>
                        </div>
                        <ElisaSelect
                            label="Statut"
                            value={formData.statut || 'actif'}
                            onChange={(value) => handleChange('statut', value)}
                            options={[
                                { value: 'actif', label: 'Actif' },
                                { value: 'inactif', label: 'Inactif' },
                            ]}
                        />
                    </div>

                    {/* Description */}
                    <ElisaInput
                        label="Description"
                        type="textarea"
                        value={formData.description || ''}
                        onChange={(value) => handleChange('description', value)}
                        placeholder="Description optionnelle de la matière..."
                        rows={3}
                    />

                    {/* Programme */}
                    <ElisaInput
                        label="Programme"
                        type="textarea"
                        value={formData.programme || ''}
                        onChange={(value) => handleChange('programme', value)}
                        placeholder="Contenu du programme..."
                        rows={3}
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
                            {mode === 'creation' ? 'Créer' : 'Enregistrer'}
                        </ElisaButton>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
