/**
 * ==================================
 * eLISAschool - Service API publique établissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service pour les pages publiques — projection restrictive.
 * Seules les colonnes publiques sont exposées.
 * Cache Redis TTL 300s (5 minutes).
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Etablissement } from '@modules/etablissement/entities';
import { CmsPage, CmsTheme, CmsMenu, CmsWidget, CmsSection, StatutPage } from '../entities';
import { AppError } from '@common/filters/error.filter';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import { dataBindingService } from './data-binding.service';

// Colonnes publiques exposées via l'API (pas de données sensibles)
// Note: logoBase64 excluded (select: false dans l'entité, chargée séparément si besoin)
const COLONNES_PUBLIQUES: (keyof Etablissement)[] = [
    'id', 'nom', 'slogan', 'pays', 'region', 'ville', 'quartier',
    'adresse', 'latitude', 'longitude',
    'contactEmail', 'contactTelephone',
    'logoType',
    'couleurPrimaire', 'couleurSecondaire',
    'siteWeb', 'facebook', 'twitter',
    'heuresOuverture', 'heuresFermeture',
    'descriptionPublique', 'codeEtablissement',
    'sousSysteme', 'type', 'directeurNom',
    'devise', 'fuseauHoraire', 'langueDefaut',
];

export class PublicEtablissementService {
    private etabRepo: Repository<Etablissement>;
    private pageRepo: Repository<CmsPage>;
    private themeRepo: Repository<CmsTheme>;
    private menuRepo: Repository<CmsMenu>;
    private widgetRepo: Repository<CmsWidget>;

    // Cache TTL : 300s (5 minutes) pour les pages publiques
    private readonly CACHE_TTL = 300;

    constructor() {
        this.etabRepo = AppDataSource.getRepository(Etablissement);
        this.pageRepo = AppDataSource.getRepository(CmsPage);
        this.themeRepo = AppDataSource.getRepository(CmsTheme);
        this.menuRepo = AppDataSource.getRepository(CmsMenu);
        this.widgetRepo = AppDataSource.getRepository(CmsWidget);
    }

    /**
     * Récupère les données publiques d'un établissement par son code.
     * Projection restrictive — exclut les données privées.
     * Fallback : recherche par nom si le code ne donne rien.
     */
    async getDonneesPubliques(code: string): Promise<Partial<Etablissement>> {
        const cacheKey = `public:${code}:etab`;

        // Vérifier le cache Redis
        try {
            const cached = await redisService.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch {
            // Redis indisponible — continuer sans cache
        }

        // 1. Recherche principale par codeEtablissement
        let etab = await this.etabRepo.findOne({
            where: { codeEtablissement: code, actif: true },
            select: COLONNES_PUBLIQUES as string[],
        });

        if (!etab) {
            // 2. Fallback : recherche par nom (case-insensitive via ILIKE)
            logger.info(`[Public] Établissement '${code}' non trouvé par code — tentative par nom`);
            etab = await this.etabRepo
                .createQueryBuilder('e')
                .select(COLONNES_PUBLIQUES.map(c => `e."${c}"`))
                .where('(LOWER(e.nom) = LOWER(:code) OR e.nom ILIKE :likeCode)', { code, likeCode: `%${code}%` })
                .andWhere('e.actif = true')
                .getOne() as Etablissement | null;
        }

        if (!etab) {
            // 3. Vérifier si l'établissement existe mais est inactif
            const etabInactif = await this.etabRepo.findOne({
                where: { codeEtablissement: code },
                select: ['id', 'nom', 'actif', 'statut'],
            });
            if (etabInactif) {
                throw new AppError(
                    `Établissement '${code}' inactif (statut: ${etabInactif.statut})`,
                    403,
                    'ETABLISSEMENT_INACTIF',
                );
            }

            // 4. Log de diagnostic pour aider au débogage
            const totalEtabs = await this.etabRepo.count();
            const etabsAvecCode = await this.etabRepo
                .createQueryBuilder('e')
                .select(['e."codeEtablissement"', 'e.nom', 'e.actif'])
                .where('e."codeEtablissement" IS NOT NULL')
                .limit(10)
                .getRawMany();
            logger.warn(`[Public] Établissement '${code}' introuvable. Total étab: ${totalEtabs}. Codes disponibles: ${JSON.stringify(etabsAvecCode.map(e => e.e_codeEtablissement))}`);

            throw new AppError(
                `Établissement '${code}' introuvable. Vérifiez le code établissement.`,
                404,
                'ETABLISSEMENT_NOT_FOUND',
            );
        }

        // Charger le logo séparément (colonne select: false)
        try {
            const logoRow = await this.etabRepo.createQueryBuilder('e')
                .select(['e."logoBase64"'])
                .where('e.id = :id', { id: etab.id })
                .getRawOne();
            if (logoRow?.e_logoBase64) {
                (etab as any).logoBase64 = logoRow.e_logoBase64;
            }
        } catch {
            // Logo non disponible — non bloquant
        }

        // Mettre en cache (uniquement les résultats positifs)
        try {
            await redisService.set(cacheKey, JSON.stringify(etab), this.CACHE_TTL);
        } catch {
            // Redis indisponible — non bloquant
        }
        return etab;
    }

    /**
     * Récupère les pages publiées d'un établissement.
     */
    async getPagesPubliques(code: string): Promise<CmsPage[]> {
        const cacheKey = `public:${code}:pages`;

        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch { /* Redis indisponible */ }

        const etab = await this.getEtablissementByCode(code);
        const pages = await this.pageRepo.find({
            where: { etablissementId: etab.id, statut: StatutPage.PUBLIE },
            order: { ordre: 'ASC' },
            select: ['id', 'titre', 'slug', 'template', 'ordre', 'estPageAccueil', 'seo'],
        });

        try { await redisService.set(cacheKey, JSON.stringify(pages), this.CACHE_TTL); } catch { /* non bloquant */ }
        return pages;
    }

    /**
     * Récupère une page publique avec ses sections.
     */
    async getPagePublique(code: string, slug: string): Promise<{ page: CmsPage; sections: CmsSection[] }> {
        const cacheKey = `public:${code}:page:${slug}`;

        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch { /* Redis indisponible */ }

        const etab = await this.getEtablissementByCode(code);
        const page = await this.pageRepo.findOne({
            where: { slug, etablissementId: etab.id, statut: StatutPage.PUBLIE },
            relations: ['sections'],
        });

        if (!page) {
            throw new AppError('Page introuvable', 404, 'CMS_PAGE_NOT_FOUND');
        }

        // Filtrer les sections visibles uniquement
        let sectionsPubliques = page.sections
            .filter(s => s.visible)
            .sort((a, b) => a.ordre - b.ordre);

        // Résoudre les variables {{data binding}} dans le contenu des sections
        sectionsPubliques = await this.resoudreSectionsBinding(sectionsPubliques, etab.id);

        const result = { page, sections: sectionsPubliques };
        try { await redisService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL); } catch { /* non bloquant */ }
        return result;
    }

    /**
     * Récupère une page en mode preview (brouillon inclus) via token.
     * Le token est validé via Redis (TTL 10 min).
     */
    async getPagePreview(code: string, slug: string, token: string): Promise<{ page: CmsPage; sections: CmsSection[] }> {
        // Valider le token
        let tokenData: { pageId: string; etablissementId: string; slug: string };
        try {
            const raw = await redisService.get(`preview:${token}`);
            if (!raw) {
                throw new AppError('Token de preview invalide ou expiré', 401, 'PREVIEW_TOKEN_INVALID');
            }
            tokenData = JSON.parse(raw);
        } catch (err) {
            if (err instanceof AppError) throw err;
            throw new AppError('Token de preview invalide', 401, 'PREVIEW_TOKEN_INVALID');
        }

        const etab = await this.getEtablissementByCode(code);

        // Vérifier cohérence token ↔ établissement
        if (tokenData.etablissementId !== etab.id) {
            throw new AppError('Token non valide pour cet établissement', 403, 'PREVIEW_ETAB_MISMATCH');
        }

        // Récupérer la page même si BROUILLON
        const page = await this.pageRepo.findOne({
            where: { slug, etablissementId: etab.id },
            relations: ['sections'],
        });

        if (!page) {
            throw new AppError('Page introuvable', 404, 'CMS_PAGE_NOT_FOUND');
        }

        let sectionsPubliques = page.sections
            .filter(s => s.visible)
            .sort((a, b) => a.ordre - b.ordre);

        // Résoudre les variables {{data binding}} dans le contenu des sections
        sectionsPubliques = await this.resoudreSectionsBinding(sectionsPubliques, etab.id);

        // Ne pas cacher le preview
        return { page, sections: sectionsPubliques };
    }

    /**
     * Récupère le thème actif d'un établissement.
     * Applique le mapping vers le format frontend (couleurs + typographie).
     */
    async getThemePublic(code: string): Promise<Record<string, unknown> | null> {
        const cacheKey = `public:${code}:theme`;

        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch { /* Redis indisponible */ }

        const etab = await this.getEtablissementByCode(code);
        const theme = await this.themeRepo.findOne({
            where: { etablissementId: etab.id, actif: true },
        });

        if (theme) {
            const mapped = this.mapThemeToPublic(theme);
            try { await redisService.set(cacheKey, JSON.stringify(mapped), 600); } catch { /* non bloquant */ }
            return mapped;
        }
        return null;
    }

    /**
     * Récupère les menus de navigation publics.
     */
    async getMenusPublic(code: string): Promise<CmsMenu[]> {
        const cacheKey = `public:${code}:menus`;

        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch { /* Redis indisponible */ }

        const etab = await this.getEtablissementByCode(code);
        const menus = await this.menuRepo.find({
            where: { etablissementId: etab.id },
            order: { emplacement: 'ASC' },
        });

        try { await redisService.set(cacheKey, JSON.stringify(menus), this.CACHE_TTL); } catch { /* non bloquant */ }
        return menus;
    }

    /**
     * Récupère les widgets actifs publics.
     */
    async getWidgetsPublic(code: string): Promise<CmsWidget[]> {
        const cacheKey = `public:${code}:widgets`;

        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return JSON.parse(cached);
        } catch { /* Redis indisponible */ }

        const etab = await this.getEtablissementByCode(code);
        const widgets = await this.widgetRepo.find({
            where: { etablissementId: etab.id, actif: true },
            order: { emplacement: 'ASC', ordre: 'ASC' },
        });

        try { await redisService.set(cacheKey, JSON.stringify(widgets), this.CACHE_TTL); } catch { /* non bloquant */ }
        return widgets;
    }

    /**
     * Récupère la page d'accueil d'un établissement.
     * Résilient : si le CMS n'est pas encore configuré, retourne au minimum les données de l'établissement.
     */
    async getPageAccueil(code: string): Promise<{ etab: Partial<Etablissement>; page: CmsPage | null; sections: CmsSection[]; theme: Record<string, unknown> | null; menus: CmsMenu[]; widgets: CmsWidget[] }> {
        const cacheKey = `public:${code}:accueil`;

        try {
            const cached = await redisService.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch {
            // Redis indisponible — continuer sans cache
        }

        // 1. Charger l'établissement EN PREMIER (critique)
        const etab = await this.getDonneesPubliques(code);

        // 2. Charger les données CMS en parallèle avec allSettled (résilient)
        const [pagesResult, themeResult, menusResult, widgetsResult] = await Promise.allSettled([
            this.getPagesPubliques(code),
            this.getThemePublic(code),
            this.getMenusPublic(code),
            this.getWidgetsPublic(code),
        ]);

        // 3. Extraire les valeurs (ou fallback si erreur)
        const pages = pagesResult.status === 'fulfilled' ? pagesResult.value : [];
        const theme = themeResult.status === 'fulfilled' ? themeResult.value : null;
        const menus = menusResult.status === 'fulfilled' ? menusResult.value : [];
        const widgets = widgetsResult.status === 'fulfilled' ? widgetsResult.value : [];

        // Logger les erreurs CMS (non bloquantes)
        if (pagesResult.status === 'rejected') {
            logger.warn(`[CMS] Erreur chargement pages pour ${code}: ${pagesResult.reason?.message || 'inconnu'}`);
        }

        // Trouver la page d'accueil
        const pageAccueil = pages.find(p => p.estPageAccueil) || null;

        let sections: CmsSection[] = [];
        if (pageAccueil) {
            try {
                const pageComplete = await this.pageRepo.findOne({
                    where: { id: pageAccueil.id },
                    relations: ['sections'],
                });
                if (pageComplete) {
                    let secs = pageComplete.sections
                        .filter(s => s.visible)
                        .sort((a, b) => a.ordre - b.ordre);
                    // Résoudre les variables {{data binding}}
                    secs = await this.resoudreSectionsBinding(secs, (etab as any).id || etab.id);
                    sections = secs;
                }
            } catch {
                // Sections non disponibles — non bloquant
            }
        }

        const result = { etab, page: pageAccueil, sections, theme, menus, widgets };

        try {
            await redisService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
        } catch {
            // Redis indisponible — non bloquant
        }
        return result;
    }

    /**
     * Endpoint de diagnostic — liste les établissements actifs avec leur code.
     * Utilisé pour déboguer les erreurs 404.
     */
    async getDiagnostic(): Promise<{ total: number; etablissements: Array<{ code: string | null; nom: string; actif: boolean }> }> {
        const etabs = await this.etabRepo.find({
            select: ['codeEtablissement', 'nom', 'actif'],
            order: { nom: 'ASC' },
            take: 50,
        });
        return {
            total: etabs.length,
            etablissements: etabs.map(e => ({
                code: e.codeEtablissement,
                nom: e.nom,
                actif: e.actif,
            })),
        };
    }

    // ==================================
    // Helpers privés
    // ==================================

    /**
     * Mappe une entité CmsTheme vers le format attendu par le frontend.
     * Gère le legacy (variables flat) et le nouveau format (couleurs + typographie imbriquées).
     */
    private mapThemeToPublic(theme: CmsTheme): Record<string, unknown> {
        const vars = theme.variables || {};

        // Nouveau format : variables = { couleurs: {...}, typographie: {...} }
        if (vars.couleurs && typeof vars.couleurs === 'object') {
            return {
                id: theme.id,
                nom: theme.nom,
                couleurs: vars.couleurs,
                typographie: vars.typographie || { titre: "'Inter', sans-serif", corps: "'Inter', sans-serif" },
                actif: theme.actif,
                etablissementId: theme.etablissementId,
            };
        }

        // Legacy : variables = { couleurFond, couleurTexte, couleurPrimaire, ... }
        return {
            id: theme.id,
            nom: theme.nom,
            couleurs: {
                primaire: vars.couleurPrimaire || '#28a745',
                secondaire: vars.couleurSecondaire || '#007bff',
                accent: vars.couleurAccent || '#ffc107',
                fond: vars.couleurFond || '#ffffff',
                texte: vars.couleurTexte || '#1a1a2e',
                texteClair: vars.couleurTexteClair || '#6c757d',
            },
            typographie: {
                titre: vars.policeTitres ? `'${vars.policeTitres}', sans-serif` : "'Inter', sans-serif",
                corps: vars.policeCorps ? `'${vars.policeCorps}', sans-serif` : "'Inter', sans-serif",
            },
            actif: theme.actif,
            etablissementId: theme.etablissementId,
        };
    }

    /**
     * Résout les variables data-binding dans le contenu des sections.
     * Non bloquant : en cas d'erreur, retourne les sections sans résolution.
     */
    private async resoudreSectionsBinding(sections: CmsSection[], etablissementId: string): Promise<CmsSection[]> {
        try {
            const resolved = await Promise.all(
                sections.map(async (section) => {
                    if (!section.contenu || Object.keys(section.contenu).length === 0) {
                        return section;
                    }
                    // Vérifier si le contenu contient des variables {{...}}
                    const serialized = JSON.stringify(section.contenu);
                    if (!serialized.includes('{{')) {
                        return section;
                    }
                    const resolvedContenu = await dataBindingService.resoudreContenu(section.contenu, etablissementId);
                    return { ...section, contenu: resolvedContenu };
                })
            );
            return resolved;
        } catch (error) {
            logger.warn('[DataBinding] Erreur résolution sections — retour sans binding', { etablissementId, error });
            return sections;
        }
    }

    /**
     * Résout un code établissement en entité (projection restrictive).
     * Utilisé par les routes publiques pour convertir :code → id.
     */
    async getEtablissementByCode(code: string): Promise<Etablissement> {
        const etab = await this.etabRepo.findOne({
            where: { codeEtablissement: code, actif: true },
            select: ['id', 'nom', 'codeEtablissement'],
        });
        if (!etab) {
            throw new AppError('Établissement introuvable ou inactif', 404, 'ETABLISSEMENT_NOT_FOUND');
        }
        return etab;
    }
}

export const publicEtablissementService = new PublicEtablissementService();
