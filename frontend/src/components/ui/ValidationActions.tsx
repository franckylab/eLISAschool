/**
 * ==================================
 * eLISAschool - Validation Actions Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Boutons d'action pour approuver/rejeter/annuler un workflow.
 * Gère le commentaire optionnel et la confirmation.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, XOctagon } from 'lucide-react';
import { ElisaButton } from './ElisaButton';
import { CustomModal } from '../modals/CustomModal';
import { useTraiterValidation, useAnnulerWorkflow, type StatutWorkflow } from '@/hooks/use-validation-workflow';

interface ValidationActionsProps {
    workflowId: string;
    statut: StatutWorkflow;
    niveauActuel: number;
    niveauxRequis: number;
    module: string;
    className?: string;
    onValidated?: () => void;
}

export function ValidationActions({
    workflowId,
    statut,
    module: _module,
    className,
    onValidated,
}: ValidationActionsProps) {
    const { t } = useTranslation();
    const [modalOuvert, setModalOuvert] = useState(false);
    const [decision, setDecision] = useState<'APPROUVE' | 'REJETE'>('APPROUVE');
    const [commentaire, setCommentaire] = useState('');

    const traiter = useTraiterValidation();
    const annuler = useAnnulerWorkflow();

    if (statut !== 'EN_COURS') return null;

    const ouvrirModal = (d: 'APPROUVE' | 'REJETE') => {
        setDecision(d);
        setCommentaire('');
        setModalOuvert(true);
    };

    const handleSubmit = async () => {
        await traiter.mutateAsync({
            workflowId,
            dto: { decision, commentaire: commentaire || undefined },
        });
        setModalOuvert(false);
        onValidated?.();
    };

    const handleAnnuler = async () => {
        await annuler.mutateAsync(workflowId);
        onValidated?.();
    };

    return (
        <>
            <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => ouvrirModal('APPROUVE')}
                    isLoading={traiter.isPending}
                >
                    {t('validation.approuver')}
                </ElisaButton>
                <ElisaButton
                    variant="danger"
                    size="sm"
                    icon={<XCircle className="h-4 w-4" />}
                    onClick={() => ouvrirModal('REJETE')}
                    isLoading={traiter.isPending}
                >
                    {t('validation.rejeter')}
                </ElisaButton>
                <ElisaButton
                    variant="outline"
                    size="sm"
                    icon={<XOctagon className="h-4 w-4" />}
                    onClick={handleAnnuler}
                    isLoading={annuler.isPending}
                >
                    {t('validation.annulerWorkflow')}
                </ElisaButton>
            </div>

            <CustomModal
                open={modalOuvert}
                onOpenChange={setModalOuvert}
                title={decision === 'APPROUVE' ? t('validation.confirmerApprobation') : t('validation.confirmerRejet')}
                size="md"
                footer={<>
                    <ElisaButton variant="outline" onClick={() => setModalOuvert(false)}>
                        {t('common:boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant={decision === 'APPROUVE' ? 'primary' : 'danger'}
                        icon={decision === 'APPROUVE' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        onClick={handleSubmit}
                        isLoading={traiter.isPending}
                    >
                        {decision === 'APPROUVE' ? t('validation.approuver') : t('validation.rejeter')}
                    </ElisaButton>
                </>}
            >
                <div className="space-y-4">
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {decision === 'APPROUVE'
                            ? t('validation.messageApprobation')
                            : t('validation.messageRejet')}
                    </p>
                    <div>
                        <label
                            htmlFor="commentaire-validation"
                            className="mb-1 block text-sm font-medium text-[var(--color-texte)]"
                        >
                            {t('validation.commentaire')} ({t('common:labels.optionnel')})
                        </label>
                        <textarea
                            id="commentaire-validation"
                            value={commentaire}
                            onChange={(e) => setCommentaire(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-texte)] placeholder:text-[var(--color-texte-secondaire)] focus:border-[var(--color-dominante)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominante)]"
                            placeholder={t('validation.commentairePlaceholder')}
                        />
                    </div>
                </div>
            </CustomModal>
        </>
    );
}
