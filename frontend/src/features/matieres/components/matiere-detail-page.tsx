import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, BookOpen, Clock, FileText, Users,
    Edit, Trash2, Hash, TrendingUp, AlertCircle,
    Layers, CheckCircle, XCircle,
    Globe, UserCheck, UserPlus, AlertTriangle, Plus,
} from 'lucide-react';
import { useMatiere, useSupprimerMatiere, useModifierMatiere, useMatiereProgramme, useMatiereProgrammesPedagogiques, useMatiereAffectations, useMatiereConfigurations, useCreerAffectation, useModifierAffectation, useSupprimerAffectation, useCreerConfigurationMatiereClasse, useModifierConfigurationMatiereClasse, useSupprimerConfigurationMatiereClasse } from '../hooks/use-matieres';
import { MatiereFormModal } from './matiere-form-modal';
import { TabProgramme } from './tab-programme';
import { TabNiveaux } from './tab-niveaux';
import { useCreneaux } from '@/features/emploi-du-temps';
import { EDTCalendar } from '@/features/emploi-du-temps';
import { AffectationFormModal } from './affectation-form-modal';
import { ConfigurationFormModal } from './configuration-form-modal';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LoadingState } from '@/components/feedback';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import type { MatiereNiveau, AffectationMatiere, ConfigurationMatiereClasse } from '../types/matiere.types';
import type { AffectationPayload } from '../hooks/use-matieres';

type OngletActif = 'informations' | 'niveaux' | 'programme' | 'affectations' | 'configurations' | 'emploi-du-temps';

function StatutBadge({ actif }: { actif: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
            actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
        }`}>
            {actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {actif ? 'Active' : 'Inactive'}
        </span>
    );
}

const sousSystemeConfig: Record<string, { label: string; bg: string; text: string }> = {
    FRANCOPHONE: { label: 'Francophone', bg: 'bg-blue-100', text: 'text-blue-700' },
    ANGLOPHONE: { label: 'Anglophone', bg: 'bg-green-100', text: 'text-green-700' },
    BICULTUREL: { label: 'Biculturel', bg: 'bg-purple-100', text: 'text-purple-700' },
};

function SousSystemeBadge({ value }: { value: string | null }) {
    if (!value) return <span className="text-xs text-gray-500 dark:text-gray-200">Commun</span>;
    const cfg = sousSystemeConfig[value] || { label: value, bg: 'bg-gray-100', text: 'text-gray-700 dark:text-gray-400' };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <Globe className="h-3 w-3" />
            {cfg.label}
        </span>
    );
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function MatiereDetailPage() {
    const { id } = useParams({ from: '/_auth/matieres/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const { data: matiere, isLoading, error } = useMatiere(id);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const modifier = useModifierMatiere();
    const supprimer = useSupprimerMatiere();

    const [affectationModalOpen, setAffectationModalOpen] = useState(false);
    const [affectationToEdit, setAffectationToEdit] = useState<AffectationMatiere | null>(null);
    const [deleteAffectationId, setDeleteAffectationId] = useState<string | null>(null);
    const creerAffectation = useCreerAffectation();
    const modifierAffectation = useModifierAffectation();
    const supprimerAffectation = useSupprimerAffectation();

    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [configToEdit, setConfigToEdit] = useState<ConfigurationMatiereClasse | null>(null);
    const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);
    const creerConfig = useCreerConfigurationMatiereClasse();
    const modifierConfig = useModifierConfigurationMatiereClasse();
    const supprimerConfig = useSupprimerConfigurationMatiereClasse();

    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const programmeQuery = useMatiereProgramme(id);
    const programmesPedagogiquesQuery = useMatiereProgrammesPedagogiques(id);
    const affectationsQuery = useMatiereAffectations(id);
    const configurationsQuery = useMatiereConfigurations(id);
    const edtQuery = useCreneaux({ matiereId: id, limit: 100 });

    const { niveauxSansAffectation, affectationsInactives, tauxCouverture } = useMemo(() => {
        const programme = programmeQuery.data ?? [];
        const affectations = affectationsQuery.data ?? [];
        const affectes = new Set(affectations.map((a) => a.classeAnneeId));
        const sansAffectation = programme.filter((p) => !affectes.has(p.niveauId));
        const inactives = affectations.filter((a) => !a.actif);
        const couverture = programme.length > 0
            ? Math.round(((programme.length - sansAffectation.length) / programme.length) * 100)
            : 0;
        return {
            niveauxSansAffectation: sansAffectation,
            affectationsInactives: inactives,
            tauxCouverture: couverture,
        };
    }, [programmeQuery.data, affectationsQuery.data]);

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id, ...data });
        setFormOpen(false);
    };

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/matieres' });
    };

    const handleAffectationSave = async (data: AffectationPayload) => {
        if (affectationToEdit) {
            await modifierAffectation.mutateAsync({ id: affectationToEdit.id, ...data });
        } else {
            await creerAffectation.mutateAsync(data);
        }
        setAffectationModalOpen(false);
        setAffectationToEdit(null);
    };

    const handleConfigSave = async (data: any) => {
        if (configToEdit) {
            await modifierConfig.mutateAsync({ configId: configToEdit.id, matiereId: id, ...data });
        } else {
            await creerConfig.mutateAsync({ matiereId: id, ...data });
        }
        setConfigModalOpen(false);
        setConfigToEdit(null);
    };

    const handleDeleteConfig = async () => {
        if (!deleteConfigId) return;
        await supprimerConfig.mutateAsync({ configId: deleteConfigId, matiereId: id });
        setDeleteConfigId(null);
    };

    const handleDeleteAffectation = async () => {
        if (!deleteAffectationId) return;
        await supprimerAffectation.mutateAsync({ id: deleteAffectationId, matiereId: id });
        setDeleteAffectationId(null);
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement de la matière..." />
            </div>
        );
    }

    if (error || !matiere) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-100" />
                <p className="text-lg text-gray-600 dark:text-gray-300">Matière non trouvée</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/matieres' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    const couleur = matiere.couleur || '#3B82F6';

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: BookOpen },
        { id: 'niveaux' as const, label: 'Niveaux', icon: Layers, count: programmeQuery.data?.length },
        { id: 'programme' as const, label: 'Programmes', icon: BookOpen, count: programmesPedagogiquesQuery.data?.length },
        { id: 'affectations' as const, label: 'Enseignants', icon: Users, count: affectationsQuery.data?.length, warning: affectationsInactives.length > 0 },
        { id: 'configurations' as const, label: 'Configurations', icon: FileText, count: configurationsQuery.data?.length },
        { id: 'emploi-du-temps' as const, label: 'Emploi du temps', icon: Clock, count: edtQuery.data?.items?.length },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <Breadcrumbs currentLabel={matiere.nom} />

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                <div className="h-2 w-full" style={{ backgroundColor: couleur }} />

                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 rounded-lg flex items-center justify-center shadow-lg shrink-0"
                                style={{ backgroundColor: `${couleur}20` }}
                            >
                                <BookOpen className="h-10 w-10" style={{ color: couleur }} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-200 truncate">{matiere.nom}</h1>
                                    <StatutBadge actif={matiere.actif} />
                                    <SousSystemeBadge value={matiere.sousSysteme} />
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        <span className="font-mono">{matiere.code || '-'}</span>
                                    </div>
                                    {matiere.nomAnglais && (
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            <span>{matiere.nomAnglais}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                            {hasPermission('config:edit') && (
                                <>
                                    <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                                        Modifier
                                    </ElisaButton>
                                    <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteOpen(true)}>
                                        Supprimer
                                    </ElisaButton>
                                </>
                            )}
                            <ElisaButton variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: '/matieres' })}>
                                Retour
                            </ElisaButton>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard icon={Layers} label="Niveaux" value={programmeQuery.data?.length ?? '-'} color="blue" delay={0.1} />
                <StatCard icon={BookOpen} label="Programmes" value={programmesPedagogiquesQuery.data?.length ?? '-'} color="purple" delay={0.15} />
                <StatCard icon={Users} label="Enseignants" value={affectationsQuery.data?.length ?? '-'} color="green" delay={0.2} />
                <StatCard icon={FileText} label="Configurations" value={configurationsQuery.data?.length ?? '-'} color="indigo" delay={0.3} />
                <StatCard icon={TrendingUp} label={`Couverture ${tauxCouverture}%`} value={`${programmeQuery.data?.length ? programmeQuery.data.length - niveauxSansAffectation.length : '-'}/${programmeQuery.data?.length ?? '-'}`}
                    color={tauxCouverture >= 80 ? 'green' : tauxCouverture >= 50 ? 'yellow' : 'red'} delay={0.4}
                />
            </div>

            {niveauxSansAffectation.length > 0 && (
                <ErrorMessage
                    variant="warning"
                    message={`${niveauxSansAffectation.length} niveau(x) sans enseignant assigné`}
                    description="Ajoutez des affectations pour les niveaux du programme qui n'ont pas encore d'enseignant."
                    autoDismissMs={30000}
                />
            )}

            {affectationsInactives.length > 0 && (
                <ErrorMessage
                    variant="warning"
                    message={`${affectationsInactives.length} affectation(s) inactive(s)`}
                    description="Certaines affectations sont marquées comme inactives. Vérifiez leur état dans l'onglet Enseignants."
                    autoDismissMs={30000}
                />
            )}

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    {onglets.map((o) => {
                        const Icon = o.icon;
                        return (
                            <button key={o.id} onClick={() => setOngletActif(o.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    ongletActif === o.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {o.label}
                                {o.count !== undefined && (
                                    <span className="ml-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                                        {o.count}
                                    </span>
                                )}
                                {o.warning && (
                                    <span title={o.id === 'programme' ? 'Niveaux sans enseignant' : 'Affectations inactives'}
                                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700"
                                    >
                                        <AlertTriangle className="h-3 w-3" />
                                        {o.id === 'programme' ? niveauxSansAffectation.length : affectationsInactives.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <motion.div key={ongletActif} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {ongletActif === 'informations' && (
                    <InformationsTab matiere={matiere} couleur={couleur} />
                )}
                {ongletActif === 'niveaux' && (
                    <TabNiveaux
                        matiereNiveaux={programmeQuery.data}
                        isLoading={programmeQuery.isLoading}
                        matiereId={id}
                        matiereNom={matiere.nom}
                    />
                )}
                {ongletActif === 'programme' && (
                    <TabProgramme
                        programmesPedagogiques={programmesPedagogiquesQuery.data}
                        isLoadingPP={programmesPedagogiquesQuery.isLoading}
                        matiereId={id}
                        matiereNom={matiere.nom}
                    />
                )}
                {ongletActif === 'affectations' && (
                    <AffectationsTab
                        data={affectationsQuery.data}
                        isLoading={affectationsQuery.isLoading}
                        matiereId={id}
                        onEdit={(a) => { setAffectationToEdit(a); setAffectationModalOpen(true); }}
                        onDelete={(id) => setDeleteAffectationId(id)}
                        onCreate={() => { setAffectationToEdit(null); setAffectationModalOpen(true); }}
                        hasPermission={hasPermission('config:edit')}
                    />
                )}
                {ongletActif === 'configurations' && (
                    <ConfigurationsTab
                        data={configurationsQuery.data}
                        isLoading={configurationsQuery.isLoading}
                        onEdit={(c) => { setConfigToEdit(c); setConfigModalOpen(true); }}
                        onDelete={(id) => setDeleteConfigId(id)}
                        onCreate={() => { setConfigToEdit(null); setConfigModalOpen(true); }}
                        hasPermission={hasPermission('config:edit')}
                    />
                )}
                {ongletActif === 'emploi-du-temps' && (
                    <div className="space-y-4">
                        {edtQuery.isLoading ? (
                            <div className="py-12"><LoadingState message="Chargement de l'emploi du temps..." /></div>
                        ) : !edtQuery.data?.items?.length ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <Clock className="h-12 w-12 text-gray-400 dark:text-gray-100 mx-auto mb-3" />
                                <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">Aucun créneau pour cette matière</p>
                                <p className="text-sm text-gray-500 dark:text-gray-200">
                                    Les créneaux apparaîtront ici une fois l'emploi du temps généré.
                                </p>
                            </div>
                        ) : (
                            <EDTCalendar creneaux={edtQuery.data.items} />
                        )}
                    </div>
                )}
            </motion.div>

            {formOpen && (
                <MatiereFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    matiere={matiere}
                    onSave={handleSave}
                    isLoading={modifier.isPending}
                />
            )}

            {affectationModalOpen && (
                <AffectationFormModal
                    open={affectationModalOpen}
                    onOpenChange={(v) => { if (!v) { setAffectationModalOpen(false); setAffectationToEdit(null); } }}
                    matiereId={id}
                    affectation={affectationToEdit}
                    onSave={handleAffectationSave}
                    isLoading={creerAffectation.isPending || modifierAffectation.isPending}
                />
            )}

            <ConfirmationModal
                isOpen={deleteOpen}
                title="Supprimer cette matière"
                message={`Êtes-vous sûr de vouloir supprimer "${matiere.nom}" ?`}
                details="Cette action est irréversible et supprimera toutes les données associées (programme, affectations, configurations)."
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeleteOpen(false)}
                isLoading={supprimer.isPending}
            />

            <ConfirmationModal
                isOpen={!!deleteAffectationId}
                title="Supprimer cette affectation"
                message="Êtes-vous sûr de vouloir supprimer cette affectation ?"
                details="Cette action est irréversible."
                variant="danger"
                onConfirm={handleDeleteAffectation}
                onCancel={() => setDeleteAffectationId(null)}
                isLoading={supprimerAffectation.isPending}
            />

            <ConfigurationFormModal
                open={configModalOpen}
                onOpenChange={(v) => { if (!v) { setConfigModalOpen(false); setConfigToEdit(null); } }}
                matiereId={id}
                matiereNom={matiere.nom}
                config={configToEdit}
                onSave={handleConfigSave}
                isLoading={creerConfig.isPending || modifierConfig.isPending}
            />

            <ConfirmationModal
                isOpen={!!deleteConfigId}
                title="Supprimer cette configuration"
                message="Êtes-vous sûr de vouloir supprimer cette configuration matière-classe ?"
                details="Cette action est irréversible."
                variant="danger"
                onConfirm={handleDeleteConfig}
                onCancel={() => setDeleteConfigId(null)}
                isLoading={supprimerConfig.isPending}
            />
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, delay }: { icon: any; label: string; value: string | number; color: string; delay: number }) {
    const colors: Record<string, { bg: string; text: string; value: string }> = {
        blue: { bg: 'from-blue-50 to-blue-100 border-blue-200', text: 'text-blue-700', value: 'text-blue-800' },
        green: { bg: 'from-green-50 to-green-100 border-green-200', text: 'text-green-700', value: 'text-green-800' },
        purple: { bg: 'from-purple-50 to-purple-100 border-purple-200', text: 'text-purple-700', value: 'text-purple-800' },
        yellow: { bg: 'from-yellow-50 to-yellow-100 border-yellow-200', text: 'text-yellow-700', value: 'text-yellow-800' },
        red: { bg: 'from-red-50 to-red-100 border-red-200', text: 'text-red-700', value: 'text-red-800' },
        indigo: { bg: 'from-indigo-50 to-indigo-100 border-indigo-200', text: 'text-indigo-700', value: 'text-indigo-800' },
        gray: { bg: 'from-gray-50 to-gray-100 border-gray-200', text: 'text-gray-700 dark:text-gray-400', value: 'text-gray-800 dark:text-gray-300' },
    };
    const c = colors[color] || colors.blue;
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className={`bg-gradient-to-br ${c.bg} rounded-lg p-4 border`}
        >
            <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${c.text}`} />
                <span className={`text-sm font-medium ${c.text}`}>{label}</span>
            </div>
            <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
        </motion.div>
    );
}

function InformationsTab({ matiere, couleur }: { matiere: any; couleur: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Informations générales
                </h3>
                <dl className="space-y-4">
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Nom</dt>
                        <dd className="mt-1 text-lg font-medium text-gray-900 dark:text-gray-200">{matiere.nom}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Code</dt>
                        <dd className="mt-1 font-mono text-gray-900 dark:text-gray-200">{matiere.code || '-'}</dd>
                    </div>
                    {matiere.nomAnglais && (
                        <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Nom anglais</dt>
                            <dd className="mt-1 text-gray-900 dark:text-gray-200">{matiere.nomAnglais}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Sous-système</dt>
                        <dd className="mt-1"><SousSystemeBadge value={matiere.sousSysteme} /></dd>
                    </div>
                </dl>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Configuration
                </h3>
                <dl className="space-y-4">
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Couleur</dt>
                        <dd className="mt-1 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm" style={{ backgroundColor: couleur }} />
                            <span className="font-mono text-sm">{couleur}</span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Statut</dt>
                        <dd className="mt-1"><StatutBadge actif={matiere.actif} /></dd>
                    </div>
                </dl>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-600" />
                    Métadonnées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Créée le</dt>
                        <dd className="mt-1 text-gray-900 dark:text-gray-200">{formatDate(matiere.createdAt)}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-200">Dernière modification</dt>
                        <dd className="mt-1 text-gray-900 dark:text-gray-200">{formatDate(matiere.updatedAt)}</dd>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AffectationsTab({ data, isLoading, matiereId, onEdit, onDelete, onCreate, hasPermission }: {
    data: AffectationMatiere[] | undefined;
    isLoading: boolean;
    matiereId: string;
    onEdit: (a: AffectationMatiere) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
    hasPermission: boolean;
}) {
    if (isLoading) return <div className="py-12 text-center text-gray-500 dark:text-gray-200"><LoadingState message="Chargement des affectations..." /></div>;

    return (
        <div className="space-y-4">
            {hasPermission && (
                <div className="flex justify-end">
                    <ElisaButton variant="primary" size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={onCreate}>
                        Affecter un enseignant
                    </ElisaButton>
                </div>
            )}

            {!data || data.length === 0 ? (
                <EmptyState icon={Users} message="Aucun enseignant assigné" sub="Utilisez le bouton ci-dessus pour affecter un enseignant à cette matière." />
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Enseignant</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Classe</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Année scolaire</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Période</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Statut</th>
                                    {hasPermission && <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="h-4 w-4 text-gray-400 dark:text-gray-100" />
                                                <span className="font-medium">{a.enseignant ? `${a.enseignant.prenom} ${a.enseignant.nom}` : a.enseignantId}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{a.classeAnnee?.classe?.nom || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.classeAnnee?.anneeScolaire?.libelle || '-'}</td>
                                        <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-200">
                                            {a.dateDebut ? formatDate(a.dateDebut) : '-'}
                                            {a.dateFin ? ` → ${formatDate(a.dateFin)}` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {a.actif ? (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                                    <CheckCircle className="h-3 w-3" /> Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400">
                                                    <XCircle className="h-3 w-3" /> Inactif
                                                </span>
                                            )}
                                        </td>
                                        {hasPermission && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <ElisaButton variant="ghost" size="sm" onClick={() => onEdit(a)}>
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </ElisaButton>
                                                    <ElisaButton variant="ghost" size="sm" onClick={() => onDelete(a.id)}>
                                                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                    </ElisaButton>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function ConfigurationsTab({ data, isLoading, onEdit, onDelete, onCreate, hasPermission }: {
    data: ConfigurationMatiereClasse[] | undefined;
    isLoading: boolean;
    onEdit: (c: ConfigurationMatiereClasse) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
    hasPermission: boolean;
}) {
    if (isLoading) return <div className="py-12 text-center text-gray-500 dark:text-gray-200"><LoadingState message="Chargement des configurations..." /></div>;

    const maxVolume = data && data.length > 0 ? Math.max(...data.map((c) => c.volumeHoraireHebdo || 0)) : 0;

    return (
        <div className="space-y-4">
            {hasPermission && (
                <div className="flex justify-end">
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onCreate}>
                        Ajouter une configuration
                    </ElisaButton>
                </div>
            )}

            {!data || data.length === 0 ? (
                <EmptyState icon={FileText} message="Aucune configuration spécifique" sub="Les configurations par classe héritent des valeurs du programme par défaut. Utilisez le bouton ci-dessus pour surcharger une classe." />
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Classe</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Année scolaire</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Coeff.</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Barème</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Vol. horaire</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Oblig.</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Statut</th>
                                    {hasPermission && <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 font-medium">{c.classeAnnee?.classe?.nom || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.classeAnnee?.anneeScolaire?.libelle || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <InheritedValue value={c.coefficient} unit="" />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <InheritedValue value={c.bareme} unit="" prefix="/ " />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {c.volumeHoraireHebdo
                                                ? <VolumeBar value={c.volumeHoraireHebdo} max={maxVolume} />
                                                : <span className="text-xs text-gray-400 dark:text-gray-100 italic">Hérité</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {c.obligatoire ? (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                                    <CheckCircle className="h-3 w-3" /> Oblig.
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700">
                                                    <XCircle className="h-3 w-3" /> Optionnel
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                c.statut === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                c.statut === 'EN_ATTENTE_VALIDATION' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                                            }`}>
                                                {c.statut === 'ACTIVE' ? 'Active' : c.statut === 'EN_ATTENTE_VALIDATION' ? 'En attente' : 'Inactive'}
                                            </span>
                                        </td>
                                        {hasPermission && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => onEdit(c)}
                                                        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => onDelete(c.id)}
                                                        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function VolumeBar({ value, max }: { value: number; max: number }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-2 w-24">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8 text-right">{value}h</span>
        </div>
    );
}

function InheritedValue({ value, unit, prefix }: { value: number | null | undefined; unit: string; prefix?: string }) {
    if (value == null) return <span className="text-xs text-gray-400 dark:text-gray-100 italic">Hérité</span>;
    return <span className="font-semibold">{prefix ?? ''}{value}{unit}</span>;
}

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Icon className="h-12 w-12 text-gray-400 dark:text-gray-100 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300 font-medium mb-1">{message}</p>
            <p className="text-sm text-gray-500 dark:text-gray-200">{sub}</p>
        </div>
    );
}
