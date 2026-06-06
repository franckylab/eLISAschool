/**
 * ==================================
 * eLISAschool - Service Élèves
 * ==================================
 */

import { Repository } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { Eleve } from '../entities';
import { CreateEleveDto, UpdateEleveDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { getParamNumber, getParamBoolean, getParam } from '@modules/configuration/helpers/config-helpers';

export class ElevesService {
    private repo: Repository<Eleve>;

    constructor() {
        this.repo = AppDataSource.getRepository(Eleve);
    }

    private async getElevesParams() {
        return {
            maxStudentsPerClass: await getParamNumber('eleves.max_students_per_class', 45),
            autoGenerateMatricule: await getParamBoolean('eleves.auto_generate_matricule', true),
            matriculePrefix: await getParam<string>('eleves.matricule_prefix', 'ELV'),
            requirePhoto: await getParamBoolean('eleves.require_photo', false),
            requireMedicalRecord: await getParamBoolean('eleves.require_medical_record', false),
            defaultAnneeScolaire: await getParam<string>('eleves.default_annee_scolaire', ''),
        };
    }

    async create(dto: CreateEleveDto, etablissementId?: string, req?: Request): Promise<Eleve> {
        const params = await this.getElevesParams();

        // Vérification du matricule existant
        const existing = await this.repo.findOne({ where: { matricule: dto.matricule } });
        if (existing) throw new AppError('Matricule élève déjà existant', 409, 'MATRICULE_EXISTS');

        const userUsed = await this.repo.findOne({ where: { utilisateurId: dto.utilisateurId } });
        if (userUsed) throw new AppError('Cet utilisateur est déjà lié à un dossier élève', 409, 'USER_ALREADY_LINKED');

        // Validation photo si requise
        if (params.requirePhoto && !dto.photoUrl) {
            throw new AppError(
                'La photo de l\'élève est obligatoire',
                400,
                'PHOTO_REQUIRED'
            );
        }

        // Validation dossier médical si requis
        if (params.requireMedicalRecord && !dto.antecedentsMedicaux) {
            throw new AppError(
                'Le dossier médical est obligatoire',
                400,
                'MEDICAL_RECORD_REQUIRED'
            );
        }

        const eleve = this.repo.create({
            ...dto,
            dateNaissance: new Date(dto.dateNaissance),
            dateInscription: dto.dateInscription ? new Date(dto.dateInscription) : new Date(),
            etablissementId,
        });

        await this.repo.save(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_CREATE,
                cible: 'Eleve',
                cibleId: eleve.id,
                description: `Création dossier élève: ${dto.matricule}`,
                nouvellesValeurs: dto,
                module: 'eleves',
            }, req);
        }
        
        logger.info(`Dossier élève créé: ${dto.matricule}`);
        return eleve;
    }

    async findAll(sousSysteme?: string, etablissementId?: string): Promise<Eleve[]> {
        const where: any = {};
        if (sousSysteme) where.sousSysteme = sousSysteme;
        if (etablissementId) where.etablissementId = etablissementId;

        return this.repo.find({
            where,
            relations: ['utilisateur'],
            order: { nomTuteur: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Eleve> {
        const eleve = await this.repo.findOne({ where: { id }, relations: ['utilisateur'] });
        if (!eleve) throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        return eleve;
    }

    async findByUserId(userId: string): Promise<Eleve | null> {
        return this.repo.findOne({ where: { utilisateurId: userId } });
    }

    async update(id: string, dto: UpdateEleveDto, req?: Request): Promise<Eleve> {
        const eleve = await this.findOne(id);
        const anciennesValeurs = {
            matricule: eleve.matricule,
            nomTuteur: eleve.nomTuteur,
            telephoneTuteur: eleve.telephoneTuteur,
        };

        if (dto.dateNaissance) dto.dateNaissance = new Date(dto.dateNaissance) as any;
        if (dto.dateInscription) dto.dateInscription = new Date(dto.dateInscription) as any;

        Object.assign(eleve, dto);
        await this.repo.save(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_UPDATE,
                cible: 'Eleve',
                cibleId: eleve.id,
                description: `Modification dossier élève: ${eleve.matricule}`,
                anciennesValeurs,
                nouvellesValeurs: dto,
                module: 'eleves',
            }, req);
        }
        
        return eleve;
    }

    async delete(id: string, req?: Request): Promise<void> {
        const eleve = await this.findOne(id);
        await this.repo.remove(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_DELETE,
                cible: 'Eleve',
                cibleId: id,
                description: `Suppression dossier élève: ${eleve.matricule}`,
                anciennesValeurs: { matricule: eleve.matricule },
                module: 'eleves',
                severity: 'WARNING' as any,
            }, req);
        }
        
        logger.info(`Dossier élève supprimé: ${id}`);
    }
}

export const elevesService = new ElevesService();
