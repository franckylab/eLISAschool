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
