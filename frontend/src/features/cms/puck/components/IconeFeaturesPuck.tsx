/**
 * ==================================
 * eLISAschool - Puck Component: Icone Features
 * ==================================
 * Grille de fonctionnalités avec icônes.
 */
import type { ComponentConfig } from '@puckeditor/core';

type Feature = { icone: string; titre: string; description: string };

type IconeFeaturesProps = {
    features: Feature[];
    columns: number;
    centered: boolean;
};

export const IconeFeaturesPuck: ComponentConfig<IconeFeaturesProps> = {
    fields: {
        features: {
            type: 'array',
            arrayFields: {
                icone: { type: 'text', label: 'Icône (emoji ou URL)' },
                titre: { type: 'text', label: 'Titre' },
                description: { type: 'text', label: 'Description' },
            },
            defaultItemProps: { icone: '✨', titre: 'Feature', description: 'Description de la fonctionnalité' },
            label: 'Fonctionnalités',
        },
        columns: { type: 'select', label: 'Colonnes', options: [
            { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
        ]},
        centered: { type: 'radio', label: 'Centré', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    },
    defaultProps: {
        features: [
            { icone: '📚', titre: 'Programmes riches', description: 'Curriculum complet et enrichi.' },
            { icone: '👨‍🏫', titre: 'Enseignants qualifiés', description: 'Corps professoral expérimenté.' },
            { icone: '🏫', titre: 'Infrastructures modernes', description: 'Salles équipées et laboratoires.' },
            { icone: '🎯', titre: 'Suivi personnalisé', description: 'Accompagnement de chaque élève.' },
            { icone: '🌍', titre: 'Ouverture internationale', description: 'Échanges et partenariats.' },
            { icone: '🏆', titre: 'Excellence académique', description: 'Taux de réussite élevé.' },
        ],
        columns: 3,
        centered: true,
    },
    render: ({ features, columns, centered }) => (
        <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {features.map((f, i) => (
                <div key={i} className={`rounded-xl p-6 ${centered ? 'text-center' : ''}`}>
                    <div className="mb-3 text-3xl">{f.icone}</div>
                    <h3 className="font-bold text-gray-900">{f.titre}</h3>
                    <p className="mt-2 text-sm text-gray-600">{f.description}</p>
                </div>
            ))}
        </div>
    ),
};
