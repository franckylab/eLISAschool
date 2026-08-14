/**
 * ==================================
 * eLISAschool - Seed CMS Widgets
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Seed opérationnel idempotent — crée les 5 widgets par défaut
 * pour chaque établissement existant en base.
 * Vérifie l'existence avant création (pas de doublons).
 */

import { AppDataSource } from '../../src/database/data-source';
import { CmsWidget, WidgetType, EmplacementWidget } from '../../src/modules/cms/entities/cms.entity';
import { Etablissement } from '../../src/modules/etablissement/entities';
import { logger } from '../../src/common/utils/logger.util';

// ==================================
// Définition des 5 types de widgets par défaut
// ==================================

interface WidgetDef {
    type: string;
    titre: string;
    description: string;
    contenuDefaut: Record<string, unknown>;
    emplacement: string;
    ordre: number;
}

export const WIDGETS_DEFAUT: WidgetDef[] = [
    {
        type: WidgetType.RESEAUX_SOCIAUX,
        titre: 'Suivez-nous',
        description: 'Liens vers les réseaux sociaux de l\'établissement',
        contenuDefaut: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: '',
            siteWeb: '',
        },
        emplacement: EmplacementWidget.PIED_PAGE,
        ordre: 0,
    },
    {
        type: WidgetType.CONTACT_RAPIDE,
        titre: 'Contact',
        description: 'Coordonnées de contact rapide',
        contenuDefaut: {
            email: '',
            telephone: '',
            adresse: '',
            whatsapp: '',
        },
        emplacement: EmplacementWidget.PIED_PAGE,
        ordre: 1,
    },
    {
        type: WidgetType.HORAIRES,
        titre: 'Horaires d\'ouverture',
        description: 'Horaires d\'ouverture de l\'établissement',
        contenuDefaut: {
            horaires: [
                { jour: 'Lundi - Vendredi', horaires: '07h30 - 17h00' },
                { jour: 'Samedi', horaires: '08h00 - 12h00' },
                { jour: 'Dimanche', horaires: 'Fermé' },
            ],
        },
        emplacement: EmplacementWidget.PIED_PAGE,
        ordre: 2,
    },
    {
        type: WidgetType.NEWSLETTER,
        titre: 'Newsletter',
        description: 'Inscription à la newsletter de l\'établissement',
        contenuDefaut: {
            titre: 'Restez informé',
            description: 'Inscrivez-vous pour recevoir nos actualités',
            placeholder: 'Votre adresse email',
            boutonLabel: 'S\'inscrire',
        },
        emplacement: EmplacementWidget.PIED_PAGE,
        ordre: 3,
    },
    {
        type: WidgetType.LIENS_UTILES,
        titre: 'Liens utiles',
        description: 'Liens rapides vers les pages importantes',
        contenuDefaut: {
            liens: [
                { label: 'Espace parent', url: '/login' },
                { label: 'Espace enseignant', url: '/login' },
                { label: 'Vie scolaire', url: '#' },
                { label: 'Résultats', url: '#' },
            ],
        },
        emplacement: EmplacementWidget.PIED_PAGE,
        ordre: 4,
    },
];

// ==================================
// Fonction de seed opérationnelle (idempotent)
// ==================================

export async function seedCmsWidgets(): Promise<void> {
    const widgetRepo = AppDataSource.getRepository(CmsWidget);
    const etabRepo = AppDataSource.getRepository(Etablissement);

    // Récupérer tous les établissements
    const etablissements = await etabRepo.find({
        select: ['id', 'nom', 'contactEmail', 'contactTelephone', 'facebook', 'twitter', 'siteWeb', 'heuresOuverture', 'heuresFermeture'],
    });

    if (etablissements.length === 0) {
        logger.info('[Seed CMS Widgets] Aucun établissement trouvé — skip');
        return;
    }

    let totalCrees = 0;
    let totalExistants = 0;

    for (const etab of etablissements) {
        // Vérifier si des widgets existent déjà pour cet établissement
        const widgetsExistants = await widgetRepo.count({
            where: { etablissementId: etab.id },
        });

        if (widgetsExistants > 0) {
            totalExistants++;
            continue; // Idempotent — skip si déjà des widgets
        }

        // Personnaliser avec les données de l'établissement
        const widgetsACreer = WIDGETS_DEFAUT.map((def) => {
            const contenu = { ...def.contenuDefaut };

            // Personnalisation selon le type
            if (def.type === WidgetType.RESEAUX_SOCIAUX) {
                contenu.facebook = etab.facebook || '';
                contenu.twitter = etab.twitter || '';
                contenu.siteWeb = etab.siteWeb || '';
            } else if (def.type === WidgetType.CONTACT_RAPIDE) {
                contenu.email = etab.contactEmail || '';
                contenu.telephone = etab.contactTelephone || '';
            } else if (def.type === WidgetType.HORAIRES) {
                if (etab.heuresOuverture) {
                    contenu.horaires = [
                        { jour: 'Lundi - Vendredi', horaires: `${etab.heuresOuverture} - ${etab.heuresFermeture || '17h00'}` },
                        { jour: 'Samedi', horaires: '08h00 - 12h00' },
                        { jour: 'Dimanche', horaires: 'Fermé' },
                    ];
                }
            }

            const widget = new CmsWidget();
            widget.etablissementId = etab.id;
            widget.type = def.type;
            widget.titre = def.titre;
            widget.contenu = contenu;
            widget.emplacement = def.emplacement;
            widget.ordre = def.ordre;
            widget.actif = true;
            return widget;
        });

        await widgetRepo.save(widgetsACreer);
        totalCrees += widgetsACreer.length;
    }

    logger.info(`[Seed CMS Widgets] ${totalCrees} widgets créés pour ${etablissements.length - totalExistants} établissements (${totalExistants} déjà configurés)`);
}
