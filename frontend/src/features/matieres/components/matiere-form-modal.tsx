/**
 * ==================================
 * eLISAschool - Formulaire Matière
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useCreerMatiere, useModifierMatiere } from '../hooks/use-matieres';
import { CustomModal } from '@/components/modals/CustomModal';
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

    const titre = mode === 'creation' ? 'Créer une matière' : 'Modifier la matière';

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onCancel(); }}
            title={titre}
            description="Renseignez les informations de la matière"
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
                {/* Nom et Code */}
                <div className="grid grid-cols-2 gap-4">
                    <ElisaInput
                        label="Nom de la matière"
                        value={formData.nom || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nom', e.target.value)}
                        error={erreurs.nom}
                        placeholder="Ex: Mathématiques"
                        required
                    />
                    <ElisaInput
                        label="Code"
                        value={formData.code || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('code', e.target.value)}
                        error={erreurs.code}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('coefficient', parseFloat(e.target.value))}
                        error={erreurs.coefficient}
                        min="0.5"
                        max="10"
                        step="0.5"
                    />
                    <ElisaInput
                        label="Nombre d'heures/semaine"
                        type="number"
                        value={formData.nombreHeures?.toString() || '0'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('nombreHeures', parseInt(e.target.value))}
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
                        onValueChange={(value: string) => handleChange('statut', value)}
                        options={[
                            { value: 'actif', label: 'Actif' },
                            { value: 'inactif', label: 'Inactif' },
                        ]}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">Description</label>
                    <textarea
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Description optionnelle de la matière..."
                        rows={3}
                    />
                </div>

                {/* Programme */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-texte)] mb-1">Programme</label>
                    <textarea
                        className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        value={formData.programme || ''}
                        onChange={(e) => handleChange('programme', e.target.value)}
                        placeholder="Contenu du programme..."
                        rows={3}
                    />
                </div>
            </form>
        </CustomModal>
    );
}
