/**
 * ==================================
 * eLISAschool - Service Suivi-Élèves
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    IncidentEleve,
    ObservationEleve,
    SanctionEleve,
    FelicitationEleve,
    StatutSanction,
} from '../entities';
import {
    CreateIncidentEleveDto,
    CreateObservationEleveDto,
    CreateSanctionEleveDto,
    CreateFelicitationEleveDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { gamificationService } from '@modules/gamification/services';
import { TypeActionPoints } from '@modules/gamification/entities';
import { Eleve } from '@modules/eleves/entities';

export class SuiviEleveService {
    private incidentRepo: Repository<IncidentEleve>;
    private observationRepo: Repository<ObservationEleve>;
    private sanctionRepo: Repository<SanctionEleve>;
    private felicitationRepo: Repository<FelicitationEleve>;
    private eleveRepo: Repository<Eleve>;

    constructor() {
        this.incidentRepo = AppDataSource.getRepository(IncidentEleve);
        this.observationRepo = AppDataSource.getRepository(ObservationEleve);
        this.sanctionRepo = AppDataSource.getRepository(SanctionEleve);
        this.felicitationRepo = AppDataSource.getRepository(FelicitationEleve);
        this.eleveRepo = AppDataSource.getRepository(Eleve);
    }

    /**
     * Helper: Récupère le utilisateurId d'un élève
     */
    private async getUtilisateurIdFromEleveId(eleveId: string): Promise<string> {
        const eleve = await this.eleveRepo.findOne({
            where: { id: eleveId },
            select: ['utilisateurId'],
        });
        if (!eleve) {
            throw new AppError(`Élève non trouvé: ${eleveId}`, 404, 'ELEVE_NOT_FOUND');
        }
        return eleve.utilisateurId;
    }

    // ==================== INCIDENTS ====================
    async createIncident(dto: CreateIncidentEleveDto, declarantId: string, etablissementId: string, req?: Request): Promise<IncidentEleve> {
        const incident = this.incidentRepo.create({
            ...dto,
            declarantId,
            etablissementId,
            dateIncident: new Date(),
        });
        await this.incidentRepo.save(incident);
        
        // Audit trail
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.INCIDENT_ELEVE_CREATE,
                cible: 'IncidentEleve',
                cibleId: incident.id,
                description: `Incident créé: ${dto.type} - Gravité: ${dto.gravite} - Année: ${dto.anneeScolaireId}`,
                nouvellesValeurs: dto,
                module: 'suivi-eleves',
            }, req);
        }
        
        logger.info(`[Suivi-Élèves] Incident créé: ${dto.eleveId} - Année: ${dto.anneeScolaireId}`);
        return incident;
    }

    async getIncidentsByEleve(
        eleveId: string, 
        etablissementId: string,
        anneeScolaireId: string,
        options?: { periodeId?: string; page?: number; limit?: number }
    ): Promise<{ data: IncidentEleve[]; total: number }> {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 20;
        const skip = (page - 1) * limit;
        
        const where: any = { eleveId, etablissementId, anneeScolaireId };
        if (options?.periodeId) {
            where.periodeId = options.periodeId; // ← NOUVEAU: filtre par trimestre
        }
        
        const [data, total] = await this.incidentRepo.findAndCount({
            where,
            relations: ['declarant', 'eleve', 'classe', 'matiere', 'anneeScolaire', 'periode'], // ← NOUVEAU: relation periode
            order: { dateIncident: 'DESC' },
            take: Math.min(limit, 100),
            skip,
        });
        return { data, total };
    }

    // ==================== OBSERVATIONS ====================
    async createObservation(dto: CreateObservationEleveDto, observateurId: string, etablissementId: string, req?: Request): Promise<ObservationEleve> {
        const observation = this.observationRepo.create({
            ...dto,
            observateurId,
            etablissementId,
        });
        await this.observationRepo.save(observation);
        
        // Attribution points gamification si pointsImpact != 0
        if (dto.pointsImpact && dto.pointsImpact !== 0) {
            try {
                // Récupérer le vrai utilisateurId de l'élève
                const utilisateurId = await this.getUtilisateurIdFromEleveId(dto.eleveId);
                
                // Déterminer l'action selon le type d'observation
                const action = dto.type === 'POSITIVE' 
                    ? TypeActionPoints.OBSERVATION_POSITIVE 
                    : TypeActionPoints.OBSERVATION_NEGATIVE;
                
                await gamificationService.attribuerPoints({
                    utilisateurId,
                    points: dto.pointsImpact,
                    action,
                    description: `Observation: ${dto.categorie} - ${dto.commentaire.substring(0, 50)}...`,
                    sourceModule: 'suivi-eleves',
                    sourceId: observation.id,
                });
                
                logger.info(`[Suivi-Élèves] Points observation attribués: ${dto.pointsImpact} à ${utilisateurId}`);
            } catch (error) {
                logger.warn(`[Suivi-Élèves] Échec attribution points observation (non bloquant)`, error);
            }
        }
        
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.OBSERVATION_ELEVE_CREATE,
                cible: 'ObservationEleve',
                cibleId: observation.id,
                description: `Observation créée: ${dto.type} - Année: ${dto.anneeScolaireId}`,
                nouvellesValeurs: dto,
                module: 'suivi-eleves',
            }, req);
        }
        
        return observation;
    }

    async getObservationsByEleve(
        eleveId: string, 
        etablissementId: string,
        anneeScolaireId: string,
        options?: { periodeId?: string; page?: number; limit?: number }
    ): Promise<{ data: ObservationEleve[]; total: number }> {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 20;
        const skip = (page - 1) * limit;
        
        const where: any = { eleveId, etablissementId, anneeScolaireId };
        if (options?.periodeId) {
            where.periodeId = options.periodeId; // ← NOUVEAU: filtre par trimestre
        }
        
        const [data, total] = await this.observationRepo.findAndCount({
            where,
            relations: ['observateur', 'eleve', 'anneeScolaire', 'periode'], // ← NOUVEAU
            order: { createdAt: 'DESC' },
            take: Math.min(limit, 100),
            skip,
        });
        return { data, total };
    }

    // ==================== SANCTIONS ====================
    async createSanction(dto: CreateSanctionEleveDto, decideParId: string, etablissementId: string, req?: Request): Promise<SanctionEleve> {
        // Vérifier si validation requise pour sanctions graves
        const requireValidation = await getParamBoolean('suivi-eleves.sanction.require_validation', { defaultValue: false });
        const sanctionGrave = dto.gravite === 'GRAVE' || dto.gravite === 'TRES_GRAVE';
        
        const sanction = this.sanctionRepo.create({
            ...dto,
            decideParId,
            etablissementId,
            statut: (requireValidation && sanctionGrave) 
                ? StatutSanction.EN_ATTENTE_VALIDATION 
                : StatutSanction.PRONONCEE,
        });
        
        await this.sanctionRepo.save(sanction);
        
        // Créer workflow si nécessaire
        if (requireValidation && sanctionGrave && decideParId) {
            try {
                const niveauxRequis = await getParamNumber('suivi-eleves.sanction.validation_levels', { defaultValue: 2 });
                
                await validationWorkflowService.createWorkflow({
                    module: 'suivi-eleves',
                    entiteId: sanction.id,
                    entiteType: 'SanctionEleve',
                    niveauxRequis,
                    etablissementId,
                }, decideParId);
                
                logger.info(`[Suivi-Élèves] Workflow créé pour sanction: ${sanction.id}`);
            } catch (error) {
                logger.warn(`[Suivi-Élèves] Échec création workflow sanction (non bloquant)`, error);
            }
        }
        
        // Mettre à jour l'incident associé
        await this.incidentRepo.update(dto.incidentId, {
            statut: 'SANCTIONNE',
            sanctionId: sanction.id,
        });

        // Audit trail
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.SANCTION_ELEVE_CREATE,
                cible: 'SanctionEleve',
                cibleId: sanction.id,
                description: `Sanction créée: ${dto.type} - Statut: ${sanction.statut} - Élève: ${dto.eleveId}`,
                nouvellesValeurs: dto,
                module: 'suivi-eleves',
            }, req);
        }

        logger.info(`[Suivi-Élèves] Sanction créée: ${dto.eleveId} - Statut: ${sanction.statut} - Année: ${dto.anneeScolaireId}`);
        return sanction;
    }

    // ==================== FELICITATIONS ====================
    async createFelicitation(dto: CreateFelicitationEleveDto, attribueParId: string, etablissementId: string, req?: Request): Promise<FelicitationEleve> {
        const felicitation = this.felicitationRepo.create({
            ...dto,
            attribueParId,
            etablissementId,
        });
        await this.felicitationRepo.save(felicitation);
        
        // Attribution points gamification
        try {
            // Récupérer le vrai utilisateurId de l'élève
            const utilisateurId = await this.getUtilisateurIdFromEleveId(dto.eleveId);
            
            // Récupérer les points configurés ou utiliser ceux du DTO
            const pointsConfig = await getParamNumber('suivi-eleves.gamification.points_felicitations', dto.pointsBonus || 10);
            const points = dto.pointsBonus || pointsConfig;
            
            await gamificationService.attribuerPoints({
                utilisateurId,
                points,
                action: TypeActionPoints.FELICITATIONS,
                description: `Félicitation: ${dto.motif}`,
                sourceModule: 'suivi-eleves',
                sourceId: felicitation.id,
            });
            
            logger.info(`[Suivi-Élèves] Points gamification attribués: ${points} à ${utilisateurId}`);
        } catch (error) {
            logger.warn(`[Suivi-Élèves] Échec attribution points gamification (non bloquant)`, error);
        }
        
        // Audit trail
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.FELICITATION_ELEVE_CREATE,
                cible: 'FelicitationEleve',
                cibleId: felicitation.id,
                description: `Félicitation créée: ${dto.motif} - Points: ${dto.pointsBonus}`,
                nouvellesValeurs: dto,
                module: 'suivi-eleves',
            }, req);
        }
        
        logger.info(`[Suivi-Élèves] Félicitation créée: ${dto.eleveId}`);
        return felicitation;
    }

    async getFelicitationsByEleve(
        eleveId: string, 
        etablissementId: string,
        anneeScolaireId: string,
        options?: { periodeId?: string; page?: number; limit?: number }
    ): Promise<{ data: FelicitationEleve[]; total: number }> {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 20;
        const skip = (page - 1) * limit;
        
        const where: any = { eleveId, etablissementId, anneeScolaireId };
        if (options?.periodeId) {
            where.periodeId = options.periodeId; // ← NOUVEAU: filtre par trimestre
        }
        
        const [data, total] = await this.felicitationRepo.findAndCount({
            where,
            relations: ['attribuePar', 'eleve', 'anneeScolaire', 'periode'], // ← NOUVEAU
            order: { createdAt: 'DESC' },
            take: Math.min(limit, 100),
            skip,
        });
        return { data, total };
    }

    async getSanctionsByEleve(
        eleveId: string, 
        etablissementId: string,
        anneeScolaireId: string,
        options?: { periodeId?: string; page?: number; limit?: number }
    ): Promise<{ data: SanctionEleve[]; total: number }> {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 20;
        const skip = (page - 1) * limit;
        
        const where: any = { eleveId, etablissementId, anneeScolaireId };
        if (options?.periodeId) {
            where.periodeId = options.periodeId; // ← NOUVEAU: filtre par trimestre
        }
        
        const [data, total] = await this.sanctionRepo.findAndCount({
            where,
            relations: ['decidePar', 'eleve', 'incident', 'anneeScolaire', 'periode'], // ← NOUVEAU
            order: { createdAt: 'DESC' },
            take: Math.min(limit, 100),
            skip,
        });
        return { data, total };
    }

    // ==================== DASHBOARD ====================
    async getDashboardEleve(
        eleveId: string, 
        etablissementId: string,
        anneeScolaireId: string
    ) {
        const [incidents, observations, sanctions, felicitations] = await Promise.all([
            this.getIncidentsByEleve(eleveId, etablissementId, anneeScolaireId),
            this.getObservationsByEleve(eleveId, etablissementId, anneeScolaireId),
            this.sanctionRepo.find({ where: { eleveId, etablissementId, anneeScolaireId } }),
            this.getFelicitationsByEleve(eleveId, etablissementId, anneeScolaireId),
        ]);

        return {
            incidents: incidents.data.length,
            incidentsGraves: incidents.data.filter(i => i.gravite === 'GRAVE' || i.gravite === 'TRES_GRAVE').length,
            observations: observations.data.length,
            observationsPositives: observations.data.filter(o => o.type === 'POSITIVE').length,
            sanctions: sanctions.length,
            sanctionsEnCours: sanctions.filter(s => s.statut === 'EN_COURS').length,
            felicitations: felicitations.data.length,
            pointsGamification: observations.data.reduce((sum, o) => sum + o.pointsImpact, 0) +
                                felicitations.data.reduce((sum, f) => sum + f.pointsBonus, 0),
        };
    }
}

export const suiviEleveService = new SuiviEleveService();
