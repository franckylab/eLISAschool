/**
 * ==================================
 * eLISAschool - Puck Component: Hero Vidéo
 * ==================================
 * Hero avec vidéo en arrière-plan.
 */
import type { ComponentConfig } from '@puckeditor/core';

type HeroVideoProps = {
    videoUrl: string;
    titre: string;
    sousTitre: string;
    boutonTexte: string;
    boutonLien: string;
    overlay: boolean;
    overlayOpacity: string;
    hauteur: string;
};

export const HeroVideoPuck: ComponentConfig<HeroVideoProps> = {
    fields: {
        videoUrl: { type: 'text', label: 'URL vidéo (MP4 ou YouTube embed)' },
        titre: { type: 'text', label: 'Titre' },
        sousTitre: { type: 'text', label: 'Sous-titre' },
        boutonTexte: { type: 'text', label: 'Texte bouton' },
        boutonLien: { type: 'text', label: 'Lien bouton' },
        overlay: { type: 'radio', label: 'Overlay', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
        overlayOpacity: { type: 'select', label: 'Opacité overlay', options: [
            { label: 'Légère (30%)', value: '0.3' },
            { label: 'Moyenne (50%)', value: '0.5' },
            { label: 'Forte (70%)', value: '0.7' },
        ]},
        hauteur: { type: 'select', label: 'Hauteur', options: [
            { label: 'Moyenne (500px)', value: '500px' },
            { label: 'Grande (700px)', value: '700px' },
            { label: 'Plein écran', value: '100vh' },
        ]},
    },
    defaultProps: {
        videoUrl: '',
        titre: 'Bienvenue dans notre établissement',
        sousTitre: 'Excellence éducative depuis 2020',
        boutonTexte: 'Découvrir',
        boutonLien: '#',
        overlay: true,
        overlayOpacity: '0.5',
        hauteur: '700px',
    },
    render: ({ videoUrl, titre, sousTitre, boutonTexte, overlay, overlayOpacity, hauteur }) => (
        <div className="relative flex items-center justify-center overflow-hidden" style={{ height: hauteur }}>
            {videoUrl ? (
                <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
                    <source src={videoUrl} type="video/mp4" />
                </video>
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-800" />
            )}
            {overlay && <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />}
            <div className="relative z-10 text-center text-white px-4 max-w-3xl">
                <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">{titre}</h1>
                <p className="mt-4 text-lg opacity-90 md:text-xl">{sousTitre}</p>
                {boutonTexte && (
                    <a href={boutonLien} className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-colors">
                        {boutonTexte}
                    </a>
                )}
            </div>
        </div>
    ),
};
