/**
 * ==================================
 * eLISAschool - Service Matières
 * ==================================
 * Version: 2.1.0
 * 
 * v2.1: Ajout findProgrammesPedagogiquesByMatiere
 */

import { Repository, ILike } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Matiere, GroupeMatiere, MatiereNiveau, AffectationMatiere, StatutAffectationMatiere, StatutMatiereNiveau, StatutValidationAffectation } from '../entities';
import { MembrePersonnel, ContratPersonnel, StatutContrat } from '@modules/personnel/entities';
import { personnelService } from '@modules/personnel/services/personnel.service';
import { CategorieFonction } from '../../../shared/constants/personnel.constants';
import { CreateMatiereDto, UpdateMatiereDto, CreateGroupeMatiereDto, CreateMatiereNiveauDto, UpdateMatiereNiveauDto, AffecterEnseignantDto, QueryMatieresDto, MoveAffectationDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { classesService } from '@modules/classes/services';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { coefficientResolverService } from './coefficient-resolver.service';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithRepository, PaginatedResult } from '@common/utils/pagination.util';

export class MatieresService {
    private matiereRepo: Repository<Matiere>;
    private groupeRepo: Repository<GroupeMatiere>;
    private niveauRepo: Repository<MatiereNiveau>;
    private affectationRepo: Repository<AffectationMatiere>;

    constructor() {
        this.matiereRepo = AppDataSource.getRepository(Matiere);
        this.groupeRepo = AppDataSource.getRepository(GroupeMatiere);
        this.niveauRepo = AppDataSource.getRepository(MatiereNiveau);
        this.affectationRepo = AppDataSource.getRepository(AffectationMatiere);
    }

    // ==== MATIERES ====

    async findOne(id: string, etablissementId: string): Promise<Matiere> {
        const matiere = await this.matiereRepo.findOne({
            where: { id, etablissementId },
        });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        return matiere;
    }

    async create(dto: CreateMatiereDto, etablissementId: string): Promise<Matiere> {
        const existing = await this.matiereRepo.findOne({ 
            where: { nom: dto.nom, etablissementId } 
        });
        if (existing) throw new AppError('Matière déjà existante dans cet établissement', 409, 'MATIERE_EXISTS');

        const matiere = this.matiereRepo.create({
            ...dto,
            etablissementId,
        });
        await this.matiereRepo.save(matiere);
        logger.info(`Matière créée: ${dto.nom} pour établissement ${etablissementId}`);
        return matiere;
    }

    async findAll(query: QueryMatieresDto = {} as QueryMatieresDto, etablissementId: string): Promise<PaginatedResult<Matiere>> {
        const { page = 1, limit = 20, actif, recherche, sousSysteme } = query;

        const baseWhere: any = { etablissementId };
        
        if (actif !== undefined) {
            baseWhere.actif = actif;
        }

        if (sousSysteme !== undefined) {
            baseWhere.sousSysteme = sousSysteme;
        }

        let where: any = baseWhere;

        if (recherche) {
            where = [
                { ...baseWhere, nom: ILike(`%${recherche}%`) },
                { ...baseWhere, code: ILike(`%${recherche}%`) },
            ];
        }

        return paginateWithRepository(this.matiereRepo, {
            where,
            order: { nom: 'ASC' },
            page,
            limit,
        });
    }

    async update(id: string, dto: UpdateMatiereDto, etablissementId: string): Promise<Matiere> {
        const matiere = await this.matiereRepo.findOne({ 
            where: { id, etablissementId } 
        });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        Object.assign(matiere, dto);
        await this.matiereRepo.save(matiere);
        return matiere;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const matiere = await this.matiereRepo.findOne({ 
            where: { id, etablissementId } 
        });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        await this.matiereRepo.remove(matiere);
        logger.info(`Matière supprimée: ${id} pour établissement ${etablissementId}`);
    }

    // ==== GROUPES ====

    async createGroupe(dto: CreateGroupeMatiereDto): Promise<GroupeMatiere> {
        const groupe = this.groupeRepo.create(dto);
        await this.groupeRepo.save(groupe);
        return groupe;
    }

    async findAllGroupes(page: number = 1, limit: number = 20): Promise<PaginatedResult<GroupeMatiere>> {
        return paginateWithRepository(this.groupeRepo, {
            order: { ordre: 'ASC' },
            page,
            limit,
        });
    }

    // ==== GRILLE MATIÈRE PAR NIVEAU (MatiereNiveau) ====
    // Source de vérité pour coefficient, barème, volumeHoraire, obligatoire

    async addMatiereToNiveau(dto: CreateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        // La contrainte d'unicité (matiereId, niveauId) est levée pour permettre
        // plusieurs MatiereNiveau (ex: un par programme). Chacun sera lié à
        // un unique programme via ProgrammeMatiere (contrainte d'unicité globale).
        const requireValidation = await getParamBoolean('matieres.require_validation', { defaultValue: false, etablissementId });

        const prog = this.niveauRepo.create({
            ...dto,
            statut: requireValidation
                ? StatutMatiereNiveau.EN_ATTENTE_VALIDATION
                : StatutMatiereNiveau.ACTIF,
        } as unknown as MatiereNiveau);
        await this.niveauRepo.save(prog);

        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: prog.id,
                entiteType: 'MatiereNiveau',
                niveauxRequis: 2,
                etablissementId,
            }, createurId);

            logger.info(`[${etablissementId}] Programme matière-niveau créé en attente de validation: ${prog.id}`);
        } else {
            logger.info(`Programme matière-niveau créé: ${prog.id}`);
        }

        return prog;
    }

    async getMatieresParNiveau(niveauId: string, etablissementId: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { niveauId, matiere: { etablissementId } },
            relations: ['matiere', 'groupe'],
            order: { groupe: { ordre: 'ASC' }, matiere: { nom: 'ASC' } }
        });
    }

    async getAllMatieresNiveaux(etablissementId?: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { matiere: { etablissementId } },
            relations: ['matiere', 'niveau', 'groupe', 'filiere'],
            order: { niveau: { ordre: 'ASC' }, matiere: { nom: 'ASC' } }
        });
    }

    async deleteMatiereNiveau(id: string, etablissementId: string): Promise<void> {
        const prog = await this.niveauRepo.findOne({ where: { id, matiere: { etablissementId } } });
        if (!prog) throw new AppError('Programme matière-niveau non trouvé', 404, 'NOT_FOUND');

        const affectationRepo = AppDataSource.getRepository(AffectationMatiere);
        const nbAffectations = await affectationRepo.createQueryBuilder('am')
            .innerJoin('am.classeAnnee', 'ca')
            .where('am.matiereId = :matiereId', { matiereId: prog.matiereId })
            .andWhere('ca.niveauId = :niveauId', { niveauId: prog.niveauId })
            .getCount();
        if (nbAffectations > 0) {
            throw new AppError(
                `Impossible de supprimer : ${nbAffectations} affectation(s) utilisent ce programme`,
                409,
                'PROGRAMME_AFFECTE'
            );
        }

        await this.niveauRepo.remove(prog);
        logger.info(`Programme matière-niveau supprimé: ${id}`);
    }

    async updateMatiereNiveau(id: string, dto: UpdateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        const prog = await this.niveauRepo.findOne({
            where: etablissementId ? { id, matiere: { etablissementId } } : { id },
        });
        if (!prog) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');
        Object.assign(prog, dto);
        await this.niveauRepo.save(prog);

        const requireValidation = await getParamBoolean('matieres.require_validation', { defaultValue: false, etablissementId });
        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: prog.id,
                entiteType: 'MatiereNiveau',
                niveauxRequis: 2,
                etablissementId,
                commentaire: 'Modification du programme',
            }, createurId);

            logger.info(`[${etablissementId}] Programme modifié avec workflow: ${id}`);
        }

        return prog;
    }

    // ==== AFFECTATIONS ENSEIGNANTS ====

    /**
     * Garde stricte : le membre doit exister dans le tenant, avoir un contrat
     * actif et être de catégorie dérivée ENSEIGNANT.
     */
    private async verifierEnseignant(enseignantId: string, etablissementId: string): Promise<void> {
        const membreRepo = AppDataSource.getRepository(MembrePersonnel);
        const membre = await membreRepo.findOne({ where: { id: enseignantId, etablissementId } });
        if (!membre) {
            throw new AppError('Membre du personnel introuvable dans cet établissement', 400, 'ENSEIGNANT_NOT_FOUND');
        }

        const contratRepo = AppDataSource.getRepository(ContratPersonnel);
        const contratActif = await contratRepo.findOne({
            where: { membrePersonnelId: enseignantId, statut: StatutContrat.ACTIF },
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

    async affecterEnseignant(dto: AffecterEnseignantDto, createurId: string, etablissementId?: string): Promise<AffectationMatiere> {
        if (!etablissementId) {
            throw new AppError('Établissement requis', 400, 'ETABLISSEMENT_REQUIRED');
        }

        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: dto.classeAnneeId },
            relations: ['classe', 'anneeScolaire']
        }) as any;

        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        const prog = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: classeAnnee.classe.niveauId }
        });
        if (!prog) throw new AppError('Cette matière n\'est pas au programme de ce niveau', 400, 'MATIERE_NOT_IN_LEVEL');

        await this.verifierEnseignant(dto.enseignantId, etablissementId);

        const requireValidation = await getParamBoolean('matieres.require_validation', { defaultValue: false, etablissementId });

        // Historisation : désactiver l'affectation active existante (remplacement d'enseignant)
        const existing = await this.affectationRepo.findOne({
            where: {
                matiereId: dto.matiereId,
                classeAnneeId: dto.classeAnneeId,
                etablissementId,
                actif: true,
            }
        });

        if (existing && existing.enseignantId === dto.enseignantId) {
            // Même enseignant : mise à jour simple des attributs
            if (dto.dateDebut) existing.dateDebut = new Date(dto.dateDebut);
            if (dto.dateFin !== undefined) existing.dateFin = new Date(dto.dateFin);
            if (dto.coefficient !== undefined) existing.coefficient = dto.coefficient;
            if (dto.coEnseignantIds !== undefined) existing.coEnseignantIds = dto.coEnseignantIds;
            await this.affectationRepo.save(existing);
            logger.info(`Affectation enseignant mise à jour: ${dto.enseignantId} → ${dto.matiereId}`);
            return existing;
        }

        if (existing) {
            existing.actif = false;
            existing.statut = StatutAffectationMatiere.INACTIVE;
            existing.dateFin = new Date();
            await this.affectationRepo.save(existing);
            logger.info(`Affectation historisée (remplacement): ${existing.enseignantId} → ${dto.matiereId} (classe ${dto.classeAnneeId})`);
        }

        const affectation = this.affectationRepo.create({
            matiereId: dto.matiereId,
            classeAnneeId: dto.classeAnneeId,
            enseignantId: dto.enseignantId,
            etablissementId,
            dateDebut: dto.dateDebut || new Date().toISOString().split('T')[0],
            ...(dto.dateFin ? { dateFin: dto.dateFin } : {}),
            ...(dto.coefficient !== undefined ? { coefficient: dto.coefficient } : {}),
            ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
            ...(dto.obligatoire !== undefined ? { obligatoire: dto.obligatoire } : {}),
            ...(dto.statutValidation !== undefined ? { statutValidation: dto.statutValidation as StatutValidationAffectation } : {}),
            statut: requireValidation
                ? StatutAffectationMatiere.EN_ATTENTE_VALIDATION
                : StatutAffectationMatiere.ACTIVE,
        });
        if (dto.coEnseignantIds !== undefined) {
            affectation.coEnseignantIds = dto.coEnseignantIds;
        }
        await this.affectationRepo.save(affectation);

        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: affectation.id,
                entiteType: 'AffectationMatiere',
                niveauxRequis: 2,
                etablissementId,
            }, createurId);

            logger.info(`[${etablissementId}] Affectation enseignant créée en attente de validation: ${dto.enseignantId} → ${dto.matiereId}`);
        } else {
            logger.info(`Affectation enseignant créée: ${dto.enseignantId} → ${dto.matiereId}`);
        }

        return affectation;
    }

    // ==== CRUD AFFECTATIONS ====

    async updateAffectation(id: string, dto: Partial<AffecterEnseignantDto>, etablissementId: string): Promise<AffectationMatiere> {
        const affectation = await this.affectationRepo.findOne({ where: { id, etablissementId } });
        if (!affectation) throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');

        if (dto.enseignantId && dto.enseignantId !== affectation.enseignantId) {
            await this.verifierEnseignant(dto.enseignantId, etablissementId);
            affectation.enseignantId = dto.enseignantId;
        }
        if (dto.dateDebut) affectation.dateDebut = new Date(dto.dateDebut);
        if (dto.dateFin !== undefined) affectation.dateFin = new Date(dto.dateFin);
        if (dto.actif !== undefined) affectation.actif = dto.actif;
        if (dto.coefficient !== undefined) affectation.coefficient = dto.coefficient;

        await this.affectationRepo.save(affectation);
        logger.info(`Affectation mise à jour: ${id}`);
        return affectation;
    }

    async deleteAffectation(id: string, etablissementId: string): Promise<void> {
        const affectation = await this.affectationRepo.findOne({ where: { id, etablissementId } });
        if (!affectation) throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
        // Désactivation (historisation) plutôt que hard delete : les notes et heures
        // de cours passées référencent cette affectation.
        affectation.actif = false;
        affectation.statut = StatutAffectationMatiere.INACTIVE;
        if (!affectation.dateFin) affectation.dateFin = new Date();
        await this.affectationRepo.save(affectation);
        logger.info(`Affectation désactivée: ${id}`);
    }

    async moveAffectation(id: string, dto: MoveAffectationDto, etablissementId: string): Promise<AffectationMatiere> {
        const affectation = await this.affectationRepo.findOne({ where: { id, etablissementId } });
        if (!affectation) throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');

        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const cibleClasseAnnee = await classeAnneeRepo.findOne({
            where: { id: dto.cibleClasseAnneeId },
            relations: ['classe'],
        }) as any;
        if (!cibleClasseAnnee) throw new AppError('Classe/Année cible non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');

        const prog = await this.niveauRepo.findOne({
            where: { matiereId: affectation.matiereId, niveauId: cibleClasseAnnee.classe.niveauId }
        });
        if (!prog) throw new AppError('Cette matière n\'est pas au programme du niveau cible', 400, 'MATIERE_NOT_IN_LEVEL');

        affectation.classeAnneeId = dto.cibleClasseAnneeId;
        await this.affectationRepo.save(affectation);
        logger.info(`Affectation déplacée: ${id} → classe ${dto.cibleClasseAnneeId}`);
        return affectation;
    }

    // ==== GRILLE PAR MATIÈRE (MatiereNiveau filtré par matière) ====

    async findProgrammeByMatiere(matiereId: string, etablissementId: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { matiereId, matiere: { etablissementId } },
            relations: ['niveau', 'groupe', 'filiere'],
            order: { createdAt: 'ASC' },
        });
    }

    // ==== PROGRAMMES PEDAGOGIQUES PAR MATIERE ====

    async findProgrammesPedagogiquesByMatiere(matiereId: string, etablissementId: string): Promise<any[]> {
        const { programmeMatiereService } = await import('@modules/programmes/services/programme-matiere.service');
        return programmeMatiereService.findByMatiere(matiereId, etablissementId);
    }

    // ==== AFFECTATIONS PAR ENSEIGNANT ====

    async getAffectationsByEnseignant(enseignantId: string, etablissementId: string): Promise<any[]> {
        const affectations = await this.affectationRepo.find({
            where: { enseignantId, etablissementId },
            relations: [
                'matiere',
                'classeAnnee',
                'classeAnnee.classe',
                'classeAnnee.anneeScolaire',
            ],
            order: { createdAt: 'DESC' },
        });

        const matiereIds = [...new Set(affectations.map(a => a.matiereId))];
        const niveauIds = [...new Set(affectations.map(a => a.classeAnnee?.classe?.niveauId).filter(Boolean))];
        const matiereNiveaux: Map<string, MatiereNiveau> = new Map();

        if (matiereIds.length > 0 && niveauIds.length > 0) {
            const nivs = await this.niveauRepo.createQueryBuilder('mn')
                .where('mn.matiereId IN (:...matiereIds)', { matiereIds })
                .andWhere('mn.niveauId IN (:...niveauIds)', { niveauIds })
                .getMany();
            for (const mn of nivs) {
                matiereNiveaux.set(`${mn.matiereId}::${mn.niveauId}`, mn);
            }
        }

        // Résolution centralisée des coefficients, groupée par classe-année (batch)
        const matieresParClasseAnnee = new Map<string, Set<string>>();
        for (const aff of affectations) {
            if (!aff.classeAnneeId) continue;
            const set = matieresParClasseAnnee.get(aff.classeAnneeId) ?? new Set<string>();
            set.add(aff.matiereId);
            matieresParClasseAnnee.set(aff.classeAnneeId, set);
        }
        const coefficientsParClasseAnnee = new Map<string, Map<string, number>>();
        for (const [classeAnneeId, ids] of matieresParClasseAnnee) {
            try {
                const resolus = await coefficientResolverService.resoudreCoefficients(
                    classeAnneeId,
                    [...ids],
                    etablissementId
                );
                const coefMap = new Map<string, number>();
                for (const [matiereId, resolu] of resolus) {
                    coefMap.set(matiereId, resolu.coefficient);
                }
                coefficientsParClasseAnnee.set(classeAnneeId, coefMap);
            } catch (e) {
                logger.warn(`[Matieres] Résolution coefficients impossible pour classe-année ${classeAnneeId} (non bloquant)`, e);
            }
        }

        return affectations.map((aff) => {
            const niveauId = aff.classeAnnee?.classe?.niveauId;
            const key = niveauId ? `${aff.matiereId}::${niveauId}` : '';
            const matiereNiveau = key ? matiereNiveaux.get(key) : null;

            // Chaîne canonique (A1) : Affectation → ProgrammeMatiere → MatiereNiveau → défaut
            const coefficient = coefficientsParClasseAnnee.get(aff.classeAnneeId)?.get(aff.matiereId)
                ?? matiereNiveau?.coefficient
                ?? 1;
            const volumeHoraireHebdo = matiereNiveau?.volumeHoraire ?? null;

            return {
                ...aff,
                coefficient,
                volumeHoraireHebdo,
                effectifActuel: aff.classeAnnee?.effectifActuel ?? 0,
            };
        });
    }

    // ==== AFFECTATIONS PAR MATIERE ====

    async findAffectationsByMatiere(matiereId: string, etablissementId: string): Promise<AffectationMatiere[]> {
        return this.affectationRepo.find({
            where: { matiereId, etablissementId },
            relations: ['enseignant', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire'],
            order: { createdAt: 'DESC' },
        });
    }

}

export const matieresService = new MatieresService();
