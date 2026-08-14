/**
 * ==================================
 * eLISAschool - Seed CMS Templates
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Seed TypeScript idempotent pour les templates CMS système.
 * Vérifie l'existence avant insertion (ON CONFLICT DO NOTHING).
 * 8 templates système : Accueil, Contact, Galerie, Inscriptions,
 * À propos, Mentions légales, Actualités, Page vierge.
 */

import { AppDataSource } from '../../src/database/data-source';
import { CmsTemplate, CategorieTemplate } from '../../src/modules/cms/entities/cms-template.entity';
import { logger } from '../../src/common/utils/logger.util';

// ==================================
// Définition des 8 templates système
// ==================================

const TEMPLATES_SYSTEME = [
    {
        nom: 'Accueil classique',
        code: 'ACCUEIL_CLASSIQUE',
        description: 'Page d\'accueil avec hero, présentation, chiffres clés et appel à l\'action',
        categorie: CategorieTemplate.ACCUEIL,
        ordre: 1,
        sectionsDef: [
            {
                type: 'HERO',
                titre: 'Bienvenue',
                contenu: {
                    surtitre: 'Notre établissement',
                    titre: 'Bienvenue dans notre établissement',
                    description: 'Un lieu d\'excellence éducative au service de la réussite de chaque élève.',
                    boutons: [
                        { label: 'Découvrir', url: '#about', principal: true, nouvelOnglet: false },
                        { label: 'Nous contacter', url: '/e/{code}/contact', principal: false, nouvelOnglet: false },
                    ],
                },
                ordre: 0,
            },
            {
                type: 'TEXTE',
                titre: 'Notre mission',
                contenu: {
                    html: '<p style="max-width:700px;margin:0 auto;line-height:1.8;text-align:center;">Nous offrons un enseignement de qualité, dans un cadre bienveillant et stimulant, pour former les citoyens de demain. Chaque élève est accompagné individuellement vers la réussite.</p>',
                },
                ordre: 1,
            },
            {
                type: 'CHIFFRES_CLES',
                titre: 'Notre établissement en chiffres',
                contenu: {
                    chiffres: [
                        { valeur: '500+', label: 'Élèves', description: 'Inscrits cette année' },
                        { valeur: '30+', label: 'Enseignants', description: 'Qualifiés et dévoués' },
                        { valeur: '95%', label: 'Taux de réussite', description: 'Aux examens nationaux' },
                        { valeur: '15+', label: 'Années', description: 'D\'excellence éducative' },
                    ],
                },
                ordre: 2,
            },
            {
                type: 'CARTE_INFOS',
                titre: 'Pourquoi nous choisir',
                contenu: {
                    cartes: [
                        { icone: '🎓', titre: 'Excellence académique', description: 'Un programme rigoureux aligné sur les standards nationaux et internationaux.' },
                        { icone: '🤝', titre: 'Encadrement personnalisé', description: 'Des classes à effectif réduit pour une attention individuelle.' },
                        { icone: '🌍', titre: 'Ouverture sur le monde', description: 'Activités parascolaires, voyages pédagogiques et partenariats.' },
                    ],
                },
                ordre: 3,
            },
            {
                type: 'APPEL_ACTION',
                titre: 'Rejoignez notre communauté éducative',
                contenu: {
                    description: 'Venez découvrir notre établissement et rencontrer notre équipe.',
                    bouton: { label: 'S\'inscrire maintenant', url: '/e/{code}/inscriptions', nouvelOnglet: false },
                },
                ordre: 4,
            },
        ],
    },
    {
        nom: 'Page Contact',
        code: 'PAGE_CONTACT',
        description: 'Page de contact avec formulaire, carte et informations pratiques',
        categorie: CategorieTemplate.SPECIAL,
        ordre: 2,
        sectionsDef: [
            {
                type: 'HERO',
                titre: 'Contactez-nous',
                contenu: {
                    surtitre: 'Communication',
                    titre: 'Nous sommes à votre écoute',
                    description: 'N\'hésitez pas à nous contacter pour toute question ou demande d\'inscription.',
                    boutons: [],
                },
                ordre: 0,
            },
            {
                type: 'FORMULAIRE',
                titre: 'Formulaire de contact',
                contenu: {
                    description: 'Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.',
                },
                ordre: 1,
            },
            {
                type: 'CARTE_INFOS',
                titre: 'Informations pratiques',
                contenu: {
                    cartes: [
                        { icone: '📍', titre: 'Adresse', description: 'Siège de l\'établissement' },
                        { icone: '📞', titre: 'Téléphone', description: 'Appelez-nous aux heures de bureau' },
                        { icone: '✉️', titre: 'Email', description: 'Écrivez-nous à tout moment' },
                    ],
                },
                ordre: 2,
            },
            {
                type: 'CARTE',
                titre: 'Nous localiser',
                contenu: {},
                ordre: 3,
            },
        ],
    },
    {
        nom: 'Page Galerie',
        code: 'PAGE_GALERIE',
        description: 'Galerie photos de l\'établissement avec lightbox',
        categorie: CategorieTemplate.PAGE,
        ordre: 3,
        sectionsDef: [
            {
                type: 'HERO',
                titre: 'Galerie photos',
                contenu: {
                    surtitre: 'En images',
                    titre: 'Découvrez notre établissement en photos',
                    description: 'Vie scolaire, activités, événements et infrastructures.',
                    boutons: [],
                },
                ordre: 0,
            },
            {
                type: 'GALERIE',
                titre: 'Nos photos',
                contenu: {
                    images: [
                        { url: '', alt: 'Photo 1', legend: 'Nos infrastructures' },
                        { url: '', alt: 'Photo 2', legend: 'Vie scolaire' },
                        { url: '', alt: 'Photo 3', legend: 'Activités sportives' },
                        { url: '', alt: 'Photo 4', legend: 'Laboratoire' },
                        { url: '', alt: 'Photo 5', legend: 'Bibliothèque' },
                        { url: '', alt: 'Photo 6', legend: 'Cérémonie' },
                    ],
                },
                ordre: 1,
            },
        ],
    },
    {
        nom: 'Page Inscriptions',
        code: 'PAGE_INSCRIPTIONS',
        description: 'Page d\'information sur les procédures d\'inscription',
        categorie: CategorieTemplate.PAGE,
        ordre: 4,
        sectionsDef: [
            {
                type: 'HERO',
                titre: 'Inscriptions',
                contenu: {
                    surtitre: 'Rejoignez-nous',
                    titre: 'Procédure d\'inscription',
                    description: 'Découvrez les étapes pour inscrire votre enfant dans notre établissement.',
                    boutons: [
                        { label: 'Nous contacter', url: '/e/{code}/contact', principal: true, nouvelOnglet: false },
                    ],
                },
                ordre: 0,
            },
            {
                type: 'TEXTE',
                titre: 'Étapes d\'inscription',
                contenu: {
                    html: '<div style="max-width:700px;margin:0 auto;line-height:1.8;"><ol style="list-style:decimal;padding-left:1.5rem;"><li style="margin-bottom:1rem;"><strong>Retrait du dossier</strong> — Présentez-vous à l\'accueil ou téléchargez le dossier ci-dessous.</li><li style="margin-bottom:1rem;"><strong>Constitution du dossier</strong> — Rassemblez les pièces requises (bulletins, certificats, photos).</li><li style="margin-bottom:1rem;"><strong>Dépôt du dossier</strong> — Déposez le dossier complet au secrétariat.</li><li style="margin-bottom:1rem;"><strong>Test de niveau</strong> — L\'élève passera un test d\'évaluation (sauf maternelle).</li><li style="margin-bottom:1rem;"><strong>Entretien</strong> — Entretien avec la direction pour les parents et l\'élève.</li><li style="margin-bottom:1rem;"><strong>Notification</strong> — Réponse sous 5 jours ouvrables.</li></ol></div>',
                },
                ordre: 1,
            },
            {
                type: 'TELECHARGEMENTS',
                titre: 'Documents à télécharger',
                contenu: {
                    fichiers: [
                        { nom: 'Dossier d\'inscription', description: 'Formulaire à remplir et à compléter', url: '#', taille: '' },
                        { nom: 'Liste des pièces requises', description: 'Documents à fournir', url: '#', taille: '' },
                        { nom: 'Tarifs et frais de scolarité', description: 'Grille tarifaire par niveau', url: '#', taille: '' },
                    ],
                },
                ordre: 2,
            },
            {
                type: 'FAQ',
                titre: 'Questions fréquentes',
                contenu: {
                    faqs: [
                        { question: 'Quand les inscriptions sont-elles ouvertes ?', reponse: 'Les inscriptions sont ouvertes toute l\'année, sous réserve de places disponibles.' },
                        { question: 'Quels sont les niveaux proposés ?', reponse: 'Nous proposons tous les niveaux de la maternelle au secondaire.' },
                        { question: 'Y a-t-il des bourses disponibles ?', reponse: 'Oui, des bourses d\'excellence et des aides sociales sont disponibles sur dossier.' },
                    ],
                },
                ordre: 3,
            },
        ],
    },
    {
        nom: 'Page À propos',
        code: 'PAGE_A_PROPOS',
        description: 'Page de présentation avec équipe, chiffres clés et témoignages',
        categorie: CategorieTemplate.PAGE,
        ordre: 5,
        sectionsDef: [
            {
                type: 'HERO',
                titre: 'Notre établissement',
                contenu: {
                    surtitre: 'Qui sommes-nous',
                    titre: 'Une tradition d\'excellence éducative',
                    description: 'Découvrez notre histoire, nos valeurs et notre équipe engagée pour la réussite de chaque élève.',
                    boutons: [],
                },
                ordre: 0,
            },
            {
                type: 'TEXTE',
                titre: 'Notre histoire',
                contenu: {
                    html: '<p style="max-width:700px;margin:0 auto;line-height:1.8;text-align:justify;">Fondé il y a plus de 15 ans, notre établissement s\'est donné pour mission de former les leaders de demain. Dans un environnement bienveillant et stimulant, nous accompagnons chaque élève vers la réussite académique et personnelle.</p>',
                },
                ordre: 1,
            },
            {
                type: 'CHIFFRES_CLES',
                titre: 'L\'établissement en chiffres',
                contenu: {
                    chiffres: [
                        { valeur: '15+', label: 'Années d\'expérience' },
                        { valeur: '500+', label: 'Élèves' },
                        { valeur: '30+', label: 'Enseignants' },
                        { valeur: '95%', label: 'Taux de réussite' },
                    ],
                },
                ordre: 2,
            },
            {
                type: 'EQUIPE',
                titre: 'Notre équipe dirigeante',
                contenu: {
                    membres: [
                        { nom: 'M. le Directeur', fonction: 'Directeur', photo: '', bio: 'Engagé pour l\'excellence éducative.' },
                        { nom: 'Mme la Directrice adjointe', fonction: 'Directrice adjointe', photo: '', bio: 'Spécialiste en pédagogie.' },
                    ],
                },
                ordre: 3,
            },
            {
                type: 'TEMOIGNAGES',
                titre: 'Ils nous font confiance',
                contenu: {
                    temoignages: [
                        { nom: 'Marie K.', fonction: 'Parent d\'élève', texte: 'Un établissement exceptionnel.', avatar: '' },
                        { nom: 'Paul N.', fonction: 'Parent d\'élève', texte: 'L\'équipe pédagogique est à l\'écoute.', avatar: '' },
                    ],
                },
                ordre: 4,
            },
            {
                type: 'APPEL_ACTION',
                titre: 'Rejoignez notre communauté',
                contenu: {
                    description: 'Venez découvrir notre établissement.',
                    bouton: { label: 'Nous contacter', url: '/e/{code}/contact' },
                },
                ordre: 5,
            },
        ],
    },
    {
        nom: 'Page Mentions légales',
        code: 'PAGE_MENTIONS_LEGALES',
        description: 'Page de mentions légales avec informations juridiques',
        categorie: CategorieTemplate.SPECIAL,
        ordre: 6,
        sectionsDef: [
            {
                type: 'TEXTE',
                titre: 'Mentions légales',
                contenu: {
                    html: '<div style="max-width:700px;margin:0 auto;line-height:1.8;"><h3>Éditeur du site</h3><p>Le présent site est la propriété de et est édité par :</p><p>[Nom de l\'établissement]<br/>[Adresse complète]</p><h3>Propriété intellectuelle</h3><p>L\'ensemble du contenu de ce site est protégé par le droit d\'auteur.</p><h3>Données personnelles</h3><p>Les données personnelles collectées sont utilisées uniquement dans le cadre du fonctionnement de l\'établissement.</p></div>',
                },
                ordre: 0,
            },
            {
                type: 'TELECHARGEMENTS',
                titre: 'Documents officiels',
                contenu: {
                    fichiers: [
                        { nom: 'Règlement intérieur', description: 'Règlement en vigueur', url: '#' },
                        { nom: 'Charte informatique', description: 'Règles d\'utilisation', url: '#' },
                        { nom: 'Politique de confidentialité', description: 'Traitement des données', url: '#' },
                    ],
                },
                ordre: 1,
            },
        ],
    },
    {
        nom: 'Page Actualités',
        code: 'PAGE_ACTUALITES',
        description: 'Page de liste des actualités et nouvelles de l\'établissement',
        categorie: CategorieTemplate.PAGE,
        ordre: 7,
        sectionsDef: [
            {
                type: 'HERO',
                titre: 'Actualités',
                contenu: {
                    surtitre: 'Dernières nouvelles',
                    titre: 'Restez informé',
                    description: 'Suivez les dernières nouvelles de notre établissement.',
                    boutons: [],
                },
                ordre: 0,
            },
            {
                type: 'ACTUALITES',
                titre: 'Dernières actualités',
                contenu: {
                    actualites: [
                        { titre: 'Rentrée scolaire 2025', date: '2025-09-01', resume: 'La rentrée scolaire est fixée au 1er septembre.', image: '', lien: '#' },
                        { titre: 'Journée portes ouvertes', date: '2025-06-15', resume: 'Venez découvrir notre établissement.', image: '', lien: '#' },
                    ],
                },
                ordre: 1,
            },
        ],
    },
    {
        nom: 'Page vierge',
        code: 'PAGE_VIERGE',
        description: 'Template vide pour créer une page personnalisée',
        categorie: CategorieTemplate.PAGE,
        ordre: 8,
        sectionsDef: [
            {
                type: 'HERO',
                titre: 'Titre de la page',
                contenu: {
                    surtitre: 'Surtitre',
                    titre: 'Titre principal',
                    description: 'Description de la page.',
                    boutons: [],
                },
                ordre: 0,
            },
        ],
    },
];

// ==================================
// Fonction de seed
// ==================================

export async function seedCmsTemplates(): Promise<void> {
    const templateRepo = AppDataSource.getRepository(CmsTemplate);

    logger.info('[Seed] Vérification des templates CMS système...');

    let created = 0;
    let skipped = 0;

    for (const tpl of TEMPLATES_SYSTEME) {
        try {
            // Vérifier si le template existe déjà
            const existing = await templateRepo.findOne({ where: { code: tpl.code } });
            if (existing) {
                skipped++;
                continue;
            }

            const template = templateRepo.create({
                ...tpl,
                estSysteme: true,
                actif: true,
                sectionsDef: tpl.sectionsDef as Record<string, unknown>[],
            });

            await templateRepo.save(template);
            created++;
            logger.info(`[Seed] Template créé : ${tpl.nom} (${tpl.code})`);
        } catch (error) {
            logger.warn(`[Seed] Erreur création template ${tpl.code}`, { error });
        }
    }

    logger.info(`[Seed] Templates CMS : ${created} créés, ${skipped} existants`);
}
