/**
 * ==================================
 * eLISAschool - Service CMS Contenu Dynamique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Service CRUD pour les entités de contenu CMS :
 * Actualités, Témoignages, Événements, Partenaires, Newsletter.
 * Multi-tenant strict via etablissementId.
 */

import { Repository, Like, IsNull, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    CmsActualite, CmsTemoignage, CmsEvenement,
    CmsPartenaire, CmsAbonnementNewsletter,
    StatutActualite,
} from '../entities/cms-content.entity';
import {
    CreerActualiteDto, ModifierActualiteDto,
    CreerTemoignageDto, ModifierTemoignageDto,
    CreerEvenementDto, ModifierEvenementDto,
    CreerPartenaireDto, ModifierPartenaireDto,
    AbonnementNewsletterDto,
} from '../dto/cms-content.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

// ==================================
// Service principal
// ==================================

export class CmsContentService {
    private actualiteRepo: Repository<CmsActualite>;
    private temoignageRepo: Repository<CmsTemoignage>;
    private evenementRepo: Repository<CmsEvenement>;
    private partenaireRepo: Repository<CmsPartenaire>;
    private newsletterRepo: Repository<CmsAbonnementNewsletter>;

    constructor() {
        this.actualiteRepo = AppDataSource.getRepository(CmsActualite);
        this.temoignageRepo = AppDataSource.getRepository(CmsTemoignage);
        this.evenementRepo = AppDataSource.getRepository(CmsEvenement);
        this.partenaireRepo = AppDataSource.getRepository(CmsPartenaire);
        this.newsletterRepo = AppDataSource.getRepository(CmsAbonnementNewsletter);
    }

    // ────────────────────────────────────────
    // UTILITAIRES
    // ────────────────────────────────────────

    private genererSlug(titre: string): string {
        return titre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 200);
    }

    private async verifierUniciteSlug(etablissementId: string, slug: string, excludeId?: string): Promise<void> {
        const where: any = { etablissementId, slug };
        if (excludeId) where.id = (() => { const obj: any = {}; obj.id = excludeId; return obj; })().id;
        const existant = await this.actualiteRepo.findOne({ where });
        if (existant && existant.id !== excludeId) {
            throw new AppError('Une actualité avec ce slug existe déjà', 409, 'ACTUALITE_SLUG_EXISTS');
        }
    }

    // ────────────────────────────────────────
    // ACTUALITÉS
    // ────────────────────────────────────────

    async creerActualite(dto: CreerActualiteDto, etablissementId: string, auteurId?: string): Promise<CmsActualite> {
        const slug = dto.slug || this.genererSlug(dto.titre);
        await this.verifierUniciteSlug(etablissementId, slug);

        const actualite = this.actualiteRepo.create({
            ...dto,
            slug,
            etablissementId,
            auteurId,
            datePublication: dto.statut === StatutActualite.PUBLIE ? new Date() : undefined,
        });

        const saved = await this.actualiteRepo.save(actualite);
        logger.info('Actualité CMS créée', { id: saved.id, titre: dto.titre, etablissementId });
        return saved;
    }

    async listerActualites(
        etablissementId: string,
        options: { page: number; limit: number; statut?: string; categorie?: string; estEnUne?: boolean; recherche?: string },
    ): Promise<{ data: CmsActualite[]; total: number; page: number; totalPages: number }> {
        const { page, limit, statut, categorie, estEnUne, recherche } = options;
        const where: any = { etablissementId };

        if (statut) where.statut = statut;
        if (categorie) where.categorie = categorie;
        if (estEnUne !== undefined) where.estEnUne = estEnUne;
        if (recherche) {
            where.titre = Like(`%${recherche}%`);
        }

        const [data, total] = await this.actualiteRepo.findAndCount({
            where,
            order: { datePublication: 'DESC', createdAt: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getActualite(id: string, etablissementId: string): Promise<CmsActualite> {
        const actualite = await this.actualiteRepo.findOne({ where: { id, etablissementId } });
        if (!actualite) throw new AppError('Actualité introuvable', 404, 'ACTUALITE_NOT_FOUND');
        return actualite;
    }

    async modifierActualite(id: string, etablissementId: string, dto: ModifierActualiteDto): Promise<CmsActualite> {
        const actualite = await this.getActualite(id, etablissementId);

        // Si passage à PUBLIE, définir la datePublication
        if (dto.statut === StatutActualite.PUBLIE && actualite.statut !== StatutActualite.PUBLIE) {
            (dto as any).datePublication = new Date();
        }

        Object.assign(actualite, dto);
        const saved = await this.actualiteRepo.save(actualite);
        logger.info('Actualité CMS modifiée', { id, etablissementId });
        return saved;
    }

    async supprimerActualite(id: string, etablissementId: string): Promise<void> {
        const actualite = await this.getActualite(id, etablissementId);
        await this.actualiteRepo.remove(actualite);
        logger.info('Actualité CMS supprimée', { id, etablissementId });
    }

    async incrementerVues(id: string, etablissementId: string): Promise<void> {
        await this.actualiteRepo.increment({ id, etablissementId }, 'vues', 1);
    }

    // ────────────────────────────────────────
    // TÉMOIGNAGES
    // ────────────────────────────────────────

    async creerTemoignage(dto: CreerTemoignageDto, etablissementId: string): Promise<CmsTemoignage> {
        const temoignage = this.temoignageRepo.create({ ...dto, etablissementId });
        const saved = await this.temoignageRepo.save(temoignage);
        logger.info('Témoignage CMS créé', { id: saved.id, nom: dto.nom, etablissementId });
        return saved;
    }

    async listerTemoignages(
        etablissementId: string,
        options?: { categorie?: string; estVisible?: boolean },
    ): Promise<CmsTemoignage[]> {
        const where: any = { etablissementId };
        if (options?.categorie) where.categorie = options.categorie;
        if (options?.estVisible !== undefined) where.estVisible = options.estVisible;

        return this.temoignageRepo.find({
            where,
            order: { ordre: 'ASC', createdAt: 'DESC' },
        });
    }

    async getTemoignage(id: string, etablissementId: string): Promise<CmsTemoignage> {
        const temoignage = await this.temoignageRepo.findOne({ where: { id, etablissementId } });
        if (!temoignage) throw new AppError('Témoignage introuvable', 404, 'TEMOIGNAGE_NOT_FOUND');
        return temoignage;
    }

    async modifierTemoignage(id: string, etablissementId: string, dto: ModifierTemoignageDto): Promise<CmsTemoignage> {
        const temoignage = await this.getTemoignage(id, etablissementId);
        Object.assign(temoignage, dto);
        return this.temoignageRepo.save(temoignage);
    }

    async supprimerTemoignage(id: string, etablissementId: string): Promise<void> {
        const temoignage = await this.getTemoignage(id, etablissementId);
        await this.temoignageRepo.remove(temoignage);
    }

    // ────────────────────────────────────────
    // ÉVÉNEMENTS
    // ────────────────────────────────────────

    async creerEvenement(dto: CreerEvenementDto, etablissementId: string): Promise<CmsEvenement> {
        const evenement = this.evenementRepo.create({
            ...dto,
            dateDebut: new Date(dto.dateDebut),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            etablissementId,
        });
        const saved = await this.evenementRepo.save(evenement);
        logger.info('Événement CMS créé', { id: saved.id, titre: dto.titre, etablissementId });
        return saved;
    }

    async listerEvenements(
        etablissementId: string,
        options: { page: number; limit: number; type?: string; futur?: boolean; recherche?: string },
    ): Promise<{ data: CmsEvenement[]; total: number; page: number; totalPages: number }> {
        const { page, limit, type, futur, recherche } = options;
        const where: any = { etablissementId };

        if (type) where.type = type;
        if (futur) where.dateDebut = MoreThanOrEqual(new Date());
        if (recherche) where.titre = Like(`%${recherche}%`);

        const [data, total] = await this.evenementRepo.findAndCount({
            where,
            order: { dateDebut: 'ASC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getEvenement(id: string, etablissementId: string): Promise<CmsEvenement> {
        const evenement = await this.evenementRepo.findOne({ where: { id, etablissementId } });
        if (!evenement) throw new AppError('Événement introuvable', 404, 'EVENEMENT_NOT_FOUND');
        return evenement;
    }

    async modifierEvenement(id: string, etablissementId: string, dto: ModifierEvenementDto): Promise<CmsEvenement> {
        const evenement = await this.getEvenement(id, etablissementId);
        const changes: any = { ...dto };
        if (dto.dateDebut) changes.dateDebut = new Date(dto.dateDebut);
        if (dto.dateFin) changes.dateFin = new Date(dto.dateFin);
        Object.assign(evenement, changes);
        return this.evenementRepo.save(evenement);
    }

    async supprimerEvenement(id: string, etablissementId: string): Promise<void> {
        const evenement = await this.getEvenement(id, etablissementId);
        await this.evenementRepo.remove(evenement);
    }

    // ────────────────────────────────────────
    // PARTENAIRES
    // ────────────────────────────────────────

    async creerPartenaire(dto: CreerPartenaireDto, etablissementId: string): Promise<CmsPartenaire> {
        const partenaire = this.partenaireRepo.create({ ...dto, etablissementId });
        const saved = await this.partenaireRepo.save(partenaire);
        logger.info('Partenaire CMS créé', { id: saved.id, nom: dto.nom, etablissementId });
        return saved;
    }

    async listerPartenaires(
        etablissementId: string,
        options?: { categorie?: string; estVisible?: boolean },
    ): Promise<CmsPartenaire[]> {
        const where: any = { etablissementId };
        if (options?.categorie) where.categorie = options.categorie;
        if (options?.estVisible !== undefined) where.estVisible = options.estVisible;

        return this.partenaireRepo.find({
            where,
            order: { ordre: 'ASC', nom: 'ASC' },
        });
    }

    async getPartenaire(id: string, etablissementId: string): Promise<CmsPartenaire> {
        const partenaire = await this.partenaireRepo.findOne({ where: { id, etablissementId } });
        if (!partenaire) throw new AppError('Partenaire introuvable', 404, 'PARTENAIRE_NOT_FOUND');
        return partenaire;
    }

    async modifierPartenaire(id: string, etablissementId: string, dto: ModifierPartenaireDto): Promise<CmsPartenaire> {
        const partenaire = await this.getPartenaire(id, etablissementId);
        Object.assign(partenaire, dto);
        return this.partenaireRepo.save(partenaire);
    }

    async supprimerPartenaire(id: string, etablissementId: string): Promise<void> {
        const partenaire = await this.getPartenaire(id, etablissementId);
        await this.partenaireRepo.remove(partenaire);
    }

    // ────────────────────────────────────────
    // NEWSLETTER
    // ────────────────────────────────────────

    async ajouterAbonnementNewsletter(dto: AbonnementNewsletterDto, etablissementId: string): Promise<CmsAbonnementNewsletter> {
        // Vérifier si l'email existe déjà (même soft-deleted)
        const existant = await this.newsletterRepo.findOne({
            where: { email: dto.email, etablissementId },
            withDeleted: true,
        });

        if (existant) {
            if (!existant.deletedAt && existant.estActif) {
                throw new AppError('Cet email est déjà abonné à la newsletter', 409, 'NEWSLETTER_ALREADY_SUBSCRIBED');
            }
            // Réactiver si supprimé ou inactif
            if (existant.deletedAt) {
                await this.newsletterRepo.restore(existant.id);
            }
            existant.estActif = true;
            existant.nom = dto.nom || existant.nom;
            return this.newsletterRepo.save(existant);
        }

        const abonnement = this.newsletterRepo.create({
            ...dto,
            etablissementId,
            source: dto.source || 'public',
        });
        const saved = await this.newsletterRepo.save(abonnement);
        logger.info('Abonnement newsletter créé', { email: dto.email, etablissementId });
        return saved;
    }

    async listerAbonnementsNewsletter(etablissementId: string): Promise<CmsAbonnementNewsletter[]> {
        return this.newsletterRepo.find({
            where: { etablissementId, estActif: true },
            order: { createdAt: 'DESC' },
        });
    }

    async desabonnerNewsletter(id: string, etablissementId: string): Promise<void> {
        const abonnement = await this.newsletterRepo.findOne({ where: { id, etablissementId } });
        if (!abonnement) throw new AppError('Abonnement introuvable', 404, 'NEWSLETTER_NOT_FOUND');
        abonnement.estActif = false;
        await this.newsletterRepo.save(abonnement);
    }

    async getStatsNewsletter(etablissementId: string): Promise<{ total: number; actifs: number; cetteSemaine: number }> {
        const total = await this.newsletterRepo.count({ where: { etablissementId } });
        const actifs = await this.newsletterRepo.count({ where: { etablissementId, estActif: true } });

        const uneSemaineEnArriere = new Date();
        uneSemaineEnArriere.setDate(uneSemaineEnArriere.getDate() - 7);
        const cetteSemaine = await this.newsletterRepo.count({
            where: { etablissementId, createdAt: MoreThanOrEqual(uneSemaineEnArriere) },
        });

        return { total, actifs, cetteSemaine };
    }

    // ────────────────────────────────────────
    // STATS GLOBALES (pour dashboard)
    // ────────────────────────────────────────

    async getStatsGlobales(etablissementId: string): Promise<{
        actualites: { total: number; publiees: number; enUne: number };
        temoignages: { total: number; visibles: number };
        evenements: { total: number; futurs: number };
        partenaires: { total: number; visibles: number };
        newsletter: { actifs: number };
    }> {
        const [
            totalActualites, actualitesPubliees, actualitesEnUne,
            totalTemoignages, temoignagesVisibles,
            totalEvenements, evenementsFuturs,
            totalPartenaires, partenairesVisibles,
            newsletterActifs,
        ] = await Promise.all([
            this.actualiteRepo.count({ where: { etablissementId } }),
            this.actualiteRepo.count({ where: { etablissementId, statut: StatutActualite.PUBLIE } }),
            this.actualiteRepo.count({ where: { etablissementId, estEnUne: true } }),
            this.temoignageRepo.count({ where: { etablissementId } }),
            this.temoignageRepo.count({ where: { etablissementId, estVisible: true } }),
            this.evenementRepo.count({ where: { etablissementId } }),
            this.evenementRepo.count({ where: { etablissementId, dateDebut: MoreThanOrEqual(new Date()) } }),
            this.partenaireRepo.count({ where: { etablissementId } }),
            this.partenaireRepo.count({ where: { etablissementId, estVisible: true } }),
            this.newsletterRepo.count({ where: { etablissementId, estActif: true } }),
        ]);

        return {
            actualites: { total: totalActualites, publiees: actualitesPubliees, enUne: actualitesEnUne },
            temoignages: { total: totalTemoignages, visibles: temoignagesVisibles },
            evenements: { total: totalEvenements, futurs: evenementsFuturs },
            partenaires: { total: totalPartenaires, visibles: partenairesVisibles },
            newsletter: { actifs: newsletterActifs },
        };
    }

    // ────────────────────────────────────────
    // API PUBLIQUE (projection restrictive)
    // ────────────────────────────────────────

    /**
     * Liste les actualités PUBLIÉES uniquement (pour API publique /e/:code/actualites).
     */
    async listerActualitesPubliques(
        etablissementId: string,
        options: { page: number; limit: number; categorie?: string },
    ): Promise<{ data: CmsActualite[]; total: number; page: number; totalPages: number }> {
        const { page, limit, categorie } = options;
        const where: any = { etablissementId, statut: StatutActualite.PUBLIE };
        if (categorie) where.categorie = categorie;

        const [data, total] = await this.actualiteRepo.findAndCount({
            where,
            select: ['id', 'titre', 'slug', 'resume', 'contenu', 'imageUrl', 'categorie', 'datePublication', 'vues'],
            order: { datePublication: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
        });

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Retrouve une actualité par son slug (pour API publique /e/:code/actualites/:slug).
     */
    async getActualiteParSlug(slug: string, etablissementId: string): Promise<CmsActualite> {
        const actualite = await this.actualiteRepo.findOne({
            where: { slug, etablissementId, statut: StatutActualite.PUBLIE },
        });
        if (!actualite) throw new AppError('Actualité introuvable', 404, 'ACTUALITE_NOT_FOUND');
        return actualite;
    }
}

// Singleton
export const cmsContentService = new CmsContentService();

