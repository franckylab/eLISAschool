/**
 * ==================================
 * eLISAschool - Service Suivi-Personnel
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { IncidentPersonnel, EvaluationPersonnel } from '../entities';
import { CreateIncidentPersonnelDto, CreateEvaluationPersonnelDto } from '../dto';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';
import { getParamBoolean, getParamNumber } from '@modules/configuration/utils/config.helper';
import { gamificationService } from '@modules/gamification/services';
import { TypeActionPoints } from '@modules/gamification/entities';
import { scoringPersonnelService } from './scoring-personnel.service';

export class SuiviPersonnelService {
    private incidentRepo: Repository<IncidentPersonnel>;
    private evaluationRepo: Repository<EvaluationPersonnel>;

    constructor() {
        this.incidentRepo = AppDataSource.getRepository(IncidentPersonnel);
        this.evaluationRepo = AppDataSource.getRepository(EvaluationPersonnel);
    }

    async createIncident(dto: CreateIncidentPersonnelDto, declarantId: string, etablissementId: string, req?: Request): Promise<IncidentPersonnel> {
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
                action: AuditAction.INCIDENT_PERSONNEL_CREATE,
                cible: 'IncidentPersonnel',
                cibleId: incident.id,
                description: `Incident créé: ${dto.type} - Gravité: ${dto.gravite}`,
                nouvellesValeurs: dto,
                module: 'suivi-personnel',
            }, req);
        }
        
        logger.info(`[Suivi-Personnel] Incident créé: ${dto.membrePersonnelId} - Année: ${dto.anneeScolaireId}`);
        
        // SCORING: Attribution automatique de points négatifs pour incident
        try {
            const scoringActif = await getParamBoolean('scoring-personnel.actif', false);
            
            if (scoringActif) {
                const pointsParGravite: Record<string, number> = {
                    'MINEUR': -5,
                    'MODERE': -10,
                    'GRAVE': -20,
                    'TRES_GRAVE': -40,
                };
                
                const points = pointsParGravite[dto.gravite] || -5;
                
                await scoringPersonnelService.attribuerPoints({
                    membrePersonnelId: dto.membrePersonnelId,
                    points,
                    typeAction: 'COMPORTEMENT',
                    description: `Incident ${dto.gravite}: ${dto.type}`,
                    sourceModule: 'suivi-personnel',
                    sourceId: incident.id,
                    declencheurAutomatique: true,
                    categorieScore: 'comportement',
                }, dto.etablissementId, dto.anneeScolaireId, declarantId);
                
                logger.info(`[Suivi-Personnel] Scoring appliqué: ${points} points pour incident ${dto.gravite}`);
            }
        } catch (error) {
            logger.warn('[Suivi-Personnel] Échec attribution scoring (non bloquant)', error);
        }
        
        return incident;
    }

    async getIncidentsByPersonnel(
        membrePersonnelId: string, 
        etablissementId: string,
        anneeScolaireId: string,
        options?: { periodeId?: string; page?: number; limit?: number }
    ): Promise<{ data: IncidentPersonnel[]; total: number }> {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 20;
        const skip = (page - 1) * limit;
        
        const where: any = { membrePersonnelId, etablissementId, anneeScolaireId };
        if (options?.periodeId) {
            where.periodeId = options.periodeId; // ← NOUVEAU: filtre par trimestre
        }
        
        const [data, total] = await this.incidentRepo.findAndCount({
            where,
            relations: ['declarant', 'membrePersonnel', 'anneeScolaire', 'periode'], // ← NOUVEAU
            order: { dateIncident: 'DESC' },
            take: Math.min(limit, 100),
            skip,
        });
        return { data, total };
    }

    async createEvaluation(dto: CreateEvaluationPersonnelDto, evaluateurId: string, etablissementId: string, req?: Request): Promise<EvaluationPersonnel> {
        const evaluation = this.evaluationRepo.create({
            ...dto,
            evaluateurId,
            etablissementId,
        });
        await this.evaluationRepo.save(evaluation);
        
        // GAMIFICATION : Attribution automatique de points pour évaluation positive
        try {
            const gamificationActive = await getParamBoolean('suivi-personnel.gamification.actif', false);
            
            if (gamificationActive && dto.noteGlobale !== null && dto.noteGlobale !== undefined) {
                const seuil = await getParamNumber('suivi-personnel.gamification.seuil_evaluation_positive', 15);
                const points = await getParamNumber('suivi-personnel.gamification.points_evaluation_positive', 20);
                
                if (dto.noteGlobale >= seuil) {
                    await gamificationService.attribuerPoints({
                        utilisateurId: dto.membrePersonnelId,
                        points,
                        action: TypeActionPoints.EVALUATION_POSITIVE,
                        description: `Évaluation positive: ${dto.noteGlobale}/20 (seuil: ${seuil})`,
                        sourceModule: 'suivi-personnel',
                        sourceId: evaluation.id,
                    });
                    
                    logger.info(`[Suivi-Personnel] Points gamification attribués: ${points} pour évaluation ${dto.noteGlobale}/20`);
                }
            }
        } catch (error) {
            // Ne pas bloquer la création d'évaluation si la gamification échoue
            logger.warn('[Suivi-Personnel] Échec attribution points gamification (non bloquant)', error);
        }
        
        // Audit trail
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.EVALUATION_PERSONNEL_CREATE,
                cible: 'EvaluationPersonnel',
                cibleId: evaluation.id,
                description: `Évaluation créée: ${dto.periodicite} - Période: ${dto.periode}`,
                nouvellesValeurs: dto,
                module: 'suivi-personnel',
            }, req);
        }
        
        logger.info(`[Suivi-Personnel] Évaluation créée: ${dto.membrePersonnelId}`);
        
        // SCORING: Attribution automatique de points pour évaluation
        try {
            const scoringActif = await getParamBoolean('scoring-personnel.actif', false);
            
            if (scoringActif && dto.noteGlobale !== null && dto.noteGlobale !== undefined) {
                // Points basés sur la note (sur 20)
                const scoreSur100 = (dto.noteGlobale / 20) * 100;
                let points = 0;
                
                if (scoreSur100 >= 90) {
                    points = 30; // Excellent
                } else if (scoreSur100 >= 80) {
                    points = 20; // Très bon
                } else if (scoreSur100 >= 70) {
                    points = 10; // Bon
                } else if (scoreSur100 >= 60) {
                    points = 5; // Passable
                } else if (scoreSur100 < 50) {
                    points = -10; // Insuffisant
                }
                
                if (points !== 0) {
                    await scoringPersonnelService.attribuerPoints({
                        membrePersonnelId: dto.membrePersonnelId,
                        points,
                        typeAction: 'PERFORMANCE',
                        description: `Évaluation ${dto.periodicite}: ${dto.noteGlobale}/20 (${scoreSur100.toFixed(0)}%)`,
                        sourceModule: 'suivi-personnel',
                        sourceId: evaluation.id,
                        declencheurAutomatique: true,
                        categorieScore: 'performance',
                    }, dto.etablissementId, dto.anneeScolaireId, evaluateurId);
                    
                    logger.info(`[Suivi-Personnel] Scoring appliqué: ${points} points pour évaluation ${dto.noteGlobale}/20`);
                }
            }
        } catch (error) {
            logger.warn('[Suivi-Personnel] Échec attribution scoring (non bloquant)', error);
        }
        
        return evaluation;
    }

    async getEvaluationsByPersonnel(
        membrePersonnelId: string, 
        etablissementId: string,
        anneeScolaireId: string,
        options?: { periodeId?: string; page?: number; limit?: number }
    ): Promise<{ data: EvaluationPersonnel[]; total: number }> {
        const page = options?.page ?? 1;
        const limit = options?.limit ?? 20;
        const skip = (page - 1) * limit;
        
        const where: any = { membrePersonnelId, etablissementId, anneeScolaireId };
        if (options?.periodeId) {
            where.periodeId = options.periodeId; // ← NOUVEAU: filtre par trimestre
        }
        
        const [data, total] = await this.evaluationRepo.findAndCount({
            where,
            relations: ['evaluateur', 'anneeScolaire', 'periodeObj'],
            order: { periode: 'DESC' },
            take: Math.min(limit, 100),
            skip,
        });
        return { data, total };
    }

    async getDashboardPersonnel(membrePersonnelId: string, etablissementId: string) {
        const [incidents, evaluations] = await Promise.all([
            this.getIncidentsByPersonnel(membrePersonnelId, etablissementId),
            this.getEvaluationsByPersonnel(membrePersonnelId, etablissementId),
        ]);

        const moyenneNotes = evaluations
            .filter(e => e.noteGlobale !== null)
            .reduce((sum, e) => sum + (e.noteGlobale || 0), 0) / (evaluations.filter(e => e.noteGlobale !== null).length || 1);

        return {
            incidents: incidents.length,
            incidentsGraves: incidents.filter(i => i.gravite === 'GRAVE' || i.gravite === 'TRES_GRAVE').length,
            evaluations: evaluations.length,
            moyenneEvaluations: moyenneNotes,
            derniereEvaluation: evaluations[0] || null,
        };
    }
}

export const suiviPersonnelService = new SuiviPersonnelService();
