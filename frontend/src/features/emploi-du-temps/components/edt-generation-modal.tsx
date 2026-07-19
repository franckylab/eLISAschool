import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGenererEDT } from '../hooks/use-emploi-du-temps';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Settings, Loader2, Info } from 'lucide-react';

interface EDTGenerationModalProps {
    classeAnneeId: string;
    onSuccess: () => void;
    onClose: () => void;
}

export function EDTGenerationModal({ classeAnneeId, onSuccess, onClose }: EDTGenerationModalProps) {
    const { t } = useTranslation('emplois');
    const genererEDT = useGenererEDT();

    const [regenerer, setRegenerer] = useState(false);
    const [respecterContraintes, setRespecterContraintes] = useState(true);

    const handleGenerer = async () => {
        try {
            await genererEDT.mutateAsync({
                classeAnneeId,
                options: { regenerer, respecterContraintes },
            });
            onSuccess();
        } catch {
            // Error already handled by hook's onError toast
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-[var(--color-dominant-600)]" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('generation.options')}</h3>
                </div>

                <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            checked={regenerer}
                            onChange={(e) => setRegenerer(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-[var(--color-bordure)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                        />
                        <div>
                            <div className="font-medium text-sm text-[var(--color-text-primary)]">{t('generation.regenerer')}</div>
                            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                {t('generation.regenererDesc')}
                            </div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] cursor-pointer transition-colors">
                        <input
                            type="checkbox"
                            checked={respecterContraintes}
                            onChange={(e) => setRespecterContraintes(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-[var(--color-bordure)] text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                        />
                        <div>
                            <div className="font-medium text-sm text-[var(--color-text-primary)]">{t('generation.respecterContraintes')}</div>
                            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                {t('generation.respecterContraintesDesc')}
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="p-4 rounded-lg border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5">
                <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-[var(--color-accent)]" />
                    <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">{t('generation.info.titre')}</h4>
                </div>
                <ul className="text-xs text-[var(--color-text-secondary)] space-y-1 ml-6 list-disc">
                    <li>{t('generation.info.l1')}</li>
                    <li>{t('generation.info.l2')}</li>
                    <li>{t('generation.info.l3')}</li>
                    <li>{t('generation.info.l4')}</li>
                </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-bordure)]">
                <ElisaButton variant="outline" size="md" onClick={onClose} disabled={genererEDT.isPending}>
                    {t('generation.annuler')}
                </ElisaButton>
                <ElisaButton
                    variant="primary"
                    size="md"
                    icon={genererEDT.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                    onClick={handleGenerer}
                    disabled={genererEDT.isPending}
                >
                    {genererEDT.isPending ? t('generation.enCours') : t('generation.generer')}
                </ElisaButton>
            </div>
        </div>
    );
}