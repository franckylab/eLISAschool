/**
 * ==================================
 * eLISAschool - Service Heure de Cours
 * ==================================
 * Version: 1.2.0
 * Ajout typeCreneau (v1.2 — cohérence Template/Instance)
 */

import { Repository, Between, In, Not, EntityManager } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { HeureCours, StatutEffectue, ContratPersonnel, StatutContrat } from '../entities';
import { CreateHeureCoursDto, UpdateHeureCoursDto, QueryHeureCoursDto, GenererHeuresCoursFromEdtDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { CreneauHoraire, JourSemaine, StatutCreneau, TypeCreneau, PreferenceEmploiDuTemps } from '@modules/emploi-du-temps/entities';
import { jourFerieService, formatDateLocal } from '@modules/emploi-du-temps/services/jour-ferie.service';
import { ClasseAnnee } from '@modules/classes/entities';
import { Matiere } from '@modules/matieres/entities';
import { MembrePersonnel, StatutPersonnel } from '@modules/personnel/entities';
import { personnelService } from './personnel.service';
import { CategorieFonction } from '../../../shared/constants/personnel.constants';
import { verifierOverlapHoraire } from '@modules/emploi-du-temps/services/conflit-commun.service';
import { conflitDetectionService } from '@modules/emploi-du-temps/services/conflit-detection.service';
import { AnneeScolaire, StatutAnneeScolaire } from '@modules/annees-scolaires/entities';
import { Request } from 'express';

// ─── Synchronisation créneau → instances (grill-me 2026-08-03) ───

export type TypeConflitInstance = 'ENSEIGNANT' | 'CLASSE' | 'SALLE';

export interface ConflitPropagation {
    date: string;
    type: TypeConflitInstance;
    message: string;
}

export interface RapportPropagation {
    instancesQuiSuivent: number;
    instancesInchangees: number;
    conflits: ConflitPropagation[];
}

export interface ChangementsPropagation {
    jour?: JourSemaine;
    heureDebut?: string;
    heureFin?: string;
    salleId?: string | null;
    typeCreneau?: TypeCreneau;
}

export class HeureCoursService {
    private repo: Repository<HeureCours>;

    constructor() {
        this.repo = AppDataSource.getRepository(HeureCours);
    }

    async create(
        dto: CreateHeureCoursDto,
        etablissementId: string,
        createurId?: string,
        req?: Request
    ): Promise<HeureCours> {
        await this.verifierEnseignant(dto.enseignantId, etablissementId);
        await this.verifierClasseAnnee(dto.classeAnneeId, etablissementId);
        await this.verifierMatiere(dto.matiereId, etablissementId);

        const conflits = await this.verifierConflitsInstance(
            {
                enseignantId: dto.enseignantId,
                classeAnneeId: dto.classeAnneeId,
                salleId: dto.salleId,
                date: dto.date,
                heureDebut: dto.heureDebut,
                heureFin: dto.heureFin,
                etablissementId,
            },
        );
        if (conflits.length > 0) {
            throw new AppError(
                conflits.map(c => c.message).join('; '),
                409,
                'CRENEAU_CONFLIT',
                true,
                { conflits },
            );
        }

        const heureCours = new HeureCours();
        Object.assign(heureCours, dto, {
            statutEffectue: (dto.statutEffectue as StatutEffectue) || StatutEffectue.PLANIFIE,
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

    private async verifierEnseignant(enseignantId: string, etablissementId: string): Promise<void> {
        const membreRepo = AppDataSource.getRepository(MembrePersonnel);
        const membre = await membreRepo.findOne({ where: { id: enseignantId, etablissementId } });
        if (!membre) {
            throw new AppError('Membre du personnel introuvable dans cet établissement', 400, 'ENSEIGNANT_NOT_FOUND');
        }
        if (membre.statut !== StatutPersonnel.ACTIF) {
            throw new AppError('Ce membre du personnel n\'est pas actif', 400, 'ENSEIGNANT_INACTIF');
        }
        const contratRepo = AppDataSource.getRepository(ContratPersonnel);
        const contratActif = await contratRepo.findOne({
            where: { membrePersonnelId: enseignantId, etablissementId, statut: StatutContrat.ACTIF },
        });
        if (!contratActif) {
            throw new AppError('Ce membre du personnel n\'a pas de contrat actif', 400, 'ENSEIGNANT_SANS_CONTRAT_ACTIF');
        }
        const categories = await personnelService.deriverCategories([enseignantId]);
        const info = categories.get(enseignantId);
        if (info?.categorie !== CategorieFonction.ENSEIGNANT) {
            throw new AppError('Ce membre du personnel n\'est pas de catégorie enseignant', 400, 'MEMBRE_NON_ENSEIGNANT');
        }
    }

    private async verifierClasseAnnee(classeAnneeId: string, etablissementId: string): Promise<void> {
        const repo = AppDataSource.getRepository(ClasseAnnee);
        const found = await repo.findOne({ where: { id: classeAnneeId, etablissementId } });
        if (!found) {
            throw new AppError('Classe (année) introuvable dans cet établissement', 400, 'CLASSE_ANNEE_NOT_IN_TENANT');
        }
    }

    private async verifierMatiere(matiereId: string, etablissementId: string): Promise<void> {
        const repo = AppDataSource.getRepository(Matiere);
        const found = await repo.findOne({ where: { id: matiereId, etablissementId } });
        if (!found) {
            throw new AppError('Matière introuvable dans cet établissement', 400, 'MATIERE_NOT_IN_TENANT');
        }
    }

    /**
     * Vérifie les conflits d'une instance de cours sur une date précise.
     * Axes : enseignant (+ co-enseignants), classe, salle — contre les autres HeureCours
     * (hors ANNULE, hors exclusions). Vérification complète utilisée par la création,
     * la modification et la propagation créneau → instances.
     * Public : utilisée aussi par materialiserInstances (P0-3).
     */
    async verifierConflitsInstance(
        params: {
            enseignantId: string;
            classeAnneeId: string;
            salleId?: string | null;
            date: string;
            heureDebut: string;
            heureFin: string;
            etablissementId: string;
        },
        excludeIds: string[] = [],
    ): Promise<ConflitPropagation[]> {
        const { enseignantId, classeAnneeId, salleId, date, heureDebut, heureFin, etablissementId } = params;

        const qb = this.repo
            .createQueryBuilder('hc')
            .leftJoinAndSelect('hc.affectationMatiere', 'am')
            .where('hc.etablissementId = :etablissementId', { etablissementId })
            .andWhere('hc.date = :date', { date })
            .andWhere('hc.statutEffectue != :annule', { annule: StatutEffectue.ANNULE });

        if (excludeIds.length > 0) {
            qb.andWhere('hc.id NOT IN (:...excludeIds)', { excludeIds });
        }

        const coursDuJour = await qb.getMany();
        const conflits: ConflitPropagation[] = [];

        for (const cours of coursDuJour) {
            const overlap = verifierOverlapHoraire(
                cours.heureDebut,
                cours.heureFin,
                heureDebut,
                heureFin,
            );
            if (!overlap) continue;

            const coEnseignants = cours.affectationMatiere?.coEnseignantIds ?? [];
            const conflitEnseignant =
                cours.enseignantId === enseignantId ||
                (cours.enseignantId !== enseignantId && coEnseignants.includes(enseignantId));

            if (conflitEnseignant) {
                conflits.push({
                    date,
                    type: 'ENSEIGNANT',
                    message: `L'enseignant a déjà un cours de ${cours.heureDebut} à ${cours.heureFin} ce jour-là`,
                });
            }
            if (cours.classeAnneeId === classeAnneeId) {
                conflits.push({
                    date,
                    type: 'CLASSE',
                    message: `La classe a déjà un cours de ${cours.heureDebut} à ${cours.heureFin} ce jour-là`,
                });
            }
            if (salleId && cours.salleId === salleId) {
                conflits.push({
                    date,
                    type: 'SALLE',
                    message: `La salle est déjà occupée de ${cours.heureDebut} à ${cours.heureFin} ce jour-là`,
                });
            }
        }

        return conflits;
    }

    /**
     * Propage une modification de créneau aux instances futures PLANIFIE (frontière temporelle).
     *
     * Règles (grill-me 2026-08-03) :
     *  - Seules les instances PLANIFIE avec date >= aujourd'hui suivent (Q4).
     *  - Les instances pointées (EFFECTUE/ANNULE/REMPLACE) et passées sont figées.
     *  - Chaque instance est re-vérifiée en conflit sur SA date précise (Q5).
     *  - Mode strict (force=false) : conflit → 409 CONFLITS_PROPAGATION avec rapport, AUCUNE écriture.
     *  - Mode force : les instances en conflit sont exclues et comptées dans instancesInchangees.
     *  - dryRun : calcule sans écrire (pré-validation par l'appelant).
     */
    async propagerModificationCreneau(
        creneau: CreneauHoraire,
        changements: ChangementsPropagation,
        etablissementId: string,
        options?: {
            force?: boolean;
            dryRun?: boolean;
            createurId?: string;
            req?: Request;
            excludeInstanceIds?: string[];
            /** P0-2 : manager transactionnel pour atomicité */
            manager?: EntityManager;
        },
    ): Promise<RapportPropagation> {
        const mgr = options?.manager ?? this.repo.manager;
        const aujourdhui = new Date();
        const aujourdhuiStr = this.dateToString(aujourdhui);
        const rapport: RapportPropagation = { instancesQuiSuivent: 0, instancesInchangees: 0, conflits: [] };

        const instances = await mgr.find(HeureCours, {
            where: {
                creneauId: creneau.id,
                etablissementId,
                statutEffectue: StatutEffectue.PLANIFIE,
            },
            order: { date: 'ASC' },
        });

        const excludes = new Set(options?.excludeInstanceIds ?? []);
        const cibles: HeureCours[] = [];

        // Passe 1 : calcul des cibles + vérification des conflits (aucune écriture)
        for (const instance of instances) {
            if (excludes.has(instance.id)) {
                rapport.instancesInchangees++;
                continue;
            }

            const dateStr = this.dateToString(instance.date);
            if (dateStr < aujourdhuiStr) {
                rapport.instancesInchangees++;
                continue;
            }

            let nouvelleDate = instance.date;
            if (changements.jour) {
                const monday = this.lundiDeSemaine(instance.date);
                nouvelleDate = new Date(monday);
                nouvelleDate.setDate(monday.getDate() + (this.jourVersIndex(changements.jour) - 1));
            }

            const nouvelleHeureDebut = changements.heureDebut ?? instance.heureDebut;
            const nouvelleHeureFin = changements.heureFin ?? instance.heureFin;
            const nouvelleSalleId = changements.salleId !== undefined ? changements.salleId : instance.salleId;
            const nouveauType = changements.typeCreneau ?? instance.typeCreneau;

            const rienNeChange =
                this.dateToString(nouvelleDate) === dateStr &&
                nouvelleHeureDebut === instance.heureDebut &&
                nouvelleHeureFin === instance.heureFin &&
                nouvelleSalleId === (instance.salleId ?? null) &&
                nouveauType === instance.typeCreneau;

            if (rienNeChange) {
                rapport.instancesInchangees++;
                continue;
            }

            const conflits = await this.verifierConflitsInstance(
                {
                    enseignantId: instance.enseignantId,
                    classeAnneeId: instance.classeAnneeId,
                    salleId: nouvelleSalleId,
                    date: this.dateToString(nouvelleDate),
                    heureDebut: nouvelleHeureDebut,
                    heureFin: nouvelleHeureFin,
                    etablissementId,
                },
                [instance.id],
            );

            if (conflits.length > 0) {
                rapport.conflits.push(...conflits);
                rapport.instancesInchangees++;
                continue;
            }

            if (options?.dryRun) {
                rapport.instancesQuiSuivent++;
                continue;
            }

            instance.date = nouvelleDate;
            instance.heureDebut = nouvelleHeureDebut;
            instance.heureFin = nouvelleHeureFin;
            if (changements.salleId !== undefined) {
                (instance as { salleId?: string | null }).salleId = nouvelleSalleId;
            }
            if (changements.typeCreneau !== undefined) {
                instance.typeCreneau = nouveauType;
            }

            // Traçabilité : motif de propagation dans commentaire
            const motifParts: string[] = [];
            if (changements.jour) motifParts.push(`jour→${changements.jour}`);
            if (changements.heureDebut) motifParts.push(`début→${changements.heureDebut}`);
            if (changements.heureFin) motifParts.push(`fin→${changements.heureFin}`);
            if (changements.salleId !== undefined) motifParts.push(`salle→${changements.salleId || '∅'}`);
            if (changements.typeCreneau) motifParts.push(`type→${changements.typeCreneau}`);
            const motif = `Propagé(${creneau.id.substring(0, 8)}): ${motifParts.join(', ')}`;
            instance.commentaire = [instance.commentaire, motif].filter(Boolean).join(' | ');

            cibles.push(instance);
        }

        if (rapport.conflits.length > 0 && !options?.force) {
            throw new AppError(
                `${rapport.conflits.length} instance(s) future(s) en conflit après propagation du créneau — utilisez le mode force pour exclure`,
                409,
                'CONFLITS_PROPAGATION',
                true,
                { rapport },
            );
        }

        // Passe 2 : application par lots (chunks de 50)
        if (!options?.dryRun && cibles.length > 0) {
            const CHUNK_SIZE = 50;
            for (let i = 0; i < cibles.length; i += CHUNK_SIZE) {
                await mgr.save(cibles.slice(i, i + CHUNK_SIZE));
            }
            rapport.instancesQuiSuivent = cibles.length;
        }

        if (rapport.instancesQuiSuivent > 0 && options?.createurId && !options?.dryRun) {
            await auditService.log({
                utilisateurId: options.createurId,
                action: AuditAction.HEURE_COURS_UPDATE,
                cible: 'HeureCours',
                cibleId: creneau.id,
                description: `Propagation créneau ${creneau.id}: ${rapport.instancesQuiSuivent} instance(s) mise(s) à jour, ${rapport.instancesInchangees} inchangée(s), ${rapport.conflits.length} en conflit`,
                nouvellesValeurs: changements,
                module: 'personnel',
                metadata: { creneauId: creneau.id, rapport },
            }, options.req);
        }

        return rapport;
    }

    /**
     * Annule les instances futures PLANIFIE liées à des créneaux (suppression de créneau,
     * régénération du plan). Les instances passées ou pointées restent intactes (Q2/Q4).
     */
    async annulerInstancesCreneaux(
        creneauIds: string[],
        etablissementId: string,
        options?: { motif?: string; createurId?: string; req?: Request; manager?: EntityManager },
    ): Promise<number> {
        if (creneauIds.length === 0) return 0;

        const mgr = options?.manager ?? this.repo.manager;
        const aujourdhuiStr = this.dateToString(new Date());

        // P1 (BUG 2) : chargement en une seule requête, puis UPDATE bulk
        const instances = await mgr.find(HeureCours, {
            where: {
                creneauId: In(creneauIds),
                etablissementId,
                statutEffectue: StatutEffectue.PLANIFIE,
            },
        });

        const idsAFiltrer = instances
            .filter(i => this.dateToString(i.date) >= aujourdhuiStr)
            .map(i => i.id);

        if (idsAFiltrer.length === 0) return 0;

        // UPDATE bulk (1 seule requête au lieu de N)
        const updateData: Record<string, unknown> = { statutEffectue: StatutEffectue.ANNULE };
        if (options?.motif) {
            updateData.commentaire = () => `COALESCE("heures_cours"."commentaire", '') || ' — ${options.motif!.replace(/'/g, "''")}'`;
        }

        await mgr.createQueryBuilder()
            .update(HeureCours)
            .set(updateData)
            .whereInIds(idsAFiltrer)
            .execute();

        const count = idsAFiltrer.length;

        if (count > 0 && options?.createurId) {
            await auditService.log({
                utilisateurId: options.createurId,
                action: AuditAction.HEURE_COURS_UPDATE,
                cible: 'HeureCours',
                cibleId: creneauIds.length === 1 ? creneauIds[0] : undefined,
                description: `${count} instance(s) annulée(s) suite à suppression de créneau(x)`,
                module: 'personnel',
                metadata: { creneauIds, instancesAnnulees: count },
            }, options.req);
        }

        return count;
    }

    /**
     * Q6-C : met à jour le créneau hebdo depuis une instance (case « aussi le créneau »),
     * puis propage aux autres instances futures. L'instance courante est exclue de la
     * propagation (elle a déjà été alignée par le PATCH lui-même).
     */
    private async appliquerModificationAuCreneau(
        heureCours: HeureCours,
        champs: UpdateHeureCoursDto,
        userId: string,
        etablissementId: string,
        req?: Request,
    ): Promise<RapportPropagation> {
        if (!heureCours.creneauId) {
            return { instancesQuiSuivent: 0, instancesInchangees: 0, conflits: [] };
        }

        const creneauRepo = AppDataSource.getRepository(CreneauHoraire);
        const creneau = await creneauRepo.findOne({
            where: { id: heureCours.creneauId, etablissementId },
            relations: ['affectationMatiere'],
        });
        if (!creneau) {
            throw new AppError('Créneau source introuvable', 404, 'CRENEAU_NOT_FOUND');
        }

        const date = champs.date ? new Date(champs.date) : heureCours.date;
        const jour = this.jourDepuisDate(date);
        if (!jour) {
            throw new AppError('La date cible ne correspond à aucun jour de la semaine (dimanche exclu)', 400, 'JOUR_INVALIDE');
        }

        const heureDebut = champs.heureDebut || heureCours.heureDebut;
        const heureFin = champs.heureFin || heureCours.heureFin;
        const salleId: string | null = champs.salleId !== undefined
            ? (champs.salleId ?? null)
            : (heureCours.salleId ?? null);

        // Vérification hebdo du créneau (contre les autres créneaux) — AVANT toute écriture
        const conflits = await conflitDetectionService.detecterConflits(
            {
                affectationMatiereId: creneau.affectationMatiereId,
                jour,
                heureDebut,
                heureFin,
                salleId: salleId || undefined,
                excludeCreneauId: creneau.id,
            },
            etablissementId,
        );
        const bloquants = conflits.filter(c => c.severite === 'BLOQUANT');
        if (bloquants.length > 0) {
            throw new AppError(
                bloquants.map(c => c.message).join('; '),
                409,
                'CONFLITS_CRENEAU',
            );
        }

        const typeCreneau = (champs.typeCreneau as TypeCreneau | undefined) || creneau.typeCreneau;
        Object.assign(creneau, {
            jour,
            heureDebut,
            heureFin,
            salleId: salleId || null,
            typeCreneau,
        });
        await creneauRepo.save(creneau);

        return this.propagerModificationCreneau(
            creneau,
            { jour, heureDebut, heureFin, salleId: salleId || null, typeCreneau },
            etablissementId,
            { force: true, createurId: userId, req, excludeInstanceIds: [heureCours.id] },
        );
    }

    private dateToString(d: Date | string): string {
        if (typeof d === 'string') return d.slice(0, 10);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    private toDate(d: Date | string): Date {
        if (typeof d === 'string') return new Date(`${d.slice(0, 10)}T00:00:00`);
        return new Date(d);
    }

    private lundiDeSemaine(date: Date | string): Date {
        const d = this.toDate(date);
        d.setHours(0, 0, 0, 0);
        const dayOfWeek = d.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        d.setDate(d.getDate() + diffToMonday);
        return d;
    }

    private jourVersIndex(jour: JourSemaine): number {
        const index: Record<JourSemaine, number> = {
            [JourSemaine.LUNDI]: 1,
            [JourSemaine.MARDI]: 2,
            [JourSemaine.MERCREDI]: 3,
            [JourSemaine.JEUDI]: 4,
            [JourSemaine.VENDREDI]: 5,
            [JourSemaine.SAMEDI]: 6,
        };
        return index[jour] ?? 1;
    }

    private jourDepuisDate(date: Date | string): JourSemaine | undefined {
        const d = this.toDate(date);
        const index: Record<number, JourSemaine> = {
            1: JourSemaine.LUNDI,
            2: JourSemaine.MARDI,
            3: JourSemaine.MERCREDI,
            4: JourSemaine.JEUDI,
            5: JourSemaine.VENDREDI,
            6: JourSemaine.SAMEDI,
        };
        return index[d.getDay()];
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
        req?: Request
    ): Promise<{ heureCours: HeureCours; rapport?: RapportPropagation }> {
        const heureCours = await this.findOne(id, etablissementId);

        const { mettreAJourCreneau, ...champs } = dto;

        const anciennesValeurs = {
            date: heureCours.date,
            heureDebut: heureCours.heureDebut,
            heureFin: heureCours.heureFin,
            statutEffectue: heureCours.statutEffectue,
        };

        const dateChange = dto.date ? { date: new Date(dto.date) } : {};

        Object.assign(heureCours, champs, dateChange);

        // Garde REMPLACE : un cours remplacé doit désigner un remplaçant actif
        if ((champs.statutEffectue as StatutEffectue | undefined) === StatutEffectue.REMPLACE) {
            const remplacantId = champs.remplacantId ?? heureCours.remplacantId;
            if (!remplacantId) {
                throw new AppError('Un cours remplacé doit désigner un remplaçant (remplacantId)', 400, 'REMPLACANT_REQUIS');
            }
            const remplacant = await AppDataSource.getRepository(MembrePersonnel).findOne({
                where: { id: remplacantId, etablissementId },
            });
            if (!remplacant || remplacant.statut !== StatutPersonnel.ACTIF) {
                throw new AppError('Le remplaçant doit être un membre actif de l\'établissement', 400, 'REMPLACANT_INVALIDE');
            }
        }

        // Vérification des conflits au niveau instance (enseignant + classe + salle, par date)
        if (champs.heureDebut || champs.heureFin || champs.date) {
            const conflits = await this.verifierConflitsInstance(
                {
                    enseignantId: heureCours.enseignantId,
                    classeAnneeId: heureCours.classeAnneeId,
                    salleId: heureCours.salleId,
                    date: dto.date ? this.dateToString(dto.date) : this.dateToString(heureCours.date),
                    heureDebut: champs.heureDebut || heureCours.heureDebut,
                    heureFin: champs.heureFin || heureCours.heureFin,
                    etablissementId,
                },
                [id],
            );
            if (conflits.length > 0) {
                throw new AppError(
                    conflits.map(c => c.message).join('; '),
                    409,
                    'CRENEAU_CONFLIT',
                    true,
                    { conflits },
                );
            }
        }

        // Sens inverse (Q6-C) : mise à jour du créneau hebdo + propagation aux autres instances
        let rapport: RapportPropagation | undefined;
        if (mettreAJourCreneau && heureCours.creneauId) {
            rapport = await this.appliquerModificationAuCreneau(
                heureCours,
                champs,
                userId,
                etablissementId,
                req,
            );
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
        return { heureCours, rapport };
    }

    async delete(id: string, userId: string, etablissementId: string, req?: Request): Promise<void> {
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
                date: Between(dateDebut, dateFin),
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
                date: Between(dateDebut, dateFin),
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
                date: Between(lundi, samedi),
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

    /**
     * Q7 — Matérialisation de la semaine courante à la semaine suivante
     * [lundi S, dimanche S+1], clampée aux bornes de l'année scolaire EN_COURS.
     * Utilisée par le Canal A (validation créneau) et le Canal B (cron).
     * Respecte toujours le flag genereAutomatiquement.
     */
    async materialiserSemainesCourantes(options: {
        etablissementId: string;
        creneauIds?: string[];
        classeAnneeId?: string;
        enseignantId?: string;
        createurId?: string;
        req?: Request;
    }): Promise<{ created: number; skipped: number }> {
        const { etablissementId, creneauIds, classeAnneeId, enseignantId, createurId, req } = options;

        const anneeRepo = AppDataSource.getRepository(AnneeScolaire);
        const annee = await anneeRepo.findOne({
            where: [
                { etablissementId, enCours: true },
                { etablissementId, statut: StatutAnneeScolaire.EN_COURS },
            ],
            order: { dateDebut: 'DESC' },
        });

        const lundi = this.lundiDeSemaine(new Date());
        const dimancheS1 = new Date(lundi);
        dimancheS1.setDate(lundi.getDate() + 13);

        if (annee) {
            const debut = this.toDate(annee.dateDebut);
            const fin = this.toDate(annee.dateFin);
            if (dimancheS1 < debut || lundi > fin) {
                logger.info(`[HeureCours] Matérialisation auto ignorée: hors année scolaire ${this.dateToString(annee.dateDebut)} → ${this.dateToString(annee.dateFin)}`);
                return { created: 0, skipped: 0 };
            }
            if (lundi < debut) lundi.setTime(debut.getTime());
            if (dimancheS1 > fin) dimancheS1.setTime(fin.getTime());
        }

        return this.materialiserInstances({
            etablissementId,
            creneauIds,
            classeAnneeId,
            enseignantId,
            dateDebut: lundi,
            dateFin: dimancheS1,
            periodeId: undefined,
            respecterFlagAuto: true,
            createurId,
            req,
        });
    }

    /**
     * Q7 — Coeur de matérialisation réutilisable.
     * Canal A (validation créneau) et Canal B (cron) l'appellent avec
     * `respecterFlagAuto: true` (seuls les créneaux genereAutomatiquement sont
     * matérialisés). La génération manuelle (genererHeuresCoursFromEdt) passe
     * `false` : elle matérialise tous les créneaux VALIDE, flag ou non.
     */
    async materialiserInstances(options: {
        etablissementId: string;
        enseignantId?: string;
        classeAnneeId?: string;
        creneauIds?: string[];
        dateDebut: Date | string;
        dateFin: Date | string;
        periodeId?: string;
        respecterFlagAuto?: boolean;
        createurId?: string;
        req?: Request;
    }): Promise<{ created: number; skipped: number }> {
        const {
            etablissementId,
            enseignantId,
            classeAnneeId,
            creneauIds,
            dateDebut,
            dateFin,
            periodeId,
            respecterFlagAuto = false,
            createurId,
            req,
        } = options;

        const dateD = new Date(dateDebut);
        const dateF = new Date(dateFin);

        const edtRepo = AppDataSource.getRepository(CreneauHoraire);
        const edtQuery = edtRepo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'm')
            .where('e.etablissementId = :etablissementId', { etablissementId })
            .andWhere('e.statut = :statut', { statut: StatutCreneau.VALIDE });

        if (enseignantId) {
            edtQuery.andWhere('am.enseignantId = :enseignantId', { enseignantId });
        }
        if (classeAnneeId) {
            edtQuery.andWhere('am.classeAnneeId = :classeAnneeId', { classeAnneeId });
        }
        if (creneauIds && creneauIds.length > 0) {
            edtQuery.andWhere('e.id IN (:...creneauIds)', { creneauIds });
        }
        if (respecterFlagAuto) {
            edtQuery.andWhere('e.genereAutomatiquement = true');
        }

        const edtSlots = await edtQuery.getMany();

        if (edtSlots.length === 0) {
            logger.info(`[HeureCours] Aucun créneau EDT matérialisable (enseignant=${enseignantId || '-'}, classe=${classeAnneeId || '-'}, creneaux=${creneauIds?.length || 0})`);
            return { created: 0, skipped: 0 };
        }

        // ─── Exclusion jours fériés (préférence EDT) ─────────
        let datesJFSet = new Set<string>();
        const prefRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);
        const prefs = await prefRepo.findOne({ where: { etablissementId } });
        const exclureJF = prefs?.exclureJoursFeries ?? true; // défaut: exclure

        if (exclureJF) {
            const jfList = await jourFerieService.findByPlageDates(
                formatDateLocal(dateD),
                formatDateLocal(dateF),
                etablissementId
            );
            for (const jf of jfList) {
                if (jf.estRecurrent && jf.mois && jf.jourMois) {
                    // Développer les récurrents en dates concrètes pour la plage
                    for (let annee = dateD.getFullYear(); annee <= dateF.getFullYear(); annee++) {
                        const d = new Date(annee, jf.mois - 1, jf.jourMois);
                        if (d >= dateD && d <= dateF) {
                            datesJFSet.add(formatDateLocal(d));
                        }
                    }
                } else if (jf.date) {
                    datesJFSet.add(formatDateLocal(new Date(jf.date + 'T00:00:00')));
                }
            }
            if (datesJFSet.size > 0) {
                logger.info(`[HeureCours] Exclusion JF activée : ${datesJFSet.size} jours fériés dans la plage`);
            }
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
        const batch: HeureCours[] = [];
        const CHUNK_SIZE = 50;

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

                // Exclusion jour férié
                const courseDateStr = formatDateLocal(courseDate);
                if (exclureJF && datesJFSet.has(courseDateStr)) {
                    skipped++;
                    continue;
                }

                const existing = await this.repo.findOne({
                    where: {
                        enseignantId: slot.affectationMatiere?.enseignantId,
                        date: courseDate,
                        heureDebut: slot.heureDebut,
                        creneauId: slot.id,
                    },
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                // P0-3 : Vérification complète des conflits (enseignant + classe + salle)
                // au lieu du seul conflit enseignant (ancien code partiel)
                const slotClasseAnneeId = slot.affectationMatiere?.classeAnneeId;
                const slotMatiereId = slot.affectationMatiere?.matiereId;
                const slotEnseignantId = slot.affectationMatiere?.enseignantId;
                if (!slotClasseAnneeId || !slotMatiereId || !slotEnseignantId) {
                    skipped++;
                    continue;
                }

                const dateStr = formatDateLocal(courseDate);
                const conflitsInstance = await this.verifierConflitsInstance(
                    {
                        enseignantId: slotEnseignantId,
                        classeAnneeId: slotClasseAnneeId,
                        salleId: slot.salleId,
                        date: dateStr,
                        heureDebut: slot.heureDebut,
                        heureFin: slot.heureFin,
                        etablissementId,
                    },
                );

                if (conflitsInstance.length > 0) {
                    logger.warn(
                        `[HeureCours] Conflit détecté à la matérialisation: ${slotEnseignantId} le ${dateStr} ${slot.heureDebut}-${slot.heureFin} — ${conflitsInstance.map(c => c.type).join(', ')} — créneau ignoré`,
                    );
                    skipped++;
                    continue;
                }

                const hc = this.repo.create({
                    enseignantId: slotEnseignantId,
                    classeAnneeId: slotClasseAnneeId,
                    matiereId: slotMatiereId,
                    periodeId: periodeId || slot.periodeId,
                    creneauId: slot.id,
                    salleId: slot.salleId,
                    typeCreneau: slot.typeCreneau,
                    date: courseDate,
                    heureDebut: slot.heureDebut,
                    heureFin: slot.heureFin,
                    statutEffectue: StatutEffectue.PLANIFIE,
                    etablissementId,
                });

                batch.push(hc);

                // Flush du batch par chunks pour éviter les requêtes individuelles
                if (batch.length >= CHUNK_SIZE) {
                    await this.repo.save(batch);
                    created += batch.length;
                    batch.length = 0;
                }
            }

            // Flush du batch restant en fin de semaine
            if (batch.length > 0) {
                await this.repo.save(batch);
                created += batch.length;
                batch.length = 0;
            }

            current.setDate(current.getDate() + 7);
        }

        logger.info(`[HeureCours] Matérialisation: ${created} créées, ${skipped} ignorées (enseignant=${enseignantId || '-'}, classe=${classeAnneeId || '-'}, creneaux=${creneauIds?.length || 0})`);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.HEURE_COURS_CREATE,
                cible: 'HeureCours',
                description: `Matérialisation HeureCours depuis EDT: ${created} créées, ${skipped} ignorées`,
                nouvellesValeurs: options,
                module: 'personnel',
            }, req);
        }

        return { created, skipped };
    }

    async genererHeuresCoursFromEdt(
        dto: GenererHeuresCoursFromEdtDto,
        etablissementId: string,
        createurId?: string,
        req?: Request
    ): Promise<{ created: number; skipped: number }> {
        const { enseignantId, classeAnneeId, dateDebut, dateFin, periodeId } = dto;
        return this.materialiserInstances({
            etablissementId,
            enseignantId,
            classeAnneeId,
            dateDebut,
            dateFin,
            periodeId,
            respecterFlagAuto: false,
            createurId,
            req,
        });
    }

    /**
     * Statistiques globales pour la page Heures de cours (établissement)
     */
    async getStatistiquesGlobales(
        etablissementId: string,
        filtres?: { enseignantId?: string; classeAnneeId?: string; periodeId?: string; dateDebut?: string; dateFin?: string },
    ): Promise<{
        totalHeures: number;
        heuresEffectuees: number;
        heuresAnnulees: number;
        heuresRemplacees: number;
        heuresPlanifiees: number;
        tauxEffectuation: number;
        tauxAnnulation: number;
        tauxRemplacement: number;
        volumeSemaine: number;
        volumeMois: number;
    }> {
        const qb = this.repo.createQueryBuilder('h')
            .where('h.etablissementId = :etablissementId', { etablissementId });

        if (filtres?.enseignantId) qb.andWhere('h.enseignantId = :enseignantId', { enseignantId: filtres.enseignantId });
        if (filtres?.classeAnneeId) qb.andWhere('h.classeAnneeId = :classeAnneeId', { classeAnneeId: filtres.classeAnneeId });
        if (filtres?.periodeId) qb.andWhere('h.periodeId = :periodeId', { periodeId: filtres.periodeId });
        if (filtres?.dateDebut) qb.andWhere('h.date >= :dateDebut', { dateDebut: filtres.dateDebut });
        if (filtres?.dateFin) qb.andWhere('h.date <= :dateFin', { dateFin: filtres.dateFin });

        const heures = await qb
            .select('h.statutEffectue', 'statut')
            .addSelect('COUNT(*)', 'count')
            .addSelect(`SUM(EXTRACT(EPOCH FROM (h."heureFin"::time - h."heureDebut"::time)) / 3600)`, 'heures')
            .groupBy('h.statutEffectue')
            .getRawMany();

        const stats: Record<string, { count: number; heures: number }> = {};
        let totalHeures = 0;
        for (const row of heures) {
            const h = parseFloat(row.heures) || 0;
            const c = parseInt(row.count, 10);
            stats[row.statut] = { count: c, heures: Math.round(h * 10) / 10 };
            totalHeures += h;
        }

        const effectuees = stats['EFFECTUE']?.heures || 0;
        const annulees = stats['ANNULE']?.heures || 0;
        const remplacees = stats['REMPLACE']?.heures || 0;
        const planifiees = stats['PLANIFIE']?.heures || 0;
        const total = totalHeures || 1;

        // Volume semaine courante
        const now = new Date();
        const lundi = new Date(now);
        lundi.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        const vendredi = new Date(lundi);
        vendredi.setDate(lundi.getDate() + 4);

        const volSemaine = await this.repo.createQueryBuilder('h')
            .where('h.etablissementId = :etablissementId', { etablissementId })
            .andWhere('h.date >= :lundi', { lundi: lundi.toISOString().split('T')[0] })
            .andWhere('h.date <= :vendredi', { vendredi: vendredi.toISOString().split('T')[0] })
            .select(`COALESCE(SUM(EXTRACT(EPOCH FROM (h."heureFin"::time - h."heureDebut"::time)) / 3600), 0)`, 'vol')
            .getRawOne();

        // Volume mois courant
        const debutMois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        const volMois = await this.repo.createQueryBuilder('h')
            .where('h.etablissementId = :etablissementId', { etablissementId })
            .andWhere('h.date >= :debutMois', { debutMois })
            .andWhere('h.date <= :finMois', { finMois })
            .select(`COALESCE(SUM(EXTRACT(EPOCH FROM (h."heureFin"::time - h."heureDebut"::time)) / 3600), 0)`, 'vol')
            .getRawOne();

        return {
            totalHeures: Math.round(totalHeures * 10) / 10,
            heuresEffectuees: effectuees,
            heuresAnnulees: annulees,
            heuresRemplacees: remplacees,
            heuresPlanifiees: planifiees,
            tauxEffectuation: Math.round((effectuees / total) * 100),
            tauxAnnulation: Math.round((annulees / total) * 100),
            tauxRemplacement: Math.round((remplacees / total) * 100),
            volumeSemaine: Math.round((parseFloat(volSemaine?.vol) || 0) * 10) / 10,
            volumeMois: Math.round((parseFloat(volMois?.vol) || 0) * 10) / 10,
        };
    }

    /**
     * Export CSV des heures de cours
     */
    async exportCSV(
        query: QueryHeureCoursDto,
        etablissementId: string,
    ): Promise<string> {
        const { items } = await this.findAll({ ...query, limit: 10000 } as QueryHeureCoursDto, etablissementId);

        const headers = ['Date', 'Heure début', 'Heure fin', 'Matière', 'Classe', 'Enseignant', 'Salle', 'Type', 'Statut', 'Commentaire'];
        const rows = items.map((h: any) => [
            h.date?.split('T')[0] || '',
            h.heureDebut || '',
            h.heureFin || '',
            h.matiere?.nom || '',
            h.classeAnnee?.classe?.nom || '',
            h.enseignant ? `${h.enseignant.nom} ${h.enseignant.prenom || ''}`.trim() : '',
            h.salle?.nom || '',
            h.typeCreneau || '',
            h.statutEffectue || '',
            (h.commentaire || '').replace(/"/g, '""'),
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
        return csv;
    }

    /**
     * Export HTML des heures de cours (formaté pour impression)
     */
    async exportHTML(
        query: QueryHeureCoursDto,
        etablissementId: string,
    ): Promise<string> {
        const { items } = await this.findAll({ ...query, limit: 10000 } as QueryHeureCoursDto, etablissementId);

        const rows = items.map((h: any) => {
            const date = h.date ? new Date(h.date).toLocaleDateString('fr-FR') : '';
            const matiere = h.matiere?.nom || '';
            const classe = h.classeAnnee?.classe?.nom || '';
            const enseignant = h.enseignant ? `${h.enseignant.prenom || ''} ${h.enseignant.nom || ''}`.trim() : '';
            const salle = h.salle?.nom || '';
            const type = h.typeCreneau || '';
            const statut = h.statutEffectue || '';
            return `<tr>
                <td>${date}</td><td>${h.heureDebut || ''} – ${h.heureFin || ''}</td>
                <td>${matiere}</td><td>${classe}</td><td>${enseignant}</td>
                <td>${salle}</td><td>${type}</td><td>${statut}</td>
            </tr>`;
        }).join('\n');

        return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Heures de cours</title>
<style>
body{font-family:system-ui,sans-serif;margin:2em;color:#1a1a1a}
h1{font-size:1.5em;margin-bottom:.5em}
table{width:100%;border-collapse:collapse;font-size:.85em}
th,td{border:1px solid #ddd;padding:.5em .75em;text-align:left}
th{background:#f5f5f5;font-weight:600}
tr:nth-child(even){background:#fafafa}
@media print{body{margin:1em}th{background:#eee}}
</style></head><body>
<h1>Heures de cours — Export</h1>
<p>Généré le ${new Date().toLocaleDateString('fr-FR')} — ${items.length} enregistrement(s)</p>
<table><thead><tr><th>Date</th><th>Heure</th><th>Matière</th><th>Classe</th><th>Enseignant</th><th>Salle</th><th>Type</th><th>Statut</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`;
    }
}

export const heureCoursService = new HeureCoursService();