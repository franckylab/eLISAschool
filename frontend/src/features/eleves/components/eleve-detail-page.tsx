/**
 * ==================================
 * eLISAschool - Page Détail Élève
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Download, Mail, Phone, MapPin, Calendar, User, AlertCircle, Award, BookOpen } from 'lucide-react';
import { useEleve } from '../hooks/use-eleves';
import { useEleveResponsables } from '../hooks/use-eleve-responsables';
import { useEleveDocuments } from '../hooks/use-eleve-documents';
import { useEleveSuivi } from '../hooks/use-eleve-suivi';
import { EleveFormModal } from './eleve-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { StatutEleve } from '../types/eleve.types';

const ONGLETS = ['informations', 'scolarite', 'finances', 'documents', 'historique'] as const;
type OngletType = typeof ONGLETS[number];

export function EleveDetailPage() {
    const { id } = useParams({ from: '/_auth/eleves/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('eleves');
    const [ongletActif, setOngletActif] = useState<OngletType>('informations');
    const [modalEditionOpen, setModalEditionOpen] = useState(false);

    const { data: eleveData, isLoading } = useEleve(id);
    const { data: responsables } = useEleveResponsables(id);
    const { data: documents } = useEleveDocuments(id);
    const { data: suivi } = useEleveSuivi(id);

    const eleve = eleveData?.data;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <p className="text-lg text-[var(--color-text-secondary)]">{t('chargement')}</p>
            </div>
        );
    }

    if (!eleve) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
                <p className="text-lg text-[var(--color-text-secondary)]">Élève non trouvé</p>
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

    const getStatutColor = (statut: StatutEleve) => {
        const colors: Record<StatutEleve, string> = {
            ACTIF: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            EXCLU: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            ABANDON: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
            DIPLOME: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        };
        return colors[statut];
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
                                    <span className="text-sm text-[var(--color-text-muted)]">•</span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatutColor(eleve.statut)}`}
                                    >
                                        {getStatutLabel(eleve.statut)}
                                    </span>
                                    {eleve.classe && (
                                        <>
                                            <span className="text-sm text-[var(--color-text-muted)]">•</span>
                                            <span className="rounded bg-[var(--color-secondary-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-secondary-700)]">
                                                {eleve.classe.nom}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Edit className="h-4 w-4" />}
                            onClick={() => setModalEditionOpen(true)}
                        >
                            {t('actions.modifier')}
                        </ElisaButton>
                        <ElisaButton
                            variant="outline"
                            size="sm"
                            icon={<Download className="h-4 w-4" />}
                        >
                            Exporter fiche
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
                    {ONGLETS.map((onglet) => (
                        <button
                            key={onglet}
                            onClick={() => setOngletActif(onglet)}
                            className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-all ${
                                ongletActif === onglet
                                    ? 'border-b-2 border-[var(--color-dominant-600)] bg-[var(--color-surface)] text-[var(--color-dominant-600)]'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
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
                                    <span className="text-[var(--color-text-secondary)]">Nom complet</span>
                                    <span className="font-medium">{eleve.prenom} {eleve.nom}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">{t('detail.neLe')}</span>
                                    <span className="font-medium">
                                        {new Date(eleve.dateNaissance).toLocaleDateString('fr-FR')} {t('detail.a')} {eleve.lieuNaissance}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">{t('detail.age')}</span>
                                    <span className="font-medium">{calculerAge(eleve.dateNaissance)} ans</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">Sexe</span>
                                    <span className="font-medium">{eleve.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">Nationalité</span>
                                    <span className="font-medium">{eleve.nationalite || 'Camerounaise'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">Sous-système</span>
                                    <span className="font-medium">{eleve.sousSysteme === 'FRANCOPHONE' ? 'Francophone' : 'Anglophone'}</span>
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
                                    <Phone className="h-4 w-4 text-[var(--color-text-muted)]" />
                                    <span>{eleve.utilisateur?.telephone || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-[var(--color-text-muted)]" />
                                    <span>{eleve.utilisateur?.email || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-0.5 h-4 w-4 text-[var(--color-text-muted)]" />
                                    <span>{eleve.adresseDomicile || t('detail.nonDefini')}</span>
                                </div>
                                {eleve.ville && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-secondary)]">Ville</span>
                                        <span className="font-medium">{eleve.ville}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Père */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <User className="h-5 w-5 text-blue-600" />
                                {t('detail.sectionPere')}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">Nom</span>
                                    <span className="font-medium">{eleve.nomPere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">{t('detail.profession')}</span>
                                    <span className="font-medium">{eleve.professionPere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-[var(--color-text-muted)]" />
                                    <span>{eleve.telephonePere || t('detail.nonDefini')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mère */}
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <User className="h-5 w-5 text-pink-600" />
                                {t('detail.sectionMere')}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">Nom</span>
                                    <span className="font-medium">{eleve.nomMere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--color-text-secondary)]">{t('detail.profession')}</span>
                                    <span className="font-medium">{eleve.professionMere || t('detail.nonDefini')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-[var(--color-text-muted)]" />
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
                                    <p className="text-xs text-[var(--color-text-secondary)]">Transport</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.transportScolaire ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--color-secondary-50)] p-4 text-center">
                                    <p className="text-xs text-[var(--color-text-secondary)]">Cantine</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.cantine ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--color-secondary-50)] p-4 text-center">
                                    <p className="text-xs text-[var(--color-text-secondary)]">Boursier</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.boursier ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-[var(--color-secondary-50)] p-4 text-center">
                                    <p className="text-xs text-[var(--color-text-secondary)]">Redoublement</p>
                                    <p className="text-lg font-bold text-[var(--color-dominant-600)]">
                                        {eleve.redoublement ? t('detail.oui') : t('detail.non')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {ongletActif === 'scolarite' && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <BookOpen className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.scolariteResume')}
                        </h3>
                        <p className="text-[var(--color-text-secondary)]">
                            Module Notes & Bulletins - À implémenter avec les données du backend
                        </p>
                    </div>
                )}

                {ongletActif === 'finances' && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Calendar className="h-5 w-5 text-[var(--color-dominant-600)]" />
                            {t('detail.financesResume')}
                        </h3>
                        <p className="text-[var(--color-text-secondary)]">
                            Module Finances - À implémenter avec les données du backend
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
                                {documents.map((doc: { id: string; nom: string; type: string }, index: number) => (
                                    <div key={index} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
                                        <div>
                                            <p className="font-medium">{doc.type}</p>
                                            <p className="text-xs text-[var(--color-text-secondary)]">
                                                {t('detail.dateUpload')}: {new Date(doc.dateUpload).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                        <ElisaButton variant="outline" size="sm">
                                            {t('detail.telecharger')}
                                        </ElisaButton>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-8 text-center text-[var(--color-text-secondary)]">
                                {t('detail.aucunDocument')}
                            </p>
                        )}
                    </div>
                )}

                {ongletActif === 'historique' && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                        <h3 className="mb-4 text-lg font-semibold">{t('onglets.historique')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-dominant-100)]">
                                    <Calendar className="h-4 w-4 text-[var(--color-dominant-600)]" />
                                </div>
                                <div>
                                    <p className="font-medium">{t('detail.eleveCreeLe')}</p>
                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                        {new Date(eleve.createdAt).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Modale d'édition */}
            <EleveFormModal
                open={modalEditionOpen}
                onOpenChange={setModalEditionOpen}
                mode="edition"
                eleve={eleve}
            />
        </div>
    );
}
