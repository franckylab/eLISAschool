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

// Colonnes publiques exposées via l'API (pas de données sensibles)
const COLONNES_PUBLIQUES: (keyof Etablissement)[] = [
    'id', 'nom', 'slogan', 'pays', 'region', 'ville', 'quartier',
    'adresse', 'latitude', 'longitude',
    'contactEmail', 'contactTelephone',
    'logoBase64', 'logoType',
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
     */
    async getDonneesPubliques(code: string): Promise<Partial<Etablissement>> {
        const cacheKey = `public:${code}:etab`;

        // Vérifier le cache Redis
        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Projection restrictive — uniquement les colonnes publiques
        const etab = await this.etabRepo.createQueryBuilder('e')
            .select(COLONNES_PUBLIQUES.map(c => `e."${c}"`))
            .where('e."codeEtablissement" = :code', { code })
            .andWhere('e.actif = true')
            .getOne();

        if (!etab) {
            throw new AppError('Établissement introuvable ou inactif', 404, 'ETABLISSEMENT_NOT_FOUND');
        }

        // Mettre en cache
        await redisService.set(cacheKey, JSON.stringify(etab), this.CACHE_TTL);
        return etab;
    }

    /**
     * Récupère les pages publiées d'un établissement.
     */
    async getPagesPubliques(code: string): Promise<CmsPage[]> {
        const cacheKey = `public:${code}:pages`;

        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const etab = await this.getEtablissementByCode(code);
        const pages = await this.pageRepo.find({
            where: { etablissementId: etab.id, statut: StatutPage.PUBLIE },
            order: { ordre: 'ASC' },
            select: ['id', 'titre', 'slug', 'template', 'ordre', 'estPageAccueil', 'seo'],
        });

        await redisService.set(cacheKey, JSON.stringify(pages), this.CACHE_TTL);
        return pages;
    }

    /**
     * Récupère une page publique avec ses sections.
     */
    async getPagePublique(code: string, slug: string): Promise<{ page: CmsPage; sections: CmsSection[] }> {
        const cacheKey = `public:${code}:page:${slug}`;

        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const etab = await this.getEtablissementByCode(code);
        const page = await this.pageRepo.findOne({
            where: { slug, etablissementId: etab.id, statut: StatutPage.PUBLIE },
            relations: ['sections'],
        });

        if (!page) {
            throw new AppError('Page introuvable', 404, 'CMS_PAGE_NOT_FOUND');
        }

        // Filtrer les sections visibles uniquement
        const sectionsPubliques = page.sections
            .filter(s => s.visible)
            .sort((a, b) => a.ordre - b.ordre);

        const result = { page, sections: sectionsPubliques };
        await redisService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
        return result;
    }

    /**
     * Récupère le thème actif d'un établissement.
     */
    async getThemePublic(code: string): Promise<CmsTheme | null> {
        const cacheKey = `public:${code}:theme`;

        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const etab = await this.getEtablissementByCode(code);
        const theme = await this.themeRepo.findOne({
            where: { etablissementId: etab.id, actif: true },
        });

        if (theme) {
            await redisService.set(cacheKey, JSON.stringify(theme), 600); // Cache 10 min
        }
        return theme;
    }

    /**
     * Récupère les menus de navigation publics.
     */
    async getMenusPublic(code: string): Promise<CmsMenu[]> {
        const cacheKey = `public:${code}:menus`;

        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const etab = await this.getEtablissementByCode(code);
        const menus = await this.menuRepo.find({
            where: { etablissementId: etab.id },
            order: { emplacement: 'ASC' },
        });

        await redisService.set(cacheKey, JSON.stringify(menus), this.CACHE_TTL);
        return menus;
    }

    /**
     * Récupère les widgets actifs publics.
     */
    async getWidgetsPublic(code: string): Promise<CmsWidget[]> {
        const cacheKey = `public:${code}:widgets`;

        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const etab = await this.getEtablissementByCode(code);
        const widgets = await this.widgetRepo.find({
            where: { etablissementId: etab.id, actif: true },
            order: { emplacement: 'ASC', ordre: 'ASC' },
        });

        await redisService.set(cacheKey, JSON.stringify(widgets), this.CACHE_TTL);
        return widgets;
    }

    /**
     * Récupère la page d'accueil d'un établissement.
     */
    async getPageAccueil(code: string): Promise<{ etab: Partial<Etablissement>; page: CmsPage | null; sections: CmsSection[]; theme: CmsTheme | null; menus: CmsMenu[]; widgets: CmsWidget[] }> {
        const cacheKey = `public:${code}:accueil`;

        const cached = await redisService.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Charger tout en parallèle
        const [etab, pages, theme, menus, widgets] = await Promise.all([
            this.getDonneesPubliques(code),
            this.getPagesPubliques(code),
            this.getThemePublic(code),
            this.getMenusPublic(code),
            this.getWidgetsPublic(code),
        ]);

        // Trouver la page d'accueil
        const pageAccueil = pages.find(p => p.estPageAccueil) || null;

        let sections: CmsSection[] = [];
        if (pageAccueil) {
            const pageComplete = await this.pageRepo.findOne({
                where: { id: pageAccueil.id },
                relations: ['sections'],
            });
            if (pageComplete) {
                sections = pageComplete.sections
                    .filter(s => s.visible)
                    .sort((a, b) => a.ordre - b.ordre);
            }
        }

        const result = { etab, page: pageAccueil, sections, theme, menus, widgets };
        await redisService.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
        return result;
    }

    // ==================================
    // Helpers privés
    // ==================================

    private async getEtablissementByCode(code: string): Promise<Etablissement> {
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
