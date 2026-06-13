/**
 * ==================================
 * eLISAschool - Modal Détail Type de Cycle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Layers, Calendar, Hash, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import type { TypeCycle } from '../types/type-cycle.types';

interface TypeCycleDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    typeCycle: TypeCycle | null;
    onEdit?: () => void;
}

export function TypeCycleDetailModal({ open, onOpenChange, typeCycle, onEdit }: TypeCycleDetailModalProps) {
    if (!typeCycle) return null;

    const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number | boolean }) => (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="text-[var(--color-dominant-600)]">{icon}</div>
            <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value}
                </p>
            </div>
        </div>
    );

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title="Détails du type de cycle"
            description={typeCycle.nom}
            size="lg"
            footer={
                <div className="flex gap-2">
                    {onEdit && (
                        <ElisaButton
                            variant="outline"
                            onClick={() => {
                                onEdit();
                                onOpenChange(false);
                            }}
                        >
                            Modifier
                        </ElisaButton>
                    )}
                    <ElisaButton variant="ghost" onClick={() => onOpenChange(false)}>
                        Fermer
                    </ElisaButton>
                </div>
            }
        >
            <div className="space-y-4">
                {/* En-tête */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[var(--color-dominant-50)] to-[var(--color-dominant-100)] dark:from-[var(--color-dominant-900)] dark:to-[var(--color-dominant-950)]">
                    <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                        <Layers className="h-6 w-6 text-[var(--color-dominant-600)]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{typeCycle.nom}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{typeCycle.code}</p>
                    </div>
                </div>

                {/* Description */}
                {typeCycle.description && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-900 dark:text-blue-100">{typeCycle.description}</p>
                    </div>
                )}

                {/* Détails */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailRow
                        icon={<Hash className="h-5 w-5" />}
                        label="Durée (années)"
                        value={typeCycle.dureeAnnees || 0}
                    />
                    <DetailRow
                        icon={<Calendar className="h-5 w-5" />}
                        label="Ordre"
                        value={typeCycle.ordre}
                    />
                    <DetailRow
                        icon={<BookOpen className="h-5 w-5" />}
                        label="Diplôme sanctionnant"
                        value={typeCycle.diplomeSanctionnant || 'Non défini'}
                    />
                    <DetailRow
                        icon={typeCycle.actif ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        label="Actif"
                        value={typeCycle.actif}
                    />
                </div>

                {/* Métadonnées */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Créé le {new Date(typeCycle.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Dernière modification le {new Date(typeCycle.updatedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
        </CustomModal>
    );
}
