/**
 * ==================================
 * eLISAschool - Role Builder Page
 * ==================================
 * Gestion des rôles plateforme (défaut + personnalisés).
 *
 * Composants :
 * - Liste des rôles avec badges système/custom
 * - Bouton créer rôle personnalisé
 * - Matrice permissions visuelle
 * - Modal formulaire rôle
 *
 * V2.5 — Panel Admin Enterprise
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyRound, Shield, Plus, Edit, Trash2,
    CheckCircle2, XCircle, Lock, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    usePlatformRoles,
    useCreateRole,
    useDeleteRole,
    type PlatformRole,
} from '@/features/platform/hooks/use-platform-roles';

// =============================================
// Types
// =============================================

interface ModulePermission {
    module: string;
    label: string;
    actions: string[];
}

// =============================================
// Modules de permissions
// =============================================

const MODULES_PERMISSIONS: ModulePermission[] = [
    { module: 'administration', label: 'Administration', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'securite', label: 'Sécurité', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'support', label: 'Support', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'commercial', label: 'Commercial', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'monitoring', label: 'Monitoring', actions: ['read'] },
    { module: 'audit', label: 'Audit', actions: ['read'] },
    { module: 'roles', label: 'Rôles', actions: ['manage'] },
];

const ACTION_LABELS: Record<string, string> = {
    create: 'Créer',
    read: 'Lire',
    update: 'Modifier',
    delete: 'Supprimer',
    manage: 'Gérer',
};

// =============================================
// Composant principal
// =============================================

export function RoleBuilderPage() {
    const { t } = useTranslation('admin');
    const { data: roles = [], isLoading } = usePlatformRoles();
    const createRole = useCreateRole();
    const deleteRole = useDeleteRole();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleDesc, setNewRoleDesc] = useState('');

    return (
        <div className="p-[var(--space-lg)]">
            {/* Header */}
            <div className="mb-[var(--space-lg)] flex items-center justify-between">
                <div>
                    <h1 className="text-[clamp(1.25rem,3vw,1.75rem)] font-bold text-[var(--color-texte)]">
                        {t('platformRoles.titre', 'Role Builder')}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--color-texte-muted)]">
                        {t('platformRoles.description', 'Gestion des rôles plateforme — système et personnalisés')}
                    </p>
                </div>
                <motion.button
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-dominante)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-dominante)]/90"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus className="h-4 w-4" />
                    {t('platformRoles.creerRole', 'Nouveau rôle')}
                </motion.button>
            </div>

            {/* Matrice permissions */}
            <div className="mb-[var(--space-lg)]">
                <h2 className="mb-[var(--space-md)] text-sm font-semibold text-[var(--color-texte)]">
                    {t('platformRoles.matriceTitre', 'Matrice des permissions')}
                </h2>
                <div className="overflow-x-auto rounded-xl border border-[var(--color-bordure)]">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-[var(--color-bordure)] bg-[var(--color-surface)]">
                            <tr>
                                <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">
                                    {t('platformRoles.module', 'Module')}
                                </th>
                                <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">
                                    {t('platformRoles.actions', 'Actions')}
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-[var(--color-texte-muted)]">
                                    {t('platformRoles.rolesSysteme', 'Rôles système')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-bordure)] bg-[var(--color-surface)]">
                            {MODULES_PERMISSIONS.map((mod) => (
                                <tr key={mod.module} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <KeyRound className="h-4 w-4 text-[var(--color-dominante)]" />
                                            <span className="font-medium text-[var(--color-texte)]">{mod.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {mod.actions.map((action) => (
                                                <span
                                                    key={action}
                                                    className="rounded bg-[var(--color-fond)] px-2 py-0.5 text-xs text-[var(--color-texte-muted)]"
                                                >
                                                    {ACTION_LABELS[action] || action}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-xs text-[var(--color-texte-muted)]">
                                            — (API requise)
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Liste des rôles */}
            <div>
                <h2 className="mb-[var(--space-md)] text-sm font-semibold text-[var(--color-texte)]">
                    {t('platformRoles.listeRoles', 'Rôles')}
                </h2>
                <div className="overflow-hidden rounded-xl border border-[var(--color-bordure)]">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-[var(--color-bordure)] bg-[var(--color-surface)]">
                            <tr>
                                <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformRoles.nom', 'Nom')}</th>
                                <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformRoles.description', 'Description')}</th>
                                <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformRoles.type', 'Type')}</th>
                                <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformRoles.scope', 'Scope')}</th>
                                <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformRoles.permissions', 'Permissions')}</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-bordure)] bg-[var(--color-surface)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-dominante)]" />
                                    </td>
                                </tr>
                            ) : roles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Shield className="mx-auto h-10 w-10 text-[var(--color-texte-muted)]/30" />
                                        <p className="mt-3 text-sm text-[var(--color-texte-muted)]">
                                            {t('platformRoles.aucunRole', 'Aucun rôle configuré')}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--color-texte-muted)]/60">
                                            {t('platformRoles.rolesSystemeAuto', 'Les rôles système seront créés automatiquement après migration')}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                roles.map((role) => (
                                    <tr key={role.id} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                                        <td className="px-4 py-3 font-medium text-[var(--color-texte)]">{role.nom}</td>
                                        <td className="px-4 py-3 text-[var(--color-texte-muted)]">{role.description || '—'}</td>
                                        <td className="px-4 py-3">
                                            {role.estSysteme ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-danger)]">
                                                    <Lock className="h-3 w-3" /> Système
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-[var(--color-dominante)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-dominante)]">
                                                    Custom
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--color-texte-muted)]">
                                            {role.scopeType === 'global' ? 'Global' : 'Groupe'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-[var(--color-texte-muted)]">
                                            {role.permissions.length} permissions
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    className="rounded p-1 text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                                                    onClick={() => setSelectedRole(role)}
                                                    title="Voir détail"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                {!role.estSysteme && (
                                                    <button
                                                        className="rounded p-1 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                                                        title="Supprimer"
                                                        onClick={() => deleteRole.mutate(role.id)}
                                                        disabled={deleteRole.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal création */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            className="w-full max-w-lg rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-lg)] shadow-xl"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-lg font-bold text-[var(--color-texte)]">
                                {t('platformRoles.nouveauRole', 'Nouveau rôle personnalisé')}
                            </h2>
                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                                        {t('platformRoles.nomRole', 'Nom du rôle')}
                                    </label>
                                    <input
                                        type="text"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm"
                                        placeholder="Ex: GESTIONNAIRE_CONTENU"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                                        {t('platformRoles.descriptionRole', 'Description')}
                                    </label>
                                    <input
                                        type="text"
                                        value={newRoleDesc}
                                        onChange={(e) => setNewRoleDesc(e.target.value)}
                                        className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm"
                                        placeholder="Ex: Gestion du contenu pédagogique"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    className="rounded-lg border border-[var(--color-bordure)] px-4 py-2 text-sm text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]"
                                    onClick={() => { setShowCreateModal(false); setNewRoleName(''); setNewRoleDesc(''); }}
                                >
                                    {t('platformRoles.annuler', 'Annuler')}
                                </button>
                                <button
                                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-dominante)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                    disabled={!newRoleName.trim() || createRole.isPending}
                                    onClick={() => {
                                        createRole.mutate(
                                            { nom: newRoleName.trim(), description: newRoleDesc.trim() || undefined },
                                            { onSuccess: () => { setShowCreateModal(false); setNewRoleName(''); setNewRoleDesc(''); } },
                                        );
                                    }}
                                >
                                    {createRole.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {t('platformRoles.creer', 'Créer')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default RoleBuilderPage;
