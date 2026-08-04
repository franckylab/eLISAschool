/**
 * ==================================
 * eLISAschool - Modal Détails Groupe d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { CustomModal } from '@/components/modals/CustomModal';
import { Building2, Users, Calendar, Clock, UserPlus, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import type { GroupeEtablissement } from '../types/groupe-etablissement.types';
import { useGroupeEtablissementDetail, useListerAdmins } from '../hooks/use-groupes-etablissements';

interface GroupeEtablissementDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupe: GroupeEtablissement;
}

export function GroupeEtablissementDetailModal({
    open,
    onOpenChange,
    groupe,
}: GroupeEtablissementDetailModalProps) {
    const { t } = useTranslation('groupes-etablissements');
    const { data: groupeDetail } = useGroupeEtablissementDetail(groupe.id);
    const { data: admins, isLoading: adminsLoading } = useListerAdmins(groupe.id);

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('details.titre')}
            description={groupe.nom}
            size="2xl"
            showClose
            closeOnOverlayClick
        >
            <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-[var(--color-texte)]">{t('details.nomGroupe')}</h3>
                        </div>
                        <p className="text-lg font-bold text-[var(--color-texte)]">{groupe.nom}</p>
                    </div>

                    <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-[var(--color-texte)]">{t('details.code')}</h3>
                        </div>
                        <code className="px-3 py-1.5 bg-[var(--color-surface)] dark:bg-[var(--color-surface-300)] border border-[var(--color-bordure)] rounded text-sm font-mono text-[var(--color-texte)]">
                            {groupe.code}
                        </code>
                    </div>

                    <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-[var(--color-texte)]">{t('details.etablissements')}</h3>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-dominante)] mb-3">
                            {groupe.nbEtablissements || 0}
                        </p>
                        
                        {/* Liste des établissements */}
                        {(groupeDetail as any)?.etablissements && (groupeDetail as any).etablissements.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {(groupeDetail as any).etablissements.map((etab: any) => (
                                    <div
                                        key={etab.id}
                                        className="flex items-center gap-2 p-2 rounded-md bg-[var(--color-surface)] dark:bg-[var(--color-surface-300)] border border-[var(--color-bordure)]"
                                    >
                                        <Building2 className="h-4 w-4 text-[var(--color-dominante)] flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--color-texte)] truncate">
                                                {etab.nom || etab.etablissement?.nom || 'N/A'}
                                            </p>
                                            <code className="text-xs text-[var(--color-texte-secondaire)] font-mono">
                                                {etab.code || etab.etablissement?.code || ''}
                                            </code>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--color-texte-secondaire)] italic">
                                Aucun établissement assigné
                            </p>
                        )}
                    </div>

                    <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-[var(--color-texte)]">{t('details.statut')}</h3>
                        </div>
                        <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${
                                groupe.actif
                                    ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                    : 'bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            {groupe.actif ? t('champs.actif') : t('champs.inactif')}
                        </span>
                    </div>
                </div>

                {/* Description */}
                {groupe.description && (
                    <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                        <h3 className="font-semibold text-sm text-[var(--color-texte)] mb-2">{t('details.description')}</h3>
                        <p className="text-[var(--color-texte)]">{groupe.description}</p>
                    </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            <h3 className="font-semibold text-sm text-[var(--color-texte)]">{t('details.dateCreation')}</h3>
                        </div>
                        <p className="text-sm text-[var(--color-texte)]">
                            {format(new Date(groupe.creeAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                    </div>

                    <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                            <h3 className="font-semibold text-sm text-[var(--color-texte)]">{t('details.dateModification')}</h3>
                        </div>
                        <p className="text-sm text-[var(--color-texte)]">
                            {format(new Date(groupe.majAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                    </div>
                </div>

                {/* Administrateurs */}
                <div className="bg-[var(--color-surface-50)] dark:bg-[var(--color-surface-200)] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-[var(--color-texte)]">{t('details.administrateurs')}</h3>
                        </div>
                        {adminsLoading && (
                            <span className="text-xs text-[var(--color-texte-secondaire)]">{t('details.chargement')}</span>
                        )}
                    </div>

                    {adminsLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-300 rounded-full" />
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-gray-300 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : admins && admins.length > 0 ? (
                        <div className="space-y-2">
                            {admins.map((admin: any) => (
                                <div
                                    key={admin.id}
                                    className="flex items-center justify-between bg-[var(--color-surface)] dark:bg-[var(--color-surface-200)] rounded-lg p-3 border border-[var(--color-bordure)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[var(--color-dominante)]/10 flex items-center justify-center">
                                            <UserMinus className="h-5 w-5 text-[var(--color-dominante)]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-[var(--color-texte)]">
                                                {admin.utilisateur?.nom || 'Utilisateur'} {admin.utilisateur?.prenom || ''}
                                            </p>
                                            <p className="text-xs text-[var(--color-texte-secondaire)]">
                                                {admin.utilisateur?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-[var(--color-texte-secondaire)] text-center py-4">
                            {t('details.aucunAdmin')}
                        </p>
                    )}
                </div>
            </div>
        </CustomModal>
    );
}
