/**
 * ==================================
 * eLISAschool - Modal génération de Bulletins
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Génération des bulletins d'une classe pour une période
 * via POST /api/bulletins/generate (CustomModal).
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Sparkles } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { usePeriodes } from '@/features/periodes/hooks/use-periodes';
import { useAnneeScolaireActive } from '@/features/annees-scolaires/hooks/use-annees-scolaires';
import { useGenererBulletins } from '../hooks/use-bulletins';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BulletinGenerateModal({ open, onOpenChange }: Props) {
    const { t } = useTranslation('bulletins');
    const [classeAnneeId, setClasseAnneeId] = useState('');
    const [periodeId, setPeriodeId] = useState('');
    const [erreurClasse, setErreurClasse] = useState<string | undefined>(undefined);
    const [erreurPeriode, setErreurPeriode] = useState<string | undefined>(undefined);

    const { data: classesData } = useClasses({ limit: 100 });
    const { data: anneeActive } = useAnneeScolaireActive();
    const { data: periodes } = usePeriodes({ anneeId: anneeActive?.id || '' });
    const generer = useGenererBulletins();

    const classes = useMemo(
        () => (classesData?.items ?? []).filter((c) => !!c.classeAnneeId),
        [classesData]
    );

    useEffect(() => {
        if (!open) {
            setClasseAnneeId('');
            setPeriodeId('');
            setErreurClasse(undefined);
            setErreurPeriode(undefined);
        }
    }, [open]);

    const handleGenerer = async () => {
        const classeManquante = !classeAnneeId;
        const periodeManquante = !periodeId;
        setErreurClasse(classeManquante ? t('validationClasseRequise') : undefined);
        setErreurPeriode(periodeManquante ? t('validationPeriodeRequise') : undefined);
        if (classeManquante || periodeManquante) return;

        await generer.mutateAsync({ classeAnneeId, periodeId });
        onOpenChange(false);
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('genererTitre')}
            description={t('genererDescription')}
            size="md"
            footer={
                <div className="flex justify-end gap-[var(--gap-sm)]">
                    <ElisaButton variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                        {t('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Sparkles className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        isLoading={generer.isPending}
                        onClick={handleGenerer}
                    >
                        {t('genererAction')}
                    </ElisaButton>
                </div>
            }
        >
            <div className="flex flex-col gap-[clamp(0.625rem,1.5vw,1rem)]">
                <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-muted/50 p-3">
                    <FileText className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">{t('genererAide')}</p>
                </div>

                <ElisaSelect
                    label={t('classe') + ' *'}
                    value={classeAnneeId}
                    onValueChange={(v) => { setClasseAnneeId(v); setErreurClasse(undefined); }}
                    options={classes.map((c) => ({ value: c.classeAnneeId as string, label: c.nom }))}
                    placeholder={t('selectionnerClasse')}
                    error={erreurClasse}
                />

                <ElisaSelect
                    label={t('periode') + ' *'}
                    value={periodeId}
                    onValueChange={(v) => { setPeriodeId(v); setErreurPeriode(undefined); }}
                    options={(periodes ?? []).map((p) => ({ value: p.id, label: p.nom }))}
                    placeholder={t('selectionnerPeriode')}
                    error={erreurPeriode}
                />
            </div>
        </CustomModal>
    );
}
