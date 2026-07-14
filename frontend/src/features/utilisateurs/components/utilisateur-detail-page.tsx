import { useState, useCallback } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    User, Shield, Activity, Settings,
    Edit, CheckCircle, XCircle, AlertCircle, Lock, Briefcase, Eye, QrCode, Download, Loader2,
} from 'lucide-react';
import {
    useUtilisateur,
    useForcePasswordReset,
    useToggle2FA,
    useToggleSuspension,
    useRevokeSessions,
    useQRCode,
} from '../hooks/use-utilisateurs';
import { ChangeRoleModal } from './change-role-modal';
import { InfoProfilModal } from './info-profil-modal';
import { TabInformations } from './tab-informations';
import { TabRolesPermissions } from './tab-roles-permissions';
import { TabActivite } from './tab-activite';
import { TabSecurite } from './tab-securite';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ImagePreview } from '@/components/ui/ImagePreview';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/modals/CustomModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { usePermissions } from '@/hooks';

type Onglet = 'informations' | 'roles-permissions' | 'activite' | 'securite';

export function UtilisateurDetailPage() {
    const { id } = useParams({ from: '/_auth/utilisateurs/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/_auth/utilisateurs/$id' });
    const { hasPermission } = usePermissions();
    const { t } = useTranslation('utilisateurs');

    const ongletActif = (search as any)?.tab || 'informations';
    const setOngletActif = (tab: Onglet) => navigate({ to: '/utilisateurs/$id', params: { id }, search: { tab } as any });

    const [profilModalOpen, setProfilModalOpen] = useState(false);
    const [showChangeRoleModal, setShowChangeRoleModal] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [qrPreviewOpen, setQrPreviewOpen] = useState(false);

    const { data: utilisateur, isLoading, error, refetch } = useUtilisateur(id);
    const { data: qrCodeUrl } = useQRCode(id);
    const forceReset = useForcePasswordReset();
    const toggle2FA = useToggle2FA();
    const toggleSuspension = useToggleSuspension();
    const revokeSessions = useRevokeSessions();
    const confirm = useConfirmation();

    const onglets: Tab[] = [
        { id: 'informations', label: t('tabInformations'), description: t('tabInformationsDesc'), icon: User },
        { id: 'roles-permissions', label: t('tabRolesPermissions'), description: t('tabRolesPermissionsDesc'), icon: Shield },
        { id: 'activite', label: t('tabActivite'), description: t('tabActiviteDesc'), icon: Activity },
        { id: 'securite', label: t('tabSecurite'), description: t('tabSecuriteDesc'), icon: Settings },
    ];

    const handleForcePasswordReset = useCallback(() => {
        confirm.ask({
            title: 'Réinitialiser le mot de passe',
            message: `Forcer la réinitialisation du mot de passe pour ${utilisateur?.prenom} ${utilisateur?.nom} ?`,
            details: 'Les sessions actives seront révoquées. L\'utilisateur devra créer un nouveau mot de passe.',
            variant: 'warning',
            onConfirm: () => forceReset.mutateAsync(id),
        });
    }, [id, utilisateur, confirm, forceReset]);

    const handleToggle2FA = useCallback((actif: boolean) => {
        toggle2FA.mutate({ id, actif });
    }, [id, toggle2FA]);

    const handleToggleSuspension = useCallback(() => {
        if (!utilisateur) return;
        const estActif = utilisateur.statut === 'ACTIF';
        const nouveauStatut = estActif ? 'SUSPENDU' : 'ACTIF';
        confirm.ask({
            title: estActif ? 'Suspendre le compte' : 'Réactiver le compte',
            message: estActif
                ? `Suspendre le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`
                : `Réactiver le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`,
            details: estActif
                ? 'L\'utilisateur ne pourra plus se connecter jusqu\'à la réactivation.'
                : 'L\'utilisateur pourra à nouveau se connecter.',
            variant: estActif ? 'danger' : 'info',
            onConfirm: () => toggleSuspension.mutateAsync({ id, statut: nouveauStatut }),
        });
    }, [id, utilisateur, confirm, toggleSuspension]);

    const handleRevokeSessions = useCallback(() => {
        confirm.ask({
            title: 'Révoquer les sessions',
            message: `Déconnecter toutes les sessions actives de ${utilisateur?.prenom} ${utilisateur?.nom} ?`,
            details: 'L\'utilisateur sera déconnecté de tous ses appareils et devra se reconnecter.',
            variant: 'warning',
            onConfirm: () => revokeSessions.mutateAsync(id),
        });
    }, [id, utilisateur, confirm, revokeSessions]);

    if (isLoading) {
        return <PageSkeleton showHeader />;
    }

    if (error || !utilisateur) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('utilisateurNonTrouve')}
                    message={error?.message || t('impossibleChargerDetails')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                breadcrumbLabel={`${utilisateur.prenom} ${utilisateur.nom}`}
                onBack={() => navigate({ to: '/utilisateurs' })}
                actions={
                    <div className="flex gap-2">
                        {hasPermission('utilisateurs:profil:update') && (
                            <ElisaButton variant="primary" size="sm" icon={<Edit className="h-4 w-4" />}
                                onClick={() => setProfilModalOpen(true)}>{t('modifierProfil')}</ElisaButton>
                        )}
                    </div>
                }
            >
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    {utilisateur.profil?.photoUrl || utilisateur.profil?.photoThumbnail ? (
                        <button onClick={() => setImagePreview(utilisateur.profil!.photoUrl!)}
                            className="group relative shrink-0">
                            <img src={utilisateur.profil.photoThumbnail || utilisateur.profil.photoUrl}
                                alt="Photo de profil"
                                className="h-[clamp(3rem,10vw,8rem)] w-[clamp(3rem,10vw,8rem)] rounded-full object-cover border-[clamp(2px,0.3vw,4px)] border-white/30 shadow-sm group-hover:brightness-75 transition-all" />
                            <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-[clamp(1rem,3vw,2.5rem)] w-[clamp(1rem,3vw,2.5rem)] text-white drop-shadow-lg" />
                            </div>
                        </button>
                    ) : (
                        <div className="h-[clamp(3rem,10vw,8rem)] w-[clamp(3rem,10vw,8rem)] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[clamp(0.875rem,3vw,2.5rem)] font-bold text-white shadow-md shrink-0">
                            {(utilisateur.prenom?.charAt(0) ?? '') + (utilisateur.nom?.charAt(0) ?? '') || '?'}
                        </div>
                    )}
                    <div className="space-y-2">
                        <h1 className="text-[clamp(1.5rem,4.5vw,3.5rem)] font-bold text-white leading-tight">
                            {utilisateur.prenom} {utilisateur.nom}
                        </h1>
                        <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-white/70">{utilisateur.email}</p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium ${
                                utilisateur.statut === 'ACTIF' ? 'bg-green-500/20 text-green-200' :
                                utilisateur.statut === 'SUSPENDU' ? 'bg-red-500/20 text-red-200' :
                                'bg-gray-500/20 text-gray-200'
                            }`}>
                                {utilisateur.statut === 'ACTIF' ? <CheckCircle className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" /> :
                                 utilisateur.statut === 'SUSPENDU' ? <XCircle className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" /> :
                                 <AlertCircle className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />}
                                {utilisateur.statut === 'ACTIF' ? t('actif') :
                                 utilisateur.statut === 'SUSPENDU' ? t('suspendu') : t('inactif')}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-white/80">
                                <Shield className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                {utilisateur.role}
                            </span>
                            {utilisateur.deuxFacteursActif && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-blue-200">
                                    <Lock className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                    2FA
                                </span>
                            )}
                            {utilisateur.membrePersonnel && (
                                <button
                                    onClick={() => navigate({ to: '/personnel/$id' as any, params: { id: utilisateur.membrePersonnel!.id } } as any)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-purple-200 hover:bg-purple-500/30 transition-colors"
                                >
                                    <Briefcase className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                    {utilisateur.membrePersonnel.matricule}
                                </button>
                            )}
                            {utilisateur.qrCodeId && (
                                <button
                                    onClick={() => setQrPreviewOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-[clamp(0.65rem,1.4vw,0.8rem)] font-medium text-blue-200 hover:bg-blue-500/30 transition-colors"
                                >
                                    <QrCode className="h-[clamp(0.7rem,1.2vw,0.85rem)] w-[clamp(0.7rem,1.2vw,0.85rem)]" />
                                    QR
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </PageHeader>

            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as Onglet)}
                variant="underline"
                showHeader
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'informations' && <TabInformations utilisateur={utilisateur} />}
                {ongletActif === 'roles-permissions' && <TabRolesPermissions utilisateur={utilisateur} />}
                {ongletActif === 'activite' && <TabActivite utilisateur={utilisateur} />}
                {ongletActif === 'securite' && (
                    <TabSecurite
                        utilisateur={utilisateur}
                        hasPermission={hasPermission}
                        onForcePasswordReset={handleForcePasswordReset}
                        onToggle2FA={handleToggle2FA}
                        onToggleSuspension={handleToggleSuspension}
                        onRevokeSessions={handleRevokeSessions}
                        isLoading={{
                            forceReset: forceReset.isPending,
                            toggle2FA: toggle2FA.isPending,
                            toggleSuspension: toggleSuspension.isPending,
                            revokeSessions: revokeSessions.isPending,
                        }}
                    />
                )}
            </TabsContent>

            {confirm.ConfirmationModal}

            <InfoProfilModal
                open={profilModalOpen}
                onOpenChange={setProfilModalOpen}
                utilisateur={utilisateur}
            />

            <ChangeRoleModal
                open={showChangeRoleModal}
                onOpenChange={setShowChangeRoleModal}
                utilisateur={utilisateur}
            />

            <ImagePreview
                open={!!imagePreview}
                onClose={() => setImagePreview(null)}
                imageUrl={imagePreview ?? ''}
                title={'Photo de profil'}
                filename={'photo-profil'}
            />

            <CustomModal
                open={qrPreviewOpen}
                onOpenChange={setQrPreviewOpen}
                title={t('qrCode')}
                size="sm"
                footer={
                    qrCodeUrl ? (
                        <a
                            href={qrCodeUrl}
                            download={`qr-${utilisateur.id}.png`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-700)] transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            {t('telechargerQR') || 'Télécharger'}
                        </a>
                    ) : undefined
                }
            >
                <div className="flex flex-col items-center gap-4 py-4">
                    {qrCodeUrl ? (
                        <img
                            src={qrCodeUrl}
                            alt="QR Code"
                            className="w-64 h-64 object-contain rounded-xl border border-gray-200 dark:border-gray-700"
                        />
                    ) : (
                        <div className="flex items-center justify-center w-64 h-64 rounded-xl bg-gray-100 dark:bg-gray-800">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    )}
                    {utilisateur.qrCodeId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            ID: {utilisateur.qrCodeId}
                        </p>
                    )}
                </div>
            </CustomModal>
        </div>
    );
}
