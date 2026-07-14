import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Edit, Trash2, Briefcase, Building2, Target, ListChecks, ChevronRight, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import { usePoste, useSupprimerPoste } from '../hooks/use-postes';
import { PosteFormModal } from './poste-form-modal';
import { PosteCapaciteIndicator } from './PosteCapaciteIndicator';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import { NIVEAUX_RESPONSABILITE_OPTIONS, STATUT_POSTE_OPTIONS } from '../types/poste.zod';
import { getTypeColor, getTypeIcon } from '@/features/personnel/constants/type-personnel-colors';

const statutColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    ACTIF: 'success', VACANT: 'warning', SUPPRIME: 'danger', EN_ATTENTE: 'default',
};

export function PosteDetailPage() {
    const { t } = useTranslation('organisation');
    const { id } = useParams({ from: '/_auth/organisation/postes/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: poste, isLoading } = usePoste(id);
    const supprimer = useSupprimerPoste();

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const statutLabel = STATUT_POSTE_OPTIONS.find((o) => o.value === poste?.statut)?.label || poste?.statut;
    const typeNom = poste?.typePersonnel?.nom || poste?.typePersonnelId || '-';
    const typeCode = poste?.typePersonnel?.code;
    const TypeIcon = typeCode ? getTypeIcon(typeCode) : UserRound;
    const typeColor = typeCode ? getTypeColor(typeCode) : undefined;
    const niveauLabel = NIVEAUX_RESPONSABILITE_OPTIONS.find((o) => o.value === poste?.niveauResponsabilite)?.label || poste?.niveauResponsabilite;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    if (!poste) {
        return (
            <div className="text-center py-12">
                <Briefcase className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Poste non trouvé</h2>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/organisation/postes' })}>Retour aux postes</ElisaButton>
            </div>
        );
    }

    return (
        <BreadcrumbLabelProvider value={poste?.intitulé}>
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate({ to: '/organisation/postes' })} className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-foreground">{poste.intitulé}</h1>
                            <Badge variant={statutColors[poste.statut] || 'default'} size="sm">{statutLabel}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{poste.code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasPermission('postes:edit') && (
                        <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setShowEditModal(true)}>
                            {t('modifier')}
                        </ElisaButton>
                    )}
                    {hasPermission('postes:delete') && (
                        <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteConfirm(true)}>
                            {t('supprimer')}
                        </ElisaButton>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <h2 className="text-lg font-semibold text-foreground mb-4">{t('informations')}</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">{t('code')}</span>
                                <p className="font-medium text-foreground font-mono">{poste.code}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{t('type')}</span>
                                <p className="font-medium text-foreground flex items-center gap-2">
                                    <TypeIcon className="h-4 w-4" style={{ color: typeColor }} />
                                    {typeNom}
                                </p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{t('niveauResponsabilite')}</span>
                                <p className="font-medium text-foreground">{niveauLabel}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{t('modeRemunerationDefaut')}</span>
                                <p className="font-medium text-foreground">{poste.modeRemunerationDefaut || '-'}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">{t('nombrePostes')}</span>
                                <div className="font-medium text-foreground mt-1">
                                    <PosteCapaciteIndicator occupantsCount={poste.occupantsCount} nombrePostes={poste.nombrePostes} size="md" />
                                </div>
                            </div>
                            {poste.description && (
                                <div className="col-span-2">
                                    <span className="text-muted-foreground">{t('description')}</span>
                                    <p className="font-medium text-foreground">{poste.description}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {poste.missions && poste.missions.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-sm border border-border p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <ListChecks className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">{t('missions')}</h2>
                            </div>
                            <ul className="space-y-2">
                                {poste.missions.map((m, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                        <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        {m}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {poste.competencesRequises && poste.competencesRequises.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-sm border border-border p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-semibold text-foreground">Compétences requises</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {poste.competencesRequises.map((c, i) => (
                                    <span key={i} className="px-3 py-1 bg-primary/5 text-primary rounded-full text-sm">{c}</span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                <div className="space-y-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <h3 className="font-semibold text-foreground mb-3">{t('statut')}</h3>
                        <div className={`p-4 rounded-lg ${poste.actif ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                            <p className={`font-medium ${poste.actif ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {poste.actif ? 'Poste actif' : 'Poste inactif'}
                            </p>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-foreground">{t('unites')}</h3>
                        </div>
                        {poste.uniteOrganisationnelle ? (
                            <div>
                                <p className="font-medium text-foreground">{poste.uniteOrganisationnelle.nom}</p>
                                <p className="text-xs text-muted-foreground font-mono">{poste.uniteOrganisationnelle.code}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">-</p>
                        )}
                    </motion.div>

                    {poste.fonction && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl shadow-sm border border-border p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-foreground">{t('fonction')}</h3>
                            </div>
                            <p className="font-medium text-foreground">{poste.fonction.nom}</p>
                            <p className="text-xs text-muted-foreground font-mono">{poste.fonction.code}</p>
                        </motion.div>
                    )}
                </div>
            </div>

            <PosteFormModal open={showEditModal} onOpenChange={setShowEditModal} poste={poste} />

            <ConfirmDialog
                open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}
                title={t('supprimerPoste')} description={t('confirmerSuppressionPoste')}
                confirmText={t('supprimer')} variant="danger"
                onConfirm={async () => { await supprimer.mutateAsync(poste.id); navigate({ to: '/organisation/postes' }); }}
                isLoading={supprimer.isPending}
            />
        </div>
        </BreadcrumbLabelProvider>
    );
}
