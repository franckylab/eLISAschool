/**
 * ==================================
 * eLISAschool - Service Requêtes v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système de configuration centralisée
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Requete, TypeRequete, StatutRequete } from '../entities';
import { CreateRequeteDto, TraiterRequeteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { getParamNumber, getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService, AuditAction } from '@modules/auth';

/**
 * Service Requêtes avec configuration centralisée
 */
export class RequetesService {
    private requeteRepo: Repository<Requete>;

    constructor() {
        this.requeteRepo = AppDataSource.getRepository(Requete);
    }

    /**
     * Récupère les paramètres requêtes depuis la configuration
     */
    private async getRequetesParams() {
        return {
            approvalLevels: await getParamNumber('requetes.approval_levels', 1),
            autoNotify: await getParamBoolean('requetes.auto_notify', true),
        };
    }

    /**
     * Crée une nouvelle requête
     */
    async create(dto: CreateRequeteDto, demandeurId: string, etablissementId?: string): Promise<Requete> {
        const params = await this.getRequetesParams();

        // Générer un numéro de requête
        const numero = await this.generateNumero(dto.type as TypeRequete);

        const requete: Requete = this.requeteRepo.create({
            ...dto,
            etablissementId,
            type: dto.type as TypeRequete,
            numero,
            demandeurId,
            statut: StatutRequete.EN_ATTENTE,
            niveauxApprobation: params.approvalLevels,
            niveauActuel: 0,
        });

        await this.requeteRepo.save(requete);

        // Notification automatique si activé
        if (params.autoNotify) {
            // TODO: Envoyer notification
            logger.info(`[${etablissementId}] Notification auto pour requête ${numero}`);
        }

        logger.info(`[${etablissementId}] Requête créée: ${numero}`);

        await auditService.log({
            utilisateurId: demandeurId,
            action: AuditAction.REQUETE_CREATE,
            cible: 'Requete',
            cibleId: requete.id,
            description: `Création de la requête ${numero} (${requete.type})`,
            module: 'requetes',
            etablissementId,
            metadata: { entiteLabel: numero },
        });

        return requete;
    }

    async findAll(options: {
        demandeurId?: string;
        type?: TypeRequete;
        statut?: StatutRequete;
        etablissementId?: string;
        page?: number;
        limit?: number;
    }): Promise<{ items: Requete[]; total: number }> {
        const { demandeurId, type, statut, etablissementId, page = 1, limit = 20 } = options;

        const qb = this.requeteRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.demandeur', 'd')
            .orderBy('r.createdAt', 'DESC');

        if (demandeurId) qb.andWhere('r.demandeurId = :demandeurId', { demandeurId });
        if (type) qb.andWhere('r.type = :type', { type });
        if (statut) qb.andWhere('r.statut = :statut', { statut });
        if (etablissementId) qb.andWhere('r.etablissementId = :etablissementId', { etablissementId });

        const [items, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { items, total };
    }

    /**
     * Trouve les requêtes d'un utilisateur
     */
    async findByUser(demandeurId: string, query?: any): Promise<{ items: Requete[]; total: number }> {
        const page = query?.page || 1;
        const limit = query?.limit || 20;
        return this.findAll({ demandeurId, page, limit, statut: query?.statut as StatutRequete, type: query?.type as TypeRequete });
    }

    async findOne(id: string): Promise<Requete> {
        const requete = await this.requeteRepo.findOne({
            where: { id },
            relations: ['demandeur'],
        });
        if (!requete) throw new AppError('Requête non trouvée', 404, 'NOT_FOUND');
        return requete;
    }

    /**
     * Traite une requête (approbation/rejet avec niveaux)
     */
    async traiter(id: string, dto: TraiterRequeteDto, approbateurId: string): Promise<Requete> {
        const params = await this.getRequetesParams();
        const requete = await this.findOne(id);

        if (requete.statut !== StatutRequete.EN_ATTENTE && requete.statut !== StatutRequete.EN_COURS) {
            throw new AppError('Cette requête ne peut plus être traitée', 400, 'INVALID_STATUS');
        }

        if (dto.decision === 'APPROUVE') {
            requete.niveauActuel = (requete.niveauActuel || 0) + 1;

            // Vérifier si tous les niveaux sont validés
            if (requete.niveauActuel >= params.approvalLevels) {
                requete.statut = StatutRequete.APPROUVEE;
                requete.dateTraitement = new Date();
            } else {
                requete.statut = StatutRequete.EN_COURS;
            }
        } else {
            requete.statut = StatutRequete.REJETEE;
            requete.dateTraitement = new Date();
        }

        requete.approbateurId = approbateurId;
        requete.commentaireTraitement = dto.commentaire;

        // Historique d'approbation
        const historique = requete.historiqueApprobation || [];
        historique.push({
            niveau: requete.niveauActuel,
            approbateurId,
            decision: dto.decision,
            commentaire: dto.commentaire,
            date: new Date().toISOString(),
        });
        requete.historiqueApprobation = historique;

        await this.requeteRepo.save(requete);

        // Notification automatique
        if (params.autoNotify) {
            logger.info(`Notification traitement requête ${requete.numero}`);
        }

        logger.info(`Requête ${requete.numero} traitée: ${dto.decision}`);

        await auditService.log({
            utilisateurId: approbateurId,
            action: AuditAction.REQUETE_EXECUTE,
            cible: 'Requete',
            cibleId: requete.id,
            description: `Requête ${requete.numero} traitée: ${dto.decision} (niveau ${requete.niveauActuel})`,
            module: 'requetes',
            etablissementId: requete.etablissementId,
            metadata: {
                entiteLabel: requete.numero,
                decision: dto.decision,
                niveauActuel: requete.niveauActuel,
            },
        });

        return requete;
    }

    /**
     * Annule une requête
     */
    async annuler(id: string, demandeurId: string): Promise<Requete> {
        const requete = await this.findOne(id);

        if (requete.demandeurId !== demandeurId) {
            throw new AppError('Vous ne pouvez annuler que vos propres requêtes', 403, 'FORBIDDEN');
        }

        if (requete.statut !== StatutRequete.EN_ATTENTE) {
            throw new AppError('Seules les requêtes en attente peuvent être annulées', 400, 'INVALID_STATUS');
        }

        requete.statut = StatutRequete.ANNULEE;
        await this.requeteRepo.save(requete);

        logger.info(`Requête ${requete.numero} annulée`);

        await auditService.log({
            utilisateurId: demandeurId,
            action: AuditAction.REQUETE_DELETE,
            cible: 'Requete',
            cibleId: requete.id,
            description: `Requête ${requete.numero} annulée par le demandeur`,
            module: 'requetes',
            etablissementId: requete.etablissementId,
            metadata: { entiteLabel: requete.numero },
        });

        return requete;
    }

    /**
     * Génère un numéro de requête unique
     */
    private async generateNumero(type: TypeRequete): Promise<string> {
        const prefix = type.substring(0, 3).toUpperCase();
        const year = new Date().getFullYear();
        const count = await this.requeteRepo.count({
            where: { type },
        });
        return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    /**
     * Statistiques des requêtes
     */
    async getStatistiques(): Promise<any> {
        const total = await this.requeteRepo.count();
        const enAttente = await this.requeteRepo.count({ where: { statut: StatutRequete.EN_ATTENTE } });
        const approuvees = await this.requeteRepo.count({ where: { statut: StatutRequete.APPROUVEE } });
        const rejetees = await this.requeteRepo.count({ where: { statut: StatutRequete.REJETEE } });

        return { total, enAttente, approuvees, rejetees };
    }
}

export const requetesService = new RequetesService();
