/**
 * ==================================
 * eLISAschool - Role Edit Modal
 * ==================================
 * Version: 1.0.0
 *
 * Modal d'édition d'un rôle personnalisé :
 * - Nom, description
 * - Permissions avec toggles groupés par module
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Shield, Check, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import {
    useMatricePermissions,
    useModifierRolePlateforme,
    usePlatformRolePermissions,
    type PlatformRole,
} from '../hooks/use-platform-roles';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RoleEditModalProps {
    role: PlatformRole;
    onClose: () => void;
    modifier: ReturnType<typeof useModifierRolePlateforme>;
}

export function RoleEditModal({ role, onClose, modifier }: RoleEditModalProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const { data: currentPerms } = usePlatformRolePermissions(role.id);
    const { data: matrice } = useMatricePermissions();

    const [nom, setNom] = useState(role.libelle || role.nom || '');
    const [description, setDescription] = useState(role.description || '');
    const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');

    // Initialiser les permissions quand les données arrivent
    useEffect(() => {
        if (currentPerms) {
            setSelectedPerms(new Set(currentPerms));
        }
    }, [currentPerms]);

    // Déplier tous les modules au chargement de la matrice
    useEffect(() => {
        if (matrice?.modules) {
            setExpandedModules(new Set(matrice.modules.map(m => m.module)));
        }
    }, [matrice]);

    const togglePermission = useCallback((perm: string) => {
        setSelectedPerms(prev => {
            const next = new Set(prev);
            if (next.has(perm)) next.delete(perm);
            else next.add(perm);
            return next;
        });
    }, []);

    const toggleModule = useCallback((permissions: string[]) => {
        setSelectedPerms(prev => {
            const next = new Set(prev);
            const allSelected = permissions.every(p => next.has(p));
            if (allSelected) permissions.forEach(p => next.delete(p));
            else permissions.forEach(p => next.add(p));
            return next;
        });
    }, []);

    const toggleModuleExpand = useCallback((module: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(module)) next.delete(module);
            else next.add(module);
            return next;
        });
    }, []);

    const filteredModules = useMemo(() => {
        if (!matrice?.modules) return [];
        if (!searchQuery.trim()) return matrice.modules;
        const q = searchQuery.toLowerCase();
        return matrice.modules
            .map(mod => ({
                ...mod,
                permissions: mod.permissions.filter(p => p.toLowerCase().includes(q)),
            }))
            .filter(mod => mod.permissions.length > 0 || mod.label.toLowerCase().includes(q));
    }, [matrice, searchQuery]);

    const handleSave = useCallback(async () => {
        if (!nom.trim()) {
            toast.error('Le nom du rôle est requis');
            return;
        }
        try {
            await modifier.mutateAsync({
                id: role.id,
                nom: nom.trim(),
                description: description.trim() || undefined,
                permissions: Array.from(selectedPerms),
            });
            queryClient.invalidateQueries({ queryKey: ['platform-roles'] });
            onClose();
        } catch {
            // Erreur gérée par le hook
        }
    }, [role.id, nom, description, selectedPerms, modifier, queryClient, onClose]);

    const isDirty =
        nom !== (role.libelle || role.nom) ||
        description !== (role.description || '') ||
        !setsEqual(selectedPerms, new Set(currentPerms || []));

    return (
        <CustomModal
            open={true}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title={`Modifier : ${role.libelle || role.nom}`}
            size="3xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedPerms.size} permission(s) sélectionnée(s)
                    </span>
                    <div className="flex gap-2">
                        <ElisaButton variant="ghost" size="sm" onClick={onClose}>
                            Annuler
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            chargement={modifier.isPending}
                            disabled={!nom.trim() || !isDirty}
                            onClick={handleSave}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Enregistrer
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'info'
                                ? 'border-[var(--color-dominant-600)] text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-400)]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        Informations
                    </button>
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'permissions'
                                ? 'border-[var(--color-dominant-600)] text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-400)]'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" />
                            Permissions
                            <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-xs">
                                {selectedPerms.size}
                            </span>
                        </span>
                    </button>
                </div>

                {/* Tab: Informations */}
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nom du rôle
                            </label>
                            <input
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                className="h-9 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none"
                                placeholder="Description du rôle..."
                            />
                        </div>
                        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                <strong>Code :</strong> {role.code}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <strong>Scope :</strong> {role.scope === 'plateforme' ? 'Plateforme' : 'Tenant'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <strong>Utilisateurs :</strong> {role.nbUtilisateurs || 0}
                            </p>
                        </div>
                    </div>
                )}

                {/* Tab: Permissions */}
                {activeTab === 'permissions' && (
                    <div className="space-y-3">
                        {/* Recherche */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher une permission..."
                                className="w-full h-8 pl-9 pr-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                            />
                        </div>

                        {/* Modules avec toggles */}
                        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
                            {filteredModules.map((mod) => {
                                const isExpanded = expandedModules.has(mod.module);
                                const moduleSelected = mod.permissions.filter(p => selectedPerms.has(p)).length;
                                const allSelected = mod.permissions.length > 0 && moduleSelected === mod.permissions.length;
                                const someSelected = moduleSelected > 0 && !allSelected;

                                return (
                                    <div
                                        key={mod.module}
                                        className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                    >
                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/80">
                                            <button
                                                onClick={() => toggleModuleExpand(mod.module)}
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            >
                                                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => toggleModule(mod.permissions)}
                                                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                                    allSelected
                                                        ? 'bg-[var(--color-dominant-600)] border-[var(--color-dominant-600)]'
                                                        : someSelected
                                                            ? 'bg-[var(--color-dominant-200)] border-[var(--color-dominant-400)]'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            >
                                                {allSelected && <Check className="h-3 w-3 text-white" />}
                                                {someSelected && <div className="h-1.5 w-1.5 rounded-sm bg-[var(--color-dominant-600)]" />}
                                            </button>
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1">
                                                {mod.label}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {moduleSelected}/{mod.permissions.length}
                                            </span>
                                        </div>
                                        {isExpanded && (
                                            <div className="p-2 flex flex-wrap gap-1">
                                                {mod.permissions.map((perm) => {
                                                    const isSelected = selectedPerms.has(perm);
                                                    return (
                                                        <button
                                                            key={perm}
                                                            onClick={() => togglePermission(perm)}
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-all ${
                                                                isSelected
                                                                    ? 'bg-[var(--color-dominant-100)] dark:bg-[var(--color-dominant-900)]/30 text-[var(--color-dominant-700)] dark:text-[var(--color-dominant-400)]'
                                                                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                            }`}
                                                        >
                                                            {isSelected && <Check className="h-2.5 w-2.5 mr-0.5" />}
                                                            {perm}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </CustomModal>
    );
}

/** Vérifie si deux Set<string> sont égaux */
function setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
        if (!b.has(item)) return false;
    }
    return true;
}
