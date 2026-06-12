/**
 * ==================================
 * eLISAschool - Modal Formulaire Programme Pédagogique
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
import type { ProgrammePedagogique, CreerProgrammeDto } from '../types/programme.types';

interface ProgrammeFormModalProps {
    open: boolean;
    programme: ProgrammePedagogique | null;
    onClose: () => void;
    onSubmit: (dto: CreerProgrammeDto) => Promise<void>;
}

export function ProgrammeFormModal({
    open,
    programme,
    onClose,
    onSubmit,
}: ProgrammeFormModalProps) {
    const isEditMode = !!programme;

    const [nom, setNom] = useState(programme?.nom || '');
    const [description, setDescription] = useState(programme?.description || '');
    const [code, setCode] = useState(programme?.code || '');
    const [cycleId, setCycleId] = useState(programme?.cycleId || '');
    const [niveauId, setNiveauId] = useState(programme?.niveauId || '');
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        const dto: CreerProgrammeDto = {
            nom,
            description: description || undefined,
            code: code || undefined,
            cycleId: cycleId || undefined,
            niveauId: niveauId || undefined,
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
            title={isEditMode ? 'Modifier le programme' : 'Nouveau programme pédagogique'}
            description="Remplissez les informations du programme"
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
                        placeholder="Ex: Programme Sciences 2024"
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
                        placeholder="programme_sciences_2024"
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

                {/* Cycle */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cycle
                    </label>
                    <select
                        value={cycleId}
                        onChange={(e) => setCycleId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                    >
                        <option value="">Sélectionner un cycle</option>
                        {/* Les cycles seront chargés dynamiquement */}
                    </select>
                </div>

                {/* Niveau */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Niveau
                    </label>
                    <select
                        value={niveauId}
                        onChange={(e) => setNiveauId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                    >
                        <option value="">Sélectionner un niveau</option>
                        {/* Les niveaux seront chargés dynamiquement */}
                    </select>
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
                        placeholder="Description du programme pédagogique..."
                    />
                </div>
            </form>
        </CustomModal>
    );
}
