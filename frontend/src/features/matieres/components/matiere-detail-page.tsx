import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    BookOpen, Clock, FileText, Users,
    Edit, Trash2, TrendingUp,
    Layers, CheckCircle, XCircle,
    Globe, UserCheck, UserPlus, Plus,
} from 'lucide-react';
import { useMatiere, useSupprimerMatiere, useModifierMatiere, useMatiereProgramme, useMatiereProgrammesPedagogiques, useMatiereAffectations, useCreerAffectation, useModifierAffectation, useSupprimerAffectation } from '../hooks/use-matieres';
import { MatiereFormModal } from './matiere-form-modal';
import { TabProgramme } from './tab-programme';
import { TabNiveaux } from './tab-niveaux';
import { useCreneaux } from '@/features/emploi-du-temps';
import { EDTCalendar } from '@/features/emploi-du-temps';
import { AffectationFormModal } from './affectation-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage, LoadingState } from '@/components/ui/ErrorMessage';
import { usePermissions, useTabState } from '@/hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { StatCard } from '@/components/ui/StatCard';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import type { AffectationMatiere } from '../types/matiere.types';
import type { AffectationPayload } from '../hooks/use-matieres';

type OngletActif = 'informations' | 'niveaux' | 'programme' | 'affectations' | 'emploi-du-temps';

function StatutBadge({ actif }: { actif: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-[clamp(0.375rem,1vw,0.625rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium ${
            actif ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted-foreground'
        }`}>
            {actif ? <CheckCircle className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)]" /> : <XCircle className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)]" />}
            {actif ? 'Active' : 'Inactive'}
        </span>
    );
}

const sousSystemeConfig: Record<string, { label: string; bg: string; text: string }> = {
    FRANCOPHONE: { label: 'Francophone', bg: 'bg-info/10', text: 'text-info' },
    ANGLOPHONE: { label: 'Anglophone', bg: 'bg-success/10', text: 'text-success' },
    BICULTUREL: { label: 'Biculturel', bg: 'bg-purple/10', text: 'text-purple' },
};

function SousSystemeBadge({ value }: { value: string | null }) {
    if (!value) return <span className="text-xs text-gray-500 dark:text-gray-200">Commun</span>;
    const cfg = sousSystemeConfig[value] || { label: value, bg: 'bg-muted/10', text: 'text-text-secondary' };
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] text-[clamp(0.625rem,1vw,0.75rem)] font-medium ${cfg.bg} ${cfg.text}`}>
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
    const modifier = useModifierMatiere();
    const supprimer = useSupprimerMatiere();
    const { ask: askDelete, ConfirmationModal: DeleteConfirmModal } = useConfirmation();
    const { ask: askDeleteAffectation, ConfirmationModal: DeleteAffectationConfirmModal } = useConfirmation();

    const [affectationModalOpen, setAffectationModalOpen] = useState(false);
    const [affectationToEdit, setAffectationToEdit] = useState<AffectationMatiere | null>(null);
    const [deleteAffectationId, setDeleteAffectationId] = useState<string | null>(null);
    const creerAffectation = useCreerAffectation();
    const modifierAffectation = useModifierAffectation();
    const supprimerAffectation = useSupprimerAffectation();

    const [ongletActif, setOngletActif] = useTabState<OngletActif>('informations');

    const programmeQuery = useMatiereProgramme(id);
    const programmesPedagogiquesQuery = useMatiereProgrammesPedagogiques(id);
    const affectationsQuery = useMatiereAffectations(id);
    const edtQuery = useCreneaux({ affectationMatiereId: id, limit: 100 });

    const { niveauxSansAffectation, affectationsInactives } = useMemo(() => {
        const programme = programmeQuery.data ?? [];
        const affectations = affectationsQuery.data ?? [];
        const affectes = new Set(affectations.map((a) => a.classeAnneeId));
        const sansAffectation = programme.filter((p) => !affectes.has(p.niveauId));
        const inactives = affectations.filter((a) => !a.actif);
        return {
            niveauxSansAffectation: sansAffectation,
            affectationsInactives: inactives,
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

    const handleDeleteAffectation = async () => {
        if (!deleteAffectationId) return;
        await supprimerAffectation.mutateAsync({ id: deleteAffectationId, matiereId: id });
        setDeleteAffectationId(null);
    };

    if (isLoading) {
        return <PageSkeleton showHeader />;
    }

    if (error || !matiere) {
        return (
            <div className="p-6">
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-lg text-gray-600 dark:text-gray-300">Matière non trouvée</p>
                        <ElisaButton variant="primary" onClick={() => navigate({ to: '/matieres' })}>
                            Retour à la liste
                        </ElisaButton>
                    </div>
                </div>
            </div>
        );
    }

    const onglets: Tab[] = [
        { id: 'informations', label: 'Informations', icon: BookOpen },
        { id: 'niveaux', label: 'Niveaux', icon: Layers, count: programmeQuery.data?.length },
        { id: 'programme', label: 'Programmes', icon: BookOpen, count: programmesPedagogiquesQuery.data?.length },
        { id: 'affectations', label: 'Enseignants', icon: Users, count: affectationsQuery.data?.length },
        { id: 'emploi-du-temps', label: 'Emploi du temps', icon: Clock, count: edtQuery.data?.data?.items?.length },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                breadcrumbLabel={matiere.nom}
                onBack={() => navigate({ to: '/matieres' })}
                actions={
                    <div className="flex gap-2">
                        {hasPermission('config:edit') && (
                            <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                                Modifier
                            </ElisaButton>
                        )}
                        {hasPermission('config:edit') && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => askDelete({
                                title: 'Supprimer cette matière',
                                message: `Êtes-vous sûr de vouloir supprimer "${matiere.nom}" ?`,
                                details: 'Cette action est irréversible et supprimera toutes les données associées (programme, affectations, configurations).',
                                onConfirm: handleDelete,
                            })}>
                                Supprimer
                            </ElisaButton>
                        )}
                    </div>
                }
            >
                <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl shrink-0 p-[clamp(0.75rem,2.5vw,1rem)]">
                        <BookOpen className="h-[clamp(1.75rem,6vw,2.5rem)] w-[clamp(1.75rem,6vw,2.5rem)] text-white" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <h1 className="text-[clamp(1.5rem,4.5vw,3.5rem)] font-bold text-white leading-tight">{matiere.nom}</h1>
                        {matiere.code && <p className="text-[clamp(0.75rem,2vw,1.125rem)] text-white/70">{matiere.code}</p>}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <StatutBadge actif={matiere.actif} />
                            {matiere.sousSysteme && <SousSystemeBadge value={matiere.sousSysteme} />}
                        </div>
                    </div>
                </div>
            </PageHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[clamp(0.5rem,1.5vw,1rem)]">
                <StatCard icon={Layers} label="Niveaux" value={programmeQuery.data?.length ?? 0} tone="info" />
                <StatCard icon={Users} label="Enseignants" value={affectationsQuery.data?.length ?? 0} tone="success" />
                <StatCard icon={BookOpen} label="Programmes" value={programmesPedagogiquesQuery.data?.length ?? 0} tone="purple" />
            </div>

            {niveauxSansAffectation.length > 0 && (
                <ErrorMessage
                    message={`${niveauxSansAffectation.length} niveau(x) sans enseignant assigné`}
                />
            )}

            {affectationsInactives.length > 0 && (
                <ErrorMessage
                    message={`${affectationsInactives.length} affectation(s) inactive(s)`}
                />
            )}

            <TabsBar tabs={onglets} activeTab={ongletActif} onTabChange={(tabId) => setOngletActif(tabId as OngletActif)} variant="underline" />

            <motion.div key={ongletActif} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {ongletActif === 'informations' && (
                    <InformationsTab matiere={matiere} />
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
                        onDelete={(id) => {
                            setDeleteAffectationId(id);
                            askDeleteAffectation({
                                title: 'Supprimer cette affectation',
                                message: 'Êtes-vous sûr de vouloir supprimer cette affectation ?',
                                details: 'Cette action est irréversible.',
                                onConfirm: handleDeleteAffectation,
                            });
                        }}
                        onCreate={() => { setAffectationToEdit(null); setAffectationModalOpen(true); }}
                        hasPermission={hasPermission('config:edit')}
                    />
                )}
                {ongletActif === 'emploi-du-temps' && (
                    <div className="space-y-4">
                        {edtQuery.isLoading ? (
                            <div className="py-12"><LoadingState message="Chargement de l'emploi du temps..." /></div>
                        ) : !edtQuery.data?.data?.items?.length ? (
                        <div className="bg-[var(--color-card)] rounded-lg border border-border p-[clamp(1.5rem,5vw,3rem)] text-center">
                            <Clock className="h-[clamp(2rem,6vw,3rem)] w-[clamp(2rem,6vw,3rem)] text-text-muted mx-auto mb-[clamp(0.5rem,2vw,0.75rem)]" />
                            <p className="text-text-secondary font-medium mb-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.875rem,1.5vw,1rem)]">Aucun créneau pour cette matière</p>
                            <p className="text-[clamp(0.75rem,1.25vw,0.875rem)] text-text-muted">Les créneaux apparaîtront ici une fois l'emploi du temps généré.</p>
                        </div>
                        ) : (
                            <EDTCalendar creneaux={edtQuery.data.data.items} />
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

            {DeleteConfirmModal}
            {DeleteAffectationConfirmModal}
        </div>
    );
}

function InformationsTab({ matiere }: { matiere: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        Informations générales
                    </CardTitle>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="Nom" value={matiere.nom} />
                        <InfoField label="Code" value={matiere.code || '-'} />
                        {matiere.nomAnglais && <InfoField label="Nom anglais" value={matiere.nomAnglais} />}
                        <InfoField label="Sous-système" value={<SousSystemeBadge value={matiere.sousSysteme} />} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        Configuration
                    </CardTitle>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField
                            label="Couleur"
                            value={
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm" style={{ backgroundColor: matiere.couleur || '#3B82F6' }} />
                                    <span className="font-mono text-sm">{matiere.couleur}</span>
                                </div>
                            }
                        />
                        <InfoField label="Statut" value={<StatutBadge actif={matiere.actif} />} />
                    </div>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[var(--color-dominant-600)]" />
                        Métadonnées
                    </CardTitle>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InfoField label="Créée le" value={formatDate(matiere.createdAt)} />
                        <InfoField label="Dernière modification" value={formatDate(matiere.updatedAt)} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function AffectationsTab({ data, isLoading, onEdit, onDelete, onCreate, hasPermission }: {
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

function VolumeBar({ value, max }: { value: number; max: number }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] w-[clamp(4rem,12vw,6rem)]">
            <div className="flex-1 h-[clamp(0.375rem,0.75vw,0.5rem)] bg-[var(--color-surface-alt)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--color-accent)] rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[clamp(0.625rem,1.25vw,0.75rem)] font-medium text-text-secondary w-[clamp(1.5rem,4vw,2rem)] text-right">{value}h</span>
        </div>
    );
}

function InheritedValue({ value, unit, prefix }: { value: number | null | undefined; unit: string; prefix?: string }) {
    if (value == null) return <span className="text-[clamp(0.625rem,1.25vw,0.75rem)] text-text-muted italic">Hérité</span>;
    return <span className="font-semibold text-[clamp(0.75rem,1.25vw,0.875rem)]">{prefix ?? ''}{value}{unit}</span>;
}

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
    return (
        <div className="bg-[var(--color-card)] rounded-lg border border-border p-[clamp(1.5rem,5vw,3rem)] text-center">
            <Icon className="h-[clamp(2rem,6vw,3rem)] w-[clamp(2rem,6vw,3rem)] text-text-muted mx-auto mb-[clamp(0.5rem,2vw,0.75rem)]" />
            <p className="text-text-secondary font-medium mb-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.875rem,1.5vw,1rem)]">{message}</p>
            <p className="text-[clamp(0.75rem,1.25vw,0.875rem)] text-text-muted">{sub}</p>
        </div>
    );
}
