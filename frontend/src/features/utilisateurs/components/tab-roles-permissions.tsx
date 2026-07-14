import { useState, useMemo } from 'react';
import {
    Shield, CheckCircle, UserCog, Lock, Unlock, Plus, X, Filter,
    Calendar, ArrowRight,
} from 'lucide-react';
import { useToutesPermissions, usePermissionsDirectes, useAssignerPermissionUtilisateur, useRetirerPermissionUtilisateur } from '../hooks/use-roles-permissions';
import { CardGrid } from '@/components/ui/CardGrid';
import { CardSection } from '@/components/ui';
import { StatCard } from '@/components/ui/StatCard';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { usePermissions } from '@/hooks';
import { ChangeRoleModal } from './change-role-modal';
import type { Utilisateur } from '../types/utilisateur.types';

type OngletFiltre = 'tous' | string;

export function TabRolesPermissions({ utilisateur }: { utilisateur: Utilisateur }) {
    const { hasPermission } = usePermissions();
    const peutChangerRole = hasPermission('utilisateurs:role:change');
    const peutGererPermissions = hasPermission('roles:manage');

    const { data: permissionsGroupes } = useToutesPermissions({ enabled: peutGererPermissions });
    const { data: permissionsDirectes, refetch: refetchDirectes } = usePermissionsDirectes(utilisateur.id, { enabled: peutGererPermissions });
    const assignerPermission = useAssignerPermissionUtilisateur();
    const retirerPermission = useRetirerPermissionUtilisateur();
    const confirm = useConfirmation();

    const [filtreModule, setFiltreModule] = useState<OngletFiltre>('tous');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedNewPermission, setSelectedNewPermission] = useState<string>('');
    const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);

    const permissionsEffectives = useMemo(() => utilisateur.permissions || [], [utilisateur.permissions]);
    const idsDirectes = useMemo(() => new Set(permissionsDirectes?.map(p => p.permissionId) || []), [permissionsDirectes]);
    const modules = useMemo(() => {
        const m = new Set<string>();
        permissionsEffectives.forEach(p => {
            const parts = p.split(':');
            if (parts.length >= 2) m.add(parts[0]);
        });
        return Array.from(m).sort();
    }, [permissionsEffectives]);

    const permissionsFiltrees = useMemo(() => {
        if (filtreModule === 'tous') return permissionsEffectives;
        return permissionsEffectives.filter(p => p.startsWith(filtreModule + ':'));
    }, [permissionsEffectives, filtreModule]);

    const handleAssignerPermission = async () => {
        if (!selectedNewPermission) return;
        try {
            await assignerPermission.mutateAsync({
                userId: utilisateur.id,
                permissionId: selectedNewPermission,
                type: 'GRANTED' as const,
            });
            refetchDirectes();
            setShowAddModal(false);
            setSelectedNewPermission('');
        } catch {}
    };

    const handleRetirerPermission = (permissionId: string, permissionCode: string) => {
        confirm.ask({
            title: 'Retirer la permission',
            message: `Supprimer la permission directe "${permissionCode}" ?`,
            details: 'Cette action est réversible — vous pourrez la réajouter ultérieurement.',
            variant: 'warning',
            onConfirm: async () => {
                try {
                    await retirerPermission.mutateAsync({
                        userId: utilisateur.id,
                        permissionId,
                    });
                    refetchDirectes();
                } catch {}
            },
        });
    };

    const permissionIdByCode = useMemo(() => {
        const map = new Map<string, string>();
        permissionsGroupes?.forEach(g => {
            g.permissions.forEach(p => {
                map.set(p.code, p.id);
            });
        });
        return map;
    }, [permissionsGroupes]);

    const dateMaj = new Date(utilisateur.updatedAt).toLocaleDateString('fr-FR');

    return (
        <div className="space-y-6">
            <CardGrid columns={{ default: 1, md: 4 }}>
                <StatCard icon={Shield} label="Rôle actuel" value={utilisateur.role} color="blue" />
                <StatCard icon={CheckCircle} label="Permissions" value={permissionsEffectives.length} color="green" />
                <StatCard icon={UserCog} label="Directes" value={permissionsDirectes?.length || 0} color="purple" />
                <StatCard icon={Calendar} label="Dernière modif" value={dateMaj} color="gray" />
            </CardGrid>

            <CardSection
                icon={<Shield className="h-5 w-5" />}
                title="Rôle principal"
                noAnimation
            >
                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-dominant-100 dark:bg-dominant-900 px-4 py-2 text-sm font-medium text-dominant-800 dark:text-dominant-200">
                        <Shield className="h-4 w-4" />
                        {utilisateur.role}
                    </span>
                    {peutChangerRole && (
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ArrowRight className="h-4 w-4" />}
                            onClick={() => setShowChangeRoleModal(true)}
                        >
                            Changer le rôle
                        </ElisaButton>
                    )}
                </div>
            </CardSection>

            <CardSection
                icon={<Shield className="h-5 w-5" />}
                title={`Permissions effectives (${permissionsEffectives.length})`}
                noAnimation
            >
                {peutGererPermissions && (
                    <div className="flex justify-end mb-4">
                        <ElisaButton variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>
                            Ajouter une permission
                        </ElisaButton>
                    </div>
                )}

                <div className="flex gap-2 mb-4 overflow-x-auto">
                    <button
                        onClick={() => setFiltreModule('tous')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            filtreModule === 'tous'
                                ? 'bg-dominant-100 text-dominant-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                    >
                        <Filter className="h-3.5 w-3.5" />
                        Tous
                    </button>
                    {modules.map((module) => (
                        <button
                            key={module}
                            onClick={() => setFiltreModule(module)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                filtreModule === module
                                    ? 'bg-dominant-100 text-dominant-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            {module}
                        </button>
                    ))}
                </div>

                <div className="space-y-1">
                    {permissionsFiltrees.map((perm) => {
                        const isDirect = idsDirectes.has(permissionIdByCode.get(perm) || '');
                        return (
                            <div
                                key={perm}
                                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                                    isDirect ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/40'
                                }`}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    {isDirect ? (
                                        <Unlock className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                    ) : (
                                        <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                    )}
                                    <span className={`font-mono text-xs ${isDirect ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {perm}
                                    </span>
                                    {isDirect && (
                                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                                            directe
                                        </span>
                                    )}
                                </div>
                                {isDirect && peutGererPermissions && (
                                    <button
                                        onClick={() => {
                                            const pid = permissionIdByCode.get(perm);
                                            if (pid) handleRetirerPermission(pid, perm);
                                        }}
                                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                        title="Retirer cette permission"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {permissionsFiltrees.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p>Aucune permission</p>
                        </div>
                    )}
                </div>
            </CardSection>

            <CustomModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                title="Ajouter une permission"
                description="Attribuer une permission directe à cet utilisateur"
                size="lg"
                footer={
                    <>
                        <ElisaButton variant="outline" onClick={() => { setShowAddModal(false); setSelectedNewPermission(''); }} disabled={assignerPermission.isPending}>
                            Annuler
                        </ElisaButton>
                        <ElisaButton variant="primary" isLoading={assignerPermission.isPending} disabled={!selectedNewPermission} onClick={handleAssignerPermission}>
                            Ajouter
                        </ElisaButton>
                    </>
                }
            >
                <div className="space-y-4">
                    {permissionsGroupes?.map((groupe) => (
                        <details key={groupe.module} className="group">
                            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                <Shield className="h-4 w-4 text-dominant-500" />
                                {groupe.libelle}
                                <span className="text-xs text-gray-400 ml-auto">({groupe.permissions.length})</span>
                            </summary>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-1 ml-4">
                                {groupe.permissions.map((perm) => {
                                    const isAlreadyDirect = idsDirectes.has(perm.id);
                                    const isAlreadyEffective = permissionsEffectives.includes(perm.code);
                                    return (
                                        <button
                                            key={perm.id}
                                            disabled={isAlreadyDirect}
                                            onClick={() => setSelectedNewPermission(perm.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs text-left transition-colors ${
                                                selectedNewPermission === perm.id
                                                    ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400 dark:bg-blue-900/40 dark:text-blue-300'
                                                    : isAlreadyDirect
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                                                        : 'hover:bg-gray-50 text-gray-700 dark:hover:bg-gray-800/60 dark:text-gray-300'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                                selectedNewPermission === perm.id
                                                    ? 'bg-blue-600 border-blue-600'
                                                    : isAlreadyDirect
                                                        ? 'border-gray-300 bg-gray-200 dark:border-gray-500 dark:bg-gray-700'
                                                        : 'border-gray-300 dark:border-gray-500'
                                            }`}>
                                                {selectedNewPermission === perm.id && (
                                                    <CheckCircle className="h-3 w-3 text-white" />
                                                )}
                                                {isAlreadyDirect && (
                                                    <Lock className="h-3 w-3 text-gray-400" />
                                                )}
                                            </div>
                                            <span className="font-mono">{perm.code}</span>
                                            {!isAlreadyEffective && !isAlreadyDirect && (
                                                <span className="text-[10px] text-orange-600 bg-orange-50 px-1 rounded ml-auto dark:bg-orange-900/30 dark:text-orange-400">
                                                    nouveau
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </details>
                    ))}
                </div>
            </CustomModal>

            <ChangeRoleModal
                open={showChangeRoleModal}
                onOpenChange={setShowChangeRoleModal}
                utilisateur={utilisateur}
            />

            {confirm.ConfirmationModal}
        </div>
    );
}
