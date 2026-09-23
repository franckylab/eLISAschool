/**
 * ==================================
 * eLISAschool — Platform Groupes · Modal configuration
 * ==================================
 * CustomModal 3xl + onglets sobres (Membres / Modules / Promotions / Vue consolidée).
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Package, BadgePercent, BarChart3, SlidersHorizontal } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { MembresTab } from './tabs/MembresTab';
import { ModulesTab } from './tabs/ModulesTab';
import { PromotionsTab } from './tabs/PromotionsTab';
import { ConsolidatedViewTab } from './tabs/ConsolidatedViewTab';
import { BaremesTab } from './tabs/BaremesTab';
import { useGroupeSaaS } from './use-groupes-saas';
import type { GroupeSaaS, GroupeTabId } from './types';
import { cn } from '@/lib/cn';

interface GroupeConfigureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupe: GroupeSaaS;
}

export function GroupeConfigureModal({ open, onOpenChange, groupe }: GroupeConfigureModalProps) {
    const { t } = useTranslation('admin');
    const [tab, setTab] = useState<GroupeTabId>('membres');
    const { data: groupeFrais } = useGroupeSaaS(open ? groupe.id : null);

    useEffect(() => {
        if (open) setTab('membres');
    }, [open, groupe.id]);

    const groupeCourant = groupeFrais ?? groupe;

    const tabs: Array<{ id: GroupeTabId; label: string; icon: typeof Building2 }> = [
        { id: 'membres', label: t('groupes.tabs.membres'), icon: Building2 },
        { id: 'modules', label: t('groupes.tabs.modules'), icon: Package },
        { id: 'promotions', label: t('groupes.tabs.promotions'), icon: BadgePercent },
        { id: 'consolidee', label: t('groupes.tabs.vueConsolidee'), icon: BarChart3 },
        { id: 'baremes', label: t('groupes.tabs.baremes'), icon: SlidersHorizontal },
    ];

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={`${groupeCourant.nom} — ${t('groupes.configuration')}`}
            description={`${groupeCourant.code} · ${(groupeCourant.etablissements?.length ?? 0)} ${t('groupes.membres')}`}
            size="3xl"
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                <div
                    className="flex gap-[var(--gap-xs)] overflow-x-auto border-b border-[var(--color-bordure)] pb-[var(--space-xs)]"
                    role="tablist"
                    aria-label={t('groupes.configuration')}
                >
                    {tabs.map((item) => {
                        const actif = tab === item.id;
                        return (
                            <button
                                key={item.id}
                                role="tab"
                                aria-selected={actif}
                                onClick={() => setTab(item.id)}
                                className={cn(
                                    'flex shrink-0 items-center gap-[var(--gap-xs)] rounded-t-lg px-[var(--space-md)] py-[var(--space-sm)] text-sm transition-colors',
                                    actif
                                        ? 'bg-[var(--color-dominante)]/10 font-medium text-[var(--color-dominante)]'
                                        : 'text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-hover)]',
                                )}
                            >
                                <item.icon className="h-[var(--icon-sm)] w-[var(--icon-sm)]" aria-hidden />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        role="tabpanel"
                    >
                        {tab === 'membres' && <MembresTab groupe={groupeCourant} />}
                        {tab === 'modules' && <ModulesTab groupe={groupeCourant} />}
                        {tab === 'promotions' && <PromotionsTab groupe={groupeCourant} />}
                        {tab === 'consolidee' && <ConsolidatedViewTab groupe={groupeCourant} />}
                        {tab === 'baremes' && <BaremesTab groupe={groupeCourant} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </CustomModal>
    );
}
