import { Repository, LessThanOrEqual, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ContratPersonnel, StatutContrat, TypeContratPersonnalise, AffectationPoste, StatutAffectation, TypeMutation, MembreFonction, MembrePersonnel } from '../entities';
import { CreateContratDto, UpdateContratDto, QueryContratDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { Poste, StatutPoste } from '@modules/organisation/entities';
import { Fonction } from '@modules/fonctions/entities';
import { HierarchiePersonnel, TypeRelationHierarchique, StatutRelation } from '@modules/organisation/entities';

export class ContratService {
    private repo: Repository<ContratPersonnel>;
    private typeContratRepo: Repository<TypeContratPersonnalise>;
    private affectationRepo: Repository<AffectationPoste>;
    private posteRepo: Repository<Poste>;
    private membreFonctionRepo: Repository<MembreFonction>;
    private membrePersonnelRepo: Repository<MembrePersonnel>;
    private fonctionRepo: Repository<Fonction>;
    private hierarchieRepo: Repository<HierarchiePersonnel>;

    constructor() {
        this.repo = AppDataSource.getRepository(ContratPersonnel);
        this.typeContratRepo = AppDataSource.getRepository(TypeContratPersonnalise);
        this.affectationRepo = AppDataSource.getRepository(AffectationPoste);
        this.posteRepo = AppDataSource.getRepository(Poste);
        this.membreFonctionRepo = AppDataSource.getRepository(MembreFonction);
        this.membrePersonnelRepo = AppDataSource.getRepository(MembrePersonnel);
        this.fonctionRepo = AppDataSource.getRepository(Fonction);
        this.hierarchieRepo = AppDataSource.getRepository(HierarchiePersonnel);
    }

    private async syncTypeContrat(dto: CreateContratDto | UpdateContratDto): Promise<void> {
        if (dto.typeContratId) {
            const typeEntity = await this.typeContratRepo.findOne({ where: { id: dto.typeContratId } });
            if (!typeEntity) throw new AppError('Type de contrat non trouvé', 404, 'TYPE_CONTRAT_NOT_FOUND');
            (dto as any).typeContrat = typeEntity.code;
        } else if (dto.typeContrat && !dto.typeContratId) {
            const typeEntity = await this.typeContratRepo.findOne({ where: { code: dto.typeContrat } });
            if (typeEntity) (dto as any).typeContratId = typeEntity.id;
        }
    }

    private async syncAffectationPoste(
        contrat: ContratPersonnel,
        newPosteId: string | undefined,
        etablissementId: string,
    ): Promise<void> {
        const ancienPosteId = contrat.posteId;
        if (ancienPosteId === newPosteId && newPosteId) return;

        // 1. Libérer l'ancien poste si existant
        if (ancienPosteId) {
            await this.terminerAffectationActive(contrat.membrePersonnelId, etablissementId);
            await this.recalculerOccupantsCount(ancienPosteId);
        }

        // 2. Assigner le nouveau poste
        if (newPosteId) {
            const poste = await this.posteRepo.findOne({ where: { id: newPosteId } });
            if (!poste) throw new AppError('Poste non trouvé', 404, 'POSTE_NOT_FOUND');

            // Vérifier capacité (multi-occupants)
            if (poste.occupantsCount >= poste.nombrePostes) {
                throw new AppError(
                    `Ce poste a atteint son nombre maximum d'affectations (${poste.nombrePostes}/${poste.nombrePostes})`,
                    409, 'POSTE_COMPLET',
                );
            }

            // 3. Créer AffectationPoste
            const affectation = this.affectationRepo.create({
                membrePersonnelId: contrat.membrePersonnelId,
                posteId: newPosteId,
                contratId: contrat.id,
                uniteOrganisationnelleId: poste.uniteOrganisationnelleId,
                typeMutation: ancienPosteId ? TypeMutation.TRANSFERT : TypeMutation.NOUVELLE,
                statut: StatutAffectation.ACTIF,
                dateDebut: contrat.dateDebut,
                etablissementId,
                salaireAssocie: contrat.salaireBase,
            });
            await this.affectationRepo.save(affectation);

            await this.recalculerOccupantsCount(newPosteId);
            contrat.posteId = newPosteId;

            // 4. Auto-créer hiérarchie depuis la fonction du poste
            await this.autoCreerHierarchie(poste, contrat.membrePersonnelId, contrat.dateDebut, etablissementId);
        } else {
            contrat.posteId = null as any;
        }
    }

    private async recalculerOccupantsCount(posteId: string): Promise<void> {
        const count = await this.affectationRepo.count({
            where: { posteId, statut: StatutAffectation.ACTIF },
        });
        await this.posteRepo.update(posteId, { occupantsCount: count });
    }

    private async autoCreerHierarchie(
        poste: Poste,
        membrePersonnelId: string,
        dateDebut: Date,
        etablissementId: string,
    ): Promise<void> {
        if (!poste.fonctionId) return;
        const fonction = await this.fonctionRepo.findOne({ where: { id: poste.fonctionId } });
        if (!fonction?.parentId) return;

        // Trouver les postes liés à la fonction parente (= supérieurs hiérarchiques)
        const postesSuperieurs = await this.posteRepo.find({
            where: { fonctionId: fonction.parentId, actif: true },
        });
        if (!postesSuperieurs.length) return;

        // Trouver les occupants actuels de ces postes via affectations
        const superieurPosteIds = postesSuperieurs.map(p => p.id);
        const affectationsSuperieurs = await this.affectationRepo.find({
            where: { posteId: In(superieurPosteIds), statut: StatutAffectation.ACTIF },
        });

        for (const aff of affectationsSuperieurs) {
            if (aff.membrePersonnelId === membrePersonnelId) continue;
            const existe = await this.hierarchieRepo.findOne({
                where: {
                    personnelId: membrePersonnelId,
                    superieurId: aff.membrePersonnelId,
                    statut: StatutRelation.ACTIVE,
                },
            });
            if (existe) continue;
            const lien = this.hierarchieRepo.create({
                personnelId: membrePersonnelId,
                superieurId: aff.membrePersonnelId,
                typeRelation: TypeRelationHierarchique.SUPERVISE_DIRECT,
                statut: StatutRelation.ACTIVE,
                posteId: poste.id,
                posteIntitule: poste.intitulé,
                uniteOrganisationnelleId: poste.uniteOrganisationnelleId,
                etablissementId,
                dateDebut,
            });
            await this.hierarchieRepo.save(lien);
            logger.info(`Hiérarchie auto-créée: ${membrePersonnelId} → ${aff.membrePersonnelId}`);
        }
    }

    private async terminerAffectationActive(membrePersonnelId: string, etablissementId: string): Promise<void> {
        const active = await this.affectationRepo.findOne({
            where: { membrePersonnelId, etablissementId, statut: StatutAffectation.ACTIF },
        });
        if (active) {
            active.statut = StatutAffectation.TERMINE;
            active.dateFin = new Date();
            await this.affectationRepo.save(active);
        }
    }

    private async syncFonctions(
        contrat: ContratPersonnel,
        fonctionId: string | undefined,
        fonctionsSecondairesIds: string[] | undefined,
        etablissementId: string,
    ): Promise<void> {
        // 1. Supprimer les MembreFonction liés à ce contrat (pour resynchro)
        if (contrat.id) {
            await this.membreFonctionRepo.delete({ contratId: contrat.id });
        }

        // 2. Ajouter la fonction principale
        if (fonctionId) {
            const mf = this.membreFonctionRepo.create({
                membrePersonnelId: contrat.membrePersonnelId,
                fonctionId,
                contratId: contrat.id,
                dateDebut: contrat.dateDebut,
                estPrincipale: true,
                etablissementId,
            });
            await this.membreFonctionRepo.save(mf);
            contrat.fonctionId = fonctionId;
        } else {
            contrat.fonctionId = null as any;
        }

        // 3. Ajouter les fonctions secondaires
        if (fonctionsSecondairesIds?.length) {
            const secondaires = fonctionsSecondairesIds
                .filter((fid) => fid !== fonctionId)
                .map((fid) => this.membreFonctionRepo.create({
                    membrePersonnelId: contrat.membrePersonnelId,
                    fonctionId: fid,
                    contratId: contrat.id,
                    dateDebut: contrat.dateDebut,
                    estPrincipale: false,
                    etablissementId,
                }));
            if (secondaires.length > 0) {
                await this.membreFonctionRepo.save(secondaires);
            }
        }
    }

    async create(
        dto: CreateContratDto,
        etablissementId: string,
        createurId?: string,
        req?: any,
    ): Promise<ContratPersonnel> {
        await this.syncTypeContrat(dto);

        // Validation conditionnelle selon le mode de rémunération
        if (dto.modeRemuneration === 'MENSUEL' || dto.modeRemuneration === 'MIXTE') {
            if (!dto.salaireBase || dto.salaireBase <= 0) {
                throw new AppError(
                    'Le salaire de base est requis pour le mode ' + dto.modeRemuneration,
                    400, 'SALAIRE_BASE_REQUIS',
                );
            }
        }

        // Valider la compatibilité type poste ↔ type membre
        if (dto.posteId) {
            const poste = await this.posteRepo.findOne({
                where: { id: dto.posteId },
                relations: ['typePersonnel'],
            });
            if (poste?.typePersonnel?.code === 'ENSEIGNANT') {
                const membre = await this.membrePersonnelRepo.findOne({
                    where: { id: dto.membrePersonnelId },
                    relations: ['typePersonnel'],
                });
                if (membre?.typePersonnel?.code !== 'ENSEIGNANT') {
                    throw new AppError(
                        'Seul un personnel enseignant peut être affecté à un poste de type ENSEIGNANT',
                        400, 'TYPE_POSTE_INCOMPATIBLE',
                    );
                }
            }
        }

        if (dto.statut === 'ACTIF') {
            const contratActif = await this.repo.findOne({
                where: { membrePersonnelId: dto.membrePersonnelId, etablissementId, statut: StatutContrat.ACTIF },
            });
            if (contratActif) {
                contratActif.statut = StatutContrat.RENEGOCIE;
                await this.repo.save(contratActif);
                // Libérer l'ancien poste du contrat renegocié (via affectations)
                if (contratActif.posteId) {
                    await this.terminerAffectationActive(dto.membrePersonnelId, etablissementId);
                    await this.recalculerOccupantsCount(contratActif.posteId);
                }
            }
        }

        const contrat = this.repo.create({
            membrePersonnelId: dto.membrePersonnelId,
            typeContrat: dto.typeContrat,
            typeContratId: dto.typeContratId,
            fonctionId: dto.fonctionId,
            posteId: dto.posteId,
            dateDebut: new Date(dto.dateDebut),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
            salaireBase: dto.salaireBase || 0,
            tarifHoraire: dto.tarifHoraire,
            modeRemuneration: dto.modeRemuneration as any,
            heuresContractuellesMois: dto.heuresContractuellesMois,
            tarifHebdomadaire: dto.tarifHebdomadaire,
            statut: dto.statut as any,
            renouvellementAuto: dto.renouvellementAuto || false,
            clauses: dto.clauses,
            etablissementId,
        });
        await this.repo.save(contrat);

        // Sync poste
        if (dto.posteId) {
            await this.syncAffectationPoste(contrat, dto.posteId, etablissementId);
            await this.repo.save(contrat);
        }

        // Sync fonctions
        if (dto.fonctionId || dto.fonctionsSecondairesIds?.length) {
            await this.syncFonctions(contrat, dto.fonctionId, dto.fonctionsSecondairesIds, etablissementId);
            await this.repo.save(contrat);
        }

        const requireValidation = await getParamBoolean('personnel.contrat_require_validation', { defaultValue: false });
        if (requireValidation && createurId) {
            await validationWorkflowService.createWorkflow({
                module: 'personnel', entiteId: contrat.id, entiteType: 'ContratPersonnel',
                niveauxRequis: 2, etablissementId,
                commentaire: `Nouveau contrat ${dto.typeContrat} pour membre ${dto.membrePersonnelId}`,
            }, createurId);
        }

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId, action: AuditAction.CONTRAT_PERSONNEL_CREATE,
                cible: 'ContratPersonnel', cibleId: contrat.id,
                description: `Création contrat ${dto.typeContrat} pour membre ${dto.membrePersonnelId}`,
                nouvellesValeurs: dto, module: 'personnel',
            }, req);
        }

        return this.findOne(contrat.id, etablissementId);
    }

    async findAll(query: QueryContratDto, etablissementId?: string): Promise<PaginatedResult<ContratPersonnel>> {
        const { page, limit, search, membrePersonnelId, typeContrat, statut } = query;
        const qb = this.repo.createQueryBuilder('c')
            .leftJoinAndSelect('c.membrePersonnel', 'mp')
            .leftJoinAndSelect('mp.utilisateur', 'u')
            .leftJoinAndSelect('c.poste', 'p')
            .leftJoinAndSelect('c.fonction', 'f')
            .where('1=1');

        if (etablissementId) qb.andWhere('c.etablissementId = :etablissementId', { etablissementId });
        if (membrePersonnelId) qb.andWhere('c.membrePersonnelId = :membrePersonnelId', { membrePersonnelId });
        if (typeContrat) qb.andWhere('c.typeContrat = :typeContrat', { typeContrat });
        if (statut) qb.andWhere('c.statut = :statut', { statut });
        if (search) qb.andWhere('(c.clauses ILIKE :search OR c.typeContrat ILIKE :search)', { search: `%${search}%` });

        const allowedFields = ['createdAt', 'dateDebut', 'dateFin', 'statut', 'typeContrat'];
        qb.orderBy(`c.${allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt'}`, query.sortOrder);
        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findOne(id: string, etablissementId?: string): Promise<ContratPersonnel> {
        const contrat = await this.repo.findOne({
            where: { id, ...(etablissementId ? { etablissementId } : {}) },
            relations: [
                'membrePersonnel', 'membrePersonnel.utilisateur', 'etablissement',
                'poste', 'poste.uniteOrganisationnelle', 'poste.fonction',
                'fonction',
            ],
        });
        if (!contrat) throw new AppError('Contrat non trouvé', 404, 'NOT_FOUND');
        return contrat;
    }

    async getHistoriqueByMembre(membreId: string, etablissementId: string): Promise<ContratPersonnel[]> {
        return this.repo.find({
            where: { membrePersonnelId: membreId, etablissementId },
            relations: ['poste', 'fonction', 'membrePersonnel'],
            order: { dateDebut: 'DESC' },
        });
    }

    async getContratActif(membreId: string, etablissementId: string): Promise<ContratPersonnel | null> {
        return this.repo.findOne({
            where: { membrePersonnelId: membreId, etablissementId, statut: StatutContrat.ACTIF },
            relations: ['poste', 'poste.uniteOrganisationnelle', 'poste.fonction', 'fonction'],
        });
    }

    async update(
        id: string, dto: UpdateContratDto, userId: string, etablissementId: string, req?: any,
    ): Promise<ContratPersonnel> {
        const contrat = await this.findOne(id, etablissementId);
        await this.syncTypeContrat(dto);

        const anciennesValeurs = {
            typeContrat: contrat.typeContrat, statut: contrat.statut,
            salaireBase: contrat.salaireBase, posteId: contrat.posteId, fonctionId: contrat.fonctionId,
        };

        if (dto.dateDebut) dto.dateDebut = new Date(dto.dateDebut) as any;
        if (dto.dateFin) dto.dateFin = new Date(dto.dateFin) as any;

        Object.assign(contrat, dto);
        await this.repo.save(contrat);

        // Sync poste if changed
        if (dto.posteId !== undefined) {
            await this.syncAffectationPoste(contrat, dto.posteId, etablissementId);
            await this.repo.save(contrat);
        }

        // Sync fonctions if changed
        if (dto.fonctionId !== undefined || dto.fonctionsSecondairesIds !== undefined) {
            await this.syncFonctions(
                contrat,
                dto.fonctionId !== undefined ? dto.fonctionId : contrat.fonctionId,
                dto.fonctionsSecondairesIds,
                etablissementId,
            );
            await this.repo.save(contrat);
        }

        await auditService.log({
            utilisateurId: userId, action: AuditAction.CONTRAT_PERSONNEL_UPDATE,
            cible: 'ContratPersonnel', cibleId: id,
            description: `Modification contrat ${id}`,
            anciennesValeurs, nouvellesValeurs: dto, module: 'personnel',
        }, req);

        return this.findOne(id, etablissementId);
    }

    async delete(id: string, userId: string, etablissementId: string, req?: any): Promise<void> {
        const contrat = await this.findOne(id, etablissementId);
        contrat.statut = StatutContrat.ROMPU;
        await this.repo.save(contrat);

        // Libérer le poste
        if (contrat.posteId) {
            await this.terminerAffectationActive(contrat.membrePersonnelId, etablissementId);
            await this.recalculerOccupantsCount(contrat.posteId);
        }

        // Terminer les MembreFonction liés
        await this.membreFonctionRepo.update({ contratId: id }, { dateFin: new Date() });

        await auditService.log({
            utilisateurId: userId, action: AuditAction.CONTRAT_PERSONNEL_DELETE,
            cible: 'ContratPersonnel', cibleId: id,
            description: `Suppression contrat ${id}`, module: 'personnel',
        }, req);
    }

    async getContratsExpirantBientot(jours: number, etablissementId: string): Promise<ContratPersonnel[]> {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + jours);
        return this.repo.find({
            where: { etablissementId, statut: StatutContrat.ACTIF, dateFin: LessThanOrEqual(dateLimite) as any },
            relations: ['membrePersonnel', 'poste'],
            order: { dateFin: 'ASC' },
        });
    }

    async handleExpiredContracts(): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expired = await this.repo.find({
            where: { statut: StatutContrat.ACTIF, dateFin: LessThanOrEqual(today) as any },
        });
        for (const contrat of expired) {
            contrat.statut = StatutContrat.EXPIRE;
            await this.repo.save(contrat);
            if (contrat.posteId) {
                await this.terminerAffectationActive(contrat.membrePersonnelId, contrat.etablissementId);
                await this.recalculerOccupantsCount(contrat.posteId);
            }
            await this.membreFonctionRepo.update({ contratId: contrat.id }, { dateFin: today });
        }
        if (expired.length > 0) logger.info(`${expired.length} contrats expirés traités`);
        return expired.length;
    }
}

export const contratService = new ContratService();
