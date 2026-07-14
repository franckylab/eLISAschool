import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Briefcase, CheckCircle, XCircle, ArrowRight, Users, Eye } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { useModulePermissions } from '@/hooks';
import { useStatistiquesOrganisation } from '../hooks/use-organisation';
import { usePostes } from '@/features/postes/hooks/use-postes';

interface Props { organisationId: string }

export function TabPostes({ organisationId }: Props) {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const { canAccess } = useModulePermissions('postes');
    const stats = useStatistiquesOrganisation(organisationId);
    const { data: postesData } = usePostes({ limit: 5 } as any);

    if (!canAccess) return null;

    const postes = postesData?.data || [];
    const s = stats.data;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <CardGrid columns={{ default: 1, sm: 2, lg: 4 }}>
                <StatCard
                    icon={Briefcase}
                    label={t('totalPostes')}
                    value={s?.totalPostes ?? '-'}
                    color="purple"
                />
                <StatCard
                    icon={CheckCircle}
                    label={t('postesActifs')}
                    value={s?.postesActifs ?? '-'}
                    color="green"
                />
                <StatCard
                    icon={XCircle}
                    label={t('postesVacants')}
                    value={s?.postesVacants ?? '-'}
                    color="orange"
                />
                <StatCard
                    icon={Users}
                    label={t('tauxOccupation')}
                    value={s?.tauxOccupation != null ? `${s.tauxOccupation}%` : '-'}
                    color={s?.tauxOccupation >= 80 ? 'green' : s?.tauxOccupation >= 50 ? 'yellow' : 'red'}
                />
            </CardGrid>

            {postes.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">{t('derniersPostes')}</h4>
                    <div className="space-y-2">
                        {postes.slice(0, 4).map((p) => (
                            <button
                                key={p.id}
                                onClick={() => navigate({ to: '/organisation/postes/$id', params: { id: p.id } })}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm font-medium truncate">{p.intitulé}</span>
                                    <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{p.code}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                        (p.occupantsCount || 0) < p.nombrePostes
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    }`}>
                                        {p.occupantsCount || 0}/{p.nombrePostes}
                                    </span>
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <ElisaButton
                    variant="primary"
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => navigate({ to: '/organisation/postes' })}
                >
                    {t('voirTousPostes')}
                </ElisaButton>
            </div>
        </motion.div>
    );
}
