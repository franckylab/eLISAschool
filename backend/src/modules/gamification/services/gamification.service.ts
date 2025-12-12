import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Badge, PointsUtilisateur, HistoriquePoints, BadgeUtilisateur } from '../entities';
import { CreateBadgeDto, AttribuerPointsDto, AttribuerBadgeDto } from '../dto';
import { logger } from '@common/utils/logger.util';

export class GamificationService {
    private badgeRepo: Repository<Badge>;
    private pointsRepo: Repository<PointsUtilisateur>;
    private historiqueRepo: Repository<HistoriquePoints>;
    private badgeUserRepo: Repository<BadgeUtilisateur>;

    constructor() {
        this.badgeRepo = AppDataSource.getRepository(Badge);
        this.pointsRepo = AppDataSource.getRepository(PointsUtilisateur);
        this.historiqueRepo = AppDataSource.getRepository(HistoriquePoints);
        this.badgeUserRepo = AppDataSource.getRepository(BadgeUtilisateur);
    }

    async createBadge(dto: CreateBadgeDto): Promise<Badge> {
        const badge = this.badgeRepo.create(dto);
        await this.badgeRepo.save(badge);
        return badge;
    }

    async getBadges(): Promise<Badge[]> {
        return this.badgeRepo.find({ where: { actif: true } });
    }

    async attribuerPoints(dto: AttribuerPointsDto): Promise<PointsUtilisateur> {
        let points = await this.pointsRepo.findOne({ where: { utilisateurId: dto.utilisateurId } });
        if (!points) {
            points = this.pointsRepo.create({ utilisateurId: dto.utilisateurId });
        }
        points.pointsTotal += dto.points;
        points.pointsMois += dto.points;
        points.pointsSemaine += dto.points;
        points.niveau = Math.floor(points.pointsTotal / 100) + 1;
        await this.pointsRepo.save(points);

        const historique = this.historiqueRepo.create(dto);
        await this.historiqueRepo.save(historique);

        logger.info(`Points attribués: ${dto.points} à ${dto.utilisateurId} pour ${dto.action}`);
        return points;
    }

    async getPointsUtilisateur(utilisateurId: string): Promise<PointsUtilisateur | null> {
        return this.pointsRepo.findOne({ where: { utilisateurId } });
    }

    async getHistoriquePoints(utilisateurId: string, limit: number = 20): Promise<HistoriquePoints[]> {
        return this.historiqueRepo.find({
            where: { utilisateurId },
            order: { createdAt: 'DESC' },
            take: limit
        });
    }

    async attribuerBadge(dto: AttribuerBadgeDto): Promise<BadgeUtilisateur> {
        const existing = await this.badgeUserRepo.findOne({
            where: { utilisateurId: dto.utilisateurId, badgeId: dto.badgeId }
        });
        if (existing) return existing;

        const badgeUser = this.badgeUserRepo.create(dto);
        await this.badgeUserRepo.save(badgeUser);
        return badgeUser;
    }

    async getBadgesUtilisateur(utilisateurId: string): Promise<BadgeUtilisateur[]> {
        return this.badgeUserRepo.find({
            where: { utilisateurId },
            relations: ['badge']
        });
    }

    async getClassement(limit: number = 10): Promise<PointsUtilisateur[]> {
        return this.pointsRepo.find({
            order: { pointsTotal: 'DESC' },
            take: limit,
            relations: ['utilisateur']
        });
    }
}

export const gamificationService = new GamificationService();
