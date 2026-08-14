/**
 * ==================================
 * eLISAschool - Puck Component: Compteurs Animés
 * ==================================
 * Statistiques avec animation de compteur.
 */
import type { ComponentConfig } from '@puckeditor/core';

type CompteurItem = { valeur: number; label: string; prefix?: string; suffix?: string; icone?: string };

type CompteursAnimesProps = {
    items: CompteurItem[];
    columns: number;
    background: 'light' | 'primary' | 'dark';
};

export const CompteursAnimesPuck: ComponentConfig<CompteursAnimesProps> = {
    fields: {
        items: {
            type: 'array',
            arrayFields: {
                valeur: { type: 'number', label: 'Valeur' },
                label: { type: 'text', label: 'Libellé' },
                prefix: { type: 'text', label: 'Préfixe' },
                suffix: { type: 'text', label: 'Suffixe (%, +, etc.)' },
                icone: { type: 'text', label: 'Icône (emoji)' },
            },
            defaultItemProps: { valeur: 0, label: 'Stat', prefix: '', suffix: '', icone: '' },
            label: 'Compteurs',
        },
        columns: { type: 'select', label: 'Colonnes', options: [
            { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
        ]},
        background: { type: 'select', label: 'Fond', options: [
            { label: 'Clair', value: 'light' },
            { label: 'Primaire', value: 'primary' },
            { label: 'Sombre', value: 'dark' },
        ]},
    },
    defaultProps: {
        items: [
            { valeur: 500, label: 'Élèves', suffix: '+', icone: '🎓' },
            { valeur: 50, label: 'Enseignants', icone: '👨‍🏫' },
            { valeur: 98, label: 'Taux réussite', suffix: '%', icone: '🏆' },
            { valeur: 25, label: "Années d'expérience", icone: '📅' },
        ],
        columns: 4,
        background: 'primary',
    },
    render: ({ items, columns, background }) => {
        const bgClass = background === 'dark' ? 'bg-gray-900 text-white' : background === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-900';
        return (
            <div className={`rounded-xl p-8 ${bgClass}`}>
                <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {items.map((item, i) => (
                        <div key={i} className="text-center">
                            {item.icone && <div className="text-3xl mb-2">{item.icone}</div>}
                            <div className="text-3xl font-bold md:text-4xl">
                                {item.prefix}{item.valeur}{item.suffix}
                            </div>
                            <div className="mt-1 text-sm opacity-80">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    },
};
