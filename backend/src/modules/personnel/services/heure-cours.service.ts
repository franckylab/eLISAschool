/**
 * ==================================
 * eLISAschool - Service Heure de Cours
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { HeureCours, StatutEffectue } from '../entities';
import { CreateHeureCoursDto, UpdateHeureCoursDto, QueryHeureCoursDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class HeureCoursService {
    private repo: Repository<HeureCours>;

    constructor() {
        this.repo = AppDataSource.getRepository(HeureCours);
    }

    /**
     * Créer un nouveau créneau de cours avec vérification de conflits
     */
    async create(
        dto: CreateHeureCoursDto,
        etablissementId: string,
        createurId?: string,
        req?: any
    ): Promise<HeureCours> {
        // Vérifier les conflits de créneaux pour l'enseignant
        await this.verifierConflitCreneau(dto);

        const heureCours = this.repo.create({
            ...dto,
            statutEffectue: dto.statutEffectue as any,
            date: new Date(dto.date),
            etablissementId,
        });

        await this.repo.save(heureCours);

        // Audit
        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.HEURE_COURS_CREATE,
                cible: 'HeureCours',
                cibleId: heureCours.id,
                description: `Création créneau cours: ${dto.matiereId} le ${dto.date}`,
                nouvellesValeurs: dto,
                module: 'personnel',
            }, req);
        }

        logger.info(`Créneau cours créé: ${heureCours.id} pour enseignant ${dto.enseignantId}`);
        return heureCours;
    }

    /**
     * Vérifier qu'il n'y a pas de conflit de créneaux pour un enseignant
     */
    private async verifierConflitCreneau(dto: CreateHeureCoursDto): Promise<void> {
        const conflit = await this.repo.findOne({
            where: {
                enseignantId: dto.enseignantId,
                date: new Date(dto.date) as any,
                statutEffectue: { $not: StatutEffectue.ANNULE } as any,
            },
        });

        if (conflit) {
            // Vérifier overlap horaire
            const overlap = this.verifierOverlapHoraire(
                conflit.heureDebut,
                conflit.heureFin,
                dto.heureDebut,
                dto.heureFin
            );

            if (overlap) {
                throw new AppError(
                    `Conflit de créneau: l'enseignant a déjà un cours de ${conflit.heureDebut} à ${conflit.heureFin} ce jour-là`,
                    409,
                    'CRENEAU_CONFLIT'
                );
            }
        }
    }

    /**
     * Vérifier si deux créneaux horaires se superposent
     */
    private verifierOverlapHoraire(
        debut1: string,
        fin1: string,
        debut2: string,
        fin2: string
    ): boolean {
        const toMinutes = (time: string): number => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        const d1 = toMinutes(debut1);
        const f1 = toMinutes(fin1);
        const d2 = toMinutes(debut2);
        const f2 = toMinutes(fin2);

        return d1 < f2 && d2 < f1;
    }

    /**
     * Rechercher tous les créneaux avec pagination et filtres
     */
    async findAll(
        query: QueryHeureCoursDto,
        etablissementId?: string
    ): Promise<PaginatedResult<HeureCours>> {
        const { page, limit, search, enseignantId, classeId, matiereId, dateDebut, dateFin, statutEffectue } = query;

        const qb = this.repo
            .createQueryBuilder('h')
            .leftJoinAndSelect('h.enseignant', 'ens')
            .leftJoinAndSelect('h.classe', 'c')
            .leftJoinAndSelect('h.matiere', 'm')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('h.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres optionnels
        if (enseignantId) {
            qb.andWhere('h.enseignantId = :enseignantId', { enseignantId });
        }

        if (classeId) {
            qb.andWhere('h.classeId = :classeId', { classeId });
        }

        if (matiereId) {
            qb.andWhere('h.matiereId = :matiereId', { matiereId });
        }

        if (dateDebut) {
            qb.andWhere('h.date >= :dateDebut', { dateDebut: new Date(dateDebut) });
        }

        if (dateFin) {
            qb.andWhere('h.date <= :dateFin', { dateFin: new Date(dateFin) });
        }

        if (statutEffectue) {
            qb.andWhere('h.statutEffectue = :statutEffectue', { statutEffectue });
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'date', 'heureDebut', 'statutEffectue'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'date';
        qb.orderBy(`h.${orderField}`, query.sortOrder);

        // Pagination optimisée
        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    /**
     * Récupérer un créneau par son ID
     */
    async findOne(id: string, etablissementId?: string): Promise<HeureCours> {
        const heureCours = await this.repo.findOne({
            where: { id, ...(etablissementId ? { etablissementId } : {}) },
            relations: ['enseignant', 'classe', 'matiere', 'periode', 'remplacant'],
        });

        if (!heureCours) {
            throw new AppError('Créneau cours non trouvé', 404, 'NOT_FOUND');
        }

        return heureCours;
    }

    /**
     * Calculer le volume horaire hebdomadaire d'un enseignant
     */
    async calculerVolumeHoraireHebdomadaire(
        enseignantId: string,
        dateDebut: Date,
        dateFin: Date,
        etablissementId: string
    ): Promise<{
        totalHeures: number;
        heuresParSemaine: number;
        nbSemaines: number;
    }> {
        const heures = await this.repo.find({
            where: {
                enseignantId,
                etablissementId,
                date: { $gte: dateDebut, $lte: dateFin } as any,
                statutEffectue: StatutEffectue.EFFECTUE,
            },
        });

        // Calculer la durée totale en heures
        let totalMinutes = 0;
        for (const h of heures) {
            const toMinutes = (time: string): number => {
                const [hour, min] = time.split(':').map(Number);
                return hour * 60 + min;
            };
            totalMinutes += toMinutes(h.heureFin) - toMinutes(h.heureDebut);
        }

        const totalHeures = totalMinutes / 60;
        const nbSemaines = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const heuresParSemaine = nbSemaines > 0 ? totalHeures / nbSemaines : 0;

        return {
            totalHeures: Math.round(totalHeures * 100) / 100,
            heuresParSemaine: Math.round(heuresParSemaine * 100) / 100,
            nbSemaines,
        };
    }

    /**
     * Obtenir le résumé des heures d'un enseignant pour un mois donné
     */
    async getResumeMensuel(
        enseignantId: string,
        mois: number,
        annee: number,
        etablissementId: string
    ): Promise<{
        mois: number;
        annee: number;
        heuresEffectuees: number;
        heuresPlanifiees: number;
        heuresAnnulees: number;
        nombreCours: number;
    }> {
        const dateDebut = new Date(annee, mois - 1, 1);
        const dateFin = new Date(annee, mois, 0);

        const heures = await this.repo.find({
            where: {
                enseignantId,
                etablissementId,
                date: { $gte: dateDebut, $lte: dateFin } as any,
            },
        });

        let heuresEffectuees = 0;
        let heuresPlanifiees = 0;
        let heuresAnnulees = 0;

        const toMinutes = (time: string): number => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        for (const h of heures) {
            const duree = (toMinutes(h.heureFin) - toMinutes(h.heureDebut)) / 60;

            switch (h.statutEffectue) {
                case StatutEffectue.EFFECTUE:
                    heuresEffectuees += duree;
                    break;
                case StatutEffectue.PLANIFIE:
                    heuresPlanifiees += duree;
                    break;
                case StatutEffectue.ANNULE:
                    heuresAnnulees += duree;
                    break;
            }
        }

        return {
            mois,
            annee,
            heuresEffectuees: Math.round(heuresEffectuees * 100) / 100,
            heuresPlanifiees: Math.round(heuresPlanifiees * 100) / 100,
            heuresAnnulees: Math.round(heuresAnnulees * 100) / 100,
            nombreCours: heures.length,
        };
    }

    /**
     * Mettre à jour un créneau
     */
    async update(
        id: string,
        dto: UpdateHeureCoursDto,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<HeureCours> {
        const heureCours = await this.findOne(id, etablissementId);

        const anciennesValeurs = {
            date: heureCours.date,
            heureDebut: heureCours.heureDebut,
            heureFin: heureCours.heureFin,
            statutEffectue: heureCours.statutEffectue,
        };

        if (dto.date) dto.date = new Date(dto.date) as any;

        Object.assign(heureCours, dto);

        // Si on modifie l'horaire, vérifier les conflits
        if (dto.heureDebut || dto.heureFin || dto.date) {
            await this.verifierConflitCreneau({
                enseignantId: heureCours.enseignantId,
                classeId: heureCours.classeId,
                matiereId: heureCours.matiereId,
                date: dto.date ? (dto.date as any as Date).toISOString().split('T')[0] : (heureCours.date as Date).toISOString().split('T')[0],
                heureDebut: dto.heureDebut || heureCours.heureDebut,
                heureFin: dto.heureFin || heureCours.heureFin,
            } as CreateHeureCoursDto);
        }

        await this.repo.save(heureCours);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.HEURE_COURS_UPDATE,
            cible: 'HeureCours',
            cibleId: id,
            description: `Modification créneau cours ${id}`,
            anciennesValeurs,
            nouvellesValeurs: dto,
            module: 'personnel',
        }, req);

        logger.info(`Créneau cours modifié: ${id}`);
        return heureCours;
    }

    /**
     * Supprimer un créneau
     */
    async delete(id: string, userId: string, etablissementId: string, req?: any): Promise<void> {
        const heureCours = await this.findOne(id, etablissementId);
        await this.repo.remove(heureCours);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.HEURE_COURS_DELETE,
            cible: 'HeureCours',
            cibleId: id,
            description: `Suppression créneau cours ${id}`,
            module: 'personnel',
        }, req);

        logger.info(`Créneau cours supprimé: ${id}`);
    }
}

export const heureCoursService = new HeureCoursService();
