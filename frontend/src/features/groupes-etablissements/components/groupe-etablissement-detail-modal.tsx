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
    const { data: groupeDetail, isLoading: detailLoading } = useGroupeEtablissementDetail(groupe.id);
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
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-gray-700">{t('details.nomGroupe')}</h3>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{groupe.nom}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-gray-700">{t('details.code')}</h3>
                        </div>
                        <code className="px-3 py-1.5 bg-white rounded text-sm font-mono border">
                            {groupe.code}
                        </code>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-gray-700">{t('details.etablissements')}</h3>
                        </div>
                        <p className="text-2xl font-bold text-[var(--color-dominante)]">
                            {groupe.nbEtablissements || 0}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-gray-700">{t('details.statut')}</h3>
                        </div>
                        <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                groupe.actif
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                            {groupe.actif ? t('champs.actif') : t('champs.inactif')}
                        </span>
                    </div>
                </div>

                {/* Description */}
                {groupe.description && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-sm text-gray-700 mb-2">{t('details.description')}</h3>
                        <p className="text-gray-900">{groupe.description}</p>
                    </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <h3 className="font-semibold text-sm text-gray-700">{t('details.dateCreation')}</h3>
                        </div>
                        <p className="text-sm text-gray-900">
                            {format(new Date(groupe.creeAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <h3 className="font-semibold text-sm text-gray-700">{t('details.dateModification')}</h3>
                        </div>
                        <p className="text-sm text-gray-900">
                            {format(new Date(groupe.majAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                    </div>
                </div>

                {/* Administrateurs */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-[var(--color-dominante)]" />
                            <h3 className="font-semibold text-sm text-gray-700">{t('details.administrateurs')}</h3>
                        </div>
                        {adminsLoading && (
                            <span className="text-xs text-gray-500">{t('details.chargement')}</span>
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
                                    className="flex items-center justify-between bg-white rounded-lg p-3 border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[var(--color-dominante)]/10 flex items-center justify-center">
                                            <UserMinus className="h-5 w-5 text-[var(--color-dominante)]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">
                                                {admin.utilisateur?.nom || 'Utilisateur'} {admin.utilisateur?.prenom || ''}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {admin.utilisateur?.email || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                            {t('details.aucunAdmin')}
                        </p>
                    )}
                </div>
            </div>
        </CustomModal>
    );
}
