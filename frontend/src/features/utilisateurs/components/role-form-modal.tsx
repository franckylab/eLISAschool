/**
 * ==================================
 * eLISAschool - Formulaire de Rôle
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal de création et modification de rôle avec attribution de permissions
 */

import { useState, useEffect } from 'react';
import { 
    Shield, Check, AlertCircle, Search, 
    ChevronDown, ChevronRight, Save 
} from 'lucide-react';
import { useCreerRole, useModifierRole, useToutesPermissions } from '../hooks/use-roles-permissions';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { Role } from '../types/utilisateur.types';

interface RoleFormModalProps {
    role?: Role | null;
    onClose: () => void;
}

export function RoleFormModal({ role, onClose }: RoleFormModalProps) {
    const isEditMode = !!role;
    
    // État du formulaire
    const [nom, setNom] = useState(role?.libelle || '');
    const [code, setCode] = useState(role?.code || '');
    const [description, setDescription] = useState(role?.description || '');
    const [permissionsSelectionnees, setPermissionsSelectionnees] = useState<Set<string>>(
        new Set(role?.permissions?.map((p: any) => p.code || p) || [])
    );
    
    // UI State
    const [moduleExpanded, setModuleExpanded] = useState<Record<string, boolean>>({});
    const [recherchePermission, setRecherchePermission] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Hooks
    const creer = useCreerRole();
    const modifier = useModifierRole();
    const { data: permissionsGroupes, isLoading: loadingPermissions } = useToutesPermissions();

    // Auto-générer le code depuis le libelle
    useEffect(() => {
        if (!isEditMode && nom && !code) {
            const generatedCode = nom
                .toUpperCase()
                .replace(/[^A-Z0-9\s]/g, '')
                .replace(/\s+/g, '_');
            setCode(generatedCode);
        }
    }, [nom, isEditMode, code]);

    // Validation
    const valider = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!nom.trim()) newErrors.nom = 'Le libellé est requis';
        else if (nom.trim().length < 2) newErrors.nom = 'Le libellé doit avoir au moins 2 caractères';
        if (!code.trim()) newErrors.code = 'Le code est requis';
        else if (code.trim().length < 2) newErrors.code = 'Le code doit avoir au moins 2 caractères';
        else if (!/^[A-Z_]+$/.test(code)) newErrors.code = 'Le code doit être en majuscules avec underscores uniquement';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit
    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!valider()) return;

        const dto = {
            libelle: nom.trim(),
            code: code.trim(),
            description,
            permissionIds: Array.from(permissionsSelectionnees),
        };

        try {
            if (isEditMode && role) {
                await modifier.mutateAsync({ id: role.id, ...dto });
            } else {
                await creer.mutateAsync(dto);
            }
            onClose();
        } catch (error) {
            // Erreur déjà gérée par le hook (toast)
        }
    };

    // Toggle permission
    const togglePermission = (code: string) => {
        const newSet = new Set(permissionsSelectionnees);
        if (newSet.has(code)) {
            newSet.delete(code);
        } else {
            newSet.add(code);
        }
        setPermissionsSelectionnees(newSet);
    };

    // Toggle toutes les permissions d'un module
    const toggleModulePermissions = (_module: string, perms: string[]) => {
        const newSet = new Set(permissionsSelectionnees);
        const allSelected = perms.every(p => newSet.has(p));
        
        if (allSelected) {
            perms.forEach(p => newSet.delete(p));
        } else {
            perms.forEach(p => newSet.add(p));
        }
        setPermissionsSelectionnees(newSet);
    };

    // Toggle module expanded
    const toggleModule = (module: string) => {
        setModuleExpanded(prev => ({ ...prev, [module]: !prev[module] }));
    };

    // Filtrer les permissions avec vérification de type tableau
    const filteredPermissions = Array.isArray(permissionsGroupes)
        ? permissionsGroupes
              .map((groupe) => ({
                  ...groupe,
                  permissions: groupe.permissions.filter(
                      (p) =>
                          p.libelle.toLowerCase().includes(recherchePermission.toLowerCase()) ||
                          p.code.toLowerCase().includes(recherchePermission.toLowerCase())
                  ),
              }))
              .filter((groupe) => groupe.permissions.length > 0)
        : [];

    const isLoading = creer.isPending || modifier.isPending;

    const titre = isEditMode ? 'Modifier le rôle' : 'Créer un nouveau rôle';
    const desc = isEditMode ? `Modification de "${role?.libelle}"` : 'Définissez les informations et permissions du rôle';

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={titre}
            description={desc}
            size="3xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose} disabled={isLoading}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        icon={<Save className="h-4 w-4" />}
                    >
                        {isEditMode ? 'Enregistrer les modifications' : 'Créer le rôle'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations du rôle */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        Informations du rôle
                    </h3>

                    {/* Nom */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                            Nom du rôle <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            placeholder="Ex: Gestionnaire de notes"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-500 ${
                                errors.nom ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.nom && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.nom}
                            </p>
                        )}
                    </div>

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z_]/g, ''))}
                            placeholder="Ex: GESTIONNAIRE_NOTES"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20 bg-white dark:bg-gray-800 dark:text-gray-100 dark:border-gray-500 ${
                                errors.code ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.code && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                {errors.code}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Lettres majuscules et underscores uniquement
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description du rôle et de ses responsabilités..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                        />
                    </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-600" />
                            Permissions
                        </h3>
                        <span className="text-sm text-gray-600">
                            {permissionsSelectionnees.size} permission(s) sélectionnée(s)
                        </span>
                    </div>

                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            value={recherchePermission}
                            onChange={(e) => setRecherchePermission(e.target.value)}
                            placeholder="Rechercher une permission..."
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 dark:text-gray-100 py-2 pl-10 pr-4 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/20"
                        />
                    </div>

                    {/* Liste des permissions par module */}
                    {loadingPermissions ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                            ))}
                        </div>
                    ) : filteredPermissions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            Aucune permission trouvée
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredPermissions.map((groupe) => {
                                const module = groupe.module;
                                const isExpanded = moduleExpanded[module] !== false;
                                const perms = groupe.permissions.map(p => p.code);
                                const selectedCount = perms.filter(p => permissionsSelectionnees.has(p)).length;
                                const allSelected = selectedCount === perms.length;

                                return (
                                    <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        {/* Header du module */}
                                        <button
                                            type="button"
                                            onClick={() => toggleModule(module)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                )}
                                                <span className="font-medium text-gray-900 dark:text-gray-200 capitalize">
                                                    {module.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {selectedCount}/{perms.length}
                                                </span>
                                            </div>
                                            <span
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleModulePermissions(module, perms);
                                                }}
                                                className="text-sm text-[var(--color-dominant-600)] hover:text-[var(--color-dominant-700)] cursor-pointer"
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        toggleModulePermissions(module, perms);
                                                    }
                                                }}
                                            >
                                                {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                                            </span>
                                        </button>

                                        {/* Permissions du module */}
                                        {isExpanded && (
                                            <div className="p-4 space-y-2 bg-white dark:bg-gray-800">
                                                {groupe.permissions.map((perm) => {
                                                    const isSelected = permissionsSelectionnees.has(perm.code);
                                                    return (
                                                        <label
                                                            key={perm.code}
                                                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => togglePermission(perm.code)}
                                                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-500 text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                                                    {perm.libelle}
                                                                </p>
                                                                {perm.description && (
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {perm.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <code className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                                {perm.code}
                                                            </code>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </form>
        </CustomModal>
    );
}
