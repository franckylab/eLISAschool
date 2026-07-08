import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Globe, FileText, Hash, Building2 } from 'lucide-react';
import type { Organisation } from '../types/organisation.types';

interface Props { organisation: Organisation }

export function TabInfos({ organisation }: Props) {
    const { t } = useTranslation('organisation');
    const infos = [
        { icon: Building2, label: t('type'), value: organisation.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) },
        { icon: Hash, label: t('code'), value: organisation.code || '-' },
        { icon: Mail, label: t('email'), value: organisation.email || '-' },
        { icon: Phone, label: t('telephone'), value: organisation.telephone || '-' },
        { icon: MapPin, label: t('adresse'), value: organisation.adresse || '-' },
        { icon: Globe, label: t('siteWeb'), value: organisation.siteWeb || '-' },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        {t('descriptionSection')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        {organisation.description || t('aucuneDescription')}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        {t('informationsGenerales')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {infos.map((info) => {
                            const Icon = info.icon;
                            return (
                                <div key={info.label} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{info.label}</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{info.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('statutSection')}</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('statut')}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                organisation.statut === 'ACTIF'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                                {organisation.statut === 'ACTIF' ? t('actif') : t('archive')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('actif')}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                organisation.actif
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {organisation.actif ? t('oui') : t('non')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('dates')}</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('creeLe')}</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                {new Date(organisation.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{t('modifieLe')}</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                {new Date(organisation.updatedAt).toLocaleDateString('fr-FR')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
