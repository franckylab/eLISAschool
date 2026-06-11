/**
 * ==================================
 * eLISAschool - Formulaire Classe
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useCreerClasse, useModifierClasse } from '../hooks/use-classes';
import { useToutesAnneesScolaires } from '@/features/annees-scolaires/hooks/use-toutes-annees-scolaires';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useTousCycles } from '@/features/cycles/hooks/use-tous-cycles';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import type { Classe, CreerClasseDto } from '../types/classe.types';

interface ClasseFormModalProps {
    mode: 'creation' | 'edition';
    classe?: Classe;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ClasseFormModal({ mode, classe, onSuccess, onCancel }: ClasseFormModalProps) {
    const { t } = useTranslation('classes');
    const creerClasse = useCreerClasse();
    const modifierClasse = useModifierClasse();
    const isLoading = creerClasse.isPending || modifierClasse.isPending;

    const { data: anneesScolaires } = useToutesAnneesScolaires();
    const { data: niveaux } = useTousNiveaux();
    const { data: cycles } = useTousCycles();

    const [formData, setFormData] = useState<Partial<CreerClasseDto>>({
        nom: classe?.nom || '',
        code: classe?.code || '',
        niveau: classe?.niveau || '',
        cycle: classe?.cycle || '',
        capaciteMax: classe?.capaciteMax || 40,
        anneeScolaireId: classe?.anneeScolaireId || '',
        salle: classe?.salle || '',
        statut: classe?.statut || 'actif',
        principalId: classe?.principalId || '',
    });

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (classe && mode === 'edition') {
            setFormData({
                nom: classe.nom,
                code: classe.code,
                niveau: classe.niveau,
                cycle: classe.cycle,
                capaciteMax: classe.capaciteMax,
                anneeScolaireId: classe.anneeScolaireId,
                salle: classe.salle,
                statut: classe.statut,
                principalId: classe.principalId,
            });
        }
    }, [classe, mode]);

    const valider = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.nom?.trim()) {
            nouvellesErreurs.nom = 'Le nom de la classe est requis';
        }

        if (!formData.code?.trim()) {
            nouvellesErreurs.code = 'Le code de la classe est requis';
        }

        if (!formData.niveau) {
            nouvellesErreurs.niveau = 'Le niveau est requis';
        }

        if (!formData.anneeScolaireId) {
            nouvellesErreurs.anneeScolaireId = "L'année scolaire est requise";
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!valider()) return;

        try {
            if (mode === 'creation') {
                await creerClasse.mutateAsync(formData as CreerClasseDto);
            } else if (classe) {
                await modifierClasse.mutateAsync({
                    id: classe.id,
                    ...formData,
                });
            }
            onSuccess();
        } catch (error) {
            console.error('Erreur formulaire classe:', error);
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
                        {mode === 'creation' ? 'Créer une classe' : 'Modifier la classe'}
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
                            label="Nom de la classe"
                            value={formData.nom || ''}
                            onChange={(value) => handleChange('nom', value)}
                            erreur={erreurs.nom}
                            placeholder="Ex: 6ème A"
                            required
                        />
                        <ElisaInput
                            label="Code"
                            value={formData.code || ''}
                            onChange={(value) => handleChange('code', value)}
                            erreur={erreurs.code}
                            placeholder="Ex: 6A"
                            required
                        />
                    </div>

                    {/* Cycle et Niveau */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect
                            label="Cycle"
                            value={formData.cycle || ''}
                            onChange={(value) => handleChange('cycle', value)}
                            options={cycles?.map(c => ({ value: c.nom, label: c.nom })) || []}
                            placeholder="Sélectionner un cycle"
                        />
                        <ElisaSelect
                            label="Niveau"
                            value={formData.niveau || ''}
                            onChange={(value) => handleChange('niveau', value)}
                            erreur={erreurs.niveau}
                            options={niveaux?.map(n => ({ value: n.nom, label: n.nom })) || []}
                            placeholder="Sélectionner un niveau"
                            required
                        />
                    </div>

                    {/* Année scolaire et Salle */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect
                            label="Année scolaire"
                            value={formData.anneeScolaireId || ''}
                            onChange={(value) => handleChange('anneeScolaireId', value)}
                            erreur={erreurs.anneeScolaireId}
                            options={anneesScolaires?.map(a => ({
                                value: a.id,
                                label: `${a.nom} (${a.statut})`
                            })) || []}
                            placeholder="Sélectionner une année"
                            required
                        />
                        <ElisaInput
                            label="Salle"
                            value={formData.salle || ''}
                            onChange={(value) => handleChange('salle', value)}
                            placeholder="Ex: Salle 101"
                        />
                    </div>

                    {/* Capacité et Statut */}
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput
                            label="Capacité maximale"
                            type="number"
                            value={formData.capaciteMax?.toString() || '40'}
                            onChange={(value) => handleChange('capaciteMax', parseInt(value))}
                            min="1"
                            max="100"
                        />
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
