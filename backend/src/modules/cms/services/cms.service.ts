/**
 * ==================================
 * eLISAschool - Service CMS complet
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service central pour le CMS white-label :
 * - CRUD pages, sections, médias, thèmes, menus, widgets
 * - Versioning (snapshot avant modification)
 * - Cache Redis avec invalidation
 * - Projection publique restrictive
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    CmsPage, CmsSection, CmsMedia, CmsTheme,
    CmsMenu, CmsWidget, CmsVersion, StatutPage,
} from '../entities';
import {
    CreatePageDto, UpdatePageDto,
    CreateSectionDto, UpdateSectionDto,
    CreateMediaDto,
    CreateThemeDto, UpdateThemeDto,
    CreateMenuDto, UpdateMenuDto,
    CreateWidgetDto, UpdateWidgetDto,
    ReordonnerSectionsDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { redisService } from '@common/services/redis.service';
import { randomUUID } from 'crypto';

export class CmsService {
    private pageRepo: Repository<CmsPage>;
    private sectionRepo: Repository<CmsSection>;
    private mediaRepo: Repository<CmsMedia>;
    private themeRepo: Repository<CmsTheme>;
    private menuRepo: Repository<CmsMenu>;
    private widgetRepo: Repository<CmsWidget>;
    private versionRepo: Repository<CmsVersion>;


    constructor() {
        this.pageRepo = AppDataSource.getRepository(CmsPage);
        this.sectionRepo = AppDataSource.getRepository(CmsSection);
        this.mediaRepo = AppDataSource.getRepository(CmsMedia);
        this.themeRepo = AppDataSource.getRepository(CmsTheme);
        this.menuRepo = AppDataSource.getRepository(CmsMenu);
        this.widgetRepo = AppDataSource.getRepository(CmsWidget);
        this.versionRepo = AppDataSource.getRepository(CmsVersion);

    }

    // ==================================
    // PAGES — CRUD
    // ==================================

    async findPages(etablissementId: string): Promise<CmsPage[]> {
        return this.pageRepo.find({
            where: { etablissementId },
            order: { ordre: 'ASC', createdAt: 'ASC' },
            relations: ['sections'],
        });
    }

    async findPageById(id: string, etablissementId: string): Promise<CmsPage> {
        const page = await this.pageRepo.findOne({
            where: { id, etablissementId },
            relations: ['sections', 'pageParent'],
        });
        if (!page) {
            throw new AppError('Page introuvable', 404, 'CMS_PAGE_NOT_FOUND');
        }
        return page;
    }

    async findPageBySlug(slug: string, etablissementId: string): Promise<CmsPage> {
        const page = await this.pageRepo.findOne({
            where: { slug, etablissementId, statut: StatutPage.PUBLIE },
            relations: ['sections'],
        });
        if (!page) {
            throw new AppError('Page introuvable', 404, 'CMS_PAGE_NOT_FOUND');
        }
        return page;
    }

    async createPage(dto: CreatePageDto, etablissementId: string, auteurId?: string): Promise<CmsPage> {
        // Vérifier unicité du slug
        const existant = await this.pageRepo.findOne({
            where: { slug: dto.slug, etablissementId },
        });
        if (existant) {
            throw new AppError('Ce slug existe déjà pour cet établissement', 409, 'CMS_SLUG_EXISTS');
        }

        // Si page accueil, désactiver l'ancienne
        if (dto.estPageAccueil) {
            await this.pageRepo.update(
                { etablissementId, estPageAccueil: true },
                { estPageAccueil: false }
            );
        }

        const page = this.pageRepo.create({ ...dto, etablissementId });
        const saved = await this.pageRepo.save(page);

        logger.info('[CMS] Page créée', { pageId: saved.id, slug: saved.slug, etablissementId });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async updatePage(id: string, dto: UpdatePageDto, etablissementId: string, auteurId?: string): Promise<CmsPage> {
        const page = await this.findPageById(id, etablissementId);

        // Optimistic Locking — vérifier la version
        const { version, ...restDto } = dto as UpdatePageDto & { version?: number };
        if (version !== undefined && version !== page.version) {
            throw new AppError(
                'Cette page a été modifiée par un autre utilisateur. Veuillez recharger et réessayer.',
                409,
                'CONCURRENT_EDIT',
            );
        }

        // Snapshot avant modification
        await this.creerVersion('page', page.id, page, etablissementId, auteurId);

        // Si page accueil, désactiver l'ancienne
        if (restDto.estPageAccueil) {
            await this.pageRepo.update(
                { etablissementId, estPageAccueil: true },
                { estPageAccueil: false }
            );
        }

        Object.assign(page, restDto);
        page.version = (page.version || 0) + 1;
        const saved = await this.pageRepo.save(page);

        logger.info('[CMS] Page mise à jour', { pageId: id, etablissementId });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async deletePage(id: string, etablissementId: string): Promise<void> {
        const page = await this.findPageById(id, etablissementId);

        // Supprimer d'abord les sections associées (cascade manuelle)
        await this.sectionRepo.delete({ pageId: page.id });

        await this.pageRepo.remove(page);
        logger.info('[CMS] Page supprimée', { pageId: id, etablissementId });
        await this.invaliderCache(etablissementId);
    }

    async publierPage(id: string, etablissementId: string, auteurId?: string): Promise<CmsPage> {
        const page = await this.findPageById(id, etablissementId);
        await this.creerVersion('page', page.id, page, etablissementId, auteurId, 'Publication');

        page.statut = StatutPage.PUBLIE;
        const saved = await this.pageRepo.save(page);

        logger.info('[CMS] Page publiée', { pageId: id, etablissementId });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    // ==================================
    // SECTIONS — CRUD
    // ==================================

    async findSectionsByPage(pageId: string, etablissementId: string): Promise<CmsSection[]> {
        // Vérifier que la page appartient à l'établissement
        await this.findPageById(pageId, etablissementId);
        return this.sectionRepo.find({
            where: { pageId },
            order: { ordre: 'ASC' },
        });
    }

    async createSection(dto: CreateSectionDto, pageId: string, etablissementId: string): Promise<CmsSection> {
        // Vérifier que la page appartient à l'établissement
        await this.findPageById(pageId, etablissementId);

        const section = this.sectionRepo.create({ ...dto, pageId });
        const saved = await this.sectionRepo.save(section);

        logger.info('[CMS] Section créée', { sectionId: saved.id, pageId, type: dto.type });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async updateSection(id: string, dto: UpdateSectionDto, etablissementId: string): Promise<CmsSection> {
        const section = await this.sectionRepo.findOne({
            where: { id },
            relations: ['page'],
        });
        if (!section || section.page.etablissementId !== etablissementId) {
            throw new AppError('Section introuvable', 404, 'CMS_SECTION_NOT_FOUND');
        }

        // Optimistic Locking — vérifier la version
        const { version, ...restDto } = dto as UpdateSectionDto & { version?: number };
        if (version !== undefined && version !== section.version) {
            throw new AppError(
                'Cette section a été modifiée par un autre utilisateur. Veuillez recharger et réessayer.',
                409,
                'CONCURRENT_EDIT',
            );
        }

        await this.creerVersion('section', section.id, section, etablissementId);

        Object.assign(section, restDto);
        section.version = (section.version || 0) + 1;
        const saved = await this.sectionRepo.save(section);

        logger.info('[CMS] Section mise à jour', { sectionId: id });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async deleteSection(id: string, etablissementId: string): Promise<void> {
        const section = await this.sectionRepo.findOne({
            where: { id },
            relations: ['page'],
        });
        if (!section || section.page.etablissementId !== etablissementId) {
            throw new AppError('Section introuvable', 404, 'CMS_SECTION_NOT_FOUND');
        }

        await this.sectionRepo.remove(section);
        logger.info('[CMS] Section supprimée', { sectionId: id });
        await this.invaliderCache(etablissementId);
    }

    async reordonnerSections(dto: ReordonnerSectionsDto, etablissementId: string): Promise<void> {
        for (const item of dto.sections) {
            await this.sectionRepo.update(item.id, { ordre: item.ordre });
        }
        logger.info('[CMS] Sections réordonnées', { count: dto.sections.length, etablissementId });
        await this.invaliderCache(etablissementId);
    }

    // ==================================
    // MEDIAS — CRUD
    // ==================================

    async findMedias(etablissementId: string, type?: string, dossier?: string): Promise<CmsMedia[]> {
        const where: any = { etablissementId };
        if (type) where.type = type;
        if (dossier) where.dossier = dossier;

        return this.mediaRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }

    async createMedia(dto: CreateMediaDto, etablissementId: string): Promise<CmsMedia> {
        const media = this.mediaRepo.create({ ...dto, etablissementId });
        const saved = await this.mediaRepo.save(media);
        logger.info('[CMS] Média créé', { mediaId: saved.id, type: dto.type });
        return saved;
    }

    async deleteMedia(id: string, etablissementId: string): Promise<void> {
        const media = await this.mediaRepo.findOne({ where: { id, etablissementId } });
        if (!media) {
            throw new AppError('Média introuvable', 404, 'CMS_MEDIA_NOT_FOUND');
        }
        await this.mediaRepo.remove(media);
        logger.info('[CMS] Média supprimé', { mediaId: id });
    }

    // ==================================
    // THEMES — CRUD
    // ==================================

    async findThemes(etablissementId: string): Promise<CmsTheme[]> {
        return this.themeRepo.find({
            where: { etablissementId },
            order: { actif: 'DESC', nom: 'ASC' },
        });
    }

    async findThemeActif(etablissementId: string): Promise<CmsTheme | null> {
        return this.themeRepo.findOne({
            where: { etablissementId, actif: true },
        });
    }

    async createTheme(dto: CreateThemeDto, etablissementId: string): Promise<CmsTheme> {
        // Si actif, désactiver les autres
        if (dto.actif) {
            await this.themeRepo.update({ etablissementId }, { actif: false });
        }

        const theme = this.themeRepo.create({ ...dto, etablissementId });
        const saved = await this.themeRepo.save(theme);
        logger.info('[CMS] Thème créé', { themeId: saved.id, nom: dto.nom });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async updateTheme(id: string, dto: UpdateThemeDto, etablissementId: string): Promise<CmsTheme> {
        const theme = await this.themeRepo.findOne({ where: { id, etablissementId } });
        if (!theme) {
            throw new AppError('Thème introuvable', 404, 'CMS_THEME_NOT_FOUND');
        }

        if (dto.actif) {
            await this.themeRepo.update({ etablissementId }, { actif: false });
        }

        Object.assign(theme, dto);
        const saved = await this.themeRepo.save(theme);
        logger.info('[CMS] Thème mis à jour', { themeId: id });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async activerTheme(id: string, etablissementId: string): Promise<CmsTheme> {
        const theme = await this.themeRepo.findOne({ where: { id, etablissementId } });
        if (!theme) {
            throw new AppError('Thème introuvable', 404, 'CMS_THEME_NOT_FOUND');
        }

        // Désactiver tous les autres
        await this.themeRepo.update({ etablissementId }, { actif: false });
        theme.actif = true;
        const saved = await this.themeRepo.save(theme);

        logger.info('[CMS] Thème activé', { themeId: id });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    // ==================================
    // MENUS — CRUD
    // ==================================

    async findMenus(etablissementId: string): Promise<CmsMenu[]> {
        return this.menuRepo.find({
            where: { etablissementId },
            order: { emplacement: 'ASC', nom: 'ASC' },
        });
    }

    async createMenu(dto: CreateMenuDto, etablissementId: string): Promise<CmsMenu> {
        const menu = this.menuRepo.create({ ...dto, etablissementId });
        const saved = await this.menuRepo.save(menu);
        logger.info('[CMS] Menu créé', { menuId: saved.id, emplacement: dto.emplacement });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async updateMenu(id: string, dto: UpdateMenuDto, etablissementId: string): Promise<CmsMenu> {
        const menu = await this.menuRepo.findOne({ where: { id, etablissementId } });
        if (!menu) {
            throw new AppError('Menu introuvable', 404, 'CMS_MENU_NOT_FOUND');
        }
        Object.assign(menu, dto);
        const saved = await this.menuRepo.save(menu);
        logger.info('[CMS] Menu mis à jour', { menuId: id });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    // ==================================
    // WIDGETS — CRUD
    // ==================================

    async findWidgets(etablissementId: string): Promise<CmsWidget[]> {
        return this.widgetRepo.find({
            where: { etablissementId },
            order: { emplacement: 'ASC', ordre: 'ASC' },
        });
    }

    async createWidget(dto: CreateWidgetDto, etablissementId: string): Promise<CmsWidget> {
        const widget = this.widgetRepo.create({ ...dto, etablissementId });
        const saved = await this.widgetRepo.save(widget);
        logger.info('[CMS] Widget créé', { widgetId: saved.id, type: dto.type });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    async updateWidget(id: string, dto: UpdateWidgetDto, etablissementId: string): Promise<CmsWidget> {
        const widget = await this.widgetRepo.findOne({ where: { id, etablissementId } });
        if (!widget) {
            throw new AppError('Widget introuvable', 404, 'CMS_WIDGET_NOT_FOUND');
        }
        Object.assign(widget, dto);
        const saved = await this.widgetRepo.save(widget);
        logger.info('[CMS] Widget mis à jour', { widgetId: id });
        await this.invaliderCache(etablissementId);
        return saved;
    }

    // ==================================
    // VERSIONS — Historique & rollback
    // ==================================

    async findVersions(etablissementId: string, entiteType: string, entiteId: string): Promise<CmsVersion[]> {
        return this.versionRepo.find({
            where: { etablissementId, entiteType, entiteId },
            order: { version: 'DESC' },
            take: 50,
        });
    }

    async restaurerVersion(versionId: string, etablissementId: string): Promise<void> {
        const version = await this.versionRepo.findOne({
            where: { id: versionId, etablissementId },
        });
        if (!version) {
            throw new AppError('Version introuvable', 404, 'CMS_VERSION_NOT_FOUND');
        }

        const snapshot = version.snapshot;
        switch (version.entiteType) {
            case 'page':
                await this.pageRepo.update(version.entiteId, snapshot as any);
                break;
            case 'section':
                await this.sectionRepo.update(version.entiteId, snapshot as any);
                break;
            case 'theme':
                await this.themeRepo.update(version.entiteId, snapshot as any);
                break;
            case 'menu':
                await this.menuRepo.update(version.entiteId, snapshot as any);
                break;
            case 'widget':
                await this.widgetRepo.update(version.entiteId, snapshot as any);
                break;
        }

        logger.info('[CMS] Version restaurée', { versionId, entiteType: version.entiteType });
        await this.invaliderCache(etablissementId);
    }

    private async creerVersion(
        entiteType: string,
        entiteId: string,
        snapshot: Record<string, unknown>,
        etablissementId: string,
        auteurId?: string,
        commentaire?: string,
    ): Promise<void> {
        // Trouver le numéro de version max
        const lastVersion = await this.versionRepo.findOne({
            where: { etablissementId, entiteType, entiteId },
            order: { version: 'DESC' },
        });

        const version = this.versionRepo.create({
            etablissementId,
            entiteType,
            entiteId,
            snapshot,
            auteurId,
            commentaire,
            version: (lastVersion?.version || 0) + 1,
        });

        await this.versionRepo.save(version);
    }

    // ==================================
    // PREVIEW — Token pour pages brouillon
    // ==================================

    /**
     * Génère un token de preview temporaire (10 min) pour visualiser une page brouillon.
     */
    async genererPreviewToken(pageId: string, etablissementId: string): Promise<{ token: string; slug: string; codeEtablissement: string }> {
        const page = await this.pageRepo.findOne({
            where: { id: pageId, etablissementId },
            relations: ['pageParent'],
        });
        if (!page) {
            throw new AppError('Page introuvable', 404, 'CMS_PAGE_NOT_FOUND');
        }

        const token = randomUUID();
        const payload = JSON.stringify({ pageId, etablissementId, slug: page.slug });

        // Stocker le token dans Redis avec TTL 10 minutes
        try {
            await redisService.set(`preview:${token}`, payload, 600);
        } catch {
            // Redis non disponible — fallback sans cache (token non persisté)
            logger.warn('[CMS] Redis indisponible, preview token non persisté');
        }

        // Récupérer le code établissement
        const etabRepo = AppDataSource.getRepository('Etablissement');
        const etab = await etabRepo.findOne({
            where: { id: etablissementId },
            select: ['codeEtablissement'],
        });

        return {
            token,
            slug: page.slug,
            codeEtablissement: (etab as any)?.codeEtablissement || '',
        };
    }

    // ==================================
    // EXPORT / IMPORT — Sauvegarde et restauration JSON
    // ==================================

    /**
     * Exporte une page CMS complète en JSON (page + sections + thème actif).
     * Format compatible avec l'import ou avec Puck Editor.
     */
    async exporterPage(pageId: string, etablissementId: string, options?: { format?: 'json' | 'puck' }): Promise<Record<string, unknown>> {
        const page = await this.findPageById(pageId, etablissementId);
        const sections = await this.findSectionsByPage(pageId, etablissementId);

        // Charger le thème actif
        const themeActif = await this.findThemeActif(etablissementId);

        const sectionsExport = sections
            .filter(s => s.visible)
            .sort((a, b) => a.ordre - b.ordre)
            .map(s => ({
                type: s.type,
                contenu: s.contenu,
                ordre: s.ordre,
                visible: s.visible,
                styles: s.styles,
                anchorId: s.anchorId,
            }));

        if (options?.format === 'puck') {
            // Format Puck Editor — compatible import direct
            return {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                etablissementId,
                format: 'puck',
                puckData: {
                    content: sectionsExport.map(s => ({
                        type: s.type,
                        props: { ...s.contenu },
                    })),
                    root: {},
                },
            };
        }

        // Format JSON complet
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            etablissementId,
            format: 'json',
            page: {
                titre: page.titre,
                slug: page.slug,
                template: page.template,
                statut: page.statut,
                ordre: page.ordre,
                seo: page.seo,
                metadata: page.metadata,
                estPageAccueil: page.estPageAccueil,
            },
            sections: sectionsExport,
            theme: themeActif ? {
                nom: themeActif.nom,
                variables: themeActif.variables,
                polices: themeActif.polices,
            } : null,
        };
    }

    /**
     * Importe une page CMS depuis un JSON exporté.
     * Crée une nouvelle page ou écrase une existante.
     */
    async importerPage(
        dto: { titre: string; slug?: string; sections: any[]; metadata?: any; statut?: string; ecraserExistante?: boolean },
        etablissementId: string,
        auteurId?: string,
    ): Promise<CmsPage> {
        // Générer un slug unique si non fourni
        let slug = dto.slug || dto.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        // Vérifier l'unicité du slug
        const existant = await this.pageRepo.findOne({ where: { slug, etablissementId } });

        if (existant && !dto.ecraserExistante) {
            // Ajouter un suffixe numérique
            let suffix = 1;
            let newSlug = `${slug}-${suffix}`;
            while (await this.pageRepo.findOne({ where: { slug: newSlug, etablissementId } })) {
                suffix++;
                newSlug = `${slug}-${suffix}`;
            }
            slug = newSlug;
        }

        if (existant && dto.ecraserExistante) {
            // Écraser la page existante
            await this.deletePage(existant.id, etablissementId);
        }

        // Créer la nouvelle page
        const page = this.pageRepo.create({
            titre: dto.titre,
            slug,
            template: 'custom',
            statut: (dto.statut as any) || 'BROUILLON',
            ordre: 0,
            metadata: dto.metadata,
            etablissementId,
        });
        const savedPage = await this.pageRepo.save(page);

        // Créer les sections
        if (dto.sections && dto.sections.length > 0) {
            for (let i = 0; i < dto.sections.length; i++) {
                const s = dto.sections[i];
                const section = this.sectionRepo.create({
                    type: s.type,
                    contenu: s.contenu || {},
                    ordre: s.ordre ?? i,
                    visible: s.visible ?? true,
                    styles: s.styles,
                    pageId: savedPage.id,
                });
                await this.sectionRepo.save(section);
            }
        }

        logger.info('[CMS] Page importée', { pageId: savedPage.id, slug, sectionsCount: dto.sections?.length || 0, etablissementId });
        await this.invaliderCache(etablissementId);

        // Recharger avec les sections
        return this.findPageById(savedPage.id, etablissementId);
    }

    // ==================================
    // CACHE — Invalidation
    // ==================================

    private async invaliderCache(etablissementId: string): Promise<void> {
        try {
            // SCAN + DEL — Redis DEL ne supporte pas les glob patterns
            await redisService.delPattern(`public:${etablissementId}:*`);
        } catch {
            // Redis non disponible — mode silencieux
        }
    }
}

export const cmsService = new CmsService();
