/**
 * ==================================
 * eLISAschool - Gestion des Établissements d'un Groupe
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant pour ajouter/retirer des établissements d'un groupe.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Building2, Plus, X, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
    useAjouterEtablissement,
    useRetirerEtablissement,
} from '../hooks/use-groupes-etablissements';
import type { GroupeEtablissement } from '../types/groupe-etablissement.types';

interface GestionEtablissementsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupe: GroupeEtablissement;
    etablissementsDisponibles: Array<{ id: string; nom: string; code: string }>;
    etablissementsAssignes: Array<{ id: string; nom: string; code: string }>;
    onRefresh?: () => void;
}

export function GestionEtablissementsModal({
    open,
    onOpenChange,
    groupe,
    etablissementsDisponibles,
    etablissementsAssignes,
    onRefresh,
}: GestionEtablissementsProps) {
    const { t } = useTranslation('groupes-etablissements');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const ajouterMutation = useAjouterEtablissement();
    const retirerMutation = useRetirerEtablissement();

    // Filtrer les établissements non assignés
    const assignesIds = new Set(etablissementsAssignes.map(e => e.id));
    const disponibles = etablissementsDisponibles.filter(e => !assignesIds.has(e.id));

    // Filtrer par recherche
    const filteredDisponibles = disponibles.filter(e =>
        (e.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.code || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredAssignes = etablissementsAssignes.filter(e =>
        (e.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.code || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleAjouter = async () => {
        if (selectedIds.length === 0) {
            toast.warning('Sélectionnez au moins un établissement');
            return;
        }

        try {
            await Promise.all(
                selectedIds.map(id =>
                    ajouterMutation.mutateAsync({ groupeId: groupe.id, etablissementIds: [id] })
                )
            );
            toast.success(`${selectedIds.length} établissement(s) ajouté(s)`);
            setSelectedIds([]);
            onRefresh?.();
        } catch (error: any) {
            const message = error?.message || 'Erreur lors de l\'ajout';
            toast.error(message);
        }
    };

    const handleRetirer = async (etablissementId: string) => {
        try {
            await retirerMutation.mutateAsync({ groupeId: groupe.id, etablissementId });
            toast.success('Établissement retiré');
            onRefresh?.();
        } catch (error) {
            toast.error('Erreur lors du retrait');
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={`Gérer les établissements - ${groupe.nom || ''}`}
            description="Ajoutez ou retirez des établissements de ce groupe"
            size="3xl"
            footer={
                <div className="flex justify-between items-center w-full">
                    <span className="text-sm text-[var(--color-texte-secondaire)]">
                        {etablissementsAssignes.length} établissement(s) assigné(s)
                    </span>
                    <div className="flex gap-2">
                        <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                            Fermer
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            onClick={handleAjouter}
                            isLoading={ajouterMutation.isPending}
                            disabled={selectedIds.length === 0}
                            icon={<Plus className="h-4 w-4" />}
                        >
                            Ajouter ({selectedIds.length})
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Barre de recherche */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-texte-secondaire)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un établissement..."
                        className="w-full pl-10 pr-4 py-2 border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)] focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent placeholder-[var(--color-texte-secondaire)]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Établissements disponibles */}
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--color-texte)] mb-3 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Disponibles ({filteredDisponibles.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto border border-[var(--color-bordure)] rounded-lg p-2 bg-[var(--color-surface)]">
                            {filteredDisponibles.length === 0 ? (
                                <p className="text-sm text-[var(--color-texte-secondaire)] text-center py-4">
                                    Aucun établissement disponible
                                </p>
                            ) : (
                                filteredDisponibles.map((etab) => {
                                    const isSelected = selectedIds.includes(etab.id);
                                    return (
                                        <button
                                            key={etab.id}
                                            onClick={() => toggleSelection(etab.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                                                isSelected
                                                    ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-50)] dark:bg-[var(--color-dominant-900)]/30'
                                                    : 'border-[var(--color-bordure)] hover:border-[var(--color-bordure-hover)] bg-[var(--color-surface)]'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                                                    isSelected
                                                        ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-500)]'
                                                        : 'border-[var(--color-bordure)]'
                                                }`}>
                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-medium text-sm text-[var(--color-texte)]">{etab.nom || ''}</p>
                                                    <code className="text-xs text-[var(--color-texte-secondaire)] font-mono">{etab.code || ''}</code>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Établissements assignés */}
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--color-texte)] mb-3 flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            Assignés ({filteredAssignes.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto border border-[var(--color-bordure)] rounded-lg p-2 bg-[var(--color-surface)]">
                            {filteredAssignes.length === 0 ? (
                                <p className="text-sm text-[var(--color-texte-secondaire)] text-center py-4">
                                    Aucun établissement assigné
                                </p>
                            ) : (
                                filteredAssignes.map((etab) => (
                                    <div
                                        key={etab.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-200)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-5 w-5 text-[var(--color-dominant-500)]" />
                                            <div className="text-left">
                                                <p className="font-medium text-sm text-[var(--color-texte)]">{etab.nom || ''}</p>
                                                <code className="text-xs text-[var(--color-texte-secondaire)] font-mono">{etab.code || ''}</code>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRetirer(etab.id)}
                                            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                            title="Retirer du groupe"
                                            disabled={retirerMutation.isPending}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomModal>
    );
}
