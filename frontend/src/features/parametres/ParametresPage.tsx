/**
 * ==================================
 * eLISAschool - Page Paramètres Système
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useMemo, useEffect } from 'react';
import { Settings, Filter, Search, Plus, RotateCcw, Download, Trash2, Edit2, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { cn } from '@/lib/cn';
import {
    useParametres,
    useSupprimerParametre,
    useReinitialiserTousParametres,
    useModifierParametre,
} from './hooks/use-parametres';
import { CategorieParametre, TypeValeurParametre } from './types/parametres.types';
import type { ParametreSysteme } from './types/parametres.types';

const CATEGORIES_CONFIG: Record<CategorieParametre, { label: string; icone: string; couleur: string }> = {
    [CategorieParametre.SYSTEME]: { label: 'Système', icone: '⚙️', couleur: 'gray' },
    [CategorieParametre.SECURITE]: { label: 'Sécurité', icone: '🔒', couleur: 'red' },
    [CategorieParametre.ETABLISSEMENT]: { label: 'Établissement', icone: '🏫', couleur: 'blue' },
    [CategorieParametre.MODULE]: { label: 'Modules', icone: '🧩', couleur: 'purple' },
    [CategorieParametre.THEME]: { label: 'Thème', icone: '🎨', couleur: 'pink' },
    [CategorieParametre.NOTIFICATION]: { label: 'Notifications', icone: '🔔', couleur: 'yellow' },
    [CategorieParametre.REGIONAL]: { label: 'Régional', icone: '🌍', couleur: 'green' },
    [CategorieParametre.CUSTOM]: { label: 'Personnalisé', icone: '✨', couleur: 'indigo' },
};

export function ParametresPage() {
    const [filtres, setFiltres] = useState({
        categorie: undefined as CategorieParametre | undefined,
        search: '',
        visible: true,
    });
    const [selectedParam, setSelectedParam] = useState<ParametreSysteme | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Hooks
    const { data: response, isLoading, error } = useParametres(filtres);
    const supprimer = useSupprimerParametre();
    const reinitialiserTous = useReinitialiserTousParametres();
    const modifier = useModifierParametre();

    const parametres = response?.data || [];

    // Formulaire d'édition
    const [editForm, setEditForm] = useState({
        cle: '',
        valeur: '',
        description: '',
    });

    useEffect(() => {
        if (selectedParam) {
            setEditForm({
                cle: selectedParam.cle,
                valeur: selectedParam.valeur,
                description: selectedParam.description || '',
            });
        }
    }, [selectedParam]);

    // Debug
    console.log('[ParametresPage] Response:', response);
    console.log('[ParametresPage] Error:', error);
    console.log('[ParametresPage] isLoading:', isLoading);
    console.log('[ParametresPage] parametres.length:', parametres.length);

    // Parser la valeur JSON
    const parseValeur = (param: ParametreSysteme): any => {
        try {
            return JSON.parse(param.valeur);
        } catch {
            return param.valeur;
        }
    };

    // Formater la valeur pour affichage
    const formatValeur = (param: ParametreSysteme): string => {
        const valeur = parseValeur(param);
        
        if (param.typeValeur === TypeValeurParametre.BOOLEAN) {
            return valeur ? '✅ Oui' : '❌ Non';
        }
        
        if (param.typeValeur === TypeValeurParametre.NUMBER) {
            return String(valeur);
        }
        
        if (typeof valeur === 'object') {
            return JSON.stringify(valeur, null, 2);
        }
        
        return String(valeur);
    };

    // Stats
    const stats = useMemo(() => ({
        total: parametres.length,
        parCategorie: parametres.reduce((acc, p) => {
            acc[p.categorie] = (acc[p.categorie] || 0) + 1;
            return acc;
        }, {} as Record<string, number>),
    }), [parametres]);

    const handleDelete = async (cle: string) => {
        if (!confirm(`Supprimer le paramètre "${cle}" ?`)) return;
        await supprimer.mutateAsync(cle);
    };

    const handleResetAll = async () => {
        if (!confirm('Réinitialiser TOUS les paramètres à leurs valeurs par défaut ?')) return;
        await reinitialiserTous.mutateAsync();
    };

    const handleEditSubmit = async () => {
        if (!selectedParam) return;
        
        try {
            await modifier.mutateAsync({
                cle: selectedParam.cle,
                dto: {
                    valeur: editForm.valeur,
                    description: editForm.description || undefined,
                },
            });
            setSelectedParam(null);
        } catch (error) {
            console.error('[ParametresPage] Erreur édition:', error);
        }
    };

    return (
        <div>
            <PageHeader
                title="Paramètres Système"
                description="Configurez les fonctionnalités, constantes, flags et variables d'eLISAschool"
            />

            {/* Stats rapides */}
            <div className="grid gap-4 mb-6 sm:grid-cols-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">Total paramètres</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                {Object.entries(CATEGORIES_CONFIG).slice(0, 3).map(([key, config]) => (
                    <button
                        key={key}
                        onClick={() => setFiltres({ ...filtres, categorie: key as CategorieParametre })}
                        className={cn(
                            'p-4 rounded-lg border transition-colors text-left',
                            filtres.categorie === key
                                ? 'border-[var(--color-dominante)] bg-[var(--color-dominante)]/5'
                                : 'border-gray-200 hover:border-gray-300'
                        )}
                    >
                        <p className="text-2xl mb-1">{config.icone}</p>
                        <p className="text-sm text-gray-600">{config.label}</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {stats.parCategorie[key] || 0}
                        </p>
                    </button>
                ))}
            </div>

            {/* Barre d'actions */}
            <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg border border-gray-200">
                {/* Recherche */}
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un paramètre..."
                            value={filtres.search}
                            onChange={(e) => setFiltres({ ...filtres, search: e.target.value })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Filtre catégorie */}
                <select
                    value={filtres.categorie || ''}
                    onChange={(e) => setFiltres({ ...filtres, categorie: e.target.value as CategorieParametre || undefined })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)]"
                >
                    <option value="">Toutes les catégories</option>
                    {Object.entries(CATEGORIES_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                            {config.icone} {config.label}
                        </option>
                    ))}
                </select>

                {/* Boutons */}
                <ElisaButton
                    variant="outline"
                    icon={<RotateCcw className="h-4 w-4" />}
                    onClick={handleResetAll}
                    isLoading={reinitialiserTous.isPending}
                >
                    Réinitialiser tout
                </ElisaButton>

                <ElisaButton
                    variant="primary"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setShowCreateModal(true)}
                >
                    Nouveau paramètre
                </ElisaButton>
            </div>

            {/* Tableau des paramètres */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="py-12 text-center">
                        <Settings className="h-12 w-12 mx-auto mb-3 animate-spin text-gray-400" />
                        <p className="text-gray-600">Chargement des paramètres...</p>
                    </div>
                ) : parametres.length === 0 ? (
                    <div className="py-12 text-center">
                        <Filter className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600">Aucun paramètre trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clé</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {parametres.map((param) => {
                                    const configCat = CATEGORIES_CONFIG[param.categorie];
                                    
                                    return (
                                        <tr key={param.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{param.cle}</p>
                                                    {param.description && (
                                                        <p className="text-xs text-gray-500 mt-1">{param.description}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {formatValeur(param)}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {param.typeValeur}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100">
                                                    {configCat?.icone} {configCat?.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600">
                                                    {param.module || '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedParam(param)}
                                                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                    {!param.modifiableRuntime && (
                                                        <button
                                                            onClick={() => handleDelete(param.cle)}
                                                            disabled={supprimer.isPending}
                                                            className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal d'édition */}
            {selectedParam && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Modifier le paramètre</h2>
                                <p className="text-sm text-gray-500 mt-1">{selectedParam.cle}</p>
                            </div>
                            <button
                                onClick={() => setSelectedParam(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            {/* Clé (readonly) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Clé</label>
                                <input
                                    type="text"
                                    value={editForm.cle}
                                    readOnly
                                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span className="text-sm font-mono">{selectedParam.typeValeur}</span>
                                </div>
                            </div>

                            {/* Valeur */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Valeur
                                    {selectedParam.typeValeur === TypeValeurParametre.BOOLEAN && (
                                        <span className="ml-2 text-xs text-gray-500">(true ou false)</span>
                                    )}
                                    {selectedParam.typeValeur === TypeValeurParametre.NUMBER && (
                                        <span className="ml-2 text-xs text-gray-500">(nombre)</span>
                                    )}
                                    {selectedParam.typeValeur === TypeValeurParametre.JSON && (
                                        <span className="ml-2 text-xs text-gray-500">(JSON valide)</span>
                                    )}
                                </label>
                                {selectedParam.typeValeur === TypeValeurParametre.BOOLEAN ? (
                                    <select
                                        value={editForm.valeur}
                                        onChange={(e) => setEditForm({ ...editForm, valeur: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                                    >
                                        <option value="true">✅ Oui (true)</option>
                                        <option value="false">❌ Non (false)</option>
                                    </select>
                                ) : selectedParam.typeValeur === TypeValeurParametre.JSON ? (
                                    <textarea
                                        value={editForm.valeur}
                                        onChange={(e) => setEditForm({ ...editForm, valeur: e.target.value })}
                                        rows={6}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent font-mono text-sm"
                                        placeholder='{"key": "value"}'
                                    />
                                ) : (
                                    <input
                                        type={selectedParam.typeValeur === TypeValeurParametre.NUMBER ? 'number' : 'text'}
                                        value={editForm.valeur}
                                        onChange={(e) => setEditForm({ ...editForm, valeur: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                                    />
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent"
                                    placeholder="Description du paramètre..."
                                />
                            </div>

                            {/* Catégorie et Module */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                        <span className="text-sm">
                                            {CATEGORIES_CONFIG[selectedParam.categorie]?.icone}{' '}
                                            {CATEGORIES_CONFIG[selectedParam.categorie]?.label}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                                        <span className="text-sm">{selectedParam.module || '—'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modifiable runtime */}
                            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <input
                                    type="checkbox"
                                    checked={selectedParam.modifiableRuntime}
                                    disabled
                                    className="h-4 w-4 text-blue-600"
                                />
                                <span className="text-sm text-blue-800">
                                    {selectedParam.modifiableRuntime
                                        ? '✅ Modifiable à l\'exécution'
                                        : '🔒 Non modifiable (paramètre système)'}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                            <ElisaButton
                                variant="secondary"
                                onClick={() => setSelectedParam(null)}
                                disabled={modifier.isPending}
                            >
                                Annuler
                            </ElisaButton>
                            <ElisaButton
                                onClick={handleEditSubmit}
                                disabled={modifier.isPending || !editForm.valeur}
                            >
                                {modifier.isPending ? 'Enregistrement...' : 'Enregistrer'}
                            </ElisaButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
