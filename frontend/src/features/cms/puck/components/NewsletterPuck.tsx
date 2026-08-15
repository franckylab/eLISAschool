/**
 * ==================================
 * eLISAschool - Puck Component: Newsletter
 * ==================================
 * Formulaire d'abonnement newsletter.
 */
import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

type NewsletterProps = {
    titre: string;
    description: string;
    placeholder: string;
    boutonTexte: string;
    showNom: boolean;
    background: 'light' | 'primary' | 'dark';
    styleConfig?: any;
};

export const NewsletterPuck: ComponentConfig<NewsletterProps> = {
    fields: {
        titre: { type: 'text', label: 'Titre', contentEditable: true },
        description: { type: 'text', label: 'Description', contentEditable: true },
        placeholder: { type: 'text', label: 'Placeholder email' },
        boutonTexte: { type: 'text', label: 'Texte bouton', contentEditable: true },
        showNom: { type: 'radio', label: 'Champ nom', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
        background: { type: 'select', label: 'Fond', options: [
            { label: 'Clair', value: 'light' },
            { label: 'Couleur primaire', value: 'primary' },
            { label: 'Sombre', value: 'dark' },
        ]},
    },
    defaultProps: {
        titre: 'Restez informé',
        description: 'Inscrivez-vous à notre newsletter pour recevoir les dernières nouvelles.',
        placeholder: 'votre@email.com',
        boutonTexte: "S'inscrire",
        showNom: false,
        background: 'primary',
    },
    render: ({ titre, description, placeholder, boutonTexte, showNom, background, styleConfig }) => {
        const bgClass = background === 'dark' ? 'bg-gray-900 text-white' : background === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-900';
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className={`rounded-xl p-8 text-center ${bgClass}`}>
                <h3 className="text-2xl font-bold">{titre}</h3>
                <p className="mt-2 opacity-80">{description}</p>
                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    {showNom && <input type="text" placeholder="Votre nom" className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30" />}
                    <input type="email" placeholder={placeholder} className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30" />
                    <button className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-blue-600 shadow hover:bg-blue-50 transition-colors">
                        {boutonTexte}
                    </button>
                </div>
            </div>
            </SectionWrapper>
        );
    },
};
