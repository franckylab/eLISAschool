/**
 * ==================================
 * eLISAschool - Puck Component: Timeline
 * ==================================
 * Chronologie verticale d'événements.
 */

import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

type TimelineProps = {
    items: Array<{
        date: string;
        titre: string;
        description?: string;
        icone?: string;
    }>;
    orientation: 'vertical' | 'horizontal';
    showLine: boolean;
    styleConfig?: any;
};

export const TimelinePuck: ComponentConfig<TimelineProps> = {
    fields: {
        items: {
            type: 'array',
            arrayFields: {
                date: { type: 'text', label: 'Date', contentEditable: true },
                titre: { type: 'text', label: 'Titre', contentEditable: true },
                description: { type: 'text', label: 'Description', contentEditable: true },
                icone: { type: 'text', label: 'Icône (emoji ou URL)' },
            },
            defaultItemProps: { date: '', titre: '', description: '', icone: '' },
            label: 'Événements',
        },
        orientation: { type: 'radio', label: 'Orientation', options: [{ label: 'Verticale', value: 'vertical' }, { label: 'Horizontale', value: 'horizontal' }] },
        showLine: { type: 'radio', label: 'Ligne', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    },
    defaultProps: {
        items: [
            { date: '2020', titre: 'Fondation', description: 'Création de l\'établissement', icone: '🏫' },
            { date: '2022', titre: 'Expansion', description: 'Ouverture de nouvelles classes', icone: '📈' },
            { date: '2024', titre: 'Excellence', description: 'Certification et récompenses', icone: '🏆' },
        ],
        orientation: 'vertical',
        showLine: true,
    },
    render: ({ items, orientation, showLine, styleConfig }) => (
        <SectionWrapper styleConfig={styleConfig}>
        <div className={`w-full ${orientation === 'horizontal' ? 'overflow-x-auto' : ''}`}>
            <div className={orientation === 'horizontal' ? 'flex gap-6 min-w-max px-4' : 'relative'}>
                {showLine && orientation === 'vertical' && (
                    <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200" />
                )}
                {items.map((item, i) => (
                    <div key={i} className={`relative ${orientation === 'vertical' ? 'pl-14 pb-8' : 'min-w-[200px]'}`}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl">
                            {item.icone || '📌'}
                        </div>
                        <div className="mt-2">
                            <span className="text-xs font-semibold text-blue-600">{item.date}</span>
                            <h4 className="font-bold text-gray-900">{item.titre}</h4>
                            {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </SectionWrapper>
    ),
};
