import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertCircle, Check, ArrowRight, Loader2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useTousRoles } from '../hooks/use-roles-permissions';
import { useChangerRole } from '../hooks/use-utilisateurs';
import type { Utilisateur } from '../types/utilisateur.types';

interface ChangeRoleModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    utilisateur: Utilisateur;
    onSuccess?: () => void;
}

export function ChangeRoleModal({ open, onOpenChange, utilisateur, onSuccess }: ChangeRoleModalProps) {
    const { t } = useTranslation('utilisateurs');
    const { data: roles, isLoading: rolesLoading } = useTousRoles({ enabled: open });
    const changerRole = useChangerRole();
    const [selectedRole, setSelectedRole] = useState(utilisateur.role);
    const [step, setStep] = useState<'select' | 'confirm'>('select');

    useEffect(() => {
        if (open) {
            setSelectedRole(utilisateur.role);
            setStep('select');
        }
    }, [open, utilisateur.role]);

    const selectedRoleData = roles?.find(r => r.code === selectedRole);
    const currentRoleData = roles?.find(r => r.code === utilisateur.role);
    const hasChanged = selectedRole !== utilisateur.role;

    const handleConfirm = async () => {
        if (!hasChanged) return;
        try {
            await changerRole.mutateAsync({ id: utilisateur.id, role: selectedRole });
            onOpenChange(false);
            onSuccess?.();
        } catch {
            // Toast géré par le hook
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={(open) => {
                if (!changerRole.isPending) onOpenChange(open);
            }}
            size="lg"
            showClose={!changerRole.isPending}
            closeOnOverlayClick={!changerRole.isPending}
        >
            <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                    <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 shrink-0">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {t('changerRole.titre')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {utilisateur.nom} {utilisateur.prenom} &mdash; {utilisateur.email}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="font-medium">{currentRoleData?.libelle ?? utilisateur.role}</span>
                    </div>
                    {hasChanged && (
                        <>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                <Shield className="h-3.5 w-3.5" />
                                <span className="font-medium">{selectedRoleData?.libelle ?? selectedRole}</span>
                            </div>
                        </>
                    )}
                </div>

                {step === 'select' && (
                    <>
                        {rolesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            </div>
                        ) : (
                            roles?.map((role) => {
                                const isSelected = selectedRole === role.code;
                                const isCurrent = role.code === utilisateur.role;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRole(role.code)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all
                                            ${isSelected
                                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                            ${isSelected
                                                ? 'border-blue-500 dark:border-blue-400'
                                                : 'border-gray-300 dark:border-gray-500'
                                            }
                                        `}>
                                            {isSelected && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {role.libelle}
                                                </span>
                                                {isCurrent && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                                                        {t('changerRole.actuel')}
                                                    </span>
                                                )}
                                            </div>
                                            {role.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                                    {role.description}
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </>
                )}

                {step === 'confirm' && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                                        {t('changerRole.confirmation.titre')}
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                        {t('changerRole.confirmation.description', {
                                            ancien: currentRoleData?.libelle ?? utilisateur.role,
                                            nouveau: selectedRoleData?.libelle ?? selectedRole,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {t('changerRole.confirmation.roleActuel')}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {currentRoleData?.libelle ?? utilisateur.role}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    {t('changerRole.confirmation.nouveauRole')}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                        {selectedRoleData?.libelle ?? selectedRole}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ElisaButton
                        variant="outline"
                        onClick={() => {
                            if (step === 'confirm') {
                                setStep('select');
                            } else {
                                onOpenChange(false);
                            }
                        }}
                        disabled={changerRole.isPending}
                    >
                        {step === 'confirm' ? t('changerRole.retour') : t('changerRole.annuler')}
                    </ElisaButton>

                    {step === 'select' ? (
                        <ElisaButton
                            variant="primary"
                            onClick={() => setStep('confirm')}
                            disabled={!hasChanged}
                        >
                            {t('changerRole.suivant')}
                        </ElisaButton>
                    ) : (
                        <ElisaButton
                            variant="primary"
                            onClick={handleConfirm}
                            isLoading={changerRole.isPending}
                        >
                            {t('changerRole.confirmer')}
                        </ElisaButton>
                    )}
                </div>
            </div>
        </CustomModal>
    );
}
