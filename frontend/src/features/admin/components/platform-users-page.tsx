/**
 * ==================================
 * eLISAschool - Page Utilisateurs Plateforme
 * ==================================
 * CRUD utilisateurs plateforme avec KPIs, filtres, et audit trail.
 *
 * Composants :
 * - KPIs en haut (total, par rôle, % MFA, sessions)
 * - Toolbar (recherche, filtres rôle/MFA/statut, bouton créer)
 * - Tableau des utilisateurs avec actions
 * - Modal création/édition
 * - Détail avec onglets (Infos, Sessions, Audit, Délégation)
 *
 * V2.4 — Panel Admin Enterprise
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users, Shield, ShieldCheck, UserPlus, Search,
    MoreHorizontal, Eye, Edit, Ban, RotateCcw,
    KeyRound, Clock, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import {
    usePlatformUsers,
    usePlatformUserKpis,
    useCreatePlatformUser,
} from '@/features/platform/hooks/use-platform-users';

// =============================================
// Types
// =============================================

interface UtilisateurPlateforme {
    id: string;
    email: string;
    prenom: string;
    nom: string;
    role: string;
    statut: 'ACTIF' | 'INACTIF' | 'SUSPENDU';
    mfaActive: boolean;
    groupeEtablissementIds: string[];
    createdAt: string;
    lastLoginAt?: string;
}

// =============================================
// Configuration rôles
// =============================================

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    SUPER_ADMIN: { bg: 'var(--color-danger)', text: '#fff' },
    ADMIN_PLATEFORME: { bg: 'var(--color-dominante)', text: '#fff' },
    SUPPORT: { bg: '#06b6d4', text: '#fff' },
    BILLING_MANAGER: { bg: '#f59e0b', text: '#fff' },
    ANALYST: { bg: '#10b981', text: '#fff' },
    AUDITOR: { bg: '#8b5cf6', text: '#fff' },
};

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_PLATEFORME: 'Admin Plateforme',
    SUPPORT: 'Support',
    BILLING_MANAGER: 'Facturation',
    ANALYST: 'Analyste',
    AUDITOR: 'Auditeur',
};

// =============================================
// Composant principal
// =============================================

export function PlatformUsersPage() {
    const { t } = useTranslation('admin');
    const [searchQuery, setSearchQuery] = useState('');
    const [filtreRole, setFiltreRole] = useState<string>('');
    const [filtreStatut, setFiltreStatut] = useState<string>('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UtilisateurPlateforme | null>(null);
    const [newEmail, setNewEmail] = useState('');
    const [newPrenom, setNewPrenom] = useState('');
    const [newNom, setNewNom] = useState('');
    const [newRole, setNewRole] = useState('ADMIN_PLATEFORME');

    // Appels API réels (Modèle C Dual-Plane)
    const { data: usersData, isLoading } = usePlatformUsers({
        search: searchQuery || undefined,
        role: filtreRole || undefined,
        statut: filtreStatut || undefined,
    });
    const { data: kpis } = usePlatformUserKpis();
    const createUser = useCreatePlatformUser();

    const utilisateurs = (usersData as any)?.items || [];

    const handleCreate = useCallback(() => {
        setShowCreateModal(true);
    }, []);

    return (
        <div className="p-[var(--space-lg)]">
            {/* Header */}
            <div className="mb-[var(--space-lg)] flex items-center justify-between">
                <div>
                    <h1 className="text-[clamp(1.25rem,3vw,1.75rem)] font-bold text-[var(--color-texte)]">
                        {t('navigation.utilisateurs')}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--color-texte-muted)]">
                        {t('sidebar.descUtilisateurs')}
                    </p>
                </div>
                <motion.button
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--color-dominante)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--color-dominante)]/90"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                >
                    <UserPlus className="h-4 w-4" />
                    {t('platformUsers.creer', 'Nouveau compte')}
                </motion.button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard icon={Users} label={t('platformUsers.total', 'Total comptes')} value={kpis ? String(kpis.total) : '—'} color="var(--color-dominante)" />
                <KpiCard icon={Shield} label={t('platformUsers.superAdmins', 'Super Admins')} value={kpis ? String(kpis.parRole?.SUPER_ADMIN || 0) : '—'} color="var(--color-danger)" />
                <KpiCard icon={ShieldCheck} label={t('platformUsers.mfaActif', 'MFA actif')} value={kpis ? `${kpis.mfaActive || 0}%` : '—'} color="var(--color-success)" />
                <KpiCard icon={Clock} label={t('platformUsers.sessionsActives', 'Sessions actives')} value={kpis ? String(kpis.sessionsActives || 0) : '—'} color="#8b5cf6" />
            </div>

            {/* Toolbar */}
            <div className="mt-[var(--space-lg)] flex flex-col gap-[var(--gap-md)] sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-texte-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('platformUsers.rechercher', 'Rechercher un utilisateur...')}
                        className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] pl-9 pr-3 text-sm text-[var(--color-texte)] placeholder:text-[var(--color-texte-muted)]/60 focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]/20"
                    />
                </div>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <select
                        value={filtreRole}
                        onChange={(e) => setFiltreRole(e.target.value)}
                        className="h-9 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm text-[var(--color-texte)]"
                    >
                        <option value="">{t('platformUsers.tousRoles', 'Tous les rôles')}</option>
                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <select
                        value={filtreStatut}
                        onChange={(e) => setFiltreStatut(e.target.value)}
                        className="h-9 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm text-[var(--color-texte)]"
                    >
                        <option value="">{t('platformUsers.tousStatuts', 'Tous les statuts')}</option>
                        <option value="ACTIF">Actif</option>
                        <option value="INACTIF">Inactif</option>
                        <option value="SUSPENDU">Suspendu</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="mt-[var(--space-md)] overflow-hidden rounded-xl border border-[var(--color-bordure)]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-dominante)]" />
                    </div>
                ) : (
                <table className="w-full text-left text-sm">
                    <thead className="border-b border-[var(--color-bordure)] bg-[var(--color-surface)]">
                        <tr>
                            <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformUsers.utilisateur', 'Utilisateur')}</th>
                            <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformUsers.role', 'Rôle')}</th>
                            <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformUsers.statut', 'Statut')}</th>
                            <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">MFA</th>
                            <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]">{t('platformUsers.derniereConnexion', 'Dernière connexion')}</th>
                            <th className="px-4 py-3 font-medium text-[var(--color-texte-muted)]"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-bordure)] bg-[var(--color-surface)]">
                        {utilisateurs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center">
                                    <Users className="mx-auto h-10 w-10 text-[var(--color-texte-muted)]/30" />
                                    <p className="mt-3 text-sm text-[var(--color-texte-muted)]">
                                        {t('platformUsers.aucunUtilisateur', 'Aucun utilisateur plateforme')}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--color-texte-muted)]/60">
                                        {t('platformUsers.creerPremierCompte', 'Créez le premier compte administrateur')}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            utilisateurs.map((user) => (
                                <tr key={user.id} className="transition-colors hover:bg-[var(--color-surface-hover)]">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                                style={{ backgroundColor: 'var(--color-dominante)' }}
                                            >
                                                {user.prenom[0]}{user.nom[0]}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--color-texte)]">{user.prenom} {user.nom}</p>
                                                <p className="text-xs text-[var(--color-texte-muted)]">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <RoleBadge role={user.role} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatutBadge statut={user.statut} />
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.mfaActive ? (
                                            <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-[var(--color-warning)]" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-[var(--color-texte-muted)]">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger asChild>
                                                <button className="rounded p-1 text-[var(--color-texte-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Portal>
                                                <DropdownMenu.Content
                                                    align="end"
                                                    sideOffset={4}
                                                    className="z-50 w-48 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-1 shadow-lg"
                                                >
                                                    <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]" onSelect={() => setSelectedUser(user)}>
                                                        <Eye className="h-3.5 w-3.5" /> {t('platformUsers.voir', 'Voir détail')}
                                                    </DropdownMenu.Item>
                                                    <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]">
                                                        <Edit className="h-3.5 w-3.5" /> {t('platformUsers.modifier', 'Modifier')}
                                                    </DropdownMenu.Item>
                                                    <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-bordure)]" />
                                                    <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--color-texte)] outline-none focus:bg-[var(--color-surface-hover)]">
                                                        <KeyRound className="h-3.5 w-3.5" /> {t('platformUsers.revoquerSessions', 'Révoquer sessions')}
                                                    </DropdownMenu.Item>
                                                    <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-bordure)]" />
                                                    {user.statut === 'ACTIF' ? (
                                                        <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--color-danger)] outline-none focus:bg-[var(--color-danger)]/10">
                                                            <Ban className="h-3.5 w-3.5" /> {t('platformUsers.desactiver', 'Désactiver')}
                                                        </DropdownMenu.Item>
                                                    ) : (
                                                        <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-xs text-[var(--color-success)] outline-none focus:bg-[var(--color-success)]/10">
                                                            <RotateCcw className="h-3.5 w-3.5" /> {t('platformUsers.reactiver', 'Réactiver')}
                                                        </DropdownMenu.Item>
                                                    )}
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Portal>
                                        </DropdownMenu.Root>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                )}
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
                                {t('platformUsers.nouveauCompte', 'Nouveau compte plateforme')}
                            </h2>
                            <div className="mt-4 space-y-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm"
                                        placeholder="admin@elisaschool.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">Prénom</label>
                                        <input
                                            type="text"
                                            value={newPrenom}
                                            onChange={(e) => setNewPrenom(e.target.value)}
                                            className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm"
                                            placeholder="Prénom"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">Nom</label>
                                        <input
                                            type="text"
                                            value={newNom}
                                            onChange={(e) => setNewNom(e.target.value)}
                                            className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm"
                                            placeholder="Nom"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[var(--color-texte)]">
                                        {t('platformUsers.role', 'Rôle')}
                                    </label>
                                    <select
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="h-9 w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-fond)] px-3 text-sm"
                                    >
                                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <button
                                    className="rounded-lg border border-[var(--color-bordure)] px-4 py-2 text-sm text-[var(--color-texte)] hover:bg-[var(--color-surface-hover)]"
                                    onClick={() => { setShowCreateModal(false); setNewEmail(''); setNewPrenom(''); setNewNom(''); }}
                                >
                                    {t('platformUsers.annuler', 'Annuler')}
                                </button>
                                <button
                                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-dominante)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                                    disabled={!newEmail.trim() || !newPrenom.trim() || !newNom.trim() || createUser.isPending}
                                    onClick={() => {
                                        createUser.mutate(
                                            { email: newEmail.trim(), prenom: newPrenom.trim(), nom: newNom.trim(), rolePlateforme: newRole },
                                            { onSuccess: () => { setShowCreateModal(false); setNewEmail(''); setNewPrenom(''); setNewNom(''); } },
                                        );
                                    }}
                                >
                                    {createUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {t('platformUsers.creer', 'Créer')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =============================================
// Sous-composants
// =============================================

function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-md)]">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-texte-muted)]">{label}</span>
                <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <p className="mt-2 text-2xl font-bold text-[var(--color-texte)]">{value}</p>
        </div>
    );
}

function RoleBadge({ role }: { role: string }) {
    const colors = ROLE_COLORS[role] || { bg: 'var(--color-texte-muted)', text: '#fff' };
    const label = ROLE_LABELS[role] || role;
    return (
        <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: colors.bg, color: colors.text }}
        >
            {label}
        </span>
    );
}

function StatutBadge({ statut }: { statut: string }) {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        ACTIF: { bg: 'color-mix(in srgb, var(--color-success) 15%, transparent)', text: 'var(--color-success)', label: 'Actif' },
        INACTIF: { bg: 'color-mix(in srgb, var(--color-texte-muted) 15%, transparent)', text: 'var(--color-texte-muted)', label: 'Inactif' },
        SUSPENDU: { bg: 'color-mix(in srgb, var(--color-danger) 15%, transparent)', text: 'var(--color-danger)', label: 'Suspendu' },
    };
    const c = config[statut] || config.INACTIF;
    return (
        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
            {c.label}
        </span>
    );
}

export default PlatformUsersPage;
