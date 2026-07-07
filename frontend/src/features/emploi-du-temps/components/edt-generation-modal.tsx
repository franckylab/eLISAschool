import { useState } from 'react';
import { useGenererEDT } from '../hooks/use-emploi-du-temps';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Settings, Loader2 } from 'lucide-react';

interface EDTGenerationModalProps {
    classeAnneeId: string;
    onSuccess: () => void;
    onClose: () => void;
}

export function EDTGenerationModal({ classeAnneeId, onSuccess, onClose }: EDTGenerationModalProps) {
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
                    <h3 className="text-lg font-semibold">Options de génération</h3>
                </div>

                <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={regenerer}
                            onChange={(e) => setRegenerer(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                        />
                        <div>
                            <div className="font-medium text-sm">Régénérer complètement</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Supprimer tous les créneaux existants avant de générer
                            </div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={respecterContraintes}
                            onChange={(e) => setRespecterContraintes(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--color-dominant-600)] focus:ring-[var(--color-dominant-500)]"
                        />
                        <div>
                            <div className="font-medium text-sm">Respecter les contraintes</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Éviter les conflits d'enseignants et respecter les préférences
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">Informations</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                    <li> La génération utilise les affectations de la classe</li>
                    <li> Les volumes horaires sont respectés automatiquement</li>
                    <li> Les conflits d'enseignants sont évités</li>
                    <li> Un rapport de conflits est généré si nécessaire</li>
                </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <ElisaButton
                    variant="outline"
                    size="md"
                    onClick={onClose}
                    disabled={genererEDT.isPending}
                >
                    Annuler
                </ElisaButton>

                <ElisaButton
                    variant="primary"
                    size="md"
                    icon={genererEDT.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                    onClick={handleGenerer}
                    disabled={genererEDT.isPending}
                >
                    {genererEDT.isPending ? 'Génération en cours...' : 'Générer'}
                </ElisaButton>
            </div>
        </div>
    );
}
