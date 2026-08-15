/**
 * ==================================
 * eLISAschool - Puck Component: Tabs
 * ==================================
 * Contenu à onglets interactifs.
 */

import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

type TabItem = { label: string; contenu: string; icone?: string };

type TabsProps = {
    tabs: TabItem[];
    style: 'underline' | 'pills' | 'boxed';
    styleConfig?: any;
};

export const TabsPuck: ComponentConfig<TabsProps> = {
    fields: {
        tabs: {
            type: 'array',
            arrayFields: {
                label: { type: 'text', label: 'Libellé', contentEditable: true },
                contenu: { type: 'text', label: 'Contenu (HTML supporté)', contentEditable: true },
                icone: { type: 'text', label: 'Icône (emoji)' },
            },
            defaultItemProps: { label: 'Onglet', contenu: 'Contenu de l\'onglet', icone: '' },
            label: 'Onglets',
        },
        style: { type: 'select', label: 'Style', options: [
            { label: 'Souligné', value: 'underline' },
            { label: 'Pilules', value: 'pills' },
            { label: 'Boîtes', value: 'boxed' },
        ]},
    },
    defaultProps: {
        tabs: [
            { label: 'Présentation', contenu: 'Contenu de présentation', icone: '📋' },
            { label: 'Programmes', contenu: 'Contenu des programmes', icone: '📚' },
            { label: 'Inscriptions', contenu: 'Contenu des inscriptions', icone: '✍️' },
        ],
        style: 'underline',
    },
    render: ({ tabs, style, styleConfig }) => {
        const activeTab = 0; // Static preview — premier onglet actif
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className="w-full">
                <div className={`flex gap-1 border-b ${style === 'pills' ? 'gap-2 border-none' : ''} ${style === 'boxed' ? 'border rounded-t-lg bg-gray-50 p-1' : ''}`}>
                    {tabs.map((tab, i) => (
                        <button
                            key={i}
                            className={`px-4 py-2 text-sm font-medium transition-colors
                                ${i === activeTab
                                    ? style === 'pills' ? 'rounded-full bg-blue-600 text-white'
                                        : style === 'boxed' ? 'rounded-t bg-white text-blue-600 shadow-sm'
                                        : 'border-b-2 border-blue-600 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.icone && <span className="mr-1">{tab.icone}</span>}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="py-4 text-gray-700">
                    {tabs[activeTab]?.contenu || 'Contenu de l\'onglet'}
                </div>
            </div>
            </SectionWrapper>
        );
    },
};
