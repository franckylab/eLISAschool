/**
 * ==================================
 * eLISAschool - Modal Formulaire Groupe d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système unifié CustomModal
 */

import { useState, useEffect } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Save, Building2, Check, X } from 'lucide-react';
import type { GroupeEtablissement, CreerGroupeEtablissementDto } from '../types/groupe-etablissement.types';

interface EtablissementOption {
    id: string;
    nom: string;
    code: string;
}

interface GroupeEtablissementFormModalProps {
    open: boolean;
    groupe: GroupeEtablissement | null;
    onClose: () => void;
    onSubmit: (dto: CreerGroupeEtablissementDto) => Promise<void>;
    etablissementsDisponibles?: EtablissementOption[];
}

export function GroupeEtablissementFormModal({
    open,
    groupe,
    onClose,
    onSubmit,
    etablissementsDisponibles = [],
}: GroupeEtablissementFormModalProps) {
    const isEditMode = !!groupe;

    const [nom, setNom] = useState(groupe?.nom || '');
    const [description, setDescription] = useState(groupe?.description || '');
    const [code, setCode] = useState(groupe?.code || '');
    const [selectedEtabIds, setSelectedEtabIds] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-générer le code
    useEffect(() => {
        if (!isEditMode && nom && !code) {
            const generatedCode = nom
                .toUpperCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^A-Z0-9]+/g, '_')
                .replace(/^_|_$/g, '');
            setCode(generatedCode);
        }
    }, [nom, code, isEditMode]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!nom.trim()) {
            newErrors.nom = 'Le nom est requis';
        }

        if (!code.trim()) {
            newErrors.code = 'Le code est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        const dto: CreerGroupeEtablissementDto = {
            nom,
            description: description || undefined,
            code: code || undefined,
            etablissementIds: selectedEtabIds.length > 0 ? selectedEtabIds : undefined,
        };

        try {
            await onSubmit(dto);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={isEditMode ? 'Modifier le groupe' : 'Nouveau groupe d\'établissements'}
            description="Remplissez les informations ci-dessous"
            size="2xl"
            footer={<>
                <ElisaButton variant="outline" onClick={onClose} disabled={isSubmitting}>
                    Annuler
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    icon={<Save className="h-4 w-4" />}
                >
                    {isEditMode ? 'Enregistrer' : 'Créer'}
                </ElisaButton>
            </>}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent ${
                            errors.nom ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Ex: Groupe Scolaire Africain"
                        autoFocus
                    />
                    {errors.nom && (
                        <p className="text-red-500 text-xs mt-1">{errors.nom}</p>
                    )}
                </div>

                {/* Code */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent font-mono ${
                            errors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="GROUPE_SCOLAIRE_AFRICAIN"
                    />
                    {errors.code && (
                        <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                    )}
                    {!isEditMode && (
                        <p className="text-xs text-gray-500 mt-1">
                            Généré automatiquement si vide
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        placeholder="Description du groupe d'établissements..."
                    />
                </div>

                {/* Sélection d'établissements (uniquement en création) */}
                {!isEditMode && etablissementsDisponibles.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Établissements à ajouter au groupe (optionnel)
                        </label>
                        <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                            {etablissementsDisponibles.map((etab) => {
                                const isSelected = selectedEtabIds.includes(etab.id);
                                return (
                                    <button
                                        key={etab.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedEtabIds(prev =>
                                                prev.includes(etab.id)
                                                    ? prev.filter(id => id !== etab.id)
                                                    : [...prev, etab.id]
                                            );
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${
                                            isSelected
                                                ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-500" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900">{etab.nom}</p>
                                                <code className="text-xs text-gray-500 font-mono">{etab.code}</code>
                                            </div>
                                        </div>
                                        {isSelected ? (
                                            <Check className="h-4 w-4 text-[var(--color-dominante)]" />
                                        ) : (
                                            <X className="h-4 w-4 text-gray-300" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedEtabIds.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                {selectedEtabIds.length} établissement(s) sélectionné(s)
                            </p>
                        )}
                    </div>
                )}
            </form>
        </CustomModal>
    );
}
