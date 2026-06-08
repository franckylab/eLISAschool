/**
 * eLISAschool - Module Personnel/RH
 * Service pour la gestion des absences du personnel
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { AbsencePersonnel } from '../entities/absence-personnel.entity';
import { CreateAbsenceDto, UpdateAbsenceDto, QueryAbsenceDto } from '../dto/absence-personnel.dto';

export class AbsencePersonnelService {
    private repo: Repository<AbsencePersonnel>;

    constructor() {
        this.repo = AppDataSource.getRepository(AbsencePersonnel);
    }

    async create(dto: CreateAbsenceDto, etablissementId: string, createurId?: string, req?: any) {
        const entity = this.repo.create({
            ...dto,
            type: dto.type as any,
            date: new Date(dto.date),
            etablissementId,
        });
        await this.repo.save(entity);

        if (createurId) {
            await auditService.logCRUD('CREATE', 'AbsencePersonnel', createurId, entity.id, undefined, dto as any, req);
        }

        logger.info(`Absence créée: ${entity.id}`);
        return entity;
    }

    async findAll(query: QueryAbsenceDto, etablissementId: string) {
        const qb = this.repo.createQueryBuilder('absence')
            .where('absence.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('absence.membrePersonnel', 'membrePersonnel')
            .orderBy('absence.date', 'DESC');

        // Filtres
        if (query.membrePersonnelId) {
            qb.andWhere('absence.membrePersonnelId = :membreId', { membreId: query.membrePersonnelId });
        }
        if (query.type) {
            qb.andWhere('absence.type = :type', { type: query.type });
        }
        if (query.statutJustification) {
            if (query.statutJustification === 'JUSTIFIEE') {
                qb.andWhere('absence.justification IS NOT NULL AND absence.justification != :empty', { empty: '' });
            } else if (query.statutJustification === 'NON_JUSTIFIEE') {
                qb.andWhere('(absence.justification IS NULL OR absence.justification = :empty)', { empty: '' });
            }
        }
        if (query.dateDebut) {
            qb.andWhere('absence.date >= :dateDebut', { dateDebut: query.dateDebut });
        }
        if (query.dateFin) {
            qb.andWhere('absence.date <= :dateFin', { dateFin: query.dateFin });
        }

        return paginateWithQueryBuilder(qb, query.page, query.limit);
    }

    async findOne(id: string, etablissementId: string) {
        const entity = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['membrePersonnel'],
        });

        if (!entity) {
            throw new AppError('Absence non trouvée', 404, 'NOT_FOUND');
        }

        return entity;
    }

    async update(id: string, dto: UpdateAbsenceDto, userId: string, etablissementId: string, req?: any) {
        const entity = await this.findOne(id, etablissementId);

        Object.assign(entity, dto);
        await this.repo.save(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.ABSENCE_PERSONNEL_UPDATE,
            cible: 'AbsencePersonnel',
            cibleId: id,
            description: `Modification absence ${id}`,
            nouvellesValeurs: dto,
            module: 'personnel',
        }, req);

        return entity;
    }

    async delete(id: string, userId: string, etablissementId: string, req?: any) {
        const entity = await this.findOne(id, etablissementId);

        await this.repo.remove(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.ABSENCE_PERSONNEL_DELETE,
            cible: 'AbsencePersonnel',
            cibleId: id,
            description: `Suppression absence ${id}`,
            module: 'personnel',
        }, req);

        return { success: true };
    }

    async justifier(id: string, justification: string, userId: string, etablissementId: string, req?: any) {
        const entity = await this.findOne(id, etablissementId);

        entity.justification = justification;
        await this.repo.save(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.ABSENCE_PERSONNEL_JUSTIFIER,
            cible: 'AbsencePersonnel',
            cibleId: id,
            description: `Justification absence ${id}`,
            nouvellesValeurs: { justification },
            module: 'personnel',
        }, req);

        return entity;
    }

    async getStatistiquesAssiduite(
        membreId: string,
        dateDebut: string,
        dateFin: string,
        etablissementId: string
    ) {
        const qb = this.repo.createQueryBuilder('absence')
            .where('absence.membrePersonnelId = :membreId', { membreId })
            .andWhere('absence.etablissementId = :etablissementId', { etablissementId })
            .andWhere('absence.date BETWEEN :dateDebut AND :dateFin', { dateDebut, dateFin });

        const absences = await qb.getMany();

        const totalAbsences = absences.length;
        const joursAbsents = absences.filter(a => a.type !== 'RETARD').length;
        const retards = absences.filter(a => a.type === 'RETARD').length;
        const absencesJustifiees = absences.filter(a => a.justification && a.justification.length > 0).length;
        const absencesNonJustifiees = totalAbsences - absencesJustifiees;

        // Calcul du taux de présence (simplifié)
        const joursOuvrables = this.calculerJoursOuvrables(dateDebut, dateFin);
        const tauxPresence = joursOuvrables > 0
            ? ((joursOuvrables - joursAbsents) / joursOuvrables) * 100
            : 100;

        return {
            totalAbsences,
            joursAbsents,
            retards,
            absencesJustifiees,
            absencesNonJustifiees,
            tauxPresence: Math.round(tauxPresence * 100) / 100,
        };
    }

    async getAbsencesNonJustifiees(jours: number, etablissementId: string) {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() - jours);

        const absences = await this.repo
            .createQueryBuilder('absence')
            .where('absence.etablissementId = :etablissementId', { etablissementId })
            .andWhere('(absence.justification IS NULL OR absence.justification = :empty)', { empty: '' })
            .andWhere('absence.date < :dateLimite', { dateLimite: dateLimite.toISOString().split('T')[0] })
            .leftJoinAndSelect('absence.membrePersonnel', 'membrePersonnel')
            .orderBy('absence.date', 'ASC')
            .getMany();

        return absences;
    }

    private calculerJoursOuvrables(dateDebut: string, dateFin: string): number {
        const debut = new Date(dateDebut);
        const fin = new Date(dateFin);
        let jours = 0;
        let current = new Date(debut);

        while (current <= fin) {
            const jourSemaine = current.getDay();
            if (jourSemaine !== 0 && jourSemaine !== 6) { // Exclure weekend
                jours++;
            }
            current.setDate(current.getDate() + 1);
        }

        return jours;
    }
}

export const absencePersonnelService = new AbsencePersonnelService();
