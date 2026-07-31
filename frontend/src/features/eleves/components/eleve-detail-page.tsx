/**
 * ==================================
 * eLISAschool - Page Détail Élève
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Download, Mail, Phone, MapPin, Calendar, User, AlertCircle, Award, ClipboardList, FileText, History } from 'lucide-react';
import { useEleve, useEleveDocuments } from '..';
import { EleveFormModal } from './eleve-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { usePermissions } from '@/hooks';
import { AuditTimeline } from '@/components/ui/AuditTimeline';
import type { StatutEleve } from '../types/eleve.types';

const ONGLETS = ['informations', 'scolarite', 'finances', 'documents', 'historique'] as const;
type OngletType = typeof ONGLETS[number];

const STATUT_STYLES: Record<StatutEleve, string> = {
    ACTIF: 'bg-success/15 text-success',
    EXCLU: 'bg-destructive/15 text-destructive',
    ABANDON: 'bg-muted text-muted-foreground',
    DIPLOME: 'bg-primary/15 text-primary',
};

export function EleveDetailPage() {
    const { id } = useParams({ from: '/_auth/eleves/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('eleves');
    const { hasPermission } = usePermissions();
    const search = useSearch({ from: '/_auth/eleves/$id' }) as { tab?: string };
    const ongletsAutorises = ONGLETS.filter(o => o !== 'historique' || hasPermission('audit:eleves:view') || hasPermission('audit:view'));
    const ongletActif = (ongletsAutorises.includes(search.tab as OngletType) ? search.tab : 'informations') as OngletType;
    const [modalEditionOpen, setModalEditionOpen] = useState(false);

    const { data: eleve, isLoading } = useEleve(id);
    const { data: documents } = useEleveDocuments(id);

    const setOngletActif = (tab: OngletType) => {
        navigate({ search: { tab } as never });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-lg text-muted-foreground">{t('chargement')}</p>
            </div>
        );
    }

    if (!eleve) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <AlertCircle className="mb-4 h-16 w-16 text-destructive" />
                <p className="text-lg text-muted-foreground">{t('detail.eleveNonTrouve')}</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/eleves' })} className="mt-4">
                    {t('detail.retourListe')}
                </ElisaButton>
            </div>
        );
    }

    const calculerAge = (dateNaissance: string) => {
        const today = new Date();
        const birthDate = new Date(dateNaissance);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getStatutLabel = (statut: StatutEleve) => {
        const labels: Record<StatutEleve, string> = {
            ACTIF: t('statut.actif'),
            EXCLU: t('statut.exclu'),
            ABANDON: t('statut.abandon'),
            DIPLOME: t('statut.diplome'),
        };
        return labels[statut];
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader showBreadcrumbs />

            {/* En-tête */}
            <motion.div
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<ArrowLeft className="h-4 w-4" />}
                            onClick={() => navigate({ to: '/eleves' })}
                        >
                            {t('detail.retourListe')}
                        </ElisaButton>

                        <div className="flex items-center gap-4">
                            {eleve.photo ? (
                                <img
                                    src={eleve.photo}
                                    alt={`${eleve.prenom} ${eleve.nom}`}
                                    className="h-20 w-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-dominant-100)] text-3xl font-bold text-[var(--color-dominant-700)]">
                                    {eleve.prenom[0]}{eleve.nom[0]}
                                </div>
                            )}

                            <div>
                                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {eleve.prenom} {eleve.nom}
                                </h1>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-sm text-[var(--color-dominant-600)]">
                                        {t('detail.matricule')}: {eleve.matricule}
                                    </span>
                                    <span className="text-sm text-muted-foreground">•</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLES[eleve.statut as StatutEleve]}`}
                                    >
                                        {getStatutLabel(eleve.statut)}
                                    </span>
                                    {eleve.classe && (
                                        <>
                                            <span className="text-sm text-muted-foreground">•</span>
                                            <button
                                                type="button"
                                                className="rounded bg-[var(--color-secondary-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-secondary-700)] hover:bg-[var(--color-secondary-200)] transition-colors"
                                                onClick={() => navigate({ to: '/classes/$id', params: { id: eleve.classe!.id } })}
                                            >
                                                {eleve.classe.nom}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {hasPermission('eleves:edit') && (
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Edit className="h-4 w-4" />}
                                onClick={() => setModalEditionOpen(true)}
                            >
                                {t('actions.modifier')}
                            </ElisaButton>
                        )}
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Download className="h-4 w-4" />}
                        >
                            {t('detail.exporterFiche')}
                        </ElisaButton>
                    </div>
                </div>
            </motion.div>

            {/* Onglets */}
            <motion.div
                className="border-b border-[var(--color-border)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex gap-1">
                    {ongletsAutorises.map((onglet) => (
                        <button
                            key={onglet}
                            onClick={() => setOngletActif(onglet)}
                            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-all ${
                                ongletActif === onglet
                                    ? 'border-b-2 border-[var(--color-dominant-600)] bg-[var(--color-surface)] text-[var(--color-dominant-600)]'
                                    : 'text-muted-foreground hover:bg-[var(--color-hover)]'
                            }`}
                        >
                            {t(`onglets.${onglet}`)}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Contenu des onglets */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                {ongletActif === 'informations' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Identité */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <User className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('detail.sectionIdentite')}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.nomComplet')}</span>
                                    <span className="font-medium">{eleve.prenom} {eleve.nom}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.neLe')}</span>
                                    <span className="font-medium">
                                        {new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')} {t('detail.a')} {eleve.lieuNaissance}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.age')}</span>
                                    <span className="font-medium">{calculerAge(eleve.dateNaissance)} {t('detail.ans')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.sexe')}</span>
                                    <span className="font-medium">{eleve.sexe === 'M' ? t('detail.masculin') : t('detail.feminin')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.nationalite')}</span>
                                    <span className="font-medium">{eleve.nationalite || t('detail.nationaliteDefaut')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.sousSysteme')}</span>
                                    <span className="font-medium">{eleve.sousSysteme === 'FRANCOPHONE' ? t('detail.francophone') : t('detail.anglophone')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <MapPin className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('detail.sectionContact')}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{eleve.utilisateur?.telephone || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{eleve.utilisateur?.email || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                    <span>{eleve.adresseDomicile || t('detail.nonDefini')}</span>
                                </div>
                                {eleve.ville && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('detail.ville')}</span>
                                        <span className="font-medium">{eleve.ville}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Père */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <User className="h-5 w-5 text-primary" />
                                {t('detail.sectionPere')}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.nom')}</span>
                                    <span className="font-medium">{eleve.nomPere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.profession')}</span>
                                    <span className="font-medium">{eleve.professionPere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{eleve.telephonePere || t('detail.nonDefini')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mère */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <User className="h-5 w-5 text-accent" />
                                {t('detail.sectionMere')}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.nom')}</span>
                                    <span className="font-medium">{eleve.nomMere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('detail.profession')}</span>
                                    <span className="font-medium">{eleve.professionMere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{eleve.telephoneMere || t('detail.nonDefini')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Services */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:col-span-2">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <Award className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('detail.sectionServices')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div className="rounded-lg bg-[var(--color-secondary-50)] p-4 text-center">
                                    <p className="text-xs text-muted-foreground">{t('detail.transport')}</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.transportScolaire ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--color-secondary-50)] p-4 text-center">
                                    <p className="text-xs text-muted-foreground">{t('detail.cantine')}</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.cantine ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--color-secondary-50)] p-4 text-center">
                                    <p className="text-xs text-muted-foreground">{t('detail.boursier')}</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.boursier ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--color-secondary-50)] p-4 text-center">
                                    <p className="text-xs text-muted-foreground">{t('detail.redoublement')}</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.redoublement ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {ongletActif === 'scolarite' && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <ClipboardList className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('detail.notesResume')}
                            </h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {t('detail.notesDescription')}
                            </p>
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<ClipboardList className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/notes', search: { eleveId: eleve.id } as never })}
                            >
                                {t('detail.voirNotes')}
                            </ElisaButton>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <FileText className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('detail.bulletinsResume')}
                            </h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {t('detail.bulletinsDescription')}
                            </p>
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<FileText className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/bulletins', search: { eleveId: eleve.id } as never })}
                            >
                                {t('detail.voirBulletins')}
                            </ElisaButton>
                        </div>
                    </div>
                )}

                {ongletActif === 'finances' && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Calendar className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.financesResume')}
                        </h3>
                        <p className="text-muted-foreground">
                            {t('detail.moduleFinancesPlaceholder')}
                        </p>
                    </div>
                )}

                {ongletActif === 'documents' && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-lg font-semibold">
                                <Download className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                {t('onglets.documents')}
                            </h3>
                            <ElisaButton variant="primary" size="sm">
                                {t('detail.ajouterDocument')}
                            </ElisaButton>
                        </div>

                        {documents && documents.length > 0 ? (
                            <div className="space-y-3">
                                {documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
                                        <div>
                                            <p className="font-medium">{doc.type}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {t('detail.dateUpload')}: {new Date(doc.dateUpload).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <ElisaButton variant="outline" size="sm">
                                            {t('detail.telecharger')}
                                        </ElisaButton>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-muted-foreground">
                                {t('detail.aucunDocument')}
                            </p>
                        )}
                    </div>
                )}

                {ongletActif === 'historique' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('onglets.historique')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AuditTimeline cible="Eleve" cibleId={id} module="eleves" />
                        </CardContent>
                    </Card>
                )}
            </motion.div>

            <EleveFormModal
                open={modalEditionOpen}
                onOpenChange={setModalEditionOpen}
                mode="edition"
                eleve={eleve}
            />
        </div>
    );
}
