import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookMarked, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/ErrorMessage';
import { usePermissions } from '@/hooks';
import { useRetirerMatiereProgramme, useModifierMatiereProgramme } from '../hooks/use-matieres';
import { ProgrammeMatiereModal } from '@/features/programmes/components/programme-matiere-modal';
import type { ProgrammeMatiere } from '@/features/programmes/types/programme.types';

interface TabProgrammeProps {
    programmesPedagogiques: ProgrammeMatiere[] | undefined;
    isLoadingPP: boolean;
    matiereId: string;
    matiereNom: string;
}

export function TabProgramme({
    programmesPedagogiques, isLoadingPP,
    matiereId, matiereNom,
}: TabProgrammeProps) {
    const { t } = useTranslation('matieres');
    const { hasPermission } = usePermissions();
    const retirer = useRetirerMatiereProgramme();
    const modifier = useModifierMatiereProgramme();

    const [pmModalOpen, setPmModalOpen] = useState(false);
    const [editPmId, setEditPmId] = useState<string | null>(null);
    const [editCoeff, setEditCoeff] = useState<number | ''>('');
    const [editOblig, setEditOblig] = useState(true);
    const [deletePmId, setDeletePmId] = useState<string | null>(null);

    const canWrite = hasPermission('programmes:config:write') || hasPermission('config:edit');

    const existingMatieres = programmesPedagogiques?.map(pm => ({
        matiereNiveauId: pm.matiereNiveauId,
        programmeId: pm.programmeId,
    })) || [];

    const programmeIds = [...new Set(programmesPedagogiques?.map(pm => pm.programmeId) || [])];

    const handleEdit = (pm: ProgrammeMatiere) => {
        setEditPmId(pm.id);
        setEditCoeff(pm.coefficient ?? '');
        setEditOblig(pm.obligatoire);
    };

    const handleSaveEdit = async () => {
        if (!editPmId) return;
        await modifier.mutateAsync({
            id: editPmId,
            coefficient: editCoeff !== '' ? Number(editCoeff) : undefined,
            obligatoire: editOblig,
        });
        setEditPmId(null);
    };

    const handleDelete = async () => {
        if (!deletePmId) return;
        await retirer.mutateAsync(deletePmId);
        setDeletePmId(null);
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-[clamp(0.5rem,1.5vw,0.75rem)]">
                        <CardTitle className="flex items-center gap-2 text-[clamp(0.875rem,2.5vw,1.125rem)] shrink-0">
                            <BookMarked className="h-[clamp(0.875rem,2.5vw,1.125rem)] w-[clamp(0.875rem,2.5vw,1.125rem)] text-[var(--color-dominant-600)] shrink-0" />
                            {t('programme')}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-[clamp(0.375rem,1vw,0.5rem)] w-full sm:w-auto">
                            <span className="text-[clamp(0.625rem,1.5vw,0.75rem)] text-text-muted bg-[var(--color-surface-alt)] px-[clamp(0.375rem,1vw,0.625rem)] py-[clamp(0.125rem,0.5vw,0.25rem)] rounded-full shrink-0 leading-tight">
                                {programmesPedagogiques?.length || 0} {t('programme')}(s)
                            </span>
                            {canWrite && (
                                <ElisaButton variant="primary" size="sm"
                                    icon={<Plus className="h-4 w-4" />}
                                    onClick={() => setPmModalOpen(true)}
                                >
                                    {t('ajouterProgramme')}
                                </ElisaButton>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <div className="border-b border-border mx-4 sm:mx-5" />
                <CardContent>
                    <p className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-text-muted mb-[clamp(0.5rem,1.5vw,1rem)]">
                        {t('programmesLabel')}
                    </p>

                    {isLoadingPP ? (
                        <LoadingState message={t('chargement')} />
                    ) : !programmesPedagogiques || programmesPedagogiques.length === 0 ? (
                        <div className="bg-[var(--color-card)] rounded-lg border border-border p-[clamp(1.5rem,5vw,3rem)] text-center">
                            <BookMarked className="h-[clamp(2rem,6vw,3rem)] w-[clamp(2rem,6vw,3rem)] text-text-muted mx-auto mb-[clamp(0.5rem,2vw,0.75rem)]" />
                            <p className="text-text-secondary font-medium mb-[clamp(0.125rem,0.5vw,0.25rem)] text-[clamp(0.875rem,1.5vw,1rem)]">{t('aucunProgramme')}</p>
                            <p className="text-[clamp(0.75rem,1.25vw,0.875rem)] text-text-muted">{t('programmesLabel')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {programmesPedagogiques.map((pm) => {
                                const niveau = pm.matiereNiveau?.niveau;
                                const isEditing = editPmId === pm.id;

                                return (
                                    <div key={pm.id}
                                        className="bg-[var(--color-card)] rounded-lg border border-border overflow-hidden hover:shadow-sm transition-shadow"
                                    >
                                        <div className="p-[clamp(0.75rem,2vw,1rem)]">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-[clamp(0.375rem,1vw,0.5rem)] min-w-0">
                                                    <div className="h-[clamp(1.75rem,4vw,2.5rem)] w-[clamp(1.75rem,4vw,2.5rem)] rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                                        <BookMarked className="h-[clamp(0.875rem,2vw,1.125rem)] w-[clamp(0.875rem,2vw,1.125rem)] text-accent" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-[clamp(0.25rem,0.75vw,0.375rem)]">
                                                            <h4 className="font-semibold text-[var(--color-texte)] text-[clamp(0.875rem,1.5vw,1rem)] truncate max-w-[clamp(8rem,30vw,16rem)]">
                                                                {pm.programme?.nom || pm.programmeId}
                                                            </h4>
                                                            {pm.programme?.code && <span className="text-[clamp(0.625rem,1vw,0.75rem)] font-mono text-text-muted">{pm.programme.code}</span>}
                                                            {pm.programme?.actif === false && (
                                                                <span className="text-[clamp(0.625rem,1vw,0.75rem)] bg-muted/10 text-muted-foreground px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] rounded-full">{t('statutInactif')}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[clamp(0.75rem,1.25vw,0.875rem)] text-text-muted mt-[clamp(0.125rem,0.5vw,0.25rem)] truncate">
                                                            {niveau?.nom || ''} {pm.matiereNiveau?.groupe ? `- ${pm.matiereNiveau.groupe.nom}` : ''}
                                                            {pm.matiereNiveau?.filiere ? ` (${pm.matiereNiveau.filiere.nom})` : ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                {canWrite && !isEditing && (
                                                    <div className="flex items-center gap-[clamp(0.125rem,0.5vw,0.25rem)] shrink-0">
                                                        <button onClick={() => handleEdit(pm)}
                                                            className="rounded-lg p-[clamp(0.25rem,0.75vw,0.375rem)] text-text-muted hover:text-[var(--color-accent)] hover:bg-accent/10 transition-colors"
                                                            title={t('modifier')}
                                                        >
                                                            <Edit className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
                                                        </button>
                                                        <button onClick={() => setDeletePmId(pm.id)}
                                                            className="rounded-lg p-[clamp(0.25rem,0.75vw,0.375rem)] text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                            title={t('supprimer')}
                                                        >
                                                            <Trash2 className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)]" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <div className="mt-[clamp(0.5rem,1.5vw,0.75rem)] p-[clamp(0.5rem,1.5vw,0.75rem)] bg-[var(--color-surface)] rounded-lg border border-border">
                                                    <h5 className="text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium text-text-secondary mb-[clamp(0.375rem,1vw,0.5rem)]">
                                                        {t('modifier')}
                                                    </h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(0.5rem,1.5vw,0.75rem)] mb-[clamp(0.375rem,1vw,0.5rem)]">
                                                        <div>
                                                            <label className="block text-[clamp(0.625rem,1.25vw,0.75rem)] font-medium text-text-secondary mb-[clamp(0.125rem,0.5vw,0.25rem)]">
                                                                {t('coefficient')}
                                                            </label>
                                                            <input type="number" step="0.5" min="0"
                                                                value={editCoeff}
                                                                onChange={(e) => setEditCoeff(e.target.value ? Number(e.target.value) : '')}
                                                                placeholder="Hérité"
                                                                className="w-full px-[clamp(0.5rem,1.5vw,0.625rem)] py-[clamp(0.375rem,1vw,0.5rem)] border border-border bg-[var(--color-card)] rounded-lg text-[clamp(0.75rem,1.25vw,0.875rem)] focus:border-[var(--color-dominante)] focus:ring-2 focus:ring-[var(--color-dominante)]/20 outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex items-end pb-[clamp(0.25rem,0.75vw,0.375rem)]">
                                                            <label className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] cursor-pointer">
                                                                <input type="checkbox"
                                                                    checked={editOblig}
                                                                    onChange={(e) => setEditOblig(e.target.checked)}
                                                                    className="h-[clamp(0.875rem,2vw,1rem)] w-[clamp(0.875rem,2vw,1rem)] rounded border-border text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                                                                />
                                                                <span className="text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium text-text-secondary">{t('obligatoireLabel')}</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-[clamp(0.375rem,1vw,0.5rem)]">
                                                        <ElisaButton variant="outline" size="sm"
                                                            onClick={() => setEditPmId(null)}
                                                        >
                                                            {t('annuler')}
                                                        </ElisaButton>
                                                        <ElisaButton variant="primary" size="sm"
                                                            isLoading={modifier.isPending}
                                                            onClick={handleSaveEdit}
                                                        >
                                                            {t('enregistrer')}
                                                        </ElisaButton>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="mt-[clamp(0.375rem,1.25vw,0.5rem)] flex flex-wrap gap-[clamp(0.375rem,1vw,0.5rem)]">
                                                    <div className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] text-[clamp(0.75rem,1.25vw,0.875rem)]">
                                                        <span className="text-text-muted">{t('coefficient')}:</span>
                                                        <span className={`font-semibold ${pm.coefficient != null ? 'text-[var(--color-accent)]' : 'text-text-muted'}`}>
                                                            {pm.coefficient ?? 'Hérité'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] text-[clamp(0.75rem,1.25vw,0.875rem)]">
                                                        <span className="text-text-muted">{t('statut')}:</span>
                                                        {pm.obligatoire ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] text-[clamp(0.625rem,1vw,0.75rem)] font-medium bg-success/10 text-success">
                                                                <CheckCircle className="h-[clamp(0.75rem,1.25vw,0.875rem)] w-[clamp(0.75rem,1.25vw,0.875rem)]" /> {t('obligatoire')}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full px-[clamp(0.25rem,0.75vw,0.375rem)] py-[clamp(0.0625rem,0.25vw,0.125rem)] text-[clamp(0.625rem,1vw,0.75rem)] font-medium bg-warning/10 text-warning">
                                                                <XCircle className="h-[clamp(0.75rem,1.25vw,0.875rem)] w-[clamp(0.75rem,1.25vw,0.875rem)]" /> {t('optionnel')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] text-[clamp(0.75rem,1.25vw,0.875rem)]">
                                                        <span className="text-text-muted">{t('ordre')}:</span>
                                                        <span className="font-mono text-[clamp(0.625rem,1vw,0.75rem)] text-text-secondary">#{pm.ordre}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ProgrammeMatiereModal
                open={pmModalOpen}
                onOpenChange={(v) => { if (!v) setPmModalOpen(false); }}
                matiereId={matiereId}
                matiereNom={matiereNom}
                programmeIds={programmeIds}
                existingMatieres={existingMatieres}
            />

            <ConfirmationModal
                isOpen={!!deletePmId}
                title={t('retirerProgramme')}
                message={t('retirerProgrammeMessage')}
                details={t('retirerProgrammeDetails')}
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setDeletePmId(null)}
                isLoading={retirer.isPending}
            />
        </div>
    );
}
