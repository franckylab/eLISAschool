import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Globe, FileText, Hash, Building2, Info, Calendar } from 'lucide-react';
import { CardSection, InfoField } from '@/components/ui';
import type { Organisation } from '../types/organisation.types';

interface Props { organisation: Organisation }

export function TabInfos({ organisation }: Props) {
    const { t, i18n } = useTranslation('organisation');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <CardSection
                    icon={<FileText className="h-5 w-5 text-dominant-600" />}
                    title={t('descriptionSection')}
                >
                    <p className="text-muted-foreground leading-relaxed">
                        {organisation.description || t('aucuneDescription')}
                    </p>
                </CardSection>

                <CardSection
                    icon={<Building2 className="h-5 w-5 text-dominant-600" />}
                    title={t('informationsGenerales')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoField
                            icon={<Building2 className="h-4 w-4" />}
                            label={t('type')}
                            value={organisation.type?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        />
                        <InfoField
                            icon={<Hash className="h-4 w-4" />}
                            label={t('code')}
                            value={organisation.code || '-'}
                        />
                        <InfoField
                            icon={<Mail className="h-4 w-4" />}
                            label={t('email')}
                            value={organisation.email || '-'}
                        />
                        <InfoField
                            icon={<Phone className="h-4 w-4" />}
                            label={t('telephone')}
                            value={organisation.telephone || '-'}
                        />
                        <InfoField
                            icon={<MapPin className="h-4 w-4" />}
                            label={t('adresse')}
                            value={organisation.adresse || '-'}
                        />
                        <InfoField
                            icon={<Globe className="h-4 w-4" />}
                            label={t('siteWeb')}
                            value={organisation.siteWeb || '-'}
                        />
                    </div>
                </CardSection>
            </div>

            <div className="space-y-6">
                <CardSection
                    icon={<Info className="h-5 w-5 text-dominant-600" />}
                    title={t('statutSection')}
                >
                    <InfoField
                        label={t('statut')}
                        value={
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                organisation.statut === 'ACTIF'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                                {organisation.statut === 'ACTIF' ? t('actif') : t('archive')}
                            </span>
                        }
                    />
                    <InfoField
                        label={t('actif')}
                        value={
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                organisation.actif
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {organisation.actif ? t('oui') : t('non')}
                            </span>
                        }
                    />
                </CardSection>

                <CardSection
                    icon={<Calendar className="h-5 w-5 text-dominant-600" />}
                    title={t('dates')}
                >
                    <InfoField
                        label={t('creeLe')}
                        value={new Date(organisation.createdAt).toLocaleDateString(i18n.language)}
                    />
                    <InfoField
                        label={t('modifieLe')}
                        value={new Date(organisation.updatedAt).toLocaleDateString(i18n.language)}
                    />
                </CardSection>
            </div>
        </div>
    );
}
