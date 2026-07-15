import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Phone, Mail, MapPin, Briefcase, GraduationCap, BookOpen } from 'lucide-react';
import { useResponsableEleveDetail } from '../hooks/use-responsables-eleves';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { useTabState } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { InfoField } from '@/components/ui/InfoField';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

type OngletActif = 'informations' | 'eleves';

export function ResponsableEleveDetailPage() {
    const { id } = useParams({ from: '/_auth/responsables-eleves/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('responsables-eleves');
    const { data: responsable, isLoading, error } = useResponsableEleveDetail(id);
    const [ongletActif, setOngletActif] = useTabState<OngletActif>('informations');

    const getLienParenteLabel = (lien: string) => {
        const labels: Record<string, string> = {
            PERE: t('liens.PERE'),
            MERE: t('liens.MERE'),
            TUTEUR: t('liens.TUTEUR'),
            AUTRE: t('liens.AUTRE'),
        };
        return labels[lien] || lien;
    };

    const onglets: Tab[] = [
        { id: 'informations', label: t('informations'), icon: BookOpen },
        { id: 'eleves', label: t('eleves'), icon: GraduationCap },
    ];

    if (isLoading) return <PageSkeleton showHeader />;

    if (error || !responsable) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <ErrorMessage
                    message={t('introuvable')}
                    onRetry={() => navigate({ to: '/responsables-eleves' })}
                />
            </div>
        );
    }

    const r = responsable.data;

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={Users}
                title={`${r.eleveNom ?? ''} ${r.elevePrenom ?? ''}`}
                subtitle={getLienParenteLabel(r.lienParente)}
                onBack={() => navigate({ to: '/responsables-eleves' })}
                showBreadcrumbs={false}
            />

            <TabsBar tabs={onglets} activeTab={ongletActif} onTabChange={(tabId) => setOngletActif(tabId as OngletActif)} variant="underline" />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'informations' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('detailsResponsable')}</CardTitle>
                            </CardHeader>
                            <div className="border-b border-border mx-4 sm:mx-5" />
                            <CardContent>
                                <div className="space-y-3">
                                    <InfoField label={t('telephone')} value={r.telephone ?? '—'} icon={<Phone className="h-4 w-4" />} />
                                    <InfoField label={t('email')} value={r.email ?? '—'} icon={<Mail className="h-4 w-4" />} />
                                    <InfoField label={t('adresse')} value={r.adresse ?? '—'} icon={<MapPin className="h-4 w-4" />} />
                                    <InfoField label={t('profession')} value={r.profession ?? '—'} icon={<Briefcase className="h-4 w-4" />} />
                                    <InfoField label={t('lienParente')} value={getLienParenteLabel(r.lienParente)} icon={<UserCheck className="h-4 w-4" />} />
                                    <InfoField label={t('responsableLegal')} value={r.responsableLegal ? t('oui') : t('non')} icon={<UserCheck className="h-4 w-4" />} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('detailsEleve')}</CardTitle>
                            </CardHeader>
                            <div className="border-b border-border mx-4 sm:mx-5" />
                            <CardContent>
                                <div className="space-y-3">
                                    <InfoField label={t('eleveNom')} value={r.eleveNom ?? '—'} icon={<GraduationCap className="h-4 w-4" />} />
                                    <InfoField label={t('elevePrenom')} value={r.elevePrenom ?? '—'} icon={<GraduationCap className="h-4 w-4" />} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {ongletActif === 'eleves' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('detailsEleve')}</CardTitle>
                        </CardHeader>
                        <div className="border-b border-border mx-4 sm:mx-5" />
                        <CardContent>
                            <div className="space-y-3">
                                <InfoField label={t('eleveNom')} value={r.eleveNom ?? '—'} icon={<GraduationCap className="h-4 w-4" />} />
                                <InfoField label={t('elevePrenom')} value={r.elevePrenom ?? '—'} icon={<GraduationCap className="h-4 w-4" />} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>
        </div>
    );
}
