/**
 * ==================================
 * eLISAschool - Composant de Debug des Permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant utilitaire pour afficher et tester les permissions de l'utilisateur connecté
 * Utile pour le développement et le diagnostic
 */

import { useState } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuthStore } from '@/stores/auth.store';
import { Shield, Check, X, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface DebugPermissionsProps {
    /** Afficher uniquement en mode développement */
    devOnly?: boolean;
}

export function DebugPermissions({ devOnly = true }: DebugPermissionsProps) {
    const { utilisateur, etablissementId, etablissementsDisponibles } = useAuthStore();
    const { hasPermission, permissions, role, isAdmin, isSuperAdmin } = usePermissions();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterModule, setFilterModule] = useState<string>('all');
    const [isCollapsed, setIsCollapsed] = useState(true); // Réduit par défaut

    // Ne pas afficher en production si devOnly=true
    if (devOnly && import.meta.env.PROD) {
        return null;
    }

    if (!utilisateur) {
        return (
            <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg z-50">
                <p className="text-sm">Non authentifié</p>
            </div>
        );
    }

    // Extraire les modules uniques
    const modules = Array.from(
        new Set(
            (permissions || [])
                .map(p => p.split(':')[0])
                .sort()
        )
    );

    // Filtrer les permissions
    const filteredPermissions = (permissions || []).filter(p => {
        const matchesSearch = p.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesModule = filterModule === 'all' || p.startsWith(`${filterModule}:`);
        return matchesSearch && matchesModule;
    });

    // Permissions de test rapide
    const quickTests = [
        'eleves:view',
        'eleves:create',
        'eleves:edit',
        'eleves:delete',
        'eleves:export',
        'notes:view',
        'notes:create',
        'finances:view',
        'finances:manage',
        'config:edit',
    ];

    return (
        <div 
            className={`fixed ${isCollapsed ? 'bottom-4 right-4' : 'bottom-4 right-4'} ${
                isCollapsed 
                    ? 'w-12 h-12 rounded-full' 
                    : 'w-96 max-h-[80vh] rounded-lg'
            } bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden flex flex-col transition-all duration-300`}
        >
            {/* Header - Toujours visible */}
            <div 
                className={`${
                    isCollapsed 
                        ? 'w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity p-0'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white cursor-pointer hover:opacity-90 transition-opacity'
                }`}
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Debug Permissions' : 'Réduire'}
            >
                {isCollapsed ? (
                    <Shield className="w-6 h-6 text-white" />
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                <h3 className="font-bold">Debug Permissions</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                                    DEV MODE
                                </span>
                                {isCollapsed ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronUp className="w-4 h-4" />
                                )}
                            </div>
                        </div>
                        <div className="mt-2 text-sm space-y-1">
                            <p><strong>Rôle :</strong> {role}</p>
                            <p><strong>Admin :</strong> {isAdmin ? '✅' : '❌'}</p>
                            <p><strong>Super Admin :</strong> {isSuperAdmin ? '✅' : '❌'}</p>
                            <p><strong>Total permissions :</strong> {permissions?.length || 0}</p>
                            <hr className="border-white/30 my-2" />
                            <p><strong>Établissement actif (store) :</strong> {etablissementId || 'Non défini'} - Nom: {etablissementsDisponibles?.find(e => e.id === etablissementId)?.nom || 'Non trouvé'}</p>
                            <p><strong>Établissement actif (utilisateur) :</strong> {utilisateur?.etablissementActif || 'Non défini'}</p>
                            <p><strong>Nombre d'établissements :</strong> {etablissementsDisponibles?.length || 0}</p>
                            <details className="mt-1">
                                <summary className="cursor-pointer text-xs font-semibold">Voir la liste des établissements</summary>
                                <ul className="mt-1 ml-2 text-xs space-y-1">
                                    {(etablissementsDisponibles || []).map((etab, idx) => (
                                        <li key={idx} className={etab.id === etablissementId ? 'text-green-300 font-semibold' : 'text-gray-300'}>
                                            • {etab.nom} (ID: {etab.id}) | Rôle: {etab.role} | Principal: {etab.etablissementPrincipal ? 'Oui' : 'Non'}
                                        </li>
                                    ))}
                                </ul>
                            </details>
                        </div>
                    </>
                )}
            </div>

            {/* Contenu - Visible uniquement si non réduit */}
            {!isCollapsed && (
                <>

            {/* Quick Tests */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    TESTS RAPIDES
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {quickTests.map(perm => (
                        <div 
                            key={perm}
                            className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                                hasPermission(perm)
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            }`}
                        >
                            {hasPermission(perm) ? (
                                <Check className="w-3 h-3" />
                            ) : (
                                <X className="w-3 h-3" />
                            )}
                            <span className="truncate">{perm}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une permission..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                        value={filterModule}
                        onChange={(e) => setFilterModule(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                    >
                        <option value="all">Tous les modules</option>
                        {modules.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Permissions List */}
            <div className="flex-1 overflow-y-auto p-3">
                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    PERMISSIONS ({filteredPermissions.length})
                </h4>
                <div className="space-y-1">
                    {filteredPermissions.map(perm => (
                        <div 
                            key={perm}
                            className="flex items-center gap-2 text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => navigator.clipboard.writeText(perm)}
                            title="Cliquer pour copier"
                        >
                            <Check className="w-3 h-3 text-green-600" />
                            <span className="font-mono text-gray-700 dark:text-gray-300">{perm}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    💡 Cliquer sur une permission pour la copier
                </p>
            </div>
                </>
            )}
        </div>
    );
}

/**
 * Hook pour afficher/masquer le debug panel
 */
export function useDebugPermissions() {
    const [isVisible, setIsVisible] = useState(false);

    const toggle = () => setIsVisible(prev => !prev);
    const show = () => setIsVisible(true);
    const hide = () => setIsVisible(false);

    return { isVisible, toggle, show, hide };
}

export default DebugPermissions;
