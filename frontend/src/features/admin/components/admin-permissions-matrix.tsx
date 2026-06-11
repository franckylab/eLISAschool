/**
 * ==================================
 * eLISAschool - Page Admin Matrice des Permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Visualisation complète de la matrice des permissions par rôle
 * Interface d'administration pour gérer les accès
 */

import { useState, useMemo } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { RequireRole } from '@/components/permissions';
import { Shield, Check, X, Search, Filter, Download, Eye } from 'lucide-react';

// ==================================
// TYPES
// ==================================

interface PermissionMatrix {
    module: string;
    permissions: {
        code: string;
        label: string;
        roles: Record<string, boolean>;
    }[];
}

interface RoleInfo {
    code: string;
    label: string;
    color: string;
    category: string;
}

// ==================================
// DONNÉES DE RÉFÉRENCE
// ==================================

const ROLES_INFO: RoleInfo[] = [
    { code: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-red-500', category: 'Administration' },
    { code: 'ADMIN', label: 'Administrateur', color: 'bg-orange-500', category: 'Administration' },
    { code: 'CHEF_ETABLISSEMENT', label: 'Chef Établissement', color: 'bg-yellow-500', category: 'Direction' },
    { code: 'ENSEIGNANT', label: 'Enseignant', color: 'bg-green-500', category: 'Pédagogie' },
    { code: 'PERSONNEL', label: 'Personnel', color: 'bg-blue-500', category: 'Support' },
    { code: 'PARENT', label: 'Parent', color: 'bg-purple-500', category: 'Externe' },
    { code: 'ELEVE', label: 'Élève', color: 'bg-pink-500', category: 'Externe' },
];

const MODULES_LIST = [
    'eleves', 'classes', 'matieres', 'notes', 'bulletins',
    'finances', 'personnel', 'cantine', 'transport',
    'messagerie', 'sondages', 'configuration', 'rapports',
];

// ==================================
// COMPOSANT PRINCIPAL
// ==================================

export function AdminPermissionsMatrixPage() {
    const { permissions: userPermissions, isSuperAdmin } = usePermissions();
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

    // Simuler les permissions par rôle (à remplacer par API)
    const rolePermissions = useMemo(() => generateRolePermissions(), []);

    // Filtrer les modules
    const filteredModules = useMemo(() => {
        return MODULES_LIST.filter(module => {
            const matchesSearch = module.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesModule = selectedModule === 'all' || module === selectedModule;
            return matchesSearch && matchesModule;
        });
    }, [searchTerm, selectedModule]);

    // Exporter la matrice
    const exportMatrix = () => {
        const data = {
            date: new Date().toISOString(),
            roles: ROLES_INFO,
            modules: filteredModules,
            matrix: rolePermissions,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `permissions-matrix-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <RequireRole roles={['SUPER_ADMIN', 'ADMIN']}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Matrice des Permissions</h1>
                        <p className="text-gray-600 mt-1">
                            Visualisation complète des accès par rôle et module
                        </p>
                    </div>

                    <button
                        onClick={exportMatrix}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4" />
                        Exporter
                    </button>
                </div>

                {/* Filtres */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>

                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="all">Tous les rôles</option>
                        {ROLES_INFO.map(role => (
                            <option key={role.code} value={role.code}>{role.label}</option>
                        ))}
                    </select>

                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="all">Tous les modules</option>
                        {MODULES_LIST.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('matrix')}
                            className={`flex-1 px-4 py-2 rounded-lg ${
                                viewMode === 'matrix'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            Matrice
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex-1 px-4 py-2 rounded-lg ${
                                viewMode === 'list'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            Liste
                        </button>
                    </div>
                </div>

                {/* Vue Matrice */}
                {viewMode === 'matrix' && (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Module / Permission
                                    </th>
                                    {(selectedRole === 'all' ? ROLES_INFO : ROLES_INFO.filter(r => r.code === selectedRole)).map(role => (
                                        <th key={role.code} className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${role.color}`} />
                                                <span className="text-xs font-medium text-gray-700">{role.label}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredModules.map(module => {
                                    const modulePerms = rolePermissions[module] || [];
                                    return modulePerms.map((perm, idx) => (
                                        <tr key={`${module}-${perm.code}`} className={idx === 0 ? 'bg-gray-50' : ''}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {idx === 0 && <span className="text-xs text-gray-500 block">{module}</span>}
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{perm.code}</code>
                                                </div>
                                            </td>
                                            {(selectedRole === 'all' ? ROLES_INFO : ROLES_INFO.filter(r => r.code === selectedRole)).map(role => (
                                                <td key={role.code} className="px-4 py-4 whitespace-nowrap text-center">
                                                    {perm.roles[role.code] ? (
                                                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="w-5 h-5 text-red-400 mx-auto" />
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ));
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Vue Liste */}
                {viewMode === 'list' && (
                    <div className="space-y-4">
                        {filteredModules.map(module => {
                            const modulePerms = rolePermissions[module] || [];
                            return (
                                <div key={module} className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                                        {module}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {modulePerms.map(perm => (
                                            <div key={perm.code} className="border border-gray-200 rounded-lg p-4">
                                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded block mb-3">
                                                    {perm.code}
                                                </code>
                                                <div className="space-y-1">
                                                    {(selectedRole === 'all' ? ROLES_INFO : ROLES_INFO.filter(r => r.code === selectedRole)).map(role => (
                                                        <div key={role.code} className="flex items-center justify-between text-sm">
                                                            <span className="text-gray-600">{role.label}</span>
                                                            {perm.roles[role.code] ? (
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <X className="w-4 h-4 text-red-400" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-sm font-medium text-gray-500">Total Permissions</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {Object.values(rolePermissions).flat().length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-sm font-medium text-gray-500">Modules</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {MODULES_LIST.length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-sm font-medium text-gray-500">Rôles</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {ROLES_INFO.length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h4 className="text-sm font-medium text-gray-500">Couverture Moyenne</h4>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {calculateAverageCoverage(rolePermissions)}%
                        </p>
                    </div>
                </div>
            </div>
        </RequireRole>
    );
}

// ==================================
// FONCTIONS UTILITAIRES
// ==================================

/**
 * Génère les permissions par rôle (simulation)
 * À remplacer par un appel API réel
 */
function generateRolePermissions(): Record<string, Array<{ code: string; label: string; roles: Record<string, boolean> }>> {
    const permissions: Record<string, any> = {};

    MODULES_LIST.forEach(module => {
        const actions = ['view', 'create', 'edit', 'delete', 'export', 'import', 'manage'];
        permissions[module] = actions.map(action => ({
            code: `${module}:${action}`,
            label: `${action} ${module}`,
            roles: {
                SUPER_ADMIN: true,
                ADMIN: true,
                CHEF_ETABLISSEMENT: action === 'view' || action === 'export' || action === 'manage',
                ENSEIGNANT: (module === 'notes' || module === 'bulletins' || module === 'eleves') &&
                    (action === 'view' || action === 'create' || action === 'edit'),
                PERSONNEL: module === 'personnel' && action === 'view',
                PARENT: (module === 'eleves' || module === 'notes' || module === 'bulletins') && action === 'view',
                ELEVE: (module === 'notes' || module === 'bulletins') && action === 'view',
            },
        }));
    });

    return permissions;
}

/**
 * Calcule la couverture moyenne des permissions
 */
function calculateAverageCoverage(rolePermissions: Record<string, any[]>): number {
    let total = 0;
    let granted = 0;

    Object.values(rolePermissions).forEach(perms => {
        perms.forEach(perm => {
            Object.values(perm.roles).forEach(hasAccess => {
                total++;
                if (hasAccess) granted++;
            });
        });
    });

    return total > 0 ? Math.round((granted / total) * 100) : 0;
}

export default AdminPermissionsMatrixPage;
