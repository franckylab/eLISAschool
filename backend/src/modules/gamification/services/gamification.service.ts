/**
 * ==================================
 * eLISAschool - Service Gamification v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Badge, PointsUtilisateur, HistoriquePoints, BadgeUtilisateur } from '../entities';
import { CreateBadgeDto, AttribuerPointsDto, AttribuerBadgeDto } from '../dto';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

/**
 * Service Gamification avec configuration centralisée
 */
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

    /**
     * Récupère les paramètres de gamification depuis la configuration
     */
    private async getGamificationParams() {
        return {
            pointsAttendance: await getParamNumber('gamification.points_attendance', 5),
            pointsGoodGrade: await getParamNumber('gamification.points_good_grade', 10),
            enableLeaderboard: await getParamBoolean('gamification.enable_leaderboard', true),
        };
    }

    async createBadge(dto: CreateBadgeDto, createurId?: string): Promise<Badge> {
        const badge = this.badgeRepo.create(dto);
        await this.badgeRepo.save(badge);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.BADGE_AWARD,
                cible: 'Badge',
                cibleId: badge.id,
                description: `Création du badge ${dto.nom}`,
                module: 'gamification',
                metadata: { entiteLabel: dto.nom },
            });
        }

        return badge;
    }

    async getBadges(): Promise<Badge[]> {
        return this.badgeRepo.find({ where: { actif: true } });
    }

    /**
     * Attribuer des points (utilise les valeurs configurées)
     */
    async attribuerPoints(dto: AttribuerPointsDto, attribuePar?: string): Promise<PointsUtilisateur> {
        const params = await this.getGamificationParams();

        let points = await this.pointsRepo.findOne({ where: { utilisateurId: dto.utilisateurId } });
        if (!points) {
            points = this.pointsRepo.create({ utilisateurId: dto.utilisateurId });
        }

        // Calculer les points selon l'action (utilise config)
        let pointsToAdd = dto.points;
        if (dto.action === 'assiduite') {
            pointsToAdd = dto.points || params.pointsAttendance;
        } else if (dto.action === 'bonne_note') {
            pointsToAdd = dto.points || params.pointsGoodGrade;
        }

        points.pointsTotal += pointsToAdd;
        points.pointsMois += pointsToAdd;
        points.pointsSemaine += pointsToAdd;
        points.niveau = Math.floor(points.pointsTotal / 100) + 1;
        await this.pointsRepo.save(points);

        const historique = this.historiqueRepo.create({ ...dto, points: pointsToAdd });
        await this.historiqueRepo.save(historique);

        const acteur = attribuePar ?? dto.utilisateurId;
        await auditService.log({
            utilisateurId: acteur,
            action: AuditAction.GAMIFICATION_POINTS,
            cible: 'PointsUtilisateur',
            cibleId: points.id,
            description: `${pointsToAdd} points attribués à ${dto.utilisateurId} pour ${dto.action}`,
            module: 'gamification',
            metadata: { points: pointsToAdd, action: dto.action },
        });

        logger.info(`Points attribués: ${pointsToAdd} à ${dto.utilisateurId} pour ${dto.action}`);
        return points;
    }

    /**
     * Attribue automatiquement des points pour présence
     */
    async attribuerPointsAssiduite(utilisateurId: string): Promise<PointsUtilisateur> {
        const params = await this.getGamificationParams();
        return this.attribuerPoints({
            utilisateurId,
            points: params.pointsAttendance,
            action: 'assiduite',
            description: 'Point de présence journalière',
        });
    }

    /**
     * Attribue automatiquement des points pour bonne note
     */
    async attribuerPointsBonneNote(utilisateurId: string, note: number, bareme: number): Promise<PointsUtilisateur | null> {
        const params = await this.getGamificationParams();
        // Bonne note = au moins 80% du barème
        if (note / bareme >= 0.8) {
            return this.attribuerPoints({
                utilisateurId,
                points: params.pointsGoodGrade,
                action: 'bonne_note',
                description: `Bonne note: ${note}/${bareme}`,
            });
        }
        return null;
    }

    async getPointsUtilisateur(utilisateurId: string): Promise<PointsUtilisateur | null> {
        return this.pointsRepo.findOne({ where: { utilisateurId } });
    }

    async getHistoriquePoints(utilisateurId: string, limit: number = 20): Promise<HistoriquePoints[]> {
        return this.historiqueRepo.find({
            where: { utilisateurId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    async attribuerBadge(dto: AttribuerBadgeDto, attribuePar?: string): Promise<BadgeUtilisateur> {
        const existing = await this.badgeUserRepo.findOne({
            where: { utilisateurId: dto.utilisateurId, badgeId: dto.badgeId },
        });
        if (existing) return existing;

        const badgeUser = this.badgeUserRepo.create(dto);
        await this.badgeUserRepo.save(badgeUser);

        const badge = await this.badgeRepo.findOne({ where: { id: dto.badgeId } });
        const acteur = attribuePar ?? dto.utilisateurId;
        await auditService.log({
            utilisateurId: acteur,
            action: AuditAction.GAMIFICATION_BADGE,
            cible: 'BadgeUtilisateur',
            cibleId: badgeUser.id,
            description: `Badge ${badge?.nom ?? dto.badgeId} attribué à ${dto.utilisateurId}`,
            module: 'gamification',
            metadata: { badgeNom: badge?.nom, badgeId: dto.badgeId },
        });

        return badgeUser;
    }

    async getBadgesUtilisateur(utilisateurId: string): Promise<BadgeUtilisateur[]> {
        return this.badgeUserRepo.find({
            where: { utilisateurId },
            relations: ['badge'],
        });
    }

    /**
     * Classement (affiché uniquement si activé dans config)
     */
    async getClassement(limit: number = 10): Promise<PointsUtilisateur[]> {
        const params = await this.getGamificationParams();

        if (!params.enableLeaderboard) {
            return []; // Classement désactivé
        }

        return this.pointsRepo.find({
            order: { pointsTotal: 'DESC' },
            take: limit,
            relations: ['utilisateur'],
        });
    }
}

export const gamificationService = new GamificationService();
