/**
 * ==================================
 * eLISAschool - Service Heure de Cours
 * ==================================
 * Version: 1.1.0
 * Migration complète classeId → classeAnneeId (v4.0)
 */

import { Repository, Between, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { HeureCours, StatutEffectue, ContratPersonnel, StatutContrat } from '../entities';
import { CreateHeureCoursDto, UpdateHeureCoursDto, QueryHeureCoursDto, GenererHeuresCoursFromEdtDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { CreneauHoraire, JourSemaine } from '@modules/emploi-du-temps/entities';
import { ClasseAnnee } from '@modules/classes/entities';

export class HeureCoursService {
    private repo: Repository<HeureCours>;

    constructor() {
        this.repo = AppDataSource.getRepository(HeureCours);
    }

    async create(
        dto: CreateHeureCoursDto,
        etablissementId: string,
        createurId?: string,
        req?: any
    ): Promise<HeureCours> {
        await this.verifierConflitCreneau(dto);

        const heureCours = new HeureCours();
        Object.assign(heureCours, dto, {
            statutEffectue: dto.statutEffectue as any,
            date: new Date(dto.date),
            etablissementId,
        });

        await this.repo.save(heureCours);

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

    private async verifierConflitCreneau(dto: CreateHeureCoursDto): Promise<void> {
        const conflit = await this.repo.findOne({
            where: {
                enseignantId: dto.enseignantId,
                date: new Date(dto.date) as any,
                statutEffectue: { $not: StatutEffectue.ANNULE } as any,
            },
        });

        if (conflit) {
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

    private verifierOverlapHoraire(debut1: string, fin1: string, debut2: string, fin2: string): boolean {
        const toMinutes = (time: string): number => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
        return toMinutes(debut1) < toMinutes(fin2) && toMinutes(debut2) < toMinutes(fin1);
    }

    async findAll(query: QueryHeureCoursDto, etablissementId?: string): Promise<PaginatedResult<HeureCours>> {
        const { page, limit, search, enseignantId, classeAnneeId, matiereId, dateDebut, dateFin, statutEffectue } = query;

        const qb = this.repo
            .createQueryBuilder('h')
            .leftJoinAndSelect('h.enseignant', 'ens')
            .leftJoinAndSelect('h.classeAnnee', 'ca')
            .leftJoinAndSelect('ca.classe', 'c')
            .leftJoinAndSelect('h.matiere', 'm')
            .leftJoinAndSelect('h.creneau', 'creneau')
            .where('1=1');

        if (etablissementId) {
            qb.andWhere('h.etablissementId = :etablissementId', { etablissementId });
        }

        if (enseignantId) {
            qb.andWhere('h.enseignantId = :enseignantId', { enseignantId });
        }

        if (classeAnneeId) {
            qb.andWhere('h.classeAnneeId = :classeAnneeId', { classeAnneeId });
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

        const allowedFields = ['createdAt', 'date', 'heureDebut', 'statutEffectue'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'date';
        qb.orderBy(`h.${orderField}`, query.sortOrder);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findOne(id: string, etablissementId?: string): Promise<HeureCours> {
        const heureCours = await this.repo.findOne({
            where: { id, ...(etablissementId ? { etablissementId } : {}) },
            relations: ['enseignant', 'classeAnnee', 'classeAnnee.classe', 'matiere', 'periode', 'remplacant', 'creneau'],
        });

        if (!heureCours) {
            throw new AppError('Créneau cours non trouvé', 404, 'NOT_FOUND');
        }

        return heureCours;
    }

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

        if (dto.heureDebut || dto.heureFin || dto.date) {
            const conflitDto: CreateHeureCoursDto = {
                enseignantId: heureCours.enseignantId,
                classeAnneeId: heureCours.classeAnneeId,
                matiereId: heureCours.matiereId,
                date: (dto.date ? (dto.date as any as Date) : heureCours.date as Date).toISOString().split('T')[0],
                heureDebut: dto.heureDebut || heureCours.heureDebut,
                heureFin: dto.heureFin || heureCours.heureFin,
                statutEffectue: (dto.statutEffectue as any) || heureCours.statutEffectue || 'PLANIFIE',
            };
            await this.verifierConflitCreneau(conflitDto as CreateHeureCoursDto);
        }

        await this.repo.save(heureCours);

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

    async delete(id: string, userId: string, etablissementId: string, req?: any): Promise<void> {
        const heureCours = await this.findOne(id, etablissementId);
        await this.repo.remove(heureCours);

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

    async calculerVolumeHoraireHebdomadaire(
        enseignantId: string,
        dateDebut: Date,
        dateFin: Date,
        etablissementId: string,
        periodeId?: string
    ): Promise<{ totalHeures: number; heuresParSemaine: number; nbSemaines: number }> {
        const heures = await this.repo.find({
            where: {
                enseignantId,
                etablissementId,
                date: Between(dateDebut, dateFin) as any,
                statutEffectue: StatutEffectue.EFFECTUE,
            },
        });

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
        detailParMatiere?: Array<{ matiereNom: string; heures: number; tarifHoraire: number; montant: number }>;
    }> {
        const dateDebut = new Date(annee, mois - 1, 1);
        const dateFin = new Date(annee, mois, 0);

        const heures = await this.repo.find({
            where: {
                enseignantId,
                etablissementId,
                date: Between(dateDebut, dateFin) as any,
            },
            relations: ['matiere'],
        });

        const contratRepo = AppDataSource.getRepository(ContratPersonnel);
        const contratActif = await contratRepo.findOne({
            where: { membrePersonnelId: enseignantId, etablissementId, statut: StatutContrat.ACTIF },
        });
        const tarifHoraireContrat = contratActif?.tarifHoraire || 0;

        let heuresEffectuees = 0;
        let heuresPlanifiees = 0;
        let heuresAnnulees = 0;
        const matiereMap = new Map<string, { matiereNom: string; heures: number; tarifHoraire: number }>();

        const toMinutes = (time: string): number => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };

        for (const h of heures) {
            const duree = (toMinutes(h.heureFin) - toMinutes(h.heureDebut)) / 60;
            const matiereNom = h.matiere?.nom || '—';

            switch (h.statutEffectue) {
                case StatutEffectue.EFFECTUE: heuresEffectuees += duree; break;
                case StatutEffectue.PLANIFIE: heuresPlanifiees += duree; break;
                case StatutEffectue.ANNULE: heuresAnnulees += duree; break;
            }

            if (h.statutEffectue === StatutEffectue.EFFECTUE) {
                const existing = matiereMap.get(matiereNom);
                if (existing) {
                    existing.heures += duree;
                } else {
                    matiereMap.set(matiereNom, { matiereNom, heures: duree, tarifHoraire: tarifHoraireContrat });
                }
            }
        }

        const detailParMatiere = Array.from(matiereMap.values()).map(d => ({
            ...d,
            montant: +(d.heures * d.tarifHoraire).toFixed(2),
        }));

        return { mois, annee, heuresEffectuees, heuresPlanifiees, heuresAnnulees, nombreCours: heures.length, detailParMatiere };
    }

    async getEdtEnseignant(
        enseignantId: string,
        semaine: string,
        etablissementId: string,
        periodeId?: string
    ): Promise<{ semaine: string; jours: Record<string, HeureCours[]> }> {
        const dateRef = new Date(semaine);
        if (isNaN(dateRef.getTime())) {
            throw new AppError('Date de semaine invalide (format YYYY-MM-DD attendu)', 400, 'INVALID_DATE');
        }

        const dayOfWeek = dateRef.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const lundi = new Date(dateRef);
        lundi.setDate(dateRef.getDate() + diffToMonday);
        lundi.setHours(0, 0, 0, 0);
        const samedi = new Date(lundi);
        samedi.setDate(lundi.getDate() + 6);
        samedi.setHours(23, 59, 59, 999);

        const heures = await this.repo.find({
            where: {
                enseignantId,
                etablissementId,
                date: Between(lundi, samedi) as any,
            },
            relations: ['matiere', 'classeAnnee', 'classeAnnee.classe', 'salle', 'remplacant', 'creneau'],
            order: { date: 'ASC', heureDebut: 'ASC' },
        });

        const jours: Record<string, HeureCours[]> = {
            LUNDI: [], MARDI: [], MERCREDI: [], JEUDI: [], VENDREDI: [], SAMEDI: [],
        };

        const dayNames = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
        for (const h of heures) {
            const dayIndex = (h.date as Date).getDay();
            const dayName = dayNames[dayIndex];
            if (jours[dayName]) {
                jours[dayName].push(h);
            }
        }

        return { semaine: lundi.toISOString().split('T')[0], jours };
    }

    async genererHeuresCoursFromEdt(
        dto: GenererHeuresCoursFromEdtDto,
        etablissementId: string,
        createurId?: string,
        req?: any
    ): Promise<{ created: number; skipped: number }> {
        const { enseignantId, classeAnneeId, dateDebut, dateFin, periodeId } = dto;
        const dateD = new Date(dateDebut);
        const dateF = new Date(dateFin);

        const edtRepo = AppDataSource.getRepository(CreneauHoraire);
        const edtQuery = edtRepo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'm')
            .where('am.enseignantId = :enseignantId', { enseignantId })
            .andWhere('e.etablissementId = :etablissementId', { etablissementId })
            .andWhere('e.statut = :statut', { statut: 'VALIDE' });

        if (classeAnneeId) {
            edtQuery.andWhere('am.classeAnneeId = :classeAnneeId', { classeAnneeId });
        }

        const edtSlots = await edtQuery.getMany();

        if (edtSlots.length === 0) {
            logger.info(`Aucun créneau EDT trouvé pour l'enseignant ${enseignantId}`);
            return { created: 0, skipped: 0 };
        }

        const jourSemaineIndex: Record<string, number> = {
            [JourSemaine.LUNDI]: 1,
            [JourSemaine.MARDI]: 2,
            [JourSemaine.MERCREDI]: 3,
            [JourSemaine.JEUDI]: 4,
            [JourSemaine.VENDREDI]: 5,
            [JourSemaine.SAMEDI]: 6,
        };

        let created = 0;
        let skipped = 0;

        const current = new Date(dateD);
        const dayOfWeek = current.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        current.setDate(current.getDate() + diffToMonday);
        current.setHours(0, 0, 0, 0);

        while (current <= dateF) {
            const semaineStart = new Date(current);

            for (const slot of edtSlots) {
                const targetDayIndex = jourSemaineIndex[slot.jour];
                if (targetDayIndex === undefined) continue;

                const courseDate = new Date(semaineStart);
                courseDate.setDate(semaineStart.getDate() + (targetDayIndex - 1));

                if (courseDate < dateD || courseDate > dateF) continue;

                const existing = await this.repo.findOne({
                    where: {
                        enseignantId,
                        date: courseDate as any,
                        heureDebut: slot.heureDebut,
                        creneauId: slot.id,
                    },
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                const hc = this.repo.create({
                    enseignantId,
                    classeAnneeId: slot.affectationMatiere?.classeAnneeId || '',
                    matiereId: slot.affectationMatiere?.matiereId || slot.matiereId || '',
                    periodeId: periodeId || slot.periodeId,
                    creneauId: slot.id,
                    salleId: slot.salleId,
                    date: courseDate,
                    heureDebut: slot.heureDebut,
                    heureFin: slot.heureFin,
                    statutEffectue: StatutEffectue.PLANIFIE,
                    etablissementId,
                });

                await this.repo.save(hc);
                created++;
            }

            current.setDate(current.getDate() + 7);
        }

        logger.info(`HeureCours générés depuis EDT: ${created} créés, ${skipped} ignorés pour enseignant ${enseignantId}`);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.HEURE_COURS_CREATE,
                cible: 'HeureCours',
                description: `Génération HeureCours depuis EDT: ${created} créés, ${skipped} ignorés`,
                nouvellesValeurs: dto,
                module: 'personnel',
            }, req);
        }

        return { created, skipped };
    }
}

export const heureCoursService = new HeureCoursService();