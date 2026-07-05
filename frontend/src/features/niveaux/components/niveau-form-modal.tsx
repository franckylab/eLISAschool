/**
 * ==================================
 * eLISAschool - Modal Formulaire Niveau
 * ==================================
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { useCreerNiveau, useModifierNiveau } from '../hooks/use-niveaux';
import { useCycles } from '@/features/cycles/hooks/use-cycles';
import type { Niveau } from '../types/niveau.types';

export function NiveauFormModal({ niveau, onClose, open = true }: { niveau: Niveau | null; onClose: () => void; open?: boolean }) {
    if (!open) return null;
    const creer = useCreerNiveau();
    const modifier = useModifierNiveau();
    const { data: cycles } = useCycles({ page: 1, limit: 50, actif: true });
    const isEditMode = !!niveau;

    const [nom, setNom] = useState(niveau?.nom || '');
    const [code, setCode] = useState(niveau?.code || '');
    const [cycleId, setCycleId] = useState(niveau?.cycleId || '');
    const [ordre, setOrdre] = useState(niveau?.ordre || 1);
    const [actif, setActif] = useState(niveau?.actif ?? true);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        
        if (!nom.trim()) newErrors.nom = 'Le nom est requis';
        if (!code.trim()) newErrors.code = 'Le code est requis';
        if (!cycleId) newErrors.cycleId = 'Le cycle est requis';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) return;

        const dto = {
            nom,
            code,
            cycleId,
            ordre,
            actif,
        };

        try {
            if (isEditMode && niveau) {
                await modifier.mutateAsync({ id: niveau.id, ...dto });
            } else {
                await creer.mutateAsync(dto);
            }
            onClose();
        } catch (error) {
            // Erreur déjà gérée par le hook
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-[var(--color-dominant-100)]">
                            <BookOpen className="h-6 w-6 text-[var(--color-dominant-600)]" />
                        </div>
                        <h2 className="text-2xl font-bold">
                            {isEditMode ? 'Modifier le niveau' : 'Nouveau niveau'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <AlertTriangle className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                            type="text"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.nom ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                            placeholder="Ex: Cours Moyen 1"
                        />
                        {errors.nom && <p className="text-red-600 text-xs mt-1">{errors.nom}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.code ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                            placeholder="Ex: cm1"
                        />
                        {errors.code && <p className="text-red-600 text-xs mt-1">{errors.code}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cycle *</label>
                        <select
                            value={cycleId}
                            onChange={(e) => setCycleId(e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.cycleId ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]`}
                        >
                            <option value="">Sélectionner un cycle...</option>
                            {cycles?.items?.map((cycle: any) => (
                                <option key={cycle.id} value={cycle.id}>
                                    {cycle.nom} ({cycle.code})
                                </option>
                            ))}
                        </select>
                        {errors.cycleId && <p className="text-red-600 text-xs mt-1">{errors.cycleId}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                            <input
                                type="number"
                                value={ordre}
                                onChange={(e) => setOrdre(parseInt(e.target.value))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                value={actif ? 'actif' : 'inactif'}
                                onChange={(e) => setActif(e.target.value === 'actif')}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]"
                            >
                                <option value="actif">Actif</option>
                                <option value="inactif">Inactif</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={creer.isPending || modifier.isPending}
                            className="px-4 py-2 rounded-lg bg-[var(--color-dominant-600)] text-white hover:bg-[var(--color-dominant-700)] disabled:opacity-50 transition-colors"
                        >
                            {creer.isPending || modifier.isPending ? 'Enregistrement...' : (isEditMode ? 'Enregistrer' : 'Créer')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
