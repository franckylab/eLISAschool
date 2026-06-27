/**
 * ==================================
 * eLISAschool - Service Périodes
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Periode, TypePeriode, StatutPeriode } from '../entities';
import { CreatePeriodeDto, UpdatePeriodeDto, CreateTypePeriodeDto } from '../dto';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class PeriodesService {
    private periodeRepo: Repository<Periode>;
    private typeRepo: Repository<TypePeriode>;

    constructor() {
        this.periodeRepo = AppDataSource.getRepository(Periode);
        this.typeRepo = AppDataSource.getRepository(TypePeriode);
    }

    // ==== TYPES ====

    async createType(dto: CreateTypePeriodeDto): Promise<TypePeriode> {
        const existing = await this.typeRepo.findOne({ where: { code: dto.code } });
        if (existing) throw new AppError('Code type période existe déjà', 409, 'TYPE_EXISTS');
        const type = this.typeRepo.create(dto);
        await this.typeRepo.save(type);
        return type;
    }

    async getTypes(): Promise<TypePeriode[]> {
        return this.typeRepo.find({ order: { nom: 'ASC' } });
    }

    // ==== PERIODES ====

    async create(dto: CreatePeriodeDto, etablissementId: string): Promise<Periode> {
        // 1. NOUVEAU: Vérifier la cohérence multi-tenant
        const anneesService = (await import('@modules/annees-scolaires/services')).anneesService;
        const annee = await anneesService.findOne(dto.anneeScolaireId);
        
        if (annee.etablissementId !== etablissementId) {
            throw new AppError(
                'L\'année scolaire n\'appartient pas à cet établissement',
                400,
                'ANNEE_ETABLISSEMENT_MISMATCH'
            );
        }

        // 2. Créer la période avec etablissementId
        const periode = this.periodeRepo.create({
            ...dto,
            dateDebut: new Date(dto.dateDebut),
            dateFin: new Date(dto.dateFin),
            etablissementId,  // ← NOUVEAU: isolation multi-tenant
        });
        await this.periodeRepo.save(periode);
        return periode;
    }

    async findAll(anneeId: string, etablissementId?: string): Promise<Periode[]> {
        const where: any = { anneeScolaireId: anneeId };
        
        // NOUVEAU: Filtrage multi-tenant si etablissementId fourni
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        return this.periodeRepo.find({
            where,
            relations: ['type'],
            order: { dateDebut: 'ASC', ordre: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Periode> {
        const periode = await this.periodeRepo.findOne({ where: { id }, relations: ['type'] });
        if (!periode) throw new AppError('Période non trouvée', 404, 'NOT_FOUND');
        return periode;
    }

    async update(id: string, dto: UpdatePeriodeDto, createurId?: string, etablissementId?: string): Promise<Periode> {
        const periode = await this.findOne(id);

        // Détecter si on demande la clôture
        const demandeCloture = dto.cloturee === true && !periode.cloturee;

        if (demandeCloture) {
            // Vérifier si la validation est requise
            const requireValidation = await getParamBoolean('periodes.require_validation', false);

            if (requireValidation && createurId) {
                // Ne pas clôturer immédiatement, créer un workflow
                periode.statut = StatutPeriode.EN_ATTENTE_CLOTURE;

                if (dto.dateDebut) dto.dateDebut = new Date(dto.dateDebut) as any;
                if (dto.dateFin) dto.dateFin = new Date(dto.dateFin) as any;

                // Appliquer les autres modifications mais pas cloturee
                const { cloturee, ...autresModifs } = dto;
                Object.assign(periode, autresModifs);
                await this.periodeRepo.save(periode);

                // Créer le workflow de validation
                await validationWorkflowService.createWorkflow({
                    module: 'periodes',
                    entiteId: periode.id,
                    entiteType: 'Periode',
                    niveauxRequis: 2,
                    etablissementId,
                    commentaire: `Demande de clôture: ${periode.nom}`,
                }, createurId);

                logger.info(`[${etablissementId}] Clôture période en attente de validation: ${periode.nom}`);
                return periode;
            }
        }

        if (dto.dateDebut) dto.dateDebut = new Date(dto.dateDebut) as any;
        if (dto.dateFin) dto.dateFin = new Date(dto.dateFin) as any;

        Object.assign(periode, dto);

        // Si clôture effective, mettre le statut CLOTUREE
        if (dto.cloturee === true) {
            periode.statut = StatutPeriode.CLOTUREE;
        }

        await this.periodeRepo.save(periode);
        return periode;
    }

    async delete(id: string): Promise<void> {
        const periode = await this.findOne(id);
        if (periode.cloturee) throw new AppError('Impossible de supprimer une période clôturée', 400, 'CANNOT_DELETE_CLOSED');
        await this.periodeRepo.remove(periode);
        logger.info(`Période supprimée: ${id}`);
    }
}

export const periodesService = new PeriodesService();
