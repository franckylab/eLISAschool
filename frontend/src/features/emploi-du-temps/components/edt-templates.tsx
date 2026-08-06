/**
 * ==================================
 * eLISAschool - Page Templates EDT
 * ==================================
 * Cards enrichies avec résumé configuration,
 * bouton "Appliquer" rapide, wizard multi-étapes
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Copy, FileText, Plus, Trash2, Edit2, Calendar, Clock, Shield, Users, Sparkles } from 'lucide-react';
import {
    useTemplatesEDT,
    useSupprimerTemplateEDT,
    useDupliquerTemplateEDT,
} from '../hooks/use-emploi-du-temps';
import type { TemplateEDT } from '../types/edt.types';
import { TemplateWizardModal } from './template-wizard-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { toast } from 'sonner';

const JOURS_ABBR: Record<string, string> = {
    LUNDI: 'L', MARDI: 'Ma', MERCREDI: 'Me',
    JEUDI: 'J', VENDREDI: 'V', SAMEDI: 'S', DIMANCHE: 'D',
};

export function EDTTemplatesPage() {
    const { t } = useTranslation('emplois');
    const { data: templates, isLoading, error, refetch } = useTemplatesEDT();
    const supprimerTemplate = useSupprimerTemplateEDT();
    const dupliquerTemplate = useDupliquerTemplateEDT();

    const [wizardOpen, setWizardOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<TemplateEDT | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    const handleDupliquer = async (id: string) => {
        await dupliquerTemplate.mutateAsync({ id });
    };

    const handleSupprimer = async () => {
        if (templateToDelete) {
            await supprimerTemplate.mutateAsync(templateToDelete);
            setTemplateToDelete(null);
        }
    };

    const handleCreer = () => {
        setEditingTemplate(null);
        setWizardOpen(true);
    };

    const handleModifier = (template: TemplateEDT) => {
        setEditingTemplate(template);
        setWizardOpen(true);
    };

    const handleAppliquer = (template: TemplateEDT) => {
        toast.info(t('templates.appliquerInfo', { nom: template.nom }));
    };

    if (error) {
        return <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />;
    }

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-secondary)] max-w-lg">
                    {t('templates.description')}
                </p>
                <ElisaButton variant="primary" size="xs" icon={<Plus className="h-4 w-4" />} onClick={handleCreer}>
                    {t('templates.nouveau')}
                </ElisaButton>
            </div>

            {/* Contenu */}
            {isLoading ? (
                <PageSkeleton showHeader={false} showStats={false} showTable={false} />
            ) : !templates || templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-20 w-20 rounded-2xl bg-[var(--color-dominant-50)] flex items-center justify-center mb-4">
                        <FileText className="h-10 w-10 text-[var(--color-dominant-400)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{t('templates.vide.titre')}</h3>
                    <p className="text-[var(--color-text-secondary)] mb-6 max-w-md">{t('templates.vide.description')}</p>
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreer}>
                        {t('templates.vide.action')}
                    </ElisaButton>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--gap-md)]">
                    {templates.map((template: TemplateEDT, index: number) => (
                        <motion.div
                            key={template.id}
                            className="flex flex-col rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {/* Bandeau coloré si partagé */}
                            {template.estPartage && (
                                <div className="h-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-dominant-500)]" />
                            )}

                            {/* Header card */}
                            <div className="px-5 pt-5 pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                                            {template.nom}
                                        </h3>
                                        {template.description && (
                                            <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                    {template.estPartage && (
                                        <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium rounded-full">
                                            <Users className="h-3 w-3" />
                                            {t('templates.partage')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Résumé configuration */}
                            <div className="px-5 pb-4 flex-1">
                                <div className="space-y-2.5">
                                    {/* Jours travaillés — mini pastilles */}
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                                        <div className="flex gap-0.5 flex-wrap">
                                            {(template.configuration?.joursTravailles ?? []).map((j) => (
                                                <span
                                                    key={j}
                                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)] text-[10px] font-medium"
                                                >
                                                    {JOURS_ABBR[j] ?? '?'}
                                                </span>
                                            ))}
                                            {(!template.configuration?.joursTravailles || template.configuration.joursTravailles.length === 0) && (
                                                <span className="text-xs text-[var(--color-text-muted)]">{t('templates.nonConfigure')}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Horaires */}
                                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                                        <Clock className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                                        <span>
                                            {template.configuration?.heureDebutCours ?? '—'}
                                            <span className="mx-1 text-[var(--color-text-muted)]">–</span>
                                            {template.configuration?.heureFinCours ?? '—'}
                                        </span>
                                        {template.configuration?.dureeCreneauStandard && (
                                            <>
                                                <span className="mx-1 text-[var(--color-text-muted)]">·</span>
                                                <span className="font-medium text-[var(--color-text-primary)]">{template.configuration.dureeCreneauStandard} min</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Contraintes résumé */}
                                    {(template.configuration?.maxCreneauxParJour || template.configuration?.maxCreneauxMatiereParJour) && (
                                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                                            <Shield className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                                            <span>
                                                {template.configuration.maxCreneauxParJour ?? '—'}{t('templates.contraintesResumeJours')}
                                                {' / '}
                                                {template.configuration.maxCreneauxMatiereParJour ?? '—'}{t('templates.contraintesResumeMatiere')}
                                            </span>
                                        </div>
                                    )}

                                    {/* Créneaux types */}
                                    {template.creneauxTypes && template.creneauxTypes.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                                            <Sparkles className="h-3.5 w-3.5 text-[var(--color-text-muted)] shrink-0" />
                                            <span className="font-medium text-[var(--color-text-primary)]">
                                                {template.creneauxTypes.length}
                                            </span>
                                            <span>{t('templates.creneauxTypesResume')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 px-5 py-3 border-t border-[var(--color-bordure)] bg-[var(--color-surface-alt)]/30">
                                <ElisaButton
                                    variant="primary"
                                    size="xs"
                                    icon={<Sparkles className="h-3 w-3" />}
                                    onClick={() => handleAppliquer(template)}
                                    className="flex-1"
                                >
                                    {t('templates.appliquer')}
                                </ElisaButton>
                                <ElisaButton variant="outline" size="xs" icon={<Edit2 className="h-3 w-3" />}
                                    onClick={() => handleModifier(template)}
                                    title={t('templates.modifier')}
                                />
                                <ElisaButton variant="outline" size="xs" icon={<Copy className="h-3 w-3" />}
                                    onClick={() => handleDupliquer(template.id)}
                                    disabled={dupliquerTemplate.isPending}
                                    title={t('templates.dupliquer')}
                                />
                                <ElisaButton variant="ghost" size="xs" icon={<Trash2 className="h-3 w-3" />}
                                    onClick={() => setTemplateToDelete(template.id)}
                                    disabled={supprimerTemplate.isPending}
                                    title={t('templates.supprimer')}
                                    className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Wizard Modal (création + édition) */}
            <TemplateWizardModal
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                template={editingTemplate}
            />

            {/* Confirm suppression */}
            <ConfirmDialog
                open={!!templateToDelete}
                onOpenChange={(v) => { if (!v) setTemplateToDelete(null); }}
                title={t('templates.supprimerTitre')}
                description={t('templates.supprimerMessage')}
                confirmText={t('templates.supprimerConfirmer')}
                variant="danger"
                onConfirm={handleSupprimer}
            />
        </div>
    );
}
