/**
 * ==================================
 * eLISAschool - Page Nomenclatures (onglets)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Regroupe les 6 nomenclatures éditables en onglets via le composant
 * générique réutilisable NomenclatureCrudPage (mode embedded).
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Tag, Briefcase, UserCheck, ArrowUpDown, Network, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent, type Tab } from '@/components/ui';
import { useDocumentTitle } from '@/hooks';
import { NiveauxOrganisationPage } from './niveaux-organisation-page';
import { UsagesUnitePage } from './usages-unite-page';
import { CategoriesPostePage } from './categories-poste-page';
import { NiveauxResponsabilitePage } from './niveaux-responsabilite-page';
import { TypesPersonnelPage } from './types-personnel-page';
import { TypesRelationPage } from './types-relation-page';
import { ModesRemunerationPage } from './modes-remuneration-page';

export function NomenclaturesPage() {
    const { t } = useTranslation('organisation');
    useDocumentTitle(`eLISAschool | ${t('nomenclaturesTitre')}`);
    const [tab, setTab] = useState('niveaux-organisation');

    const onglets: Tab[] = [
        { id: 'niveaux-organisation', label: t('niveauxOrganisation'), icon: Layers },
        { id: 'usages-unite', label: t('usagesUnite'), icon: Tag },
        { id: 'categories-poste', label: t('categoriesPoste'), icon: Briefcase },
        { id: 'niveaux-responsabilite', label: t('niveauxResponsabilite'), icon: ArrowUpDown },
        { id: 'types-personnel', label: t('typesPersonnel'), icon: UserCheck },
        { id: 'types-relation', label: t('typesRelation'), icon: Network },
        { id: 'modes-remuneration', label: t('modesRemuneration'), icon: DollarSign },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('nomenclaturesTitre')}
                subtitle={t('nomenclaturesSubtitle')}
                icon={Layers}
                variant="gradient"
            />
            <TabsBar tabs={onglets} activeTab={tab} onTabChange={setTab} variant="underline" showHeader />
            <TabsContent activeTab={tab}>
                {tab === 'niveaux-organisation' && <NiveauxOrganisationPage embedded />}
                {tab === 'usages-unite' && <UsagesUnitePage embedded />}
                {tab === 'categories-poste' && <CategoriesPostePage embedded />}
                {tab === 'niveaux-responsabilite' && <NiveauxResponsabilitePage embedded />}
                {tab === 'types-personnel' && <TypesPersonnelPage embedded />}
                {tab === 'types-relation' && <TypesRelationPage embedded />}
                {tab === 'modes-remuneration' && <ModesRemunerationPage embedded />}
            </TabsContent>
        </div>
    );
}
