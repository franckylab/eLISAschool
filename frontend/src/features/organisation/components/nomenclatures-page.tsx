/**
 * ==================================
 * eLISAschool - Page Nomenclatures (onglets)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Refonte v4.0 : 4 onglets (Échelons structurels, Responsabilités, Types personnel, Modes rémun.)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, ArrowUpDown, UserCheck, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent, type Tab } from '@/components/ui';
import { useDocumentTitle } from '@/hooks';
import { EchelonsStructurelsPage } from './echelons-structurels-page';
import { NiveauxResponsabilitePage } from './niveaux-responsabilite-page';
import { TypesPersonnelPage } from './types-personnel-page';
import { ModesRemunerationPage } from './modes-remuneration-page';

export function NomenclaturesPage() {
    const { t } = useTranslation('organisation');
    useDocumentTitle(`eLISAschool | ${t('nomenclaturesTitre')}`);
    const [tab, setTab] = useState('echelons-structurels');

    const onglets: Tab[] = [
        { id: 'echelons-structurels', label: t('echelonsStructurels'), icon: Layers },
        { id: 'niveaux-responsabilite', label: t('niveauxResponsabilite'), icon: ArrowUpDown },
        { id: 'types-personnel', label: t('typesPersonnel'), icon: UserCheck },
        { id: 'modes-remuneration', label: t('modesRemuneration'), icon: DollarSign },
    ];

    return (
        <div className="flex flex-col" style={{ gap: 'var(--gap-lg)', padding: 'var(--space-lg)' }}>
            <PageHeader
                title={t('nomenclaturesTitre')}
                subtitle={t('nomenclaturesSubtitle')}
                icon={Layers}
                variant="gradient"
            />
            <TabsBar tabs={onglets} activeTab={tab} onTabChange={setTab} variant="underline" showHeader />
            <TabsContent activeTab={tab}>
                {tab === 'echelons-structurels' && <EchelonsStructurelsPage embedded />}
                {tab === 'niveaux-responsabilite' && <NiveauxResponsabilitePage embedded />}
                {tab === 'types-personnel' && <TypesPersonnelPage embedded />}
                {tab === 'modes-remuneration' && <ModesRemunerationPage embedded />}
            </TabsContent>
        </div>
    );
}
