/**
 * ==================================
 * eLISAschool - Service Périodes (v5.0 — Niveaux de périodicité)
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Refonte v5.0 :
 * - Suppression de TYPE_HIERARCHY (codé en dur)
 * - Validation hiérarchique dynamique via NiveauPeriode.niveau
 * - Chargement de la relation niveau pour accès à l'usage
 * - Cohérence avec les niveaux configurables par établissement
 */

import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { StatutNote } from '@modules/notes/entities/note.entity';
import { Periode, PeriodeComposition, StatutPeriode, NiveauPeriode } from '../entities';
import {
    CreatePeriodeDto,
    UpdatePeriodeDto,
    CreateCompositionDto,
    UpdateCompositionDto,
    ReplaceCompositionsDto,
    GenererTemplateDto,
    CloturerPeriodeDto,
    ReouvrirPeriodeDto,
} from '../dto';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean, getParam, getParamNumber } from '@modules/configuration/utils/config.helper';
import { auditService, AuditAction } from '@modules/auth';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Request } from 'express';

/**
 * Résultat de la vérification des impacts avant clôture
 */
export interface ImpactsCloture {
    notes: { count: number; enAttenteValidation: number };
    bulletins: { count: number };
    peutCloturer: boolean;
    bloquant: boolean;
    message: string;
}

/**
 * Structure arborescente d'une période avec ses enfants (v5.0)
 */
export interface PeriodeArbre {
    id: string;
    nom: string;
    niveauId: string;
    niveau?: {
        id: string;
        niveau: number;
        label: string;
        usageCode: string;
    };
    dateDebut: Date;
    dateFin: Date;
    statut: StatutPeriode;
    anneeScolaireId: string;
    etablissementId: string;
    enfants: PeriodeArbre[];
    createdAt: Date;
    updatedAt: Date;
}

export class PeriodesService {
    private periodeRepo: Repository<Periode>;
    private compositionRepo: Repository<PeriodeComposition>;

    constructor() {
        this.periodeRepo = AppDataSource.getRepository(Periode);
        this.compositionRepo = AppDataSource.getRepository(PeriodeComposition);
    }

    // ================================================================
    // PÉRIODES — CRUD
    // ================================================================

    /**
     * Créer une période avec ses compositions optionnelles.
     * Vérifie anti-chevauchement avec les périodes de même niveau.
     */
    async create(dto: CreatePeriodeDto, etablissementId: string, utilisateurId?: string, req?: Request): Promise<Periode> {
        // Vérifier la cohérence multi-tenant
        const { anneesScolairesService } = await import('@modules/annees-scolaires/services');
        await anneesScolairesService.findOne(dto.anneeScolaireId, etablissementId);

        // Vérifier que le niveau existe pour cet établissement
        const { niveauxPeriodeService } = await import('./niveaux-periode.service');
        await niveauxPeriodeService.findOne(dto.niveauId, etablissementId);

        // Vérifier anti-chevauchement avec les périodes existantes de même niveau
        await this.verifierAntiChevauchement(
            dto.niveauId,
            dto.anneeScolaireId,
            new Date(dto.dateDebut),
            new Date(dto.dateFin),
            etablissementId,
        );

        const periode = this.periodeRepo.create({
            nom: dto.nom,
            niveauId: dto.niveauId,
            anneeScolaireId: dto.anneeScolaireId,
            dateDebut: new Date(dto.dateDebut),
            dateFin: new Date(dto.dateFin),
            etablissementId,
        });
        await this.periodeRepo.save(periode);

        // Créer les compositions si fournies
        if (dto.enfants && dto.enfants.length > 0) {
            for (const enfant of dto.enfants) {
                const composition = this.compositionRepo.create({
                    periodeParentId: periode.id,
                    periodeEnfantId: enfant.periodeId,
                    ordre: enfant.ordre,
                    poids: enfant.poids,
                });
                await this.compositionRepo.save(composition);
            }
        }

        await auditService.log({
            utilisateurId,
            action: AuditAction.PERIODE_CREATE,
            cible: 'Periode',
            cibleId: periode.id,
            description: `Période créée: ${periode.nom}`,
            nouvellesValeurs: dto as Record<string, unknown>,
            module: 'periodes',
            etablissementId,
            parentCible: 'AnneeScolaire',
            parentCibleId: periode.anneeScolaireId,
            metadata: { entiteLabel: periode.nom },
        }, req);

        logger.info(`[Periodes] Période créée: ${periode.nom} (niveau=${dto.niveauId}) — ${periode.id}`);
        return this.findOne(periode.id, etablissementId);
    }

    /**
     * Liste plate des périodes pour une année scolaire
     */
    async findAll(anneeId: string, etablissementId?: string): Promise<Periode[]> {
        const where: any = { anneeScolaireId: anneeId };
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        return this.periodeRepo.find({
            where,
            relations: ['niveau'],
            order: { dateDebut: 'ASC' },
        });
    }

    /**
     * Structure arborescente des périodes pour une année scolaire (v5.0)
     * Construit l'arbre complet à profondeur arbitraire en une seule passe :
     * 1. Charge toutes les périodes de l'année
     * 2. Charge toutes les compositions entre ces périodes
     * 3. Résout les enfants récursivement via une Map (pas de limite de profondeur)
     */
    async findAllArbre(anneeId: string, etablissementId?: string): Promise<PeriodeArbre[]> {
        const where: any = { anneeScolaireId: anneeId };
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        // 1. Toutes les périodes de l'année (tous niveaux confondus)
        const periodes = await this.periodeRepo.find({
            where,
            relations: ['niveau'],
            order: { dateDebut: 'ASC' },
        });

        const periodeIds = periodes.map(p => p.id);
        if (periodeIds.length === 0) return [];

        // 2. Toutes les compositions dont le parent appartient à cette année
        //    (couvre toutes les profondeurs : année→semestre, semestre→trimestre, etc.)
        const compositions = await this.compositionRepo.find({
            where: { periodeParentId: In(periodeIds) },
            order: { ordre: 'ASC' },
        });

        // 3. Construire une Map id→PeriodeArbre pour chaque période
        const nodesById = new Map<string, PeriodeArbre>();
        for (const periode of periodes) {
            nodesById.set(periode.id, {
                id: periode.id,
                nom: periode.nom,
                niveauId: periode.niveauId,
                niveau: periode.niveau ? {
                    id: periode.niveau.id,
                    niveau: periode.niveau.niveau,
                    label: periode.niveau.label,
                    usageCode: periode.niveau.usageCode,
                } : undefined,
                dateDebut: periode.dateDebut,
                dateFin: periode.dateFin,
                statut: periode.statut,
                anneeScolaireId: periode.anneeScolaireId,
                etablissementId: periode.etablissementId,
                enfants: [],
                createdAt: periode.createdAt,
                updatedAt: periode.updatedAt,
            });
        }

        // 4. Relier enfants aux parents via les compositions (toutes profondeurs)
        const enfantsIds = new Set<string>();
        for (const comp of compositions) {
            const parent = nodesById.get(comp.periodeParentId);
            const enfant = nodesById.get(comp.periodeEnfantId);
            if (parent && enfant) {
                parent.enfants.push(enfant);
                enfantsIds.add(enfant.id);
            }
        }

        // 5. Retourner uniquement les racines (jamais enfants)
        return periodes
            .filter(p => !enfantsIds.has(p.id))
            .map(p => nodesById.get(p.id)!);
    }

    /**
     * Période en cours pour l'établissement.
     * Déterminée par :
     * 1. Année scolaire active (enCours=true)
     * 2. Niveau hiérarchique configuré (periodes.niveau_affichage_courant)
     * 3. Période avec dateDebut <= now <= dateFin et statut OUVERTE
     */
    async findActiveByYear(anneeScolaireId: string, etablissementId: string): Promise<Periode | null> {
        const niveauParam = await getParamNumber('periodes.niveau_affichage_courant', {
            defaultValue: 1,
            etablissementId,
        });

        const { niveauxPeriodeService } = await import('./niveaux-periode.service');
        let niveau: NiveauPeriode;
        try {
            niveau = await niveauxPeriodeService.findByNiveau(niveauParam, etablissementId);
        } catch {
            return null;
        }

        const now = new Date();
        const periode = await this.periodeRepo.findOne({
            where: {
                anneeScolaireId,
                niveauId: niveau.id,
                etablissementId,
                dateDebut: LessThanOrEqual(now),
                dateFin: MoreThanOrEqual(now),
                statut: StatutPeriode.OUVERTE,
            },
            relations: ['niveau', 'anneeScolaire'],
        });

        return periode || null;
    }

    async findActive(etablissementId: string): Promise<Periode | null> {
        const { anneesScolairesService } = await import('@modules/annees-scolaires/services');
        const anneeActive = await anneesScolairesService.findActive(etablissementId);
        if (!anneeActive) return null;

        const niveauParam = await getParamNumber('periodes.niveau_affichage_courant', {
            defaultValue: 1,
            etablissementId,
        });

        const { niveauxPeriodeService } = await import('./niveaux-periode.service');
        let niveau: NiveauPeriode;
        try {
            niveau = await niveauxPeriodeService.findByNiveau(niveauParam, etablissementId);
        } catch {
            return null;
        }

        const now = new Date();
        const periode = await this.periodeRepo.findOne({
            where: {
                anneeScolaireId: anneeActive.id,
                niveauId: niveau.id,
                etablissementId,
                dateDebut: LessThanOrEqual(now),
                dateFin: MoreThanOrEqual(now),
                statut: StatutPeriode.OUVERTE,
            },
            relations: ['niveau', 'anneeScolaire'],
        });

        return periode || null;
    }

    /**
     * Détail d'une période avec ses compositions
     */
    async findOne(id: string, etablissementId?: string): Promise<Periode> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;

        const periode = await this.periodeRepo.findOne({
            where,
            relations: ['niveau', 'anneeScolaire', 'compositionsEnfants', 'compositionsEnfants.periodeEnfant'],
        });
        if (!periode) throw new AppError('Période non trouvée', 404, 'NOT_FOUND');
        return periode;
    }

    async update(id: string, dto: UpdatePeriodeDto, etablissementId?: string, utilisateurId?: string, req?: Request): Promise<Periode> {
        const periode = await this.findOne(id, etablissementId);

        if (periode.statut === StatutPeriode.CLOTUREE) {
            const lockOnCloture = await getParamBoolean('periodes.lock_on_cloture', { defaultValue: true, etablissementId });
            if (lockOnCloture) {
                throw new AppError('Impossible de modifier une période clôturée', 400, 'PERIODE_CLOTUREE_IMMUTABLE');
            }
        }

        if (dto.dateDebut) dto.dateDebut = new Date(dto.dateDebut) as any;
        if (dto.dateFin) dto.dateFin = new Date(dto.dateFin) as any;

        // Vérifier anti-chevauchement si les dates ou le niveau changent
        if ((dto.dateDebut || dto.dateFin || dto.niveauId) && etablissementId) {
            const newDebut = dto.dateDebut ? new Date(dto.dateDebut as any) : periode.dateDebut;
            const newFin = dto.dateFin ? new Date(dto.dateFin as any) : periode.dateFin;
            const newNiveauId = dto.niveauId || periode.niveauId;

            await this.verifierAntiChevauchement(
                newNiveauId,
                periode.anneeScolaireId,
                newDebut,
                newFin,
                etablissementId,
                id, // exclure la période en cours de modification
            );
        }

        const snapshotAvant: Record<string, unknown> = {};
        for (const cle of Object.keys(dto)) {
            snapshotAvant[cle] = (periode as unknown as Record<string, unknown>)[cle];
        }

        Object.assign(periode, dto);
        await this.periodeRepo.save(periode);

        await auditService.log({
            utilisateurId,
            action: AuditAction.PERIODE_UPDATE,
            cible: 'Periode',
            cibleId: periode.id,
            description: `Période modifiée: ${periode.nom}`,
            anciennesValeurs: snapshotAvant,
            nouvellesValeurs: dto as Record<string, unknown>,
            module: 'periodes',
            etablissementId,
            parentCible: 'AnneeScolaire',
            parentCibleId: periode.anneeScolaireId,
            metadata: { entiteLabel: periode.nom },
        }, req);

        return this.findOne(id, etablissementId);
    }

    async delete(id: string, etablissementId?: string, utilisateurId?: string, req?: Request): Promise<void> {
        const periode = await this.findOne(id, etablissementId);

        if (periode.statut === StatutPeriode.CLOTUREE) {
            throw new AppError('Impossible de supprimer une période clôturée', 400, 'CANNOT_DELETE_CLOSED');
        }
        if (periode.statut === StatutPeriode.EN_ATTENTE_CLOTURE) {
            throw new AppError('Impossible de supprimer une période en attente de validation', 400, 'CANNOT_DELETE_PENDING');
        }
        if (periode.compositionsEnfants && periode.compositionsEnfants.length > 0) {
            throw new AppError('Impossible de supprimer une période parent. Supprimez d\'abord ses compositions.', 400, 'PERIODE_HAS_CHILDREN');
        }

        const nomPeriode = periode.nom;
        await this.periodeRepo.remove(periode);
        logger.info(`[Periodes] Période supprimée: ${nomPeriode} (${id})`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.PERIODE_DELETE,
            cible: 'Periode',
            cibleId: id,
            description: `Période supprimée: ${nomPeriode}`,
            module: 'periodes',
            etablissementId,
            parentCible: 'AnneeScolaire',
            parentCibleId: periode.anneeScolaireId,
            metadata: { entiteLabel: nomPeriode },
        }, req);
    }

    // ================================================================
    // COMPOSITIONS — Gestion de la hiérarchie
    // ================================================================

    async ajouterComposition(dto: CreateCompositionDto, etablissementId: string): Promise<PeriodeComposition> {
        const parent = await this.findOne(dto.periodeParentId, etablissementId);
        const enfant = await this.periodeRepo.findOne({ where: { id: dto.periodeEnfantId }, relations: ['niveau'] });
        if (!enfant) throw new AppError('Période enfant non trouvée', 404, 'ENFANT_NOT_FOUND');

        if (parent.id === enfant.id) {
            throw new AppError('Une période ne peut pas être son propre enfant', 400, 'SELF_REFERENCE');
        }

        // Validation hybride : niveau enfant < niveau parent
        if (parent.niveau && enfant.niveau) {
            if (enfant.niveau.niveau >= parent.niveau.niveau) {
                throw new AppError(
                    `Le niveau « ${enfant.niveau.label} » doit être inférieur à « ${parent.niveau.label} »`,
                    400,
                    'NIVEAU_INCOMPATIBLE',
                );
            }
            if (enfant.niveau.usageCode === 'ANNEE') {
                throw new AppError('Un niveau avec l\'usage "ANNEE" ne peut pas être enfant', 400, 'ANNEE_CANNOT_BE_CHILD');
            }
        }

        const existing = await this.compositionRepo.findOne({
            where: { periodeParentId: dto.periodeParentId, periodeEnfantId: dto.periodeEnfantId },
        });
        if (existing) {
            throw new AppError('Cette composition existe déjà', 409, 'COMPOSITION_EXISTS');
        }

        const composition = this.compositionRepo.create({
            periodeParentId: dto.periodeParentId,
            periodeEnfantId: dto.periodeEnfantId,
            ordre: dto.ordre,
            poids: dto.poids,
        });
        await this.compositionRepo.save(composition);

        logger.info(`[Periodes] Composition ajoutée: ${parent.nom} → ${enfant.nom} (poids=${dto.poids})`);
        return composition;
    }

    async updateComposition(compositionId: string, dto: UpdateCompositionDto): Promise<PeriodeComposition> {
        const composition = await this.compositionRepo.findOne({ where: { id: compositionId } });
        if (!composition) throw new AppError('Composition non trouvée', 404, 'NOT_FOUND');

        Object.assign(composition, dto);
        await this.compositionRepo.save(composition);
        return composition;
    }

    async retirerComposition(compositionId: string): Promise<void> {
        const composition = await this.compositionRepo.findOne({ where: { id: compositionId } });
        if (!composition) throw new AppError('Composition non trouvée', 404, 'NOT_FOUND');

        await this.compositionRepo.remove(composition);
        logger.info(`[Periodes] Composition supprimée: ${compositionId}`);
    }

    async getCompositions(periodeId: string): Promise<PeriodeComposition[]> {
        return this.compositionRepo.find({
            where: { periodeParentId: periodeId },
            relations: ['periodeEnfant', 'periodeEnfant.niveau'],
            order: { ordre: 'ASC' },
        });
    }

    /**
     * Retourne le nombre de notes saisies pour chaque enfant d'une période parent.
     * Utilisé pour afficher la progression de saisie dans l'UI.
     */
    async getProgressionEnfants(periodeId: string): Promise<{ id: string; noteCount: number }[]> {
        const compositions = await this.compositionRepo.find({
            where: { periodeParentId: periodeId },
            select: ['id', 'periodeEnfantId'],
        });

        if (compositions.length === 0) return [];

        const enfantIds = compositions.map(c => c.periodeEnfantId);

        const notesRepo = AppDataSource.getRepository('Note');
        const rawCounts = await notesRepo
            .createQueryBuilder('note')
            .select('note.periodeId', 'periodeId')
            .addSelect('COUNT(*)', 'count')
            .where('note.periodeId IN (:...ids)', { ids: enfantIds })
            .groupBy('note.periodeId')
            .getRawMany() as { periodeId: string; count: string }[];

        const countMap = new Map(rawCounts.map(r => [r.periodeId, parseInt(r.count, 10)]));

        return enfantIds.map(id => ({
            id,
            noteCount: countMap.get(id) || 0,
        }));
    }

    // ================================================================
    // ENFANTS DISPONIBLES — Pool filtré (validation hybride niveau + usage)
    // ================================================================

    /**
     * Retourne les périodes disponibles pour être enfants d'un parent donné.
     * Filtres : même année, même établissement, niveau inférieur, dates incluses, pas déjà enfant.
     */
    async getEnfantsDisponibles(periodeId: string, etablissementId: string): Promise<Periode[]> {
        const parent = await this.findOne(periodeId, etablissementId);

        if (!parent.niveau) {
            throw new AppError('Niveau de la période parent non chargé', 400, 'NIVEAU_NON_CHARGE');
        }

        const parentNiveau = parent.niveau.niveau;

        // Trouver les niveaux inférieurs
        const { niveauxPeriodeService } = await import('./niveaux-periode.service');
        const niveauxInférieurs = await niveauxPeriodeService.getNiveauxInferieurs(parentNiveau, etablissementId);

        // Filtrer les niveaux avec usage 'ANNEE' (racine)
        const niveauxEligibles = niveauxInférieurs.filter(n => n.usageCode !== 'ANNEE');

        if (niveauxEligibles.length === 0) return [];

        const niveauIds = niveauxEligibles.map(n => n.id);

        const compositionsActuelles = await this.compositionRepo.find({
            where: { periodeParentId: periodeId },
            select: ['periodeEnfantId'],
        });
        const idsExclus = compositionsActuelles.map(c => c.periodeEnfantId);

        const qb = this.periodeRepo.createQueryBuilder('p')
            .where('p.anneeScolaireId = :anneeId', { anneeId: parent.anneeScolaireId })
            .andWhere('p.etablissementId = :etabId', { etabId: etablissementId })
            .andWhere('p.niveauId IN (:...niveauIds)', { niveauIds })
            .andWhere('p.id != :parentId', { parentId: periodeId })
            .andWhere('p.dateDebut >= :parentDebut', { parentDebut: parent.dateDebut })
            .andWhere('p.dateFin <= :parentFin', { parentFin: parent.dateFin })
            .orderBy('p.dateDebut', 'ASC');

        if (idsExclus.length > 0) {
            qb.andWhere('p.id NOT IN (:...exclus)', { exclus: idsExclus });
        }

        return qb.getMany();
    }

    // ================================================================
    // COMPOSITIONS — Sauvegarde batch (remplacement atomique)
    // ================================================================

    async replaceCompositions(
        periodeId: string,
        dto: ReplaceCompositionsDto,
        etablissementId: string,
    ): Promise<PeriodeComposition[]> {
        const parent = await this.findOne(periodeId, etablissementId);

        if (!parent.niveau) {
            throw new AppError('Niveau de la période parent non chargé', 400, 'NIVEAU_NON_CHARGE');
        }

        const parentNiveau = parent.niveau.niveau;

        // Si pas d'enfants → supprimer toutes les compositions existantes
        if (dto.enfants.length === 0) {
            const existing = await this.compositionRepo.find({
                where: { periodeParentId: periodeId },
            });
            if (existing.length > 0) {
                await this.compositionRepo.remove(existing);
                logger.info(`[Periodes] Compositions de ${parent.nom} supprimées (batch vide)`);
            }
            return [];
        }

        // Récupérer tous les enfants candidats avec leurs niveaux
        const enfantIds = dto.enfants.map(e => e.periodeEnfantId);
        const enfants = await this.periodeRepo.find({
            where: { id: In(enfantIds) },
            relations: ['niveau'],
        });

        if (enfants.length !== enfantIds.length) {
            const foundIds = new Set(enfants.map(e => e.id));
            const missing = enfantIds.filter(id => !foundIds.has(id));
            throw new AppError(`Périodes enfants non trouvées: ${missing.length} ID(s) invalide(s)`, 400, 'ENFANTS_NOT_FOUND');
        }

        // Validation stricte de chaque enfant (hybride niveau + usage)
        for (const enfant of enfants) {
            if (enfant.anneeScolaireId !== parent.anneeScolaireId) {
                throw new AppError(`"${enfant.nom}" n'appartient pas à la même année scolaire`, 400, 'ANNEE_MISMATCH');
            }

            if (enfant.niveau) {
                if (enfant.niveau.niveau >= parentNiveau) {
                    throw new AppError(
                        `Niveau "${enfant.niveau.label}" incompatible comme enfant de "${parent.niveau.label}"`,
                        400,
                        'NIVEAU_INCOMPATIBLE',
                    );
                }
                if (enfant.niveau.usageCode === 'ANNEE') {
                    throw new AppError('Un niveau avec l\'usage "ANNEE" ne peut pas être enfant', 400, 'ANNEE_CANNOT_BE_CHILD');
                }
            }

            if (new Date(enfant.dateDebut) < new Date(parent.dateDebut) ||
                new Date(enfant.dateFin) > new Date(parent.dateFin)) {
                throw new AppError(`Dates de "${enfant.nom}" débordent de "${parent.nom}"`, 400, 'DATES_MISMATCH');
            }
        }

        // Détection de cycles
        for (const enfant of enfants) {
            const aCycle = await this.detecterCycle(enfant.id, periodeId);
            if (aCycle) {
                throw new AppError(
                    `Cycle détecté : "${enfant.nom}" contient déjà "${parent.nom}" dans sa hiérarchie`,
                    400,
                    'CYCLE_DETECTED',
                );
            }
        }

        // Vérifier non-chevauchement entre frères
        await this.verifierNonChevauchementFreres(enfantIds, periodeId, etablissementId);

        // Vérifier qu'aucun enfant n'est déjà enfant d'un AUTRE parent
        const autresParents = await this.periodeRepo.find({
            where: { anneeScolaireId: parent.anneeScolaireId, etablissementId },
            select: ['id'],
        });
        const autresIds = autresParents.map(p => p.id).filter(id => id !== periodeId);

        if (autresIds.length > 0) {
            const conflits = await this.compositionRepo.find({
                where: {
                    periodeEnfantId: In(enfantIds),
                    periodeParentId: In(autresIds),
                },
            });
            if (conflits.length > 0) {
                throw new AppError(
                    `${conflits.length} période(s) sont déjà enfants d'un autre parent`,
                    400,
                    'CHILDREN_ALREADY_ASSIGNED',
                );
            }
        }

        // Transaction atomique
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const existing = await this.compositionRepo.find({
                where: { periodeParentId: periodeId },
            });
            if (existing.length > 0) {
                await queryRunner.manager.remove(existing);
            }

            const nouvelles = dto.enfants.map(enf =>
                this.compositionRepo.create({
                    periodeParentId: periodeId,
                    periodeEnfantId: enf.periodeEnfantId,
                    ordre: enf.ordre,
                    poids: enf.poids,
                }),
            );
            const created = await queryRunner.manager.save(nouvelles);
            await queryRunner.commitTransaction();

            logger.info(`[Periodes] Compositions de ${parent.nom} remplacées: ${created.length} enfant(s)`);
            return created;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private async detecterCycle(periodeId: string, ancestorId: string, profondeur = 0): Promise<boolean> {
        if (periodeId === ancestorId) return true;
        if (profondeur > 10) return false;

        const parentsCompositions = await this.compositionRepo.find({
            where: { periodeEnfantId: periodeId },
            select: ['periodeParentId'],
        });

        for (const comp of parentsCompositions) {
            // Ignorer la relation parent-enfant directe existante que l'on est en train de modifier/remplacer
            if (comp.periodeParentId === ancestorId && profondeur === 0) {
                continue;
            }
            if (comp.periodeParentId === ancestorId) return true;
            const hasCycle = await this.detecterCycle(comp.periodeParentId, ancestorId, profondeur + 1);
            if (hasCycle) return true;
        }

        return false;
    }

    // ================================================================
    // ANTI-CHEVAUCHEMENT — Détection de conflits de dates
    // ================================================================

    /**
     * Vérifier qu'une période ne chevauche pas une autre période de même niveau
     * dans la même année scolaire et le même établissement.
     * @param excludeId — ID de la période à exclure (pour les modifications)
     */
    private async verifierAntiChevauchement(
        niveauId: string,
        anneeScolaireId: string,
        dateDebut: Date,
        dateFin: Date,
        etablissementId: string,
        excludeId?: string,
    ): Promise<void> {
        if (dateDebut > dateFin) {
            throw new AppError('La date de début doit être antérieure à la date de fin', 400, 'DATES_INVALIDES');
        }

        const qb = this.periodeRepo.createQueryBuilder('p')
            .where('p.niveauId = :niveauId', { niveauId })
            .andWhere('p.anneeScolaireId = :anneeId', { anneeId: anneeScolaireId })
            .andWhere('p.etablissementId = :etabId', { etabId: etablissementId })
            // Chevauchement : A.debut <= B.fin AND A.fin >= B.debut
            .andWhere('p.dateDebut <= :newFin', { newFin: dateFin })
            .andWhere('p.dateFin >= :newDebut', { newDebut: dateDebut });

        if (excludeId) {
            qb.andWhere('p.id != :excludeId', { excludeId });
        }

        const conflit = await qb.getOne();
        if (conflit) {
            throw new AppError(
                `Chevauchement détecté avec « ${conflit.nom} » (${conflit.dateDebut instanceof Date ? conflit.dateDebut.toISOString().split('T')[0] : conflit.dateDebut} → ${conflit.dateFin instanceof Date ? conflit.dateFin.toISOString().split('T')[0] : conflit.dateFin})`,
                409,
                'CHEVAUCHEMENT_DETECTE',
            );
        }
    }

    /**
     * Vérifier que les périodes enfants d'un parent ne se chevauchent pas entre elles.
     */
    private async verifierNonChevauchementFreres(
        enfantIds: string[],
        periodeId: string,
        etablissementId: string,
    ): Promise<void> {
        if (enfantIds.length < 2) return;

        const enfants = await this.periodeRepo.find({
            where: { id: In(enfantIds) },
            order: { dateDebut: 'ASC' },
        });

        for (let i = 0; i < enfants.length - 1; i++) {
            const courant = enfants[i];
            const suivant = enfants[i + 1];

            if (courant.dateFin >= suivant.dateDebut) {
                throw new AppError(
                    `Chevauchement entre enfants « ${courant.nom} » et « ${suivant.nom} » de « ${(await this.findOne(periodeId, etablissementId)).nom} »`,
                    409,
                    'CHEVAUCHEMENT_FRERES_DETECTE',
                );
            }
        }
    }

    // ================================================================
    // TEMPLATES — Génération automatique (v5.0 — DÉLÉGUÉ)
    // ================================================================

    /**
     * @deprecated Utiliser TemplatesPeriodeService.genererDepuisTemplate() directement.
     */
    async genererDepuisTemplate(
        dto: GenererTemplateDto,
        etablissementId: string,
    ): Promise<Periode[]> {
        const { templatesPeriodeService } = await import('./templates-periode.service');
        return templatesPeriodeService.genererDepuisTemplate(
            {
                templateId: dto.template || '',
                anneeScolaireId: dto.anneeScolaireId,
                dateDebut: dto.dateDebut,
                dateFin: dto.dateFin,
            },
            etablissementId,
        );
    }

    // ================================================================
    // ACTIONS MÉTIER — CLÔTURE / RÉOUVERTURE
    // ================================================================

    async verifierImpacts(periodeId: string, etablissementId?: string): Promise<ImpactsCloture> {
        const periode = await this.findOne(periodeId, etablissementId);

        const notesRepo = AppDataSource.getRepository('Note');
        const notesCount = await notesRepo.count({ where: { periodeId: periode.id } });

        const notesEnAttente = await notesRepo.count({
            where: {
                periodeId: periode.id,
                statut: StatutNote.BROUILLON,
            },
        });

        const bulletinsRepo = AppDataSource.getRepository('Bulletin');
        const bulletinsCount = await bulletinsRepo.count({ where: { periodeId: periode.id } });

        const blockPending = await getParamBoolean('periodes.cloture_block_pending_validation', { defaultValue: true, etablissementId });

        const bloquant = blockPending && notesEnAttente > 0;
        const peutCloturer = !bloquant;

        let message = '';
        if (bloquant) {
            message = `${notesEnAttente} note(s) en attente de validation. Impossible de clôturer.`;
        } else if (notesCount > 0 || bulletinsCount > 0) {
            message = `${notesCount} note(s) et ${bulletinsCount} bulletin(s) liés à cette période. La clôture verrouillera toutes les modifications.`;
        } else {
            message = 'Aucune donnée liée. La clôture peut être effectuée sans impact.';
        }

        return {
            notes: { count: notesCount, enAttenteValidation: notesEnAttente },
            bulletins: { count: bulletinsCount },
            peutCloturer,
            bloquant,
            message,
        };
    }

    async cloturer(
        periodeId: string,
        dto: CloturerPeriodeDto,
        createurId: string | undefined,
        etablissementId: string,
    ): Promise<Periode> {
        const periode = await this.findOne(periodeId, etablissementId);

        if (periode.statut === StatutPeriode.CLOTUREE) {
            throw new AppError('Cette période est déjà clôturée', 400, 'ALREADY_CLOSED');
        }
        if (periode.statut === StatutPeriode.EN_ATTENTE_CLOTURE) {
            throw new AppError('Cette période est déjà en attente de validation', 400, 'ALREADY_PENDING');
        }

        const impacts = await this.verifierImpacts(periodeId, etablissementId);
        if (impacts.bloquant && !dto.forcer) {
            throw new AppError(impacts.message, 400, 'NOTES_PENDING_VALIDATION');
        }

        const modeCascade = await getParam('periodes.verrouillage_cascade', {
            defaultValue: 'false',
            etablissementId,
        });

        if (periode.compositionsEnfants && periode.compositionsEnfants.length > 0) {
            if (modeCascade === 'require_children') {
                for (const comp of periode.compositionsEnfants) {
                    if (comp.periodeEnfant && comp.periodeEnfant.statut !== StatutPeriode.CLOTUREE) {
                        throw new AppError(
                            `L'enfant "${comp.periodeEnfant.nom}" doit être clôturé avant le parent`,
                            400,
                            'CHILD_NOT_CLOSED',
                        );
                    }
                }
            }
        }

        const requireValidation = await getParamBoolean('periodes.require_validation', { defaultValue: false, etablissementId });

        if (requireValidation && createurId) {
            periode.statut = StatutPeriode.EN_ATTENTE_CLOTURE;
            await this.periodeRepo.save(periode);

            await validationWorkflowService.createWorkflow({
                module: 'periodes',
                entiteId: periode.id,
                entiteType: 'Periode',
                niveauxRequis: 2,
                etablissementId,
                commentaire: dto.commentaire || `Demande de clôture: ${periode.nom}`,
            }, createurId);

            logger.info(`[Periodes] Clôture en attente de validation: ${periode.nom} (${periodeId})`);
            return periode;
        }

        periode.statut = StatutPeriode.CLOTUREE;
        await this.periodeRepo.save(periode);

        if (modeCascade === 'cascade' && periode.compositionsEnfants && periode.compositionsEnfants.length > 0) {
            for (const comp of periode.compositionsEnfants) {
                if (comp.periodeEnfant && comp.periodeEnfant.statut === StatutPeriode.OUVERTE) {
                    comp.periodeEnfant.statut = StatutPeriode.CLOTUREE;
                    await this.periodeRepo.save(comp.periodeEnfant);
                    logger.info(`[Periodes] Cascade — enfant clôturé: ${comp.periodeEnfant.nom}`);
                }
            }
        }

        logger.info(`[Periodes] Période clôturée: ${periode.nom} (${periodeId})`);
        return this.findOne(periodeId, etablissementId);
    }

    async reouvrir(
        periodeId: string,
        dto: ReouvrirPeriodeDto,
        _utilisateurId: string | undefined,
        etablissementId: string,
    ): Promise<Periode> {
        const periode = await this.findOne(periodeId, etablissementId);

        if (periode.statut !== StatutPeriode.CLOTUREE) {
            throw new AppError('Seules les périodes clôturées peuvent être réouvertes', 400, 'NOT_CLOSED');
        }

        periode.statut = StatutPeriode.OUVERTE;
        await this.periodeRepo.save(periode);

        const modeCascade = await getParam('periodes.verrouillage_cascade', {
            defaultValue: 'false',
            etablissementId,
        });
        if (modeCascade === 'cascade' && periode.compositionsEnfants) {
            for (const comp of periode.compositionsEnfants) {
                if (comp.periodeEnfant && comp.periodeEnfant.statut === StatutPeriode.CLOTUREE) {
                    comp.periodeEnfant.statut = StatutPeriode.OUVERTE;
                    await this.periodeRepo.save(comp.periodeEnfant);
                }
            }
        }

        logger.info(`[Periodes] Période réouverte: ${periode.nom} — Motif: ${dto.motif}`);
        return this.findOne(periodeId, etablissementId);
    }
}

export const periodesService = new PeriodesService();
