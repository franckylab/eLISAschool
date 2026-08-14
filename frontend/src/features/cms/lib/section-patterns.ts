/**
 * ==================================
 * eLISAschool - Bibliothèque de patterns CMS (blocs réutilisables)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Patterns de sections combinées — insertions one-click dans l'éditeur Puck.
 * Chaque pattern est un ensemble de sections pré-configurées formant
 * un bloc fonctionnel (page inscriptions, contact, galerie, etc.).
 */

import type { Data } from '@puckeditor/core';

// ==================================
// Types
// ==================================

export interface SectionPattern {
    id: string;
    nom: string;
    description: string;
    categorie: 'accueil' | 'information' | 'engagement' | 'navigation' | 'medias' | 'commercial';
    icon: string;
    sections: number;
    data: Data;
}

// ==================================
// Helper — générer un ID unique
// ==================================

let _counter = 0;
function uid(): string {
    return `pat_${Date.now()}_${++_counter}`;
}

// ==================================
// Patterns de sections
// ==================================

export const SECTION_PATTERNS: SectionPattern[] = [
    // ─── ACCUEIL ───────────────────────────────────────────────
    {
        id: 'accueil-complet',
        nom: 'Accueil Complet',
        description: 'Hero + Chiffres clés + Features + Témoignages + CTA. Page d\'accueil type.',
        categorie: 'accueil',
        icon: '🏠',
        sections: 5,
        data: {
            content: [
                {
                    type: 'Hero',
                    props: {
                        id: uid(),
                        titre: 'Bienvenue dans notre établissement',
                        sousTitre: 'Une éducation d\'excellence dans un cadre bienveillant',
                        texteBtn1: 'Découvrir',
                        lienBtn1: '#',
                        texteBtn2: 'Nous contacter',
                        lienBtn2: '#contact',
                        imageBg: '',
                        positionImage: 'right',
                    },
                },
                {
                    type: 'ChiffresCles',
                    props: {
                        id: uid(),
                        items: [
                            { valeur: 500, label: 'Élèves', suffix: '+', icone: '🎓' },
                            { valeur: 50, label: 'Enseignants', icone: '👨‍🏫' },
                            { valeur: 98, label: 'Taux réussite', suffix: '%', icone: '🏆' },
                            { valeur: 25, label: 'Années', icone: '📅' },
                        ],
                        background: 'primary',
                        columns: 4,
                    },
                },
                {
                    type: 'IconeFeatures',
                    props: {
                        id: uid(),
                        features: [
                            { icone: '📚', titre: 'Programmes riches', description: 'Curriculum complet et enrichi.' },
                            { icone: '👨‍🏫', titre: 'Enseignants qualifiés', description: 'Corps professoral expérimenté.' },
                            { icone: '🏫', titre: 'Infrastructures modernes', description: 'Salles équipées et laboratoires.' },
                            { icone: '🎯', titre: 'Suivi personnalisé', description: 'Accompagnement de chaque élève.' },
                        ],
                        columns: 4,
                        centered: true,
                    },
                },
                {
                    type: 'TemoignageCarousel',
                    props: {
                        id: uid(),
                        temoignages: [
                            { nom: 'Marie K.', role: 'Parent d\'élève', citation: 'Un établissement exceptionnel qui a transformé notre enfant.', note: 5 },
                            { nom: 'Jean P.', role: 'Ancien élève', citation: 'Les valeurs et l\'enseignement m\'ont permis de réussir.', note: 5 },
                        ],
                        autoplay: true,
                        showNavigation: true,
                    },
                },
                {
                    type: 'AppelAction',
                    props: {
                        id: uid(),
                        titre: 'Prêt à rejoindre notre famille ?',
                        description: 'Inscriptions ouvertes pour la prochaine année scolaire.',
                        texteBouton: 'S\'inscrire maintenant',
                        lienBouton: '#inscriptions',
                        style: 'gradient',
                    },
                },
            ],
            root: {},
        },
    },

    // ─── INSCRIPTIONS ──────────────────────────────────────────
    {
        id: 'page-inscriptions',
        nom: 'Page Inscriptions',
        description: 'Hero CTA + Étapes + Prix + FAQ + CTA final. Page dédiée aux inscriptions.',
        categorie: 'commercial',
        icon: '📝',
        sections: 5,
        data: {
            content: [
                {
                    type: 'Hero',
                    props: {
                        id: uid(),
                        titre: 'Inscriptions ouvertes',
                        sousTitre: 'Rejoignez notre communauté éducative pour l\'année scolaire 2026-2027',
                        texteBtn1: 'S\'inscrire',
                        lienBtn1: '#formulaire',
                        texteBtn2: 'Tarifs',
                        lienBtn2: '#tarifs',
                    },
                },
                {
                    type: 'Timeline',
                    props: {
                        id: uid(),
                        items: [
                            { titre: 'Pré-inscription en ligne', description: 'Remplissez le formulaire en ligne', icone: '📋' },
                            { titre: 'Entretien', description: 'Rencontre avec la direction', icone: '🤝' },
                            { titre: 'Dossier', description: 'Constitution du dossier administratif', icone: '📁' },
                            { titre: 'Confirmation', description: 'Notification et paiement', icone: '✅' },
                        ],
                        orientation: 'horizontal',
                        showLine: true,
                    },
                },
                {
                    type: 'PrixTab',
                    props: {
                        id: uid(),
                        plans: [
                            {
                                nom: 'Maternelle',
                                prix: '150 000',
                                periode: '/trimestre',
                                features: ['Effectif réduit (15)', 'Éveil musical', 'Anglais dès 3 ans'],
                                highlight: false,
                            },
                            {
                                nom: 'Primaire',
                                prix: '200 000',
                                periode: '/trimestre',
                                features: ['Effectif réduit (20)', 'Informatique', 'Sport inclus', 'Cantine bio'],
                                highlight: true,
                            },
                            {
                                nom: 'Collège',
                                prix: '250 000',
                                periode: '/trimestre',
                                features: ['Labo sciences', 'Soutien scolaire', 'Sorties culturelles'],
                                highlight: false,
                            },
                        ],
                    },
                },
                {
                    type: 'Faq',
                    props: {
                        id: uid(),
                        faqs: [
                            { question: 'Quand commencent les inscriptions ?', reponse: 'Les inscriptions sont ouvertes de janvier à septembre.' },
                            { question: 'Quels documents fournir ?', reponse: 'Bulletin de notes, acte de naissance, certificats médicaux.' },
                            { question: 'Y a-t-il des bourses ?', reponse: 'Oui, des bourses au mérite et sociales sont disponibles.' },
                        ],
                    },
                },
                {
                    type: 'AppelAction',
                    props: {
                        id: uid(),
                        titre: 'N\'attendez plus !',
                        description: 'Les places sont limitées. Inscrivez votre enfant dès maintenant.',
                        texteBouton: 'Formulaire d\'inscription',
                        lienBouton: '#formulaire',
                        style: 'gradient',
                    },
                },
            ],
            root: {},
        },
    },

    // ─── CONTACT ───────────────────────────────────────────────
    {
        id: 'page-contact',
        nom: 'Page Contact',
        description: 'Texte intro + Formulaire + Carte + Horaires. Page contact complète.',
        categorie: 'information',
        icon: '📞',
        sections: 4,
        data: {
            content: [
                {
                    type: 'Texte',
                    props: {
                        id: uid(),
                        contenu: '<h2>Contactez-nous</h2><p>Notre équipe est à votre écoute pour répondre à toutes vos questions. N\'hésitez pas à nous rendre visite ou à nous appeler.</p>',
                        align: 'center',
                    },
                },
                {
                    type: 'Formulaire',
                    props: {
                        id: uid(),
                        champs: ['nom', 'email', 'telephone', 'sujet', 'message'],
                        boutonLabel: 'Envoyer',
                    },
                },
                {
                    type: 'CarteInfos',
                    props: {
                        id: uid(),
                        titre: 'Nos coordonnées',
                        infos: [
                            { icone: '📍', label: 'Adresse', valeur: 'Quartier Bastos, Yaoundé' },
                            { icone: '📞', label: 'Téléphone', valeur: '+237 6XX XXX XXX' },
                            { icone: '✉️', label: 'Email', valeur: 'contact@etablissement.cm' },
                            { icone: '🕐', label: 'Horaires', valeur: 'Lun-Ven: 7h30-16h30' },
                        ],
                    },
                },
                {
                    type: 'Carte',
                    props: {
                        id: uid(),
                        latitude: 3.8667,
                        longitude: 11.5167,
                        zoom: 15,
                    },
                },
            ],
            root: {},
        },
    },

    // ─── GALERIE ───────────────────────────────────────────────
    {
        id: 'page-galerie',
        nom: 'Page Galerie',
        description: 'Intro + Galerie Masonry + Vidéo. Présentation visuelle de l\'établissement.',
        categorie: 'medias',
        icon: '🖼️',
        sections: 3,
        data: {
            content: [
                {
                    type: 'Texte',
                    props: {
                        id: uid(),
                        contenu: '<h2>Notre galerie photos</h2><p>Découvrez notre établissement en images.</p>',
                        align: 'center',
                    },
                },
                {
                    type: 'GalerieMasonry',
                    props: {
                        id: uid(),
                        images: [
                            { url: '', alt: 'Bâtiment principal', span: 'large' },
                            { url: '', alt: 'Salle de classe', span: 'medium' },
                            { url: '', alt: 'Cour de récréation', span: 'small' },
                            { url: '', alt: 'Laboratoire', span: 'medium' },
                            { url: '', alt: 'Bibliothèque', span: 'large' },
                            { url: '', alt: 'Terrain de sport', span: 'small' },
                        ],
                        columns: 3,
                        gap: '8px',
                        borderRadius: '12px',
                    },
                },
                {
                    type: 'Video',
                    props: {
                        id: uid(),
                        url: '',
                        titre: 'Visite virtuelle',
                        description: 'Découvrez notre établissement en vidéo',
                    },
                },
            ],
            root: {},
        },
    },

    // ─── ACTUALITÉS ────────────────────────────────────────────
    {
        id: 'bloc-actualites',
        nom: 'Bloc Actualités',
        description: 'Titre + Grille actualités + CTA. Section actualités pour page d\'accueil.',
        categorie: 'information',
        icon: '📰',
        sections: 2,
        data: {
            content: [
                {
                    type: 'Actualites',
                    props: {
                        id: uid(),
                        titre: 'Dernières actualités',
                        maxItems: 6,
                        displayMode: 'grid',
                    },
                },
                {
                    type: 'AppelAction',
                    props: {
                        id: uid(),
                        titre: 'Restez informé',
                        description: 'Retrouvez toutes les actualités de notre établissement.',
                        texteBouton: 'Voir toutes les actualités',
                        lienBouton: '#actualites',
                        style: 'outline',
                    },
                },
            ],
            root: {},
        },
    },

    // ─── ÉQUIPE PÉDAGOGIQUE ────────────────────────────────────
    {
        id: 'bloc-equipe',
        nom: 'Bloc Équipe',
        description: 'Intro + Grille équipe + Témoignages. Présentation du personnel.',
        categorie: 'information',
        icon: '👥',
        sections: 3,
        data: {
            content: [
                {
                    type: 'Texte',
                    props: {
                        id: uid(),
                        contenu: '<h2>Notre équipe pédagogique</h2><p>Des professionnels passionnés au service de la réussite de vos enfants.</p>',
                        align: 'center',
                    },
                },
                {
                    type: 'Equipe',
                    props: {
                        id: uid(),
                        membres: [
                            { nom: 'Dr. Martin', role: 'Directeur', photo: '', bio: '20 ans d\'expérience en éducation.' },
                            { nom: 'Mme. Ngo', role: 'Directrice adjointe', photo: '', bio: 'Spécialiste en pédagogie active.' },
                            { nom: 'M. Fomekon', role: 'Responsable primaire', photo: '', bio: 'Passionné par l\'enseignement.' },
                            { nom: 'Mme. Tchoua', role: 'Responsable maternelle', photo: '', bio: 'Experte en petite enfance.' },
                        ],
                    },
                },
                {
                    type: 'Temoignages',
                    props: {
                        id: uid(),
                        temoignages: [
                            { nom: 'Parent A.', citation: 'Une équipe dévouée et compétente.', role: 'Parent' },
                            { nom: 'Ancien élève B.', citation: 'Des enseignants qui marquent des vies.', role: 'Alumni' },
                        ],
                    },
                },
            ],
            root: {},
        },
    },

    // ─── PARTENAIRES ───────────────────────────────────────────
    {
        id: 'bloc-partenaires',
        nom: 'Bloc Partenaires',
        description: 'Logo partenaires + Témoignages + CTA. Section confiance.',
        categorie: 'engagement',
        icon: '🤝',
        sections: 3,
        data: {
            content: [
                {
                    type: 'Partenaires',
                    props: {
                        id: uid(),
                        titre: 'Nos partenaires',
                        partenaires: [
                            { nom: 'Ministère Éducation', logo: '' },
                            { nom: 'UNICEF', logo: '' },
                            { nom: 'Alliance Française', logo: '' },
                            { nom: 'British Council', logo: '' },
                        ],
                    },
                },
                {
                    type: 'TemoignageCarousel',
                    props: {
                        id: uid(),
                        temoignages: [
                            { nom: 'Ambassadeur X.', role: 'Partenaire', citation: 'Un établissement modèle dans la sous-région.', note: 5 },
                        ],
                        autoplay: true,
                        showNavigation: true,
                    },
                },
                {
                    type: 'AppelAction',
                    props: {
                        id: uid(),
                        titre: 'Devenez partenaire',
                        description: 'Rejoignez notre réseau de partenaires éducatifs.',
                        texteBouton: 'Nous contacter',
                        lienBouton: '#contact',
                        style: 'outline',
                    },
                },
            ],
            root: {},
        },
    },

    // ─── CARROUSEL VISUEL ──────────────────────────────────────
    {
        id: 'bloc-carrousel',
        nom: 'Bloc Carrousel',
        description: 'Hero vidéo + Carrousel images + Compteurs. Impact visuel maximal.',
        categorie: 'medias',
        icon: '🎬',
        sections: 3,
        data: {
            content: [
                {
                    type: 'HeroVideo',
                    props: {
                        id: uid(),
                        videoUrl: '',
                        titre: 'Vivez l\'expérience',
                        sousTitre: 'Plongez au cœur de notre établissement',
                        overlay: true,
                        overlayOpacity: 50,
                        hauteur: 500,
                    },
                },
                {
                    type: 'Carousel',
                    props: {
                        id: uid(),
                        slides: [
                            { image: '', titre: 'Nos salles', description: 'Équipées et modernes' },
                            { image: '', titre: 'Nos terrains', description: 'Espaces sportifs vastes' },
                            { image: '', titre: 'Notre bibliothèque', description: 'Des milliers d\'ouvrages' },
                        ],
                        autoplay: true,
                        interval: 5000,
                        showDots: true,
                    },
                },
                {
                    type: 'CompteursAnimes',
                    props: {
                        id: uid(),
                        items: [
                            { valeur: 1500, label: 'Élèves', suffix: '+', icone: '🎓' },
                            { valeur: 120, label: 'Personnel', icone: '👨‍🏫' },
                            { valeur: 95, label: 'Satisfaction', suffix: '%', icone: '⭐' },
                            { valeur: 30, label: 'Années', suffix: ' ans', icone: '🏛️' },
                        ],
                        columns: 4,
                        background: 'dark',
                    },
                },
            ],
            root: {},
        },
    },

    // ─── NEWSLETTER + RÉSEAUX ──────────────────────────────────
    {
        id: 'bloc-newsletter',
        nom: 'Bloc Newsletter',
        description: 'Newsletter + Réseaux sociaux. Engagement communautaire.',
        categorie: 'engagement',
        icon: '📧',
        sections: 2,
        data: {
            content: [
                {
                    type: 'Newsletter',
                    props: {
                        id: uid(),
                        titre: 'Restez informé',
                        description: 'Inscrivez-vous à notre newsletter pour recevoir les dernières nouvelles.',
                        placeholderEmail: 'Votre adresse email',
                        labelBouton: 'S\'abonner',
                        background: 'primary',
                    },
                },
                {
                    type: 'Partenaires',
                    props: {
                        id: uid(),
                        titre: 'Suivez-nous',
                        partenaires: [
                            { nom: 'Facebook', logo: '' },
                            { nom: 'Instagram', logo: '' },
                            { nom: 'YouTube', logo: '' },
                            { nom: 'LinkedIn', logo: '' },
                        ],
                    },
                },
            ],
            root: {},
        },
    },

    // ─── PAGE INFORMATION ──────────────────────────────────────
    {
        id: 'page-information',
        nom: 'Page Information',
        description: 'Hero texte + Contenu + Téléchargements + FAQ. Page type "À propos".',
        categorie: 'information',
        icon: 'ℹ️',
        sections: 4,
        data: {
            content: [
                {
                    type: 'Texte',
                    props: {
                        id: uid(),
                        contenu: '<h1>À propos de notre établissement</h1><p>Fondé en 1996, notre établissement est un pilier de l\'éducation dans la région.</p>',
                        align: 'center',
                    },
                },
                {
                    type: 'Texte',
                    props: {
                        id: uid(),
                        contenu: '<h2>Notre mission</h2><p>Former les leaders de demain dans un environnement bienveillant et stimulant.</p><h2>Notre vision</h2><p>Devenir l\'établissement de référence en matière d\'éducation innovante.</p>',
                        align: 'left',
                    },
                },
                {
                    type: 'Telechargements',
                    props: {
                        id: uid(),
                        titre: 'Documents utiles',
                        fichiers: [
                            { nom: 'Règlement intérieur', taille: '2.1 MB' },
                            { nom: 'Projet d\'établissement', taille: '3.5 MB' },
                            { nom: 'Calendrier scolaire', taille: '0.8 MB' },
                        ],
                    },
                },
                {
                    type: 'Faq',
                    props: {
                        id: uid(),
                        faqs: [
                            { question: 'Quelle est la philosophie de l\'école ?', reponse: 'L\'excellence académique dans la bienveillance.' },
                            { question: 'Quels programmes sont suivis ?', reponse: 'Programme officiel enrichi de modules complémentaires.' },
                        ],
                    },
                },
            ],
            root: {},
        },
    },

    // ─── SÉPARATEUR VISUEL ─────────────────────────────────────
    {
        id: 'separateur-decoratif',
        nom: 'Séparateur Décoratif',
        description: 'Séparateur + Compteurs + Séparateur. Transition visuelle entre sections.',
        categorie: 'navigation',
        icon: '〰️',
        sections: 3,
        data: {
            content: [
                {
                    type: 'Separateur',
                    props: { id: uid(), style: 'wave', couleur: 'primary' },
                },
                {
                    type: 'CompteursAnimes',
                    props: {
                        id: uid(),
                        items: [
                            { valeur: 100, label: 'Ans d\'excellence', suffix: '+', icone: '🏆' },
                            { valeur: 5000, label: 'Diplômés', suffix: '+', icone: '🎓' },
                        ],
                        columns: 2,
                        background: 'primary',
                    },
                },
                {
                    type: 'Separateur',
                    props: { id: uid(), style: 'wave', couleur: 'primary' },
                },
            ],
            root: {},
        },
    },

    // ─── TARIFS + COMPARAISON ──────────────────────────────────
    {
        id: 'bloc-tarifs',
        nom: 'Bloc Tarifs',
        description: 'Titre + Grille tarifs + Features + FAQ. Page tarifs complète.',
        categorie: 'commercial',
        icon: '💰',
        sections: 4,
        data: {
            content: [
                {
                    type: 'Texte',
                    props: {
                        id: uid(),
                        contenu: '<h2>Nos tarifs</h2><p>Des frais scolaires transparents pour une éducation de qualité.</p>',
                        align: 'center',
                    },
                },
                {
                    type: 'PrixTab',
                    props: {
                        id: uid(),
                        plans: [
                            {
                                nom: 'Demi-pension',
                                prix: '180 000',
                                periode: '/trimestre',
                                features: ['Cantine midi', 'Goûter inclus', 'Menu bio'],
                                highlight: false,
                            },
                            {
                                nom: 'Interne',
                                prix: '350 000',
                                periode: '/trimestre',
                                features: ['Hébergement', '3 repas/jour', 'Étude du soir', 'Activités soir'],
                                highlight: true,
                            },
                            {
                                nom: 'Externat',
                                prix: '150 000',
                                periode: '/trimestre',
                                features: ['Journée complète', 'Cantine en option'],
                                highlight: false,
                            },
                        ],
                    },
                },
                {
                    type: 'IconeFeatures',
                    props: {
                        id: uid(),
                        features: [
                            { icone: '✅', titre: 'Frais transparents', description: 'Aucun coût caché.' },
                            { icone: '💳', titre: 'Paiement flexible', description: 'Mensuel ou trimestriel.' },
                            { icone: '🎓', titre: 'Bourses disponibles', description: 'Aides au mérite.' },
                        ],
                        columns: 3,
                        centered: true,
                    },
                },
                {
                    type: 'Faq',
                    props: {
                        id: uid(),
                        faqs: [
                            { question: 'Comment payer ?', reponse: 'Mobile money, virement, ou espèces.' },
                            { question: 'Des réductions ?', reponse: 'Oui, pour fratries (10%) et bourses.' },
                        ],
                    },
                },
            ],
            root: {},
        },
    },
];

// ==================================
// Helpers
// ==================================

/**
 * Retourne un pattern par son ID.
 */
export function getSectionPattern(id: string): SectionPattern | undefined {
    return SECTION_PATTERNS.find(p => p.id === id);
}

/**
 * Retourne les patterns par catégorie.
 */
export function getPatternsByCategorie(categorie: SectionPattern['categorie']): SectionPattern[] {
    return SECTION_PATTERNS.filter(p => p.categorie === categorie);
}

/**
 * Labels des catégories pour l'UI.
 */
export const PATTERN_CATEGORIE_LABELS: Record<SectionPattern['categorie'], string> = {
    accueil: 'Accueil',
    information: 'Information',
    engagement: 'Engagement',
    navigation: 'Navigation',
    medias: 'Médias',
    commercial: 'Commercial',
};

/**
 * Insère un pattern dans les données Puck existantes.
 * Retourne un nouveau Data avec les sections du pattern ajoutées.
 */
export function insererPatternDansPuck(existingData: Data, pattern: SectionPattern): Data {
    const newContent = [
        ...existingData.content,
        ...pattern.data.content,
    ];
    return { content: newContent, root: existingData.root };
}
