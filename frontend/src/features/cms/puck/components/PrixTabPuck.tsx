/**
 * ==================================
 * eLISAschool - Puck Component: Tableau de Prix
 * ==================================
 * Grille tarifaire avec plans et features.
 */
import type { ComponentConfig } from '@puckeditor/core';

type PlanItem = { nom: string; prix: string; periode?: string; features: string[]; highlight: boolean; boutonTexte: string };

type PrixTabProps = {
    plans: PlanItem[];
    titre: string;
    sousTitre: string;
};

export const PrixTabPuck: ComponentConfig<PrixTabProps> = {
    fields: {
        titre: { type: 'text', label: 'Titre' },
        sousTitre: { type: 'text', label: 'Sous-titre' },
        plans: {
            type: 'array',
            arrayFields: {
                nom: { type: 'text', label: 'Nom du plan' },
                prix: { type: 'text', label: 'Prix' },
                periode: { type: 'text', label: 'Période (/mois, /an)' },
                features: { type: 'text', label: 'Features (séparées par virgule)' },
                highlight: { type: 'radio', label: 'Mis en avant', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
                boutonTexte: { type: 'text', label: 'Texte bouton' },
            },
            defaultItemProps: { nom: 'Plan', prix: '0', periode: '/mois', features: '', highlight: false, boutonTexte: 'Choisir' },
            label: 'Plans',
        },
    },
    defaultProps: {
        titre: 'Nos Formules',
        sousTitre: 'Choisissez la formule adaptée à vos besoins',
        plans: [
            { nom: 'Base', prix: '50 000', periode: '/trimestre', features: 'Cours,Manuels,Activités', highlight: false, boutonTexte: 'Choisir' },
            { nom: 'Premium', prix: '80 000', periode: '/trimestre', features: 'Cours,Manuels,Activités,Cantine,Transport', highlight: true, boutonTexte: 'Choisir' },
            { nom: 'Excellence', prix: '120 000', periode: '/trimestre', features: 'Tout Premium,Tutorat,Sorties,Club', highlight: false, boutonTexte: 'Choisir' },
        ],
    },
    render: ({ titre, sousTitre, plans }) => (
        <div className="w-full py-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">{titre}</h2>
                <p className="mt-2 text-gray-600">{sousTitre}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan, i) => (
                    <div key={i} className={`relative rounded-xl border p-6 text-center ${plan.highlight ? 'border-blue-600 shadow-lg scale-105' : 'border-gray-200'}`}>
                        {plan.highlight && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                                Populaire
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">{plan.nom}</h3>
                        <div className="mt-4 text-3xl font-bold text-blue-600">{plan.prix}<span className="text-sm text-gray-500">{plan.periode}</span></div>
                        <ul className="mt-6 space-y-2 text-sm text-gray-600">
                            {(typeof plan.features === 'string' ? plan.features.split(',') : plan.features || []).map((f: string, j: number) => (
                                <li key={j} className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span> {f.trim()}
                                </li>
                            ))}
                        </ul>
                        <button className={`mt-6 w-full rounded-lg py-2.5 text-sm font-semibold transition-colors ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                            {plan.boutonTexte}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    ),
};
