/**
 * ==================================
 * eLISAschool - Platform Role Detail
 * ==================================
 * Détail d'un rôle plateforme — permissions, membres, audit.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

function PlatformRoleDetail() {
    const { id } = Route.useParams();
    const { t } = useTranslation('admin');

    const { data: role, isLoading } = useQuery({
        queryKey: ['platform-role', id],
        queryFn: async () => {
            const { data } = await apiClient.get(`/api/platform/roles/${id}`);
            return data.data;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin h-8 w-8 border-2 border-[var(--color-dominante)] border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!role) {
        return (
            <div className="p-[var(--space-lg)]">
                <p className="text-sm text-[var(--color-texte-muted)]">
                    {t('platformRoles.roleIntrouvable', 'Rôle introuvable')}
                </p>
            </div>
        );
    }

    return (
        <div className="p-[var(--space-lg)]">
            {/* Navigation retour */}
            <Link
                to="/platform/roles"
                className="mb-[var(--space-md)] inline-flex items-center gap-2 text-sm text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]"
            >
                <ArrowLeft className="h-4 w-4" />
                {t('platformRoles.retourListe', 'Retour aux rôles')}
            </Link>

            {/* Header rôle */}
            <div className="mb-[var(--space-lg)] flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10">
                    <Shield className="h-6 w-6 text-[var(--color-dominante)]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[var(--color-texte)]">
                        {role.nom || role.code || id}
                    </h1>
                    <div className="mt-1 flex items-center gap-2">
                        {role.estSysteme && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-danger)]">
                                <Lock className="h-3 w-3" /> {t('platformRoles.systeme', 'Système')}
                            </span>
                        )}
                        <span className="text-sm text-[var(--color-texte-muted)]">
                            {role.description || '—'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Permissions du rôle */}
            <div className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-lg)]">
                <h2 className="mb-[var(--space-md)] text-sm font-semibold text-[var(--color-texte)]">
                    {t('platformRoles.permissionsDetail', 'Permissions attribuées')}
                </h2>
                <div className="flex flex-wrap gap-2">
                    {(role.permissions || []).map((perm: string) => (
                        <span
                            key={perm}
                            className="rounded-full bg-[var(--color-dominante)]/10 px-3 py-1 text-xs font-medium text-[var(--color-dominante)]"
                        >
                            {perm}
                        </span>
                    ))}
                    {(!role.permissions || role.permissions.length === 0) && (
                        <p className="text-sm text-[var(--color-texte-muted)]">
                            {t('platformRoles.aucunePermission', 'Aucune permission attribuée')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export const Route = createFileRoute('/platform/roles/$id')({
    component: PlatformRoleDetail,
});

export default PlatformRoleDetail;
