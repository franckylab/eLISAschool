import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Fonction } from '../entities';
import { MembreFonction } from '@modules/personnel/entities/membre-fonction.entity';
import { CreateFonctionDto, UpdateFonctionDto, QueryFonctionsDto } from '../dto/fonction.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { assertNotSystem } from '@common/utils/system-guard.util';
import { auditService, AuditAction } from '@modules/auth';

export class FonctionsService {
    private repo: Repository<Fonction>;
    private membreRepo: Repository<MembreFonction>;

    constructor() {
        this.repo = AppDataSource.getRepository(Fonction);
        this.membreRepo = AppDataSource.getRepository(MembreFonction);
    }

    /**
     * Membres rattachés à une fonction (pour l'onglet détail).
     */
    async findMembres(id: string, etablissementId: string): Promise<MembreFonction[]> {
        await this.findOne(id, etablissementId);
        return this.membreRepo.find({
            where: { fonctionId: id },
            relations: ['membrePersonnel'],
            order: { estPrincipale: 'DESC' },
        });
    }

    async create(dto: CreateFonctionDto, etablissementId: string, utilisateurId?: string): Promise<Fonction> {
        const existing = await this.repo.findOne({
            where: { code: dto.code, etablissementId },
        });
        if (existing) {
            throw new AppError('Une fonction avec ce code existe déjà dans cet établissement', 409, 'FONCTION_EXISTS');
        }

        let niveau = 0;
        let parentChemin = '';

        if (dto.parentId) {
            const parent = await this.findOne(dto.parentId, etablissementId);
            niveau = parent.niveau + 1;
            parentChemin = parent.chemin || parent.id;
        }

        const fonction = this.repo.create({
            nom: dto.nom,
            code: dto.code,
            description: dto.description,
            parentId: dto.parentId ?? undefined,
            ordre: dto.ordre,
            categorie: dto.categorie,
            primesDefaut: dto.primesDefaut ?? undefined,
            majorationDefaut: dto.majorationDefaut ?? undefined,
            actif: dto.actif,
            niveau,
            etablissementId,
        });
        await this.repo.save(fonction);

        fonction.chemin = dto.parentId ? `${parentChemin}.${fonction.id}` : fonction.id;
        await this.repo.save(fonction);

        logger.info(`Fonction créée: ${dto.nom} (${dto.code}) pour établissement ${etablissementId}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.FONCTION_CREATE,
            cible: 'Fonction',
            cibleId: fonction.id,
            description: `Création de la fonction ${fonction.nom} (${fonction.code})`,
            nouvellesValeurs: { nom: dto.nom, code: dto.code, parentId: dto.parentId, categorie: dto.categorie },
            module: 'organisation',
            metadata: { entiteLabel: fonction.nom, entiteRef: fonction.code },
        });

        return fonction;
    }

    async findAll(query: QueryFonctionsDto = {}, etablissementId: string): Promise<PaginatedResult<Fonction>> {
        const { page = 1, limit = 20, search, parentId, categorie, actif, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('fonction')
            .leftJoinAndSelect('fonction.parent', 'parent')
            .leftJoinAndSelect('fonction.enfants', 'enfants')
            .where('fonction.etablissementId = :etablissementId', { etablissementId });

        if (search) {
            qb.andWhere('(fonction.nom ILIKE :search OR fonction.code ILIKE :search)', { search: `%${search}%` });
        }

        if (categorie) {
            qb.andWhere('fonction.categorie = :categorie', { categorie });
        }

        if (parentId !== undefined) {
            if (parentId === null) {
                qb.andWhere('fonction.parentId IS NULL');
            } else {
                qb.andWhere('fonction.parentId = :parentId', { parentId });
            }
        }

        if (actif !== undefined) {
            qb.andWhere('fonction.actif = :actif', { actif });
        }

        const allowedSortFields = ['nom', 'code', 'ordre', 'niveau', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`fonction.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findArbre(etablissementId: string): Promise<Fonction[]> {
        const all = await this.repo.find({
            where: { etablissementId },
            relations: ['parent'],
            order: { ordre: 'ASC', nom: 'ASC' },
        });

        const map = new Map<string, Fonction & { enfants: Fonction[] }>();
        const racines: (Fonction & { enfants: Fonction[] })[] = [];

        for (const f of all) {
            map.set(f.id, { ...f, enfants: [] });
        }

        for (const f of all) {
            const node = map.get(f.id)!;
            if (f.parentId && map.has(f.parentId)) {
                map.get(f.parentId)!.enfants.push(node);
            } else {
                racines.push(node);
            }
        }

        return racines;
    }

    async findAllSimple(etablissementId: string): Promise<Fonction[]> {
        return this.repo.find({
            where: { etablissementId, actif: true },
            order: { ordre: 'ASC', nom: 'ASC' },
        });
    }

    async findOne(id: string, etablissementId: string): Promise<Fonction> {
        const fonction = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['parent', 'enfants'],
        });
        if (!fonction) {
            throw new AppError('Fonction non trouvée', 404, 'NOT_FOUND');
        }
        return fonction;
    }

    async update(id: string, dto: UpdateFonctionDto, etablissementId: string, utilisateurId?: string): Promise<Fonction> {
        const fonction = await this.findOne(id, etablissementId);

        if (dto.code && dto.code !== fonction.code) {
            const existing = await this.repo.findOne({
                where: { code: dto.code, etablissementId },
            });
            if (existing && existing.id !== id) {
                throw new AppError('Une fonction avec ce code existe déjà', 409, 'FONCTION_EXISTS');
            }
        }

        const anciennesValeurs: Record<string, unknown> = {};
        const nouvellesValeurs: Record<string, unknown> = {};
        for (const key of Object.keys(dto)) {
            anciennesValeurs[key] = (fonction as unknown as Record<string, unknown>)[key];
            nouvellesValeurs[key] = (dto as Record<string, unknown>)[key];
        }

        if (dto.parentId !== undefined && dto.parentId !== fonction.parentId) {
            if (dto.parentId === null) {
                fonction.niveau = 0;
                fonction.chemin = fonction.id;
            } else {
                if (dto.parentId === id) {
                    throw new AppError('Une fonction ne peut pas être son propre parent', 400, 'SELF_PARENT');
                }
                const parent = await this.findOne(dto.parentId, etablissementId);
                const cyclique = await this.verifierCycleFonction(dto.parentId, id, etablissementId);
                if (cyclique) {
                    throw new AppError('Opération invalide : le parent choisi est un descendant de cette fonction', 400, 'CYCLE_DETECTED');
                }
                fonction.niveau = parent.niveau + 1;
                fonction.chemin = `${parent.chemin || parent.id}.${fonction.id}`;
            }
        }

        Object.assign(fonction, dto);

        if (!fonction.chemin) {
            fonction.chemin = fonction.id;
        }

        await this.repo.save(fonction);
        logger.info(`Fonction modifiée: ${fonction.nom}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.FONCTION_UPDATE,
            cible: 'Fonction',
            cibleId: fonction.id,
            description: `Modification de la fonction ${fonction.nom} (${fonction.code})`,
            anciennesValeurs,
            nouvellesValeurs,
            module: 'organisation',
            metadata: { entiteLabel: fonction.nom, entiteRef: fonction.code },
        });

        return fonction;
    }

    /**
     * Vérifie via CTE récursif PostgreSQL que parentId n'est pas un descendant de entityId
     */
    private async verifierCycleFonction(
        parentId: string,
        entityId: string,
        etablissementId: string,
    ): Promise<boolean> {
        const result = await this.repo.query(`
            WITH RECURSIVE ancestors AS (
                SELECT id, "parentId", 0 AS depth
                FROM fonctions
                WHERE id = $1 AND "etablissementId" = $3
                UNION ALL
                SELECT f.id, f."parentId", a.depth + 1
                FROM fonctions f
                INNER JOIN ancestors a ON f.id = a."parentId"
                WHERE a.depth < 100
            )
            SELECT COUNT(*)::int AS cnt FROM ancestors WHERE id = $2
        `, [parentId, entityId, etablissementId]);
        return (result[0]?.cnt || 0) > 0;
    }

    async delete(id: string, etablissementId: string, utilisateurId?: string): Promise<void> {
        const fonction = await this.findOne(id, etablissementId);
        assertNotSystem(fonction, 'supprimer');

        const enfants = await this.repo.count({ where: { parentId: id } });
        if (enfants > 0) {
            throw new AppError('Impossible de supprimer: cette fonction a des sous-fonctions', 400, 'HAS_CHILDREN');
        }

        const anciennesValeurs = { nom: fonction.nom, code: fonction.code, parentId: fonction.parentId };

        await this.repo.remove(fonction);
        logger.info(`Fonction supprimée: ${anciennesValeurs.nom}`);

        await auditService.log({
            utilisateurId,
            action: AuditAction.FONCTION_DELETE,
            cible: 'Fonction',
            cibleId: id,
            description: `Suppression de la fonction ${anciennesValeurs.nom} (${anciennesValeurs.code})`,
            anciennesValeurs,
            module: 'organisation',
            metadata: { entiteLabel: anciennesValeurs.nom, entiteRef: anciennesValeurs.code },
        });
    }
}

export const fonctionsService = new FonctionsService();
