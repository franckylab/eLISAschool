import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Edit, Trash2, BookOpen,
    Plus, X, ChevronRight,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { CustomModal } from '@/components/modals/CustomModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { Badge } from '@/components/ui/Badge';
import { TabsBar, TabsContent } from '@/components/ui/Tabs';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import { useTousMatieresNiveaux } from '@/features/matieres/hooks/use-matieres';
import { PageHeader } from '@/components/layout/PageHeader';
import { formatVolumeMinutesToHours } from '@/lib/format-utils';
import type { Tab } from '@/components/ui/Tabs';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import {
    useProgrammeDetail,
    useModifierProgramme,
    useSupprimerProgramme,
    useAjouterMatiereProgramme,
    useRetirerMatiereProgramme,
    useChapitresProgramme,
    useCreerChapitre,
    useModifierChapitre,
    useSupprimerChapitre,
} from '../hooks/use-programmes';
import { ProgrammeFormModal } from './programme-form-modal';
import { ChapitreFormModal } from './chapitre-form-modal';
import type { AddMatiereDto, ProgrammeChapitre, ProgrammeMatiere } from '../types/programme.types';

export function ProgrammeDetailPage() {
    const { id: programmeId } = useParams({ from: '/_auth/programmes/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('programmes');
    const { hasPermission } = usePermissions();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tabActif, setTabActif] = useState('informations');
    const [showAddMatiere, setShowAddMatiere] = useState(false);
    const [newMatiereNiveauId, setNewMatiereNiveauId] = useState('');
    const [newCoefficient, setNewCoefficient] = useState<number>(1);

    const [showChapitreModal, setShowChapitreModal] = useState(false);
    const [chapitreEdit, setChapitreEdit] = useState<ProgrammeChapitre | null>(null);
    const [chapitreDeleteId, setChapitreDeleteId] = useState<string | null>(null);
    const [chapitreProgrammeMatiereId, setChapitreProgrammeMatiereId] = useState<string>('');

    const { data: programme, isLoading, isError, error, refetch } = useProgrammeDetail(programmeId);
    const { data: tousMatieresNiveaux } = useTousMatieresNiveaux();

    const modifier = useModifierProgramme();
    const supprimer = useSupprimerProgramme();
    const ajouterMatiere = useAjouterMatiereProgramme();
    const retirerMatiere = useRetirerMatiereProgramme();
    const { data: chapitresData } = useChapitresProgramme(programmeId);
    const creerChapitre = useCreerChapitre();
    const modifierChapitre = useModifierChapitre();
    const supprimerChapitre = useSupprimerChapitre();

    if (isLoading && !programme) return <PageSkeleton />;
    if (isError) return <ErrorMessage message={(error as Error)?.message} onRetry={refetch} />;
    if (!programme) return <PageSkeleton />;

    const matieres = (programme.matieres || []) as ProgrammeMatiere[];
    const chapitres = chapitresData || [];
    const chapitresParMatiere = chapitres.reduce((acc: Record<string, ProgrammeChapitre[]>, ch: ProgrammeChapitre) => {
        const matiereId = ch.programmeMatiereId || '';
        if (!acc[matiereId]) acc[matiereId] = [];
        acc[matiereId].push(ch);
        return acc;
    }, {} as Record<string, ProgrammeChapitre[]>);

    const handleDelete = async () => {
        try {
            await supprimer.mutateAsync(programmeId);
            navigate({ to: '/programmes' });
        } catch (err) {
            console.error('Erreur suppression programme:', err);
        }
    };

    const totalMinutes = matieres.reduce((s: number, m: ProgrammeMatiere) => s + (Number(m.matiereNiveau?.volumeHoraire) || 0), 0);
    const totalCoefficients = matieres.reduce((s: number, m: ProgrammeMatiere) => s + (Number(m.coefficient) || 0), 0);

    const onglets: Tab[] = [
        { id: 'informations', label: t('informations') },
        { id: 'matieres', label: t('matieres') },
        { id: 'chapitres', label: t('chapitres') },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title={programme.nom}
                description={`${t('code')}: ${programme.code} | ${programme.cycle?.nom || ''}`}
                icon={BookOpen}
                variant="gradient"
                onBack={() => navigate({ to: '/programmes' })}
                actions={
                    <div className="flex items-center gap-2">
                        {hasPermission('programmes:config:write') && (
                            <ElisaButton
                                variant="secondary"
                                size="sm"
                                onClick={() => setShowEditModal(true)}
                                leftIcon={<Edit className="h-4 w-4" />}
                            >
                                {t('modifierProgramme')}
                            </ElisaButton>
                        )}
                        {hasPermission('programmes:config:write') && (
                            <ElisaButton
                                variant="danger"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                                leftIcon={<Trash2 className="h-4 w-4" />}
                            >
                                {t('supprimer')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <TabsBar
                tabs={onglets}
                activeTab={tabActif}
                onTabChange={setTabActif}
            />

            <TabsContent activeTab={tabActif}>
                {tabActif === 'informations' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('infosGenerales')}</CardTitle>
                            <SectionSeparator />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InfoField label={t('nom')} value={programme.nom} />
                                <InfoField label={t('code')} value={programme.code} />
                                <InfoField
                                    label={t('type')}
                                    value={t(`programmeType.${programme.type}`)}
                                />
                                <InfoField label={t('cycle')} value={programme.cycle?.nom || '-'} />
                                {programme.niveau && (
                                    <InfoField label={t('niveau')} value={programme.niveau.nom} />
                                )}
                                <InfoField
                                    label={t('statut')}
                                    value={
                                        <Badge variant={programme.actif ? 'success' : 'secondary'}>
                                            {programme.actif ? t('actif') : t('inactif')}
                                        </Badge>
                                    }
                                />
                                <InfoField
                                    label={t('volumeHoraire')}
                                    value={formatVolumeMinutesToHours(totalMinutes)}
                                />
                                <InfoField
                                    label={t('matieres')}
                                    value={`${matieres.length}`}
                                />
                                <InfoField
                                    label={t('coefficient', 'Coefficient moyen')}
                                    value={matieres.length ? (totalCoefficients / matieres.length).toFixed(1) : '-'}
                                />
                            </div>
                            {programme.description && (
                                <div className="mt-6">
                                    <InfoField label={t('description')} value={programme.description} />
                                </div>
                            )}
                            {programme.objectifsGeneraux && (
                                <div className="mt-6">
                                    <InfoField label={t('objectifsGeneraux')} value={programme.objectifsGeneraux} />
                                </div>
                            )}
                            {programme.competencesVisees && (
                                <div className="mt-6">
                                    <InfoField label={t('competencesVisees')} value={programme.competencesVisees?.join(', ')} />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {tabActif === 'matieres' && (
                    <>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{t('matieresDansProgramme')}</CardTitle>
                                    {hasPermission('programmes:config:write') && (
                                        <ElisaButton
                                            variant="primary"
                                            size="sm"
                                            onClick={() => setShowAddMatiere(true)}
                                            leftIcon={<Plus className="h-4 w-4" />}
                                        >
                                            {t('ajouterMatiere')}
                                        </ElisaButton>
                                    )}
                                </div>
                                <SectionSeparator />
                            </CardHeader>
                            <CardContent>
                                {matieres.length === 0 ? (
                                    <p className="text-sm text-[var(--color-texte-secondaire)] py-4 text-center">{t('aucuneMatiere', 'Aucune matière ajoutée')}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {matieres.map((m: ProgrammeMatiere) => {
                                            const matiere = m.matiereNiveau?.matiere;
                                            const niveau = m.matiereNiveau?.niveau;
                                            const chapitreCount = chapitresParMatiere[m.id]?.length || 0;
                                            return (
                                                <div key={m.id} className="flex items-center justify-between p-4 rounded-lg border border-[var(--color-bordure)] hover:bg-[var(--color-survol)] transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <BookOpen className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                                                        <div>
                                                            <p className="font-medium text-[var(--color-texte)]">{matiere?.nom || '-'}</p>
                                                            <div className="flex items-center gap-3 text-xs text-[var(--color-texte-secondaire)]">
                                                                <span>{t('coefficient', 'Coeff')}: {m.coefficient || 1}</span>
                                                                <span>{t('volumeHoraire')}: {formatVolumeMinutesToHours(m.matiereNiveau?.volumeHoraire ?? 0)}</span>
                                                                {niveau?.nom && <span>{t('niveau')}: {niveau.nom}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-[var(--color-texte-secondaire)]">{chapitreCount} chapitre{chapitreCount > 1 ? 's' : ''}</span>
                                                        {hasPermission('programmes:config:write') && (
                                                            <ElisaButton
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => retirerMatiere.mutate({ programmeId, pmId: m.matiereNiveauId || m.id })}
                                                                leftIcon={<X className="h-4 w-4" />}
                                                                isLoading={retirerMatiere.isPending}
                                                            >
                                                                {t('retirerMatiere')}
                                                            </ElisaButton>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <CustomModal
                            open={showAddMatiere}
                            onOpenChange={(open) => { if (!open) setShowAddMatiere(false); }}
                            title={t('ajouterMatiere')}
                            size="lg"
                            footer={
                                <div className="flex justify-end gap-3">
                                    <ElisaButton variant="ghost" onClick={() => setShowAddMatiere(false)}>{t('annuler')}</ElisaButton>
                                    <ElisaButton
                                        variant="primary"
                                        onClick={async () => {
                                            if (!newMatiereNiveauId) return;
                                            const dto: AddMatiereDto = {
                                                matiereNiveauId: newMatiereNiveauId,
                                                coefficient: newCoefficient,
                                            };
                                            await ajouterMatiere.mutateAsync({ programmeId, dto });
                                            setShowAddMatiere(false);
                                            setNewMatiereNiveauId('');
                                            setNewCoefficient(1);
                                        }}
                                        isLoading={ajouterMatiere.isPending}
                                    >
                                        {t('ajouterMatiere')}
                                    </ElisaButton>
                                </div>
                            }
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-[var(--color-texte)] mb-2 block">{t('matiere', 'Matière')}</label>
                                    <select
                                        value={newMatiereNiveauId}
                                        onChange={(e) => setNewMatiereNiveauId(e.target.value)}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                    >
                                        <option value="">{t('selectionnerMatiere', 'Sélectionner une matière')}</option>
                                        {(tousMatieresNiveaux || []).map((mn) => (
                                            <option key={mn.id} value={mn.id}>
                                                {mn.matiere?.nom} - {mn.niveau?.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-[var(--color-texte)] mb-2 block">{t('coefficient', 'Coefficient')}</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        step={0.5}
                                        value={newCoefficient}
                                        onChange={(e) => setNewCoefficient(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                    />
                                </div>
                            </div>
                        </CustomModal>
                    </>
                )}

                {tabActif === 'chapitres' && (
                    <>
                        {matieres.map((m: ProgrammeMatiere) => {
                            const matiereId = m.id;
                            const matiere = m.matiereNiveau?.matiere;
                            const chapitreList = chapitresParMatiere[matiereId] || [];
                            if (chapitreList.length === 0 && !hasPermission('programmes:config:write')) return null;
                            return (
                                <Card key={matiereId} className="mb-4">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <BookOpen className="h-5 w-5 text-[var(--color-dominante)]" />
                                                {matiere?.nom || '-'}
                                            </CardTitle>
                                            {hasPermission('programmes:config:write') && (
                                                <ElisaButton
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setChapitreProgrammeMatiereId(matiereId);
                                                        setChapitreEdit(null);
                                                        setShowChapitreModal(true);
                                                    }}
                                                    leftIcon={<Plus className="h-4 w-4" />}
                                                >
                                                    {t('nouveauChapitre')}
                                                </ElisaButton>
                                            )}
                                        </div>
                                        <SectionSeparator />
                                    </CardHeader>
                                    <CardContent>
                                        {chapitreList.length === 0 ? (
                                            <p className="text-sm text-[var(--color-texte-secondaire)] py-2">{t('aucunChapitre', 'Aucun chapitre')}</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {chapitreList
                                                    .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
                                                    .map((ch) => (
                                                        <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-bordure)] hover:bg-[var(--color-survol)] transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <ChevronRight className="h-4 w-4 text-[var(--color-texte-secondaire)]" />
                                                                <div>
                                                                    <p className="font-medium text-sm text-[var(--color-texte)]">{ch.titre}</p>
                                                                    <p className="text-xs text-[var(--color-texte-secondaire)]">{ch.dureePrevueHeures}h - {t('ordre')} {ch.ordre || '-'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={ch.statut === 'ACTIF' ? 'success' : ch.statut === 'EN_ATTENTE_VALIDATION' ? 'warning' : 'secondary'}>
                                                                    {t(`statutChapitre.${ch.statut}`)}
                                                                </Badge>
                                                                {hasPermission('programmes:config:write') && (
                                                                    <ElisaButton
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setChapitreEdit(ch);
                                                                            setChapitreProgrammeMatiereId(matiereId);
                                                                            setShowChapitreModal(true);
                                                                        }}
                                                                        leftIcon={<Edit className="h-4 w-4" />}
                                                                    />
                                                                )}
                                                                {hasPermission('programmes:config:write') && (
                                                                    <ElisaButton
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setChapitreDeleteId(ch.id)}
                                                                        leftIcon={<Trash2 className="h-4 w-4 text-destructive" />}
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </>
                )}
            </TabsContent>

            {showChapitreModal && (
                <ChapitreFormModal
                    open={showChapitreModal}
                    chapitre={chapitreEdit}
                    onClose={() => {
                        setShowChapitreModal(false);
                        setChapitreEdit(null);
                    }}
                    onSubmit={async (dto) => {
                        if (chapitreEdit) {
                            await modifierChapitre.mutateAsync({ id: chapitreEdit.id, ...dto });
                        } else {
                            await creerChapitre.mutateAsync({ programmeMatiereId: chapitreProgrammeMatiereId, ...dto });
                        }
                    }}
                />
            )}

            <ProgrammeFormModal
                open={showEditModal}
                programme={programme}
                onClose={() => setShowEditModal(false)}
                onSubmit={async (dto) => {
                    await modifier.mutateAsync({ id: programmeId, ...dto });
                    setShowEditModal(false);
                }}
            />

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={(open) => { if (!open) setShowDeleteConfirm(false); }}
                onConfirm={handleDelete}
                title={t('supprimer')}
                description={t('confirmerSuppression')}
                confirmText={t('supprimer')}
                variant="danger"
                isLoading={supprimer.isPending}
            />

            <ConfirmDialog
                open={!!chapitreDeleteId}
                onOpenChange={(open) => { if (!open) setChapitreDeleteId(null); }}
                onConfirm={async () => {
                    if (!chapitreDeleteId) return;
                    await supprimerChapitre.mutateAsync(chapitreDeleteId);
                    setChapitreDeleteId(null);
                }}
                title={t('supprimer')}
                description={t('confirmerSuppressionChapitre', 'Êtes-vous sûr de vouloir supprimer ce chapitre ?')}
                confirmText={t('supprimer')}
                variant="danger"
                isLoading={supprimerChapitre.isPending}
            />
        </div>
    );
}
