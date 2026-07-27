/**
 * ==================================
 * eLISAschool - Service Personnel
 * ==================================
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MembrePersonnel, StatutPersonnel } from '../entities';
import { CreatePersonnelDto, UpdatePersonnelDto, QueryPersonnelDto } from '../dto';
import { CategorieFonction, CategorieSource } from '../../../shared/constants/personnel.constants';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export interface MembrePersonnelEnrichi extends MembrePersonnel {
    categorie: CategorieFonction | null;
    estEnseignant: boolean;
    categorieSource: CategorieSource;
}

export class PersonnelService {
    private personnelRepo: Repository<MembrePersonnel>;

    /**
     * Derivation SQL de la categorie d'un membre (fonction principale active,
     * sinon fonction du poste de l'affectation ACTIF la plus recente).
     */
    private static readonly CATEGORIE_SQL = `
        COALESCE(
            (SELECT f.categorie FROM membres_fonctions mf
             JOIN fonctions f ON f.id = mf."fonctionId"
             WHERE mf."membrePersonnelId" = p.id
               AND (mf."dateFin" IS NULL OR mf."dateFin" >= CURRENT_DATE)
             ORDER BY mf."estPrincipale" DESC, mf."dateDebut" DESC LIMIT 1),
            (SELECT f2.categorie FROM affectations_postes ap
             JOIN postes po ON po.id = ap."posteId"
             JOIN fonctions f2 ON f2.id = po."fonctionId"
             WHERE ap."membrePersonnelId" = p.id AND ap.statut = 'ACTIF'
             ORDER BY ap."dateDebut" DESC LIMIT 1)
        )`;

    constructor() {
        this.personnelRepo = AppDataSource.getRepository(MembrePersonnel);
    }

    // ==== CATEGORIE DERIVEE ====

    /**
     * Derive en batch la categorie de fonction de plusieurs membres (anti-N+1).
     */
    async deriverCategories(membreIds: string[]): Promise<Map<string, { categorie: CategorieFonction | null; source: CategorieSource }>> {
        const result = new Map<string, { categorie: CategorieFonction | null; source: CategorieSource }>();
        if (membreIds.length === 0) return result;

        const rows: { id: string; mf_categorie: string | null; ap_categorie: string | null }[] =
            await this.personnelRepo.query(`
                SELECT p.id, mf_cat.categorie AS mf_categorie, ap_cat.categorie AS ap_categorie
                FROM membres_personnel p
                LEFT JOIN LATERAL (
                    SELECT f.categorie FROM membres_fonctions mf
                    JOIN fonctions f ON f.id = mf."fonctionId"
                    WHERE mf."membrePersonnelId" = p.id
                      AND (mf."dateFin" IS NULL OR mf."dateFin" >= CURRENT_DATE)
                    ORDER BY mf."estPrincipale" DESC, mf."dateDebut" DESC LIMIT 1
                ) mf_cat ON true
                LEFT JOIN LATERAL (
                    SELECT f2.categorie FROM affectations_postes ap
                    JOIN postes po ON po.id = ap."posteId"
                    JOIN fonctions f2 ON f2.id = po."fonctionId"
                    WHERE ap."membrePersonnelId" = p.id AND ap.statut = 'ACTIF'
                    ORDER BY ap."dateDebut" DESC LIMIT 1
                ) ap_cat ON true
                WHERE p.id = ANY($1) AND p."deletedAt" IS NULL
            `, [membreIds]);

        for (const row of rows) {
            if (row.mf_categorie) {
                result.set(row.id, { categorie: row.mf_categorie as CategorieFonction, source: 'FONCTION' });
            } else if (row.ap_categorie) {
                result.set(row.id, { categorie: row.ap_categorie as CategorieFonction, source: 'AFFECTATION' });
            } else {
                result.set(row.id, { categorie: null, source: null });
            }
        }
        return result;
    }

    /**
     * Enrichit des membres avec categorie / estEnseignant / categorieSource derives.
     */
    async enrichirCategories(membres: MembrePersonnel[]): Promise<MembrePersonnelEnrichi[]> {
        const map = await this.deriverCategories(membres.map((m) => m.id));
        return membres.map((m) => {
            const info = map.get(m.id) ?? { categorie: null, source: null };
            return Object.assign(m, {
                categorie: info.categorie,
                estEnseignant: info.categorie === CategorieFonction.ENSEIGNANT,
                categorieSource: info.source,
            }) as MembrePersonnelEnrichi;
        });
    }

    // ==== MEMBRES PERSONNEL ====

    async createMembre(dto: CreatePersonnelDto, etablissementId?: string, createurId?: string): Promise<MembrePersonnel> {
        const existing = await this.personnelRepo.findOne({ 
            where: { 
                matricule: dto.matricule,
                ...(etablissementId ? { etablissementId } : {})
            } 
        });
        if (existing) throw new AppError('Matricule déjà utilisé dans cet établissement', 409, 'MATRICULE_EXISTS');

        // Vérifier utilisateur unique
        if (dto.utilisateurId) {
            const userUsed = await this.personnelRepo.findOne({ where: { utilisateurId: dto.utilisateurId } });
            if (userUsed) throw new AppError('Cet utilisateur est déjà membre du personnel', 409, 'USER_ALREADY_MEMBER');
        }

        // Vérifier si le workflow de validation est requis
        const requireValidation = await getParamBoolean('personnel.require_validation', { defaultValue: false });

        const membre = this.personnelRepo.create({
            ...dto,
            dateEmbauche: new Date(dto.dateEmbauche),
            etablissementId,
            statut: requireValidation ? StatutPersonnel.EN_ATTENTE_VALIDATION : StatutPersonnel.ACTIF,
        });
        await this.personnelRepo.save(membre);

        // Créer le workflow de validation si requis
        if (requireValidation && createurId) {
            await validationWorkflowService.createWorkflow({
                module: 'personnel',
                entiteId: membre.id,
                entiteType: 'MembrePersonnel',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Embauche personnel: ${dto.matricule}`,
            }, createurId);
        }

        logger.info(`Nouveau membre personnel: ${dto.matricule}`);
        return membre;
    }

    /**
     * Rechercher tous les membres du personnel avec pagination et filtres
     */
    async findAll(query: QueryPersonnelDto, etablissementId?: string): Promise<PaginatedResult<MembrePersonnel>> {
        const { page, limit, search, categorie, estEnseignant, statut } = query;

        const qb = this.personnelRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.utilisateur', 'u')
            .leftJoinAndSelect('u.profil', 'prof')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('p.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres sur la catégorie dérivée (fonction principale ou affectation active)
        if (categorie) {
            qb.andWhere(`${PersonnelService.CATEGORIE_SQL} = :categorie`, { categorie });
        } else if (estEnseignant !== undefined) {
            if (estEnseignant) {
                qb.andWhere(`${PersonnelService.CATEGORIE_SQL} = :catEns`, { catEns: CategorieFonction.ENSEIGNANT });
            } else {
                qb.andWhere(`${PersonnelService.CATEGORIE_SQL} IS DISTINCT FROM :catEns`, { catEns: CategorieFonction.ENSEIGNANT });
            }
        }

        if (statut) {
            qb.andWhere('p.statut = :statut', { statut });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(p.matricule ILIKE :search OR p.specialites ILIKE :search OR p.diplomes ILIKE :search OR u.email ILIKE :search OR prof.nom ILIKE :search OR prof.prenom ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'matricule', 'dateEmbauche', 'statut'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`p.${orderField}`, query.sortOrder);

        // Pagination optimisée
        const result = await paginateWithQueryBuilder(qb, page, limit, false);
        const enrichis = await this.enrichirCategories(result.items);
        return { ...result, items: enrichis };
    }

    async findOne(id: string, etablissementId?: string): Promise<MembrePersonnelEnrichi> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const membre = await this.personnelRepo.findOne({
            where,
            relations: ['utilisateur', 'utilisateur.profil'],
        });
        if (!membre) throw new AppError('Membre non trouvé', 404, 'NOT_FOUND');
        const [enrichi] = await this.enrichirCategories([membre]);
        return enrichi;
    }

    async findByUserId(userId: string): Promise<MembrePersonnelEnrichi | null> {
        const membre = await this.personnelRepo.findOne({ where: { utilisateurId: userId } });
        if (!membre) return null;
        const [enrichi] = await this.enrichirCategories([membre]);
        return enrichi;
    }

    async linkUser(membreId: string, utilisateurId: string, etablissementId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(membreId, etablissementId);
        if (membre.utilisateurId) {
            throw new AppError('Ce membre est déjà lié à un utilisateur', 409, 'ALREADY_LINKED');
        }
        const utilisateur = await AppDataSource.getRepository('Utilisateur').findOne({ where: { id: utilisateurId } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }
        const existingLink = await this.personnelRepo.findOne({ where: { utilisateurId } });
        if (existingLink) {
            throw new AppError('Cet utilisateur est déjà lié à un autre membre du personnel', 409, 'USER_ALREADY_LINKED');
        }
        membre.utilisateurId = utilisateurId;
        await this.personnelRepo.save(membre);

        await auditService.log({
            utilisateurId: utilisateurId,
            action: AuditAction.USER_UPDATE,
            cible: 'MembrePersonnel',
            cibleId: membreId,
            description: `Utilisateur lié au dossier personnel: ${membre.matricule}`,
            module: 'personnel',
        });

        logger.info(`Utilisateur ${utilisateurId} lié au membre ${membreId}`);
        return this.findOne(membreId, etablissementId);
    }

    async unlinkUser(membreId: string, etablissementId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(membreId, etablissementId);
        if (!membre.utilisateurId) {
            throw new AppError('Ce membre n\'a pas d\'utilisateur lié', 400, 'NOT_LINKED');
        }
        membre.utilisateurId = undefined;
        await this.personnelRepo.save(membre);
        logger.info(`Utilisateur délié du membre ${membreId}`);
        return this.findOne(membreId, etablissementId);
    }

    async getPersonnelSansCompte(etablissementId: string): Promise<{ count: number; total: number; pourcentage: number }> {
        const total = await this.personnelRepo.count({ where: { etablissementId } });
        const sansCompte = await this.personnelRepo.count({ where: { etablissementId, utilisateurId: IsNull() } });
        return {
            total,
            count: sansCompte,
            pourcentage: total > 0 ? Math.round((sansCompte / total) * 100) : 0,
        };
    }

    async update(id: string, dto: UpdatePersonnelDto, etablissementId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(id, etablissementId);

        const { dateEmbauche, ...reste } = dto;
        Object.assign(membre, reste);
        if (dateEmbauche) membre.dateEmbauche = new Date(dateEmbauche);
        await this.personnelRepo.save(membre);
        return membre;
    }

    async delete(id: string, etablissementId?: string): Promise<void> {
        const membre = await this.findOne(id, etablissementId);
        await this.personnelRepo.softRemove(membre);
        logger.info(`Membre personnel supprimé (soft): ${id}`);
    }

    // ─── Inline Edit Methods ───

    async updateStatut(id: string, statut: StatutPersonnel, userId?: string, etablissementId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(id, etablissementId);
        const ancienStatut = membre.statut;
        membre.statut = statut;
        await this.personnelRepo.save(membre);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PERSONNEL_UPDATE,
                cible: 'MembrePersonnel',
                cibleId: id,
                description: `Statut modifié: ${ancienStatut} → ${statut}`,
                anciennesValeurs: { statut: ancienStatut },
                nouvellesValeurs: { statut },
                module: 'personnel',
            });
        }

        return membre;
    }

    async updateDateEntree(id: string, dateEmbauche: Date, userId?: string, etablissementId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(id, etablissementId);
        const ancienneDate = membre.dateEmbauche;
        membre.dateEmbauche = dateEmbauche;
        await this.personnelRepo.save(membre);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PERSONNEL_UPDATE,
                cible: 'MembrePersonnel',
                cibleId: id,
                description: `Date d'entrée modifiée`,
                anciennesValeurs: { dateEmbauche: ancienneDate },
                nouvellesValeurs: { dateEmbauche },
                module: 'personnel',
            });
        }

        return membre;
    }

    async updateCompetences(
        id: string,
        data: {
            specialites?: string[];
            diplomes?: string;
            specialitePrincipale?: string;
            competences?: string[];
            educationNiveau?: string;
            anneesExperience?: number;
        },
        userId?: string,
        etablissementId?: string
    ): Promise<MembrePersonnel> {
        const membre = await this.findOne(id, etablissementId);
        const anciennes: Record<string, unknown> = {};

        if (data.specialites !== undefined) { anciennes.specialites = membre.specialites; membre.specialites = data.specialites; }
        if (data.diplomes !== undefined) { anciennes.diplomes = membre.diplomes; membre.diplomes = data.diplomes; }
        if (data.specialitePrincipale !== undefined) { anciennes.specialitePrincipale = membre.specialitePrincipale; membre.specialitePrincipale = data.specialitePrincipale; }
        if (data.competences !== undefined) { anciennes.competences = membre.competences; membre.competences = data.competences; }
        if (data.educationNiveau !== undefined) { anciennes.educationNiveau = membre.educationNiveau; membre.educationNiveau = data.educationNiveau; }
        if (data.anneesExperience !== undefined) { anciennes.anneesExperience = membre.anneesExperience; membre.anneesExperience = data.anneesExperience; }

        await this.personnelRepo.save(membre);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PERSONNEL_UPDATE,
                cible: 'MembrePersonnel',
                cibleId: id,
                description: 'Compétences modifiées',
                anciennesValeurs: anciennes,
                nouvellesValeurs: data,
                module: 'personnel',
            });
        }

        return this.findOne(id, etablissementId);
    }
}

export const personnelService = new PersonnelService();
