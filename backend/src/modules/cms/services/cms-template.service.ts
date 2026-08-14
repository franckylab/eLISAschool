/**
 * ==================================
 * eLISAschool - Service CMS Templates
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service pour la gestion des templates CMS :
 * - Liste des templates actifs
 * - Instanciation d'un template (crée CmsPage + CmsSections)
 * - Application d'un thème par défaut basé sur les couleurs de l'établissement
 * - Auto-initialisation CMS complète pour les nouveaux tenants (6 pages + menus + widgets)
 * - Réinitialisation CMS (suppression + recréation)
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    CmsPage, CmsSection, CmsTheme, CmsMenu, CmsWidget, CmsMedia,
    StatutPage, TemplatePage, EmplacementMenu, EmplacementWidget, WidgetType,
} from '../entities';
import { CmsTemplate, CategorieTemplate } from '../entities/cms-template.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Etablissement } from '@modules/etablissement/entities';

export class CmsTemplateService {
    private templateRepo: Repository<CmsTemplate>;
    private pageRepo: Repository<CmsPage>;
    private sectionRepo: Repository<CmsSection>;
    private themeRepo: Repository<CmsTheme>;
    private menuRepo: Repository<CmsMenu>;
    private widgetRepo: Repository<CmsWidget>;
    private etabRepo: Repository<Etablissement>;
    private mediaRepo: Repository<CmsMedia>;

    constructor() {
        this.templateRepo = AppDataSource.getRepository(CmsTemplate);
        this.pageRepo = AppDataSource.getRepository(CmsPage);
        this.sectionRepo = AppDataSource.getRepository(CmsSection);
        this.themeRepo = AppDataSource.getRepository(CmsTheme);
        this.menuRepo = AppDataSource.getRepository(CmsMenu);
        this.widgetRepo = AppDataSource.getRepository(CmsWidget);
        this.etabRepo = AppDataSource.getRepository(Etablissement);
        this.mediaRepo = AppDataSource.getRepository(CmsMedia);
    }

    // ==================================
    // LISTE DES TEMPLATES
    // ==================================

    /**
     * Retourne tous les templates actifs, triés par ordre.
     */
    async findTemplates(categorie?: string): Promise<CmsTemplate[]> {
        const where: Record<string, unknown> = { actif: true };
        if (categorie) {
            where.categorie = categorie;
        }

        return this.templateRepo.find({
            where,
            order: { ordre: 'ASC', nom: 'ASC' },
        });
    }

    /**
     * Retourne un template par son code.
     */
    async findTemplateByCode(code: string): Promise<CmsTemplate> {
        const template = await this.templateRepo.findOne({
            where: { code, actif: true },
        });
        if (!template) {
            throw new AppError('Template introuvable', 404, 'CMS_TEMPLATE_NOT_FOUND');
        }
        return template;
    }

    // ==================================
    // INSTANCIATION — Créer une page depuis un template
    // ==================================

    /**
     * Instancie un template pour un établissement.
     * Crée une CmsPage (BROUILLON) + ses CmsSections depuis le sectionsDef du template.
     */
    async instancierTemplate(
        templateCode: string,
        etablissementId: string,
        auteurId?: string,
        options?: { titre?: string; slug?: string; publier?: boolean },
    ): Promise<CmsPage> {
        const template = await this.findTemplateByCode(templateCode);

        // Générer le slug à partir du code template si non fourni
        const slug = options?.slug || this.genererSlug(templateCode);
        const titre = options?.titre || template.nom;

        // Vérifier l'unicité du slug
        const slugExistant = await this.pageRepo.findOne({
            where: { slug, etablissementId },
        });
        if (slugExistant) {
            const suffix = Date.now().toString(36);
            const slugUnique = `${slug}-${suffix}`;
            return this.instancierTemplate(templateCode, etablissementId, auteurId, {
                ...options,
                slug: slugUnique,
            });
        }

        // Déterminer le template CMS en fonction de la catégorie
        const templatePage = this.determinerTemplatePage(template.categorie, templateCode);

        // Déterminer si c'est une page d'accueil
        const estPageAccueil = template.categorie === CategorieTemplate.ACCUEIL;

        // Si page accueil, désactiver l'ancienne
        if (estPageAccueil) {
            await this.pageRepo.update(
                { etablissementId, estPageAccueil: true },
                { estPageAccueil: false },
            );
        }

        // Créer la page
        const page = this.pageRepo.create({
            etablissementId,
            titre,
            slug,
            template: templatePage,
            statut: options?.publier ? StatutPage.PUBLIE : StatutPage.BROUILLON,
            ordre: 0,
            estPageAccueil,
            seo: {
                metaTitle: titre,
                metaDescription: template.description || '',
            },
            metadata: {
                templateSource: templateCode,
                creePar: auteurId || 'systeme',
            },
        });

        const savedPage = await this.pageRepo.save(page);

        // Créer les sections depuis le sectionsDef du template
        const sections = template.sectionsDef.map((def, index) => {
            return this.sectionRepo.create({
                pageId: savedPage.id,
                type: (def.type as string) || 'TEXTE',
                contenu: (def.contenu as Record<string, unknown>) || {},
                ordre: def.ordre ?? index,
                styles: (def.styles as Record<string, unknown>) || undefined,
                visible: true,
                anchorId: def.anchorId as string || undefined,
            });
        });

        if (sections.length > 0) {
            await this.sectionRepo.save(sections);
        }

        logger.info('[CMS] Template instancié', {
            templateCode,
            pageId: savedPage.id,
            etablissementId,
            sectionsCount: sections.length,
        });

        // Retourner la page avec ses sections
        return this.pageRepo.findOne({
            where: { id: savedPage.id },
            relations: ['sections'],
        }) as Promise<CmsPage>;
    }

    // ==================================
    // THÈME PAR DÉFAUT
    // ==================================

    /**
     * Applique un thème par défaut basé sur les couleurs de l'établissement.
     * Structure alignée avec le frontend (couleurs + typographie imbriquées).
     * Ne crée le thème que si aucun thème actif n'existe.
     */
    async appliquerThemeParDefaut(etablissementId: string): Promise<CmsTheme> {
        // Vérifier si un thème existe déjà
        const themeExistant = await this.themeRepo.findOne({
            where: { etablissementId, actif: true },
        });
        if (themeExistant) {
            return themeExistant;
        }

        // Récupérer les couleurs de l'établissement
        const etab = await this.etabRepo.findOne({
            where: { id: etablissementId },
            select: ['id', 'nom', 'couleurPrimaire', 'couleurSecondaire'],
        });

        const couleurPrimaire = etab?.couleurPrimaire || '#2563eb';
        const couleurSecondaire = etab?.couleurSecondaire || '#7c3aed';

        // Créer un thème par défaut — structure alignée avec le frontend CmsTheme type
        const theme = this.themeRepo.create({
            etablissementId,
            nom: `Thème ${etab?.nom || 'Établissement'}`,
            variables: {
                couleurs: {
                    primaire: couleurPrimaire,
                    secondaire: couleurSecondaire,
                    accent: '#f59e0b',
                    fond: '#ffffff',
                    texte: '#1a1a2e',
                    texteClair: '#6c757d',
                },
                typographie: {
                    titre: "'Inter', sans-serif",
                    corps: "'Inter', sans-serif",
                },
            },
            polices: {
                titres: { famille: 'Inter', poids: '700', taille: '2.5rem' },
                corps: { famille: 'Inter', poids: '400', taille: '1rem' },
            },
            actif: true,
            estSysteme: true,
        });

        const saved = await this.themeRepo.save(theme);
        logger.info('[CMS] Thème par défaut appliqué', { themeId: saved.id, etablissementId });
        return saved;
    }

    // ==================================
    // AUTO-INITIALISATION CMS COMPLÈTE
    // ==================================

    /**
     * Initialise le CMS complet pour un nouvel établissement :
     * - Applique le thème par défaut
     * - Instancie 6 pages (Accueil, À propos, Galerie, Inscriptions, Contact, Mentions légales)
     * - Crée 2 menus (principal + pied de page)
     * - Crée 3 widgets (réseaux sociaux, contact rapide, horaires)
     */
    async initialiserCmsEtablissement(etablissementId: string): Promise<void> {
        logger.info('[CMS] Initialisation CMS complète', { etablissementId });

        try {
            // 0. Charger les données de l'établissement pour personnalisation
            const etab = await this.etabRepo.findOne({
                where: { id: etablissementId },
                select: ['id', 'nom', 'slogan', 'descriptionPublique', 'devise', 'contactEmail', 'contactTelephone', 'adresse', 'ville', 'facebook', 'twitter', 'siteWeb', 'codeEtablissement', 'heuresOuverture', 'heuresFermeture'],
            });

            // 1. Thème par défaut
            await this.appliquerThemeParDefaut(etablissementId);

            // 2. Instancier les 6 pages par défaut avec personnalisation
            const pagesADCreer: Array<{ code: string; titre: string; slug: string; publier: boolean }> = [
                { code: 'ACCUEIL_CLASSIQUE', titre: 'Accueil', slug: 'accueil', publier: true },
                { code: 'PAGE_A_PROPOS', titre: 'À propos', slug: 'a-propos', publier: true },
                { code: 'PAGE_GALERIE', titre: 'Galerie', slug: 'galerie', publier: true },
                { code: 'PAGE_INSCRIPTIONS', titre: 'Inscriptions', slug: 'inscriptions', publier: true },
                { code: 'PAGE_CONTACT', titre: 'Contact', slug: 'contact', publier: true },
                { code: 'PAGE_MENTIONS_LEGALES', titre: 'Mentions légales', slug: 'mentions-legales', publier: true },
            ];

            for (const pageDef of pagesADCreer) {
                try {
                    // Vérifier si la page existe déjà
                    const pageExistante = await this.pageRepo.findOne({
                        where: { slug: pageDef.slug, etablissementId },
                    });
                    if (!pageExistante) {
                        const page = await this.instancierTemplate(pageDef.code, etablissementId, undefined, {
                            titre: pageDef.titre,
                            slug: pageDef.slug,
                            publier: pageDef.publier,
                        });
                        // Personnaliser le contenu avec les données réelles
                        if (etab && page) {
                            await this.personnaliserSections(page.id, etab);
                        }
                    }
                } catch (err) {
                    // Template peut ne pas exister encore — non bloquant
                    logger.warn(`[CMS] Page '${pageDef.code}' non créée (template peut-être absent)`, {
                        etablissementId,
                        error: (err as Error)?.message,
                    });
                }
            }

            // 3. Créer les menus par défaut
            await this.creerMenusParDefaut(etablissementId);

            // 4. Créer les widgets par défaut
            await this.creerWidgetsParDefaut(etablissementId);

            logger.info('[CMS] CMS initialisé avec succès', { etablissementId });
        } catch (error) {
            logger.error('[CMS] Erreur initialisation CMS', { etablissementId, error });
            // Ne pas propager l'erreur — l'initialisation est best-effort
        }
    }

    // ==================================
    // RÉINITIALISATION CMS
    // ==================================

    /**
     * Réinitialise complètement le CMS d'un établissement :
     * 1. Supprime toutes les données CMS existantes
     * 2. Ré-applique l'initialisation complète
     * 3. Optionnel : ajoute le contenu de démonstration (actualités, équipe, témoignages, médias)
     */
    async reinitialiserCms(
        etablissementId: string,
        options?: { conserverMedias?: boolean; inclureDemo?: boolean },
    ): Promise<{ pagesRecreees: number; sectionsRecreees: number; mediasCrees: number }> {
        logger.info('[CMS] Réinitialisation CMS', { etablissementId, options });

        const conserverMedias = options?.conserverMedias ?? true;
        const inclureDemo = options?.inclureDemo ?? true;

        try {
            // 1. Supprimer les sections (dépendent des pages)
            const pages = await this.pageRepo.find({ where: { etablissementId }, select: ['id'] });
            const pageIds = pages.map(p => p.id);

            if (pageIds.length > 0) {
                await this.sectionRepo.delete({ pageId: In(pageIds) });
            }

            // 2. Supprimer les pages
            await this.pageRepo.delete({ etablissementId });

            // 3. Supprimer les thèmes
            await this.themeRepo.delete({ etablissementId });

            // 4. Supprimer les menus
            await this.menuRepo.delete({ etablissementId });

            // 5. Supprimer les widgets
            await this.widgetRepo.delete({ etablissementId });

            // 6. Médias : supprimer sauf si conserverMedias = true
            if (!conserverMedias) {
                const mediaRepo = AppDataSource.getRepository('CmsMedia');
                await mediaRepo.delete({ etablissementId });
            }

            // 7. Versions liées aux pages
            const versionRepo = AppDataSource.getRepository('CmsVersion');
            if (pageIds.length > 0) {
                await versionRepo.delete({ etablissementId });
            }

            logger.info('[CMS] Données CMS supprimées, réinitialisation en cours...', { etablissementId });

            // 8. Ré-appliquer l'initialisation (thème + pages de base + menus + widgets)
            await this.initialiserCmsEtablissement(etablissementId);

            // 9. Ajouter le contenu de démonstration si demandé
            let mediasCrees = 0;
            if (inclureDemo) {
                const demo = await this.seedDemoEtablissement(etablissementId);
                mediasCrees = demo.mediasCrees;
            }

            // 10. Compter les résultats
            const pagesRecreees = await this.pageRepo.count({ where: { etablissementId } });
            const sectionsRecreees = await this.sectionRepo.count({
                where: { page: { etablissementId } },
                relations: ['page'],
            });

            logger.info('[CMS] Réinitialisation CMS terminée', { etablissementId, pagesRecreees, sectionsRecreees, mediasCrees });
            return { pagesRecreees, sectionsRecreees, mediasCrees };
        } catch (error) {
            logger.error('[CMS] Erreur réinitialisation CMS', { etablissementId, error });
            throw new AppError('Erreur lors de la réinitialisation du CMS', 500, 'CMS_RESET_ERROR');
        }
    }

    // ==================================
    // PERSONNALISATION DES SECTIONS
    // ==================================

    /**
     * Personnalise les sections d'une page avec les données réelles de l'établissement.
     * Remplace les textes génériques du template par du contenu spécifique.
     */
    private async personnaliserSections(pageId: string, etab: Partial<Etablissement>): Promise<void> {
        const sections = await this.sectionRepo.find({
            where: { pageId },
            order: { ordre: 'ASC' },
        });

        const nom = etab.nom || 'Notre établissement';
        const slogan = etab.slogan || '';
        const description = etab.descriptionPublique || '';
        const devise = etab.devise || '';
        const code = etab.codeEtablissement || '';

        const misesAJour: Array<{ id: string; contenu: Record<string, unknown> }> = [];

        for (const section of sections) {
            const contenu = { ...(section.contenu as Record<string, unknown>) };
            let modifie = false;

            switch (section.type) {
                case 'HERO': {
                    // Remplacer le titre générique par le nom réel
                    const titre = (contenu.titre as string) || '';
                    if (titre.includes('notre établissement') || titre.includes('Bienvenue')) {
                        contenu.titre = `Bienvenue à ${nom}`;
                        modifie = true;
                    }
                    // Remplacer le surtitre par le slogan si disponible
                    if (slogan && contenu.surtitre) {
                        contenu.surtitre = slogan;
                        modifie = true;
                    }
                    // Remplacer la description si disponible
                    if (description && contenu.description) {
                        contenu.description = description;
                        modifie = true;
                    }
                    // Personnaliser les boutons
                    if (Array.isArray(contenu.boutons)) {
                        const boutons = (contenu.boutons as any[]).map((btn: any) => {
                            const b = { ...btn };
                            if (b.url && b.url.includes('{code}')) {
                                b.url = b.url.replace('{code}', code);
                            }
                            return b;
                        });
                        contenu.boutons = boutons;
                        modifie = true;
                    }
                    break;
                }

                case 'TEXTE': {
                    // Remplacer le texte générique par la description réelle
                    if (description && contenu.html) {
                        const html = contenu.html as string;
                        if (html.includes('enseignement de qualité') || html.includes('Notre mission')) {
                            contenu.html = `<p style="max-width:700px;margin:0 auto;line-height:1.8;text-align:center;">${description}</p>`;
                            modifie = true;
                        }
                    }
                    break;
                }

                case 'APPEL_ACTION': {
                    // Personnaliser les URLs du CTA
                    if (Array.isArray(contenu.boutons)) {
                        const boutons = (contenu.boutons as any[]).map((btn: any) => {
                            const b = { ...btn };
                            if (b.url && b.url.includes('{code}')) {
                                b.url = b.url.replace('{code}', code);
                            }
                            return b;
                        });
                        contenu.boutons = boutons;
                        modifie = true;
                    }
                    break;
                }

                case 'FORMULAIRE': {
                    // Personnaliser l'action du formulaire
                    if (code && contenu.actionUrl) {
                        contenu.actionUrl = (contenu.actionUrl as string).replace('{code}', code);
                        modifie = true;
                    }
                    break;
                }

                case 'CARTE_INFOS': {
                    // Ajouter la devise dans le titre si disponible
                    if (devise && contenu.titre) {
                        const titreCarte = contenu.titre as string;
                        if (titreCarte.includes('Pourquoi nous choisir')) {
                            contenu.titre = `${nom} — ${titreCarte.toLowerCase()}`;
                            modifie = true;
                        }
                    }
                    break;
                }
            }

            if (modifie) {
                misesAJour.push({ id: section.id, contenu });
            }
        }

        // Appliquer toutes les mises à jour en batch
        for (const maj of misesAJour) {
            await this.sectionRepo.update({ id: maj.id }, { contenu: maj.contenu });
        }

        if (misesAJour.length > 0) {
            logger.info(`[CMS] ${misesAJour.length} sections personnalisées`, { pageId, etablissementNom: nom });
        }
    }

    // ==================================
    // HELPERS PRIVÉS
    // ==================================

    /**
     * Génère un slug à partir d'un code template.
     */
    private genererSlug(code: string): string {
        return code
            .toLowerCase()
            .replace(/_/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    }

    /**
     * Détermine le TemplatePage CMS en fonction de la catégorie et du code.
     */
    private determinerTemplatePage(categorie: string, code: string): string {
        if (categorie === CategorieTemplate.ACCUEIL) {
            return TemplatePage.ACCUEIL;
        }

        const mapping: Record<string, string> = {
            PAGE_CONTACT: TemplatePage.CONTACT,
            PAGE_GALERIE: TemplatePage.GALERIE,
            PAGE_INSCRIPTIONS: TemplatePage.INSCRIPTIONS,
            PAGE_A_PROPOS: TemplatePage.CUSTOM,
            PAGE_MENTIONS_LEGALES: TemplatePage.CUSTOM,
        };

        return mapping[code] || TemplatePage.CUSTOM;
    }

    /**
     * Crée les menus par défaut (principal + pied de page) avec pageSlug.
     */
    private async creerMenusParDefaut(etablissementId: string): Promise<void> {
        // Vérifier si les menus existent déjà
        const menusExistants = await this.menuRepo.find({ where: { etablissementId } });
        if (menusExistants.length > 0) {
            logger.info('[CMS] Menus existants détectés, skip création', { etablissementId });
            return;
        }

        // Menu principal (header)
        const menuPrincipal = this.menuRepo.create({
            etablissementId,
            nom: 'Menu principal',
            emplacement: EmplacementMenu.PRINCIPAL,
            items: [
                { id: crypto.randomUUID(), label: 'Accueil', pageSlug: '', ordre: 0, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'À propos', pageSlug: 'a-propos', ordre: 1, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'Galerie', pageSlug: 'galerie', ordre: 2, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'Inscriptions', pageSlug: 'inscriptions', ordre: 3, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'Contact', pageSlug: 'contact', ordre: 4, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'Mentions légales', pageSlug: 'mentions-legales', ordre: 5, visible: true, ouvrirdansNouvelOnglet: false },
            ],
        });

        // Menu pied de page
        const menuPiedPage = this.menuRepo.create({
            etablissementId,
            nom: 'Pied de page',
            emplacement: EmplacementMenu.PIED_PAGE,
            items: [
                { id: crypto.randomUUID(), label: 'À propos', pageSlug: 'a-propos', ordre: 0, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'Contact', pageSlug: 'contact', ordre: 1, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'Mentions légales', pageSlug: 'mentions-legales', ordre: 2, visible: true, ouvrirdansNouvelOnglet: false },
                { id: crypto.randomUUID(), label: 'Inscriptions', pageSlug: 'inscriptions', ordre: 3, visible: true, ouvrirdansNouvelOnglet: false },
            ],
        });

        await this.menuRepo.save([menuPrincipal, menuPiedPage]);
        logger.info('[CMS] Menus par défaut créés', { etablissementId });
    }

    /**
     * Crée les widgets par défaut pour un établissement.
     */
    private async creerWidgetsParDefaut(etablissementId: string): Promise<void> {
        // Vérifier si les widgets existent déjà
        const widgetsExistants = await this.widgetRepo.find({ where: { etablissementId } });
        if (widgetsExistants.length > 0) {
            logger.info('[CMS] Widgets existants détectés, skip création', { etablissementId });
            return;
        }

        // Récupérer les infos de l'établissement pour personnaliser
        const etab = await this.etabRepo.findOne({
            where: { id: etablissementId },
            select: ['id', 'nom', 'contactEmail', 'contactTelephone', 'facebook', 'twitter', 'siteWeb', 'heuresOuverture', 'heuresFermeture'],
        });

        const widgets = this.widgetRepo.create([
            {
                etablissementId,
                type: WidgetType.RESEAUX_SOCIAUX,
                titre: 'Suivez-nous',
                contenu: {
                    facebook: etab?.facebook || '',
                    twitter: etab?.twitter || '',
                    siteWeb: etab?.siteWeb || '',
                },
                emplacement: EmplacementWidget.PIED_PAGE,
                ordre: 0,
                actif: true,
            },
            {
                etablissementId,
                type: WidgetType.CONTACT_RAPIDE,
                titre: 'Contact',
                contenu: {
                    email: etab?.contactEmail || '',
                    telephone: etab?.contactTelephone || '',
                    adresse: '',
                },
                emplacement: EmplacementWidget.PIED_PAGE,
                ordre: 1,
                actif: true,
            },
            {
                etablissementId,
                type: WidgetType.HORAIRES,
                titre: 'Horaires d\'ouverture',
                contenu: {
                    horaires: [
                        { jour: 'Lundi - Vendredi', horaires: etab?.heuresOuverture ? `${etab.heuresOuverture} - ${etab.heuresFermeture || '17h00'}` : '07h30 - 17h00' },
                        { jour: 'Samedi', horaires: '08h00 - 12h00' },
                        { jour: 'Dimanche', horaires: 'Fermé' },
                    ],
                },
                emplacement: EmplacementWidget.PIED_PAGE,
                ordre: 2,
                actif: true,
            },
            {
                etablissementId,
                type: WidgetType.NEWSLETTER,
                titre: 'Newsletter',
                contenu: {
                    titre: 'Restez informé',
                    description: 'Inscrivez-vous pour recevoir nos actualités',
                    placeholder: 'Votre adresse email',
                    boutonLabel: 'S\'inscrire',
                },
                emplacement: EmplacementWidget.PIED_PAGE,
                ordre: 3,
                actif: true,
            },
            {
                etablissementId,
                type: WidgetType.LIENS_UTILES,
                titre: 'Liens utiles',
                contenu: {
                    liens: [
                        { label: 'Espace parent', url: '/login' },
                        { label: 'Espace enseignant', url: '/login' },
                        { label: 'Vie scolaire', url: '#' },
                        { label: 'Résultats', url: '#' },
                    ],
                },
                emplacement: EmplacementWidget.PIED_PAGE,
                ordre: 4,
                actif: true,
            },
        ]);

        await this.widgetRepo.save(widgets);
        logger.info('[CMS] Widgets par défaut créés', { etablissementId });
    }

    // ==================================
    // SEED DÉMO — Contenu riche pour établissement
    // ==================================

    /**
     * Peuple un établissement avec du contenu CMS riche et professionnel.
     * Idempotent : vérifie l'existence avant chaque création.
     * Crée : médias placeholder, sections actualités/équipe/témoignages sur la page d'accueil.
     */
    async seedDemoEtablissement(etablissementId: string): Promise<{ mediasCrees: number; sectionsAjoutees: number }> {
        const etab = await this.etabRepo.findOne({
            where: { id: etablissementId },
            select: ['id', 'nom', 'couleurPrimaire'],
        });
        if (!etab) {
            throw new AppError('Établissement introuvable', 404, 'ETABLISSEMENT_NOT_FOUND');
        }

        const couleur = etab.couleurPrimaire || '#28a745';
        let mediasCrees = 0;
        let sectionsAjoutees = 0;

        // 1. Créer les médias placeholder (SVG data URIs)
        const mediasExistants = await this.mediaRepo.count({ where: { etablissementId } });
        if (mediasExistants === 0) {
            const medias = this.mediaRepo.create([
                {
                    etablissementId,
                    nom: 'Hero background',
                    type: 'image',
                    url: this.genererSvgPlaceholder(1920, 800, couleur, etab.nom),
                    alt: `Bannière ${etab.nom}`,
                    mimeType: 'image/svg+xml',
                    dossier: 'hero',
                },
                {
                    etablissementId,
                    nom: 'Galerie - Bâtiment',
                    type: 'image',
                    url: this.genererSvgPlaceholder(800, 600, couleur, 'Nos locaux'),
                    alt: 'Bâtiment principal',
                    mimeType: 'image/svg+xml',
                    dossier: 'galerie',
                },
                {
                    etablissementId,
                    nom: 'Galerie - Salle de classe',
                    type: 'image',
                    url: this.genererSvgPlaceholder(800, 600, '#3b82f6', 'Salle de classe'),
                    alt: 'Salle de classe moderne',
                    mimeType: 'image/svg+xml',
                    dossier: 'galerie',
                },
                {
                    etablissementId,
                    nom: 'Galerie - Laboratoire',
                    type: 'image',
                    url: this.genererSvgPlaceholder(800, 600, '#8b5cf6', 'Laboratoire'),
                    alt: 'Laboratoire scientifique',
                    mimeType: 'image/svg+xml',
                    dossier: 'galerie',
                },
                {
                    etablissementId,
                    nom: 'Galerie - Bibliothèque',
                    type: 'image',
                    url: this.genererSvgPlaceholder(800, 600, '#f59e0b', 'Bibliothèque'),
                    alt: 'Bibliothèque et centre de documentation',
                    mimeType: 'image/svg+xml',
                    dossier: 'galerie',
                },
            ]);
            await this.mediaRepo.save(medias);
            mediasCrees = medias.length;
        }

        // 2. Ajouter des sections riches à la page d'accueil
        const pageAccueil = await this.pageRepo.findOne({
            where: { etablissementId, estPageAccueil: true },
        });

        if (pageAccueil) {
            const sectionsExistantes = await this.sectionRepo.find({
                where: { pageId: pageAccueil.id },
                select: ['type'],
            });
            const typesExistants = new Set(sectionsExistantes.map(s => s.type));

            const maxOrdre = sectionsExistantes.length > 0
                ? Math.max(...sectionsExistantes.map((_, i) => i)) + 1
                : 0;

            const nouvellesSections: Partial<CmsSection>[] = [];

            // Section Actualités (si absente)
            if (!typesExistants.has('ACTUALITES')) {
                nouvellesSections.push({
                    pageId: pageAccueil.id,
                    type: 'ACTUALITES',
                    contenu: {
                        titre: 'Dernières actualités',
                        actualites: [
                            {
                                titre: 'Rentrée scolaire 2026-2027',
                                resume: 'Découvrez les nouveautés de cette nouvelle année scolaire et les modalités d\'inscription.',
                                date: '2026-09-01',
                                image: '',
                            },
                            {
                                titre: 'Résultats aux examens',
                                resume: `Félicitations à nos élèves ! ${etab.nom} affiche d'excellents résultats cette année encore.`,
                                date: '2026-07-15',
                                image: '',
                            },
                            {
                                titre: 'Journée portes ouvertes',
                                resume: 'Venez découvrir notre établissement lors de la journée portes ouvertes. Activités et visites guidés.',
                                date: '2026-06-20',
                                image: '',
                            },
                        ],
                    },
                    ordre: maxOrdre,
                    visible: true,
                });
            }

            // Section Équipe (si absente)
            if (!typesExistants.has('EQUIPE')) {
                nouvellesSections.push({
                    pageId: pageAccueil.id,
                    type: 'EQUIPE',
                    contenu: {
                        titre: 'Notre équipe dirigeante',
                        membres: [
                            {
                                nom: 'Directeur(trice)',
                                fonction: 'Direction générale',
                                bio: 'Plus de 20 ans d\'expérience dans l\'éducation.',
                                email: etab.nom ? `direction@${etab.nom.toLowerCase().replace(/[^a-z]/g, '')}.edu` : '',
                                photo: '',
                            },
                            {
                                nom: 'Responsable pédagogique',
                                fonction: 'Pédagogie',
                                bio: 'Spécialiste en innovation pédagogique et suivi personnalisé.',
                                email: '',
                                photo: '',
                            },
                            {
                                nom: 'Secrétaire général(e)',
                                fonction: 'Administration',
                                bio: 'Gestion administrative et relation avec les familles.',
                                email: '',
                                photo: '',
                            },
                        ],
                    },
                    ordre: maxOrdre + 1,
                    visible: true,
                });
            }

            // Section Témoignages (si absente)
            if (!typesExistants.has('TEMOIGNAGES')) {
                nouvellesSections.push({
                    pageId: pageAccueil.id,
                    type: 'TEMOIGNAGES',
                    contenu: {
                        titre: 'Ce que disent nos familles',
                        temoignages: [
                            {
                                nom: 'Parent d\'élève',
                                role: 'Parent de 3ème',
                                citation: `Un établissement à l'écoute où mon enfant s'épanouit pleinement. L'encadrement est exceptionnel.`,
                            },
                            {
                                nom: 'Ancien élève',
                                role: 'Promotion 2025',
                                citation: `${etab.nom} m'a donné les bases solides pour réussir mes études supérieures.`,
                            },
                            {
                                nom: 'Parent d\'élève',
                                role: 'Parent de CP',
                                citation: 'La transition maternelle-primaire s\'est faite en douceur. Les enseignants sont dévoués.',
                            },
                        ],
                    },
                    ordre: maxOrdre + 2,
                    visible: true,
                });
            }

            if (nouvellesSections.length > 0) {
                const sectionsCrees = nouvellesSections.map(s => this.sectionRepo.create(s));
                await this.sectionRepo.save(sectionsCrees);
                sectionsAjoutees = sectionsCrees.length;
            }
        }

        logger.info('[CMS] Seed démo terminé', { etablissementId, mediasCrees, sectionsAjoutees });
        return { mediasCrees, sectionsAjoutees };
    }

    /**
     * Génère un SVG placeholder court en data URI.
     */
    private genererSvgPlaceholder(largeur: number, hauteur: number, couleur: string, texte: string): string {
        // Tronquer le texte à 20 caractères pour rester sous la limite varchar(500) du champ url
        const texteCourt = texte.length > 20 ? texte.substring(0, 18) + '..' : texte;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}"><rect width="100%" height="100%" fill="${couleur}" opacity=".15"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="${couleur}" text-anchor="middle" dominant-baseline="middle" opacity=".6">${texteCourt}</text></svg>`;
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    }
}

export const cmsTemplateService = new CmsTemplateService();
