/**
 * ==================================
 * eLISAschool - Exemples d'Utilisation de la Pagination v2.0
 * ==================================
 * 
 * Ce fichier montre comment migrer et utiliser le nouveau système
 * de pagination dans différents contextes.
 */

import { z } from 'zod';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';

// Imports du nouveau système
import {
    paginationSchema,
    paginationWithSortSchema,
    searchSchema,
    queryWithSearchSchema,
    createCustomPaginationSchema,
} from '@common/dto/pagination.dto';

import {
    paginateWithRepository,
    paginateWithQueryBuilder,
    paginateWithCustomCount,
    createPaginatedResult,
    validatePaginationParams,
} from '@common/utils/pagination.util';

import {
    sendPaginatedV2,
    sendPaginatedWithLinks,
} from '@common/utils/api-response.util';

// ============================================
// EXEMPLE 1 : DTO Simple
// ============================================

/**
 * Ancienne méthode (dépréciée)
 */
export const oldQueryDto = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
    role: z.string().optional(),
});

/**
 * Nouvelle méthode (recommandée)
 */
export const newQueryDto = paginationSchema
    .merge(searchSchema)
    .extend({
        role: z.string().optional(),
    });

// ============================================
// EXEMPLE 2 : DTO avec Tri
// ============================================

export const queryWithSortDto = paginationWithSortSchema.extend({
    statut: z.enum(['ACTIF', 'INACTIF']).optional(),
    categorie: z.string().optional(),
});

// ============================================
// EXEMPLE 3 : DTO Personnalisé avec Limites Différentes
// ============================================

/**
 * Pour les logs d'audit qui peuvent avoir plus d'éléments
 */
export const auditQueryDto = createCustomPaginationSchema({
    defaultLimit: 50,
    maxLimit: 200,
}).extend({
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
});

// ============================================
// EXEMPLE 4 : Service avec Repository
// ============================================

interface Eleve {
    id: string;
    nom: string;
    prenom: string;
    classeId: string;
}

export class EleveServiceExample {
    private eleveRepository: Repository<Eleve>;

    /**
     * Méthode ANCienne (à ne plus utiliser)
     */
    async findAllOld(page: number, limit: number, classeId?: string) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (classeId) where.classeId = classeId;

        const [items, total] = await this.eleveRepository.findAndCount({
            where,
            skip,
            take: limit,
            order: { nom: 'ASC' },
        });

        return {
            items,
            meta: {
                totalItems: total,
                itemCount: items.length,
                itemsPerPage: limit,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
            },
        };
    }

    /**
     * Méthode NOUVELLE (recommandée)
     */
    async findAllNew(query: z.infer<typeof paginationSchema> & { classeId?: string }) {
        const { page, limit, classeId } = query;

        const where: any = {};
        if (classeId) where.classeId = classeId;

        // Utilisation du helper optimisé
        return paginateWithRepository(this.eleveRepository, {
            where,
            order: { nom: 'ASC' },
            page,
            limit,
        });
    }
}

// ============================================
// EXEMPLE 5 : Service avec QueryBuilder Complexe
// ============================================

export class NoteServiceExample {
    private noteRepository: any; // Repository<Note>

    /**
     * Recherche complexe avec JOINs multiples
     * Utilise le COUNT optimisé pour de meilleures performances
     */
    async findWithFilters(query: z.infer<typeof queryWithSortSchema> & {
        eleveId?: string;
        matiereId?: string;
        periodeId?: string;
        search?: string;
    }) {
        const { page, limit, eleveId, matiereId, periodeId, search, sortBy, sortOrder } = query;

        const qb = this.noteRepository
            .createQueryBuilder('n')
            .innerJoinAndSelect('n.eleve', 'e')
            .innerJoinAndSelect('n.matiere', 'm')
            .innerJoinAndSelect('n.enseignant', 'ens')
            .where('n.statut = :statut', { statut: 'VALIDEE' });

        // Filtres optionnels
        if (eleveId) qb.andWhere('n.eleveId = :eleveId', { eleveId });
        if (matiereId) qb.andWhere('n.matiereId = :matiereId', { matiereId });
        if (periodeId) qb.andWhere('n.periodeId = :periodeId', { periodeId });

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(e.nom ILIKE :search OR e.prenom ILIKE :search OR m.nom ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation (liste blanche)
        const allowedFields = ['createdAt', 'valeur', 'dateEvaluation'];
        const orderField = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
        qb.orderBy(`n.${orderField}`, sortOrder);

        // Pagination avec COUNT optimisé (true car il y a des JOINs)
        return paginateWithQueryBuilder(qb, page, limit, true);
    }
}

// ============================================
// EXEMPLE 6 : Controller avec Réponse Standardisée
// ============================================

export class UtilisateurControllerExample {
    async getUsers(req: Request, res: Response) {
        try {
            // 1. Valider les paramètres de requête
            const query = queryWithSortSchema.parse(req.query);

            // 2. Appeler le service
            const service = new EleveServiceExample();
            const result = await service.findAllNew(query);

            // 3. Retourner la réponse standardisée
            sendPaginatedV2(res, result);

            // OPTIONNEL : Avec en-têtes Link HTTP pour la navigation
            // const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;
            // sendPaginatedWithLinks(res, result, baseUrl, req.query);
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

// ============================================
// EXEMPLE 7 : COUNT Personnalisé pour Très Grosses Tables
// ============================================

export class AuditServiceExample {
    private auditRepo: any;

    /**
     * Pour les tables avec des millions de lignes,
     * on peut utiliser un COUNT encore plus optimisé
     */
    async findAudits(query: z.infer<typeof auditQueryDto>) {
        const { page, limit, dateDebut, dateFin, severity } = query;

        // QueryBuilder principal pour les données
        const dataQb = this.auditRepo
            .createQueryBuilder('audit')
            .orderBy('audit.createdAt', 'DESC');

        // QueryBuilder simplifié pour le COUNT (sans JOINs, sans ORDER BY)
        const countQb = this.auditRepo
            .createQueryBuilder('audit')
            .select('COUNT(*)');

        // Appliquer les mêmes filtres aux deux
        if (dateDebut) {
            dataQb.andWhere('audit.createdAt >= :dateDebut', { dateDebut });
            countQb.andWhere('audit.createdAt >= :dateDebut', { dateDebut });
        }

        if (dateFin) {
            dataQb.andWhere('audit.createdAt <= :dateFin', { dateFin });
            countQb.andWhere('audit.createdAt <= :dateFin', { dateFin });
        }

        if (severity) {
            dataQb.andWhere('audit.severity = :severity', { severity });
            countQb.andWhere('audit.severity = :severity', { severity });
        }

        // Pagination avec COUNT personnalisé
        return paginateWithCustomCount(dataQb, countQb, page, limit);
    }
}

// ============================================
// EXEMPLE 8 : Validation Manuelle dans un Controller
// ============================================

export class ManualValidationExample {
    async getUsers(req: Request, res: Response) {
        try {
            // Validation manuelle si vous ne utilisez pas Zod dans le DTO
            const { page, limit, skip } = validatePaginationParams(
                req.query.page,
                req.query.limit
            );

            console.log(`Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

            // Suite du traitement...
            res.json({ success: true, data: { page, limit } });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

// ============================================
// EXEMPLE 9 : Migration d'un Service Existant
// ============================================

/**
 * AVANT (code typique dans eLISAschool v1.0)
 */
export async function oldStyleService(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.resolve([[], 0]); // Simulé

    return {
        items,
        meta: {
            totalItems: total,
            itemCount: items.length,
            itemsPerPage: limit,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        },
    };
}

/**
 * APRÈS (code recommandé v2.0)
 */
export async function newStyleService(query: z.infer<typeof paginationSchema>) {
    const { page, limit } = query;

    // Le helper s'occupe de tout
    return createPaginatedResult([], 0, page, limit);
}

// ============================================
// EXEMPLE 10 : Pagination avec Filtres Complexes
// ============================================

export const complexFilterSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        // Filtres de date
        dateDebut: z.string().datetime().optional(),
        dateFin: z.string().datetime().optional(),

        // Filtres enum
        statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']).optional(),
        type: z.enum(['TYPE_A', 'TYPE_B', 'TYPE_C']).optional(),

        // Filtres UUID
        categorieId: z.string().uuid().optional(),
        etablissementId: z.string().uuid().optional(),

        // Filtres booléens
        uniquementActifs: z.string()
            .transform((v) => v === 'true')
            .optional(),
    });

export async function complexService(query: z.infer<typeof complexFilterSchema>) {
    const { page, limit, search, statut, type, dateDebut, dateFin } = query;

    const qb = Promise.resolve({ // Simulé
        andWhere: function () { return this; },
        orderBy: function () { return this; },
    }) as any;

    // Construction dynamique des filtres
    if (search) {
        qb.andWhere('entity.nom ILIKE :search', { search: `%${search}%` });
    }

    if (statut) {
        qb.andWhere('entity.statut = :statut', { statut });
    }

    if (type) {
        qb.andWhere('entity.type = :type', { type });
    }

    if (dateDebut) {
        qb.andWhere('entity.createdAt >= :dateDebut', { dateDebut });
    }

    if (dateFin) {
        qb.andWhere('entity.createdAt <= :dateFin', { dateFin });
    }

    return paginateWithQueryBuilder(qb, page, limit, false);
}

// ============================================
// RÉSUMÉ DES BONNES PRATIQUES
// ============================================

/**
 * ✅ FAIRE :
 * 
 * 1. Utiliser les schémas réutilisables de pagination.dto.ts
 * 2. Utiliser paginateWithQueryBuilder() avec useOptimizedCount=true pour les JOINs
 * 3. Valider les champs de tri avec une liste blanche
 * 4. Utiliser sendPaginatedV2() pour les réponses
 * 5. Indexer les colonnes fréquemment filtrées
 * 
 * ❌ NE PAS FAIRE :
 * 
 * 1. Recréer la logique de pagination dans chaque service
 * 2. Charger toutes les données en mémoire avant de paginer
 * 3. Utiliser getManyAndCount() sur des requêtes avec plusieurs JOINs
 * 4. Accepter des noms de colonnes de tri sans validation
 * 5. Hardcoder les limites de pagination
 */
