/**
 * ==================================
 * eLISAschool - Service du module Sondage
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, In, IsNull, MoreThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Sondage, SondageOption, Vote, TemplateSondage, StatutSondage, NiveauAccesAnalyses, VisibiliteTemplate } from '../entities';
import {
    CreateTemplateSondageDto,
    UpdateTemplateSondageDto,
    CreerSondageDto,
    VoteSondageDto,
    UpdateSondageDto,
    UpdateAnalysesPermissionsDto,
    FiltreUtilisateursDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Utilisateur } from '@modules/utilisateurs/entities';
import { notificationsService } from '@modules/notifications/services';
import { sondageWebSocketService } from './sondage.websocket';

export class SondageService {
    private sondageRepo: Repository<Sondage>;
    private optionRepo: Repository<SondageOption>;
    private voteRepo: Repository<Vote>;
    private templateRepo: Repository<TemplateSondage>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.sondageRepo = AppDataSource.getRepository(Sondage);
        this.optionRepo = AppDataSource.getRepository(SondageOption);
        this.voteRepo = AppDataSource.getRepository(Vote);
        this.templateRepo = AppDataSource.getRepository(TemplateSondage);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    // ==================== Templates ====================

    async createTemplate(dto: CreateTemplateSondageDto, createurId: string, etablissementId: string): Promise<TemplateSondage> {
        const existing = await this.templateRepo.findOne({
            where: { nom: dto.nom, createurId, etablissementId },
        });

        if (existing) {
            throw new AppError('Un template avec ce nom existe déjà', 409, 'TEMPLATE_NAME_CONFLICT');
        }

        const template = this.templateRepo.create({
            ...dto,
            tags: dto.tags?.join(','),
            createurId,
            etablissementId,
            parametres: dto.parametres || {},
        });

        const saved = await this.templateRepo.save(template);
        logger.info(`Template sondage créé: ${saved.nom}`, { templateId: saved.id, createurId });
        return saved;
    }

    async findTemplates(etablissementId: string, createurId?: string): Promise<TemplateSondage[]> {
        const where: any[] = [
            { visibilite: VisibiliteTemplate.SYSTEME },
            { visibilite: VisibiliteTemplate.ETABLISSEMENT, etablissementId },
        ];

        if (createurId) {
            where.push({ visibilite: VisibiliteTemplate.PRIVE, createurId });
        }

        return this.templateRepo.find({
            where,
            relations: ['createur'],
            order: { utilisationCount: 'DESC', createdAt: 'DESC' },
        });
    }

    async updateTemplate(templateId: string, dto: UpdateTemplateSondageDto, createurId: string): Promise<TemplateSondage> {
        const template = await this.templateRepo.findOne({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError('Template non trouvé', 404, 'NOT_FOUND');
        }

        if (template.createurId !== createurId) {
            throw new AppError('Vous n\'êtes pas autorisé à modifier ce template', 403, 'PERMISSION_DENIED');
        }

        Object.assign(template, {
            ...dto,
            tags: dto.tags?.join(','),
        });

        return this.templateRepo.save(template);
    }

    async deleteTemplate(templateId: string, createurId: string): Promise<void> {
        const template = await this.templateRepo.findOne({
            where: { id: templateId },
        });

        if (!template) {
            throw new AppError('Template non trouvé', 404, 'NOT_FOUND');
        }

        if (template.createurId !== createurId) {
            throw new AppError('Vous n\'êtes pas autorisé à supprimer ce template', 403, 'PERMISSION_DENIED');
        }

        await this.templateRepo.remove(template);
        logger.info(`Template sondage supprimé: ${templateId}`, { createurId });
    }

    async incrementTemplateUsage(templateId: string): Promise<void> {
        await this.templateRepo.increment({ id: templateId }, 'utilisationCount', 1);
    }

    // ==================== Sondages ====================

    async createSondage(dto: CreerSondageDto, auteurId: string, etablissementId: string): Promise<Sondage> {
        if (dto.destinataires.utilisateur_ids.length === 0) {
            throw new AppError('Vous devez sélectionner au moins un destinataire', 400, 'NO_RECIPIENTS');
        }

        if (dto.destinataires.utilisateur_ids.length > 500) {
            throw new AppError('Limite de 500 destinataires dépassée', 429, 'RECIPIENT_LIMIT_EXCEEDED');
        }

        // Vérifier si c'est une programmation
        const isScheduled = !!dto.date_envoi;
        const statut = isScheduled ? StatutSondage.PROGRAMME : StatutSondage.ACTIF;

        // Calculer la date limite si spécifiée
        let dateLimite: Date | undefined;
        if (dto.parametres?.dureeLimite) {
            dateLimite = this.parseDureeLimite(dto.parametres.dureeLimite);
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const sondage = this.sondageRepo.create({
                question: dto.question,
                statut,
                estAnonyme: dto.parametres?.estAnonyme || false,
                choixMultiple: dto.parametres?.choixMultiple || false,
                dateLimite,
                dateProgrammation: isScheduled ? new Date(dto.date_envoi!) : undefined,
                nombreDestinataires: dto.destinataires.utilisateur_ids.length,
                creerConversation: dto.creer_conversation,
                templateId: dto.template_id,
                modeDestinataires: dto.destinataires.mode,
                auteurId,
                etablissementId,
            });

            await queryRunner.manager.save(sondage);

            // Créer les options
            const options = dto.options.map((opt, index) =>
                this.optionRepo.create({
                    texte: opt.texte,
                    ordre: opt.ordre || index,
                    sondageId: sondage.id,
                })
            );

            await queryRunner.manager.save(options);

            await queryRunner.commitTransaction();

            logger.info(`Sondage créé: ${sondage.id}`, {
                sondageId: sondage.id,
                auteurId,
                nombreDestinataires: sondage.nombreDestinataires,
                statut: sondage.statut,
            });

            // Envoyer des notifications aux destinataires (non bloquant)
            if (!isScheduled) {
                try {
                    await this.envoyerNotificationsSondage(sondage, dto.destinataires.utilisateur_ids);
                    // WebSocket: notifier l'activation
                    sondageWebSocketService.broadcastSondageActive(sondage.id, dto.destinataires.utilisateur_ids);
                } catch (error) {
                    logger.warn(`[Sondage] Échec envoi notifications (non bloquant)`, error);
                }
            }

            return sondage;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async vote(voteDto: VoteSondageDto, sondageId: string, utilisateurId: string): Promise<Vote[]> {
        const sondage = await this.sondageRepo.findOne({
            where: { id: sondageId },
            relations: ['options'],
        });

        if (!sondage) {
            throw new AppError('Sondage non trouvé', 404, 'NOT_FOUND');
        }

        if (sondage.statut !== StatutSondage.ACTIF) {
            throw new AppError('Ce sondage n\'est pas actif', 400, 'SONDAGE_NOT_ACTIVE');
        }

        if (sondage.dateLimite && sondage.dateLimite < new Date()) {
            throw new AppError('Ce sondage a expiré', 400, 'SONDAGE_EXPIRED');
        }

        // Vérifier si déjà voté
        const existingVote = await this.voteRepo.findOne({
            where: { sondageId, utilisateurId },
        });

        if (existingVote && !sondage.choixMultiple) {
            throw new AppError('Vous avez déjà voté à ce sondage', 409, 'ALREADY_VOTED');
        }

        // Vérifier les options
        const validOptionIds = sondage.options?.map((opt) => opt.id) || [];
        for (const optionId of voteDto.option_ids) {
            if (!validOptionIds.includes(optionId)) {
                throw new AppError('Option invalide', 400, 'INVALID_OPTION');
            }
        }

        if (!sondage.choixMultiple && voteDto.option_ids.length > 1) {
            throw new AppError('Ce sondage ne permet qu\'une seule réponse', 400, 'INVALID_INPUT');
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Supprimer les anciens votes si choix multiple
            if (sondage.choixMultiple) {
                await queryRunner.manager.delete(Vote, { sondageId, utilisateurId });
            }

            // Créer les nouveaux votes
            const votes = voteDto.option_ids.map((optionId) =>
                this.voteRepo.create({
                    sondageId,
                    optionId,
                    utilisateurId: sondage.estAnonyme ? undefined : utilisateurId,
                })
            );

            await queryRunner.manager.save(votes);

            // Mettre à jour les compteurs
            for (const optionId of voteDto.option_ids) {
                await queryRunner.manager.increment(SondageOption, { id: optionId }, 'nombreVotes', 1);
            }

            await queryRunner.manager.increment(Sondage, { id: sondageId }, 'nombreVotes', voteDto.option_ids.length);

            await queryRunner.commitTransaction();

            // WebSocket: broadcaster le nouveau vote
            sondageWebSocketService.broadcastNouveauVote({
                sondageId,
                utilisateurId: sondage.estAnonyme ? undefined : utilisateurId,
                nombreVotes: sondage.nombreVotes + voteDto.option_ids.length,
                timestamp: new Date(),
            });

            return votes;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findOne(sondageId: string, etablissementId: string): Promise<Sondage> {
        const sondage = await this.sondageRepo.findOne({
            where: { id: sondageId, etablissementId },
            relations: ['options', 'auteur'],
            order: {
                options: { ordre: 'ASC' },
            },
        });

        if (!sondage) {
            throw new AppError('Sondage non trouvé', 404, 'NOT_FOUND');
        }

        return sondage;
    }

    async findAll(
        etablissementId: string,
        page: number = 1,
        limit: number = 20,
        statut?: StatutSondage
    ): Promise<[Sondage[], number]> {
        const where: any = { etablissementId };
        if (statut) {
            where.statut = statut;
        }

        const offset = (page - 1) * limit;

        return this.sondageRepo.findAndCount({
            where,
            relations: ['auteur'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    async updateSondage(sondageId: string, dto: UpdateSondageDto, auteurId: string, etablissementId: string): Promise<Sondage> {
        const sondage = await this.findOne(sondageId, etablissementId);

        if (sondage.auteurId !== auteurId) {
            throw new AppError('Vous n\'êtes pas autorisé à modifier ce sondage', 403, 'PERMISSION_DENIED');
        }

        Object.assign(sondage, dto);
        return this.sondageRepo.save(sondage);
    }

    async fermerSondage(sondageId: string, auteurId: string, etablissementId: string): Promise<Sondage> {
        const sondage = await this.findOne(sondageId, etablissementId);

        if (sondage.auteurId !== auteurId) {
            throw new AppError('Vous n\'êtes pas autorisé à fermer ce sondage', 403, 'PERMISSION_DENIED');
        }

        sondage.statut = StatutSondage.FERME;
        sondage.dateFermeture = new Date();

        return this.sondageRepo.save(sondage);
    }

    async getSondagesProgrammes(etablissementId: string): Promise<Sondage[]> {
        return this.sondageRepo.find({
            where: {
                etablissementId,
                statut: StatutSondage.PROGRAMME,
                dateProgrammation: MoreThan(new Date()),
            },
            relations: ['auteur'],
            order: { dateProgrammation: 'ASC' },
        });
    }

    async activerSondagesProgrammes(): Promise<number> {
        const sondages = await this.sondageRepo.find({
            where: {
                statut: StatutSondage.PROGRAMME,
                dateProgrammation: MoreThan(new Date()),
            },
        });

        let count = 0;
        for (const sondage of sondages) {
            if (sondage.dateProgrammation && sondage.dateProgrammation <= new Date()) {
                sondage.statut = StatutSondage.ACTIF;
                sondage.dateProgrammation = undefined;
                await this.sondageRepo.save(sondage);
                count++;
            }
        }

        if (count > 0) {
            logger.info(`${count} sondage(s) programmé(s) activé(s)`);
        }

        return count;
    }

    // ==================== Analyses ====================

    async getAnalyses(sondageId: string, utilisateurId: string, etablissementId: string): Promise<any> {
        const sondage = await this.sondageRepo.findOne({
            where: { id: sondageId, etablissementId },
            relations: ['options'],
        });

        if (!sondage) {
            throw new AppError('Sondage non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier les permissions
        const peutVoir = this.verifierPermissionAnalyses(sondage, utilisateurId);
        if (!peutVoir) {
            throw new AppError('Vous n\'avez pas la permission de voir les analyses', 403, 'ANALYSIS_PERMISSION_DENIED');
        }

        const options = sondage.options || [];
        const totalVotes = sondage.nombreVotes;
        const tauxParticipation = sondage.nombreDestinataires > 0
            ? (totalVotes / sondage.nombreDestinataires) * 100
            : 0;

        const repartition = options.map((opt) => ({
            option_id: opt.id,
            option_texte: opt.texte,
            nombre_votes: opt.nombreVotes,
            pourcentage: totalVotes > 0 ? (opt.nombreVotes / totalVotes) * 100 : 0,
        }));

        return {
            sondage: {
                message_id: sondage.id,
                question: sondage.question,
                statut: sondage.statut,
                date_fermeture: sondage.dateFermeture,
            },
            statistiques: {
                total_votes: totalVotes,
                total_destinataires: sondage.nombreDestinataires,
                taux_participation: parseFloat(tauxParticipation.toFixed(2)),
                repartition_par_option: repartition,
                date_calcul: new Date(),
            },
            permission: {
                niveau_acces: sondage.niveauAccesAnalyses,
                peut_exporter: true,
            },
        };
    }

    async updateAnalysesPermissions(
        sondageId: string,
        dto: UpdateAnalysesPermissionsDto,
        auteurId: string,
        etablissementId: string
    ): Promise<Sondage> {
        const sondage = await this.findOne(sondageId, etablissementId);

        if (sondage.auteurId !== auteurId) {
            throw new AppError('Vous n\'êtes pas autorisé à modifier les permissions', 403, 'PERMISSION_DENIED');
        }

        sondage.niveauAccesAnalyses = dto.niveau_acces;
        sondage.utilisateursAutorisesAnalyses = dto.utilisateurs_autorises;

        return this.sondageRepo.save(sondage);
    }

    // ==================== Utilitaires ====================

    async findUtilisateursFiltres(
        dto: FiltreUtilisateursDto,
        etablissementId: string
    ): Promise<{ utilisateurs: any[]; pagination: any }> {
        const page = parseInt(dto.page) || 1;
        const limit = Math.min(parseInt(dto.limit) || 50, 100);
        const offset = (page - 1) * limit;

        const where: any = { etablissementId };

        if (dto.recherche) {
            where['email'] = dto.recherche;
        }

        const [utilisateurs, total] = await this.utilisateurRepo.findAndCount({
            where,
            select: ['id', 'email'],
            order: { createdAt: 'DESC' },
            take: limit,
            skip: offset,
        });

        return {
            utilisateurs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    private verifierPermissionAnalyses(sondage: Sondage, utilisateurId: string): boolean {
        if (sondage.auteurId === utilisateurId) {
            return true;
        }

        switch (sondage.niveauAccesAnalyses) {
            case NiveauAccesAnalyses.AUTEUR_SEUL:
                return false;
            case NiveauAccesAnalyses.TOUS_PARTICIPANTS:
                return true;
            case NiveauAccesAnalyses.PERSONNALISE:
                return sondage.utilisateursAutorisesAnalyses?.includes(utilisateurId) || false;
            default:
                return false;
        }
    }

    private parseDureeLimite(duree: string): Date {
        const match = duree.match(/^(\d+)([jhd])$/);
        if (!match) {
            throw new AppError('Format de durée invalide. Ex: 3j, 5h, 30m', 400, 'INVALID_DURATION');
        }

        const valeur = parseInt(match[1]);
        const unite = match[2];

        const maintenant = new Date();
        switch (unite) {
            case 'j':
                return new Date(maintenant.getTime() + valeur * 24 * 60 * 60 * 1000);
            case 'h':
                return new Date(maintenant.getTime() + valeur * 60 * 60 * 1000);
            case 'm':
                return new Date(maintenant.getTime() + valeur * 60 * 1000);
            default:
                throw new AppError('Unité de durée non supportée', 400, 'INVALID_DURATION');
        }
    }

    /**
     * Envoyer des notifications aux destinataires d'un sondage
     */
    private async envoyerNotificationsSondage(sondage: Sondage, destinataireIds: string[]): Promise<void> {
        // Limiter à 50 notifications pour éviter la surcharge
        const destinataires = destinataireIds.slice(0, 50);
        
        await notificationsService.createBulk({
            destinatairesIds: destinataires,
            titre: '📊 Nouveau sondage',
            contenu: `Un nouveau sondage a été créé : "${sondage.question.substring(0, 100)}${sondage.question.length > 100 ? '...' : ''}"`,
            type: 'IN_APP' as any,
            priorite: 'NORMALE' as any,
            categorie: 'sondage',
        }, sondage.auteurId);

        logger.info(`[Sondage] ${destinataires.length} notification(s) envoyée(s)`, {
            sondageId: sondage.id,
        });
    }
}

export const sondageService = new SondageService();
