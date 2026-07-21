import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Building2, Layers, Briefcase, GitBranch, Users,
    CheckCircle, SlidersHorizontal,
} from 'lucide-react';
import { useStatistiquesOrganisation } from '../hooks/use-organisation';
import { TabUnites } from './tab-unites';
import { TabPostes } from './tab-postes';
import { TabFonctions } from './tab-fonctions';
import { TabHierarchie } from './tab-hierarchie';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useAuthStore } from '@/stores/auth.store';
import { useDocumentTitle } from '@/hooks';

type Onglet = 'unites' | 'postes' | 'fonctions' | 'hierarchie';

export function OrganisationPage() {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const { etablissementId, etablissementsDisponibles } = useAuthStore();

    useDocumentTitle(`eLISAschool | ${t('organigramme')}`);

    const [ongletActif, setOngletActif] = useState<Onglet>('unites');
    const stats = useStatistiquesOrganisation();

    const onglets: Tab[] = [
        { id: 'unites', label: t('unites'), icon: Layers },
        { id: 'postes', label: t('postes'), icon: Briefcase },
        { id: 'fonctions', label: t('fonctions'), icon: GitBranch },
        { id: 'hierarchie', label: t('hierarchie'), icon: Users },
    ];

    const nomEtablissement = etablissementsDisponibles.find(e => e.id === etablissementId)?.nom || t('organigramme');

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col" style={{ gap: 'var(--gap-lg)', padding: 'var(--space-lg)' }}>
            <PageHeader
                title={nomEtablissement}
                subtitle={t('organigramme')}
                icon={Building2}
                variant="gradient"
                actions={
                    <div className="flex flex-col gap-[var(--gap-sm)]">
                        <ElisaButton variant="outline" size="sm" leftIcon={<SlidersHorizontal className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={() => navigate({ to: '/organisation/nomenclatures' })}>
                            {t('nomenclatures')}
                        </ElisaButton>
                    </div>
                }
            />

            <CardGrid>
                <StatCard icon={Layers} label={t('unites')} value={stats.data?.totalUnites ?? '-'} color="purple" />
                <StatCard icon={Briefcase} label={t('postes')} value={stats.data?.totalPostes ?? '-'} color="purple" />
                <StatCard icon={CheckCircle} label={t('occupation', { taux: stats.data?.tauxOccupation ?? '-' })}
                    value={`${stats.data?.postesActifs ?? '-'}/${stats.data?.totalPostes ?? '-'}`}
                    color={((stats.data?.tauxOccupation ?? 0) >= 80) ? 'green' : ((stats.data?.tauxOccupation ?? 0) >= 50) ? 'yellow' : 'red'} />
                <StatCard icon={Users} label={t('postesVacants')} value={stats.data?.postesVacants ?? '-'} color="orange" />
            </CardGrid>

            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as Onglet)}
                variant="underline"
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'unites' && <TabUnites />}
                {ongletActif === 'postes' && <TabPostes />}
                {ongletActif === 'fonctions' && <TabFonctions />}
                {ongletActif === 'hierarchie' && <TabHierarchie />}
            </TabsContent>
        </motion.div>
    );
}
