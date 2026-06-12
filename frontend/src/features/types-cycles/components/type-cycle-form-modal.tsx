/**
 * ==================================
 * eLISAschool - Modal Formulaire Type de Cycle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système unifié CustomModal
 */

import { useState, useEffect } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Save } from 'lucide-react';
import type { TypeCycle, CreerTypeCycleDto } from '../types/type-cycle.types';

interface TypeCycleFormModalProps {
    open: boolean;
    typeCycle: TypeCycle | null;
    onClose: () => void;
    onSubmit: (dto: CreerTypeCycleDto) => Promise<void>;
}

export function TypeCycleFormModal({
    open,
    typeCycle,
    onClose,
    onSubmit,
}: TypeCycleFormModalProps) {
    const isEditMode = !!typeCycle;

    const [nom, setNom] = useState(typeCycle?.nom || '');
    const [description, setDescription] = useState(typeCycle?.description || '');
    const [code, setCode] = useState(typeCycle?.code || '');
    const [dureeAnnees, setDureeAnnees] = useState(typeCycle?.dureeAnnees || 1);
    const [ordre, setOrdre] = useState(typeCycle?.ordre || 1);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-générer le code
    useEffect(() => {
        if (!isEditMode && nom && !code) {
            const generatedCode = nom
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '_')
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

        if (ordre < 1) {
            newErrors.ordre = "L'ordre doit être supérieur à 0";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        const dto: CreerTypeCycleDto = {
            nom,
            description: description || undefined,
            code: code || undefined,
            dureeAnnees: dureeAnnees || undefined,
            ordre,
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
            title={isEditMode ? 'Modifier le type de cycle' : 'Nouveau type de cycle'}
            description="Remplissez les informations du type de cycle"
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
                        placeholder="Ex: Primaire, Secondaire, Universitaire"
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
                        onChange={(e) => setCode(e.target.value.toLowerCase())}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent font-mono ${
                            errors.code ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="primaire"
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

                {/* Ordre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ordre <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={ordre}
                        onChange={(e) => setOrdre(parseInt(e.target.value) || 1)}
                        min={1}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent ${
                            errors.ordre ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1"
                    />
                    {errors.ordre && (
                        <p className="text-red-500 text-xs mt-1">{errors.ordre}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Ordre d'affichage dans l'interface
                    </p>
                </div>

                {/* Durée en années */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durée (années)
                    </label>
                    <input
                        type="number"
                        value={dureeAnnees}
                        onChange={(e) => setDureeAnnees(parseInt(e.target.value) || 1)}
                        min={1}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        placeholder="6"
                    />
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
                        placeholder="Description du type de cycle..."
                    />
                </div>
            </form>
        </CustomModal>
    );
}
