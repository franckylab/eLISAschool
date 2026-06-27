/**
 * ==================================
 * eLISAschool - Service TypeEnum
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Logique métier pour la gestion dynamique des types enum
 * avec protection des types système
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypeEnum, CategorieEnum } from '../entities';
import { CreateTypeEnumDto, UpdateTypeEnumDto, QueryTypeEnumDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class TypeEnumService {
    private repo: Repository<TypeEnum>;

    constructor() {
        this.repo = AppDataSource.getRepository(TypeEnum);
    }

    /**
     * Créer un nouveau type enum
     * - Vérification de l'unicité (categorie + code)
     * - Attribution automatique de l'établissement
     */
    async create(dto: CreateTypeEnumDto, etablissementId?: string): Promise<TypeEnum> {
        // Vérifier l'unicité du code dans cette catégorie
        const whereClause: any = {
            categorie: dto.categorie,
            code: dto.code,
        };
        if (etablissementId) {
            whereClause.etablissementId = etablissementId;
        } else {
            whereClause.etablissementId = null;
        }
        
        const existing = await this.repo.findOne({
            where: whereClause,
        });

        if (existing) {
            throw new AppError(
                `Le code "${dto.code}" existe déjà dans la catégorie "${dto.categorie}"`,
                409,
                'TYPE_ENUM_EXISTS'
            );
        }

        // Créer le type (personnalisé = !estSysteme)
        const typeEnum = this.repo.create({
            ...dto,
            estSysteme: false, // Toujours false pour les créations utilisateur
            etablissementId,
        });

        await this.repo.save(typeEnum);
        logger.info(`TypeEnum créé: ${dto.categorie}.${dto.code} (établissement: ${etablissementId})`);
        
        return typeEnum;
    }

    /**
     * Récupérer tous les types enum avec pagination et filtres
     * - Filtre par catégorie, estSysteme, estActif
     * - Support multi-tenant (filtre par etablissementId)
     */
    async findAll(query: QueryTypeEnumDto, etablissementId?: string): Promise<PaginatedResult<TypeEnum>> {
        const { page, limit, search, categorie, estSysteme, estActif } = query;

        const qb = this.repo.createQueryBuilder('t')
            .where('1=1');

        // Filtre multi-tenant : types système (null) + types de l'établissement
        if (etablissementId) {
            qb.andWhere('(t.etablissementId = :etablissementId OR t.etablissementId IS NULL)', {
                etablissementId,
            });
        }

        // Filtres optionnels
        if (categorie) {
            qb.andWhere('t.categorie = :categorie', { categorie });
        }

        if (estSysteme !== undefined) {
            qb.andWhere('t.estSysteme = :estSysteme', { estSysteme });
        }

        if (estActif !== undefined) {
            qb.andWhere('t.estActif = :estActif', { estActif });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere('(t.libelle ILIKE :search OR t.code ILIKE :search OR t.description ILIKE :search)', {
                search: `%${search}%`,
            });
        }

        qb.orderBy('t.ordre', 'ASC')
          .addOrderBy('t.createdAt', 'DESC');

        return paginateWithQueryBuilder(qb, { page, limit });
    }

    /**
     * Récupérer un type enum par ID
     * - Vérification de l'appartenance à l'établissement
     */
    async findOne(id: string, etablissementId?: string): Promise<TypeEnum> {
        const typeEnum = await this.repo.findOne({ where: { id } });

        if (!typeEnum) {
            throw new AppError('Type enum non trouvé', 404, 'TYPE_ENUM_NOT_FOUND');
        }

        // Vérification multi-tenant
        if (etablissementId && typeEnum.etablissementId && typeEnum.etablissementId !== etablissementId) {
            throw new AppError('Accès non autorisé à ce type enum', 403, 'FORBIDDEN');
        }

        return typeEnum;
    }

    /**
     * Récupérer tous les types d'une catégorie
     * - Pour affichage dans les dropdowns/formulaires
     */
    async findByCategorie(categorie: CategorieEnum, etablissementId?: string): Promise<TypeEnum[]> {
        const qb = this.repo.createQueryBuilder('t')
            .where('t.categorie = :categorie', { categorie })
            .andWhere('t.estActif = true')
            .orderBy('t.ordre', 'ASC')
            .addOrderBy('t.libelle', 'ASC');

        // Multi-tenant : système + établissement
        if (etablissementId) {
            qb.andWhere('(t.etablissementId = :etablissementId OR t.etablissementId IS NULL)', {
                etablissementId,
            });
        }

        return qb.getMany();
    }

    /**
     * Modifier un type enum
     * - TYPES SYSTÈME : seul le libellé est modifiable
     * - TYPES PERSONNALISÉS : tous les champs sauf code et categorie
     */
    async update(id: string, dto: UpdateTypeEnumDto, etablissementId?: string): Promise<TypeEnum> {
        const typeEnum = await this.findOne(id, etablissementId);

        // PROTECTION DES TYPES SYSTÈME
        if (typeEnum.estSysteme) {
            // Seul le libellé et la description sont modifiables
            const allowedUpdates: Partial<UpdateTypeEnumDto> = {
                libelle: dto.libelle,
                description: dto.description,
            };

            // Vérifier qu'aucun champ interdit n'est modifié
            if (dto.estActif !== undefined || dto.ordre !== undefined) {
                throw new AppError(
                    'Les types système ne peuvent pas être désactivés ou réorganisés',
                    403,
                    'SYSTEM_TYPE_IMMUTABLE'
                );
            }

            Object.assign(typeEnum, allowedUpdates);
        } else {
            // Types personnalisés : modification complète autorisée
            Object.assign(typeEnum, dto);
        }

        await this.repo.save(typeEnum);
        logger.info(`TypeEnum modifié: ${typeEnum.categorie}.${typeEnum.code}`);

        return typeEnum;
    }

    /**
     * Supprimer un type enum
     * - TYPES SYSTÈME : suppression interdite
     * - TYPES PERSONNALISÉS : suppression autorisée si non utilisé
     */
    async delete(id: string, etablissementId?: string): Promise<void> {
        const typeEnum = await this.findOne(id, etablissementId);

        // PROTECTION DES TYPES SYSTÈME
        if (typeEnum.estSysteme) {
            throw new AppError(
                'Impossible de supprimer un type système',
                403,
                'SYSTEM_TYPE_CANNOT_DELETE'
            );
        }

        // TODO: Vérifier si le type est utilisé dans des données existantes
        // Exemple : vérifier si un TYPE_DOCUMENT est référencé dans des documents
        // Pour l'instant, on autorise la suppression sans vérification

        await this.repo.remove(typeEnum);
        logger.info(`TypeEnum supprimé: ${typeEnum.categorie}.${typeEnum.code}`);
    }

    /**
     * Désactiver un type enum personnalisé
     * - Interdit pour les types système
     */
    async toggleActif(id: string, etablissementId?: string): Promise<TypeEnum> {
        const typeEnum = await this.findOne(id, etablissementId);

        if (typeEnum.estSysteme) {
            throw new AppError(
                'Impossible de désactiver un type système',
                403,
                'SYSTEM_TYPE_CANNOT_DEACTIVATE'
            );
        }

        typeEnum.estActif = !typeEnum.estActif;
        await this.repo.save(typeEnum);

        logger.info(`TypeEnum ${typeEnum.estActif ? 'activé' : 'désactivé'}: ${typeEnum.categorie}.${typeEnum.code}`);
        return typeEnum;
    }

    /**
     * Initialiser les types enum système (seed)
     * - Appelé une seule fois lors de l'initialisation
     */
    async initializeSystemTypes(): Promise<void> {
        const systemTypes: Array<{ categorie: CategorieEnum; code: string; libelle: string; description?: string; ordre: number }> = [
            // TYPE_DOCUMENT
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'BULLETIN', libelle: 'Bulletin', ordre: 1 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'CERTIFICAT', libelle: 'Certificat', ordre: 2 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'ATTESTATION', libelle: 'Attestation', ordre: 3 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'CARTE_SCOLAIRE', libelle: 'Carte scolaire', ordre: 4 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'CARTE_CANTINE', libelle: 'Carte cantine', ordre: 5 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'CARTE_TRANSPORT', libelle: 'Carte transport', ordre: 6 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'FORMULAIRE', libelle: 'Formulaire', ordre: 7 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'CONTRAT', libelle: 'Contrat', ordre: 8 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'FACTURE', libelle: 'Facture', ordre: 9 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'RECU', libelle: 'Reçu', ordre: 10 },
            { categorie: CategorieEnum.TYPE_DOCUMENT, code: 'AUTRE', libelle: 'Autre', ordre: 99 },

            // STATUT_REQUETE
            { categorie: CategorieEnum.STATUT_REQUETE, code: 'BROUILLON', libelle: 'Brouillon', ordre: 1 },
            { categorie: CategorieEnum.STATUT_REQUETE, code: 'EN_ATTENTE', libelle: 'En attente', ordre: 2 },
            { categorie: CategorieEnum.STATUT_REQUETE, code: 'EN_COURS', libelle: 'En cours', ordre: 3 },
            { categorie: CategorieEnum.STATUT_REQUETE, code: 'APPROUVE', libelle: 'Approuvé', ordre: 4 },
            { categorie: CategorieEnum.STATUT_REQUETE, code: 'REJETE', libelle: 'Rejeté', ordre: 5 },
            { categorie: CategorieEnum.STATUT_REQUETE, code: 'ANNULE', libelle: 'Annulé', ordre: 6 },

            // STATUT_DOCUMENT
            { categorie: CategorieEnum.STATUT_DOCUMENT, code: 'BROUILLON', libelle: 'Brouillon', ordre: 1 },
            { categorie: CategorieEnum.STATUT_DOCUMENT, code: 'EN_ATTENTE_VALIDATION', libelle: 'En attente de validation', ordre: 2 },
            { categorie: CategorieEnum.STATUT_DOCUMENT, code: 'VALIDE', libelle: 'Validé', ordre: 3 },
            { categorie: CategorieEnum.STATUT_DOCUMENT, code: 'ARCHIVE', libelle: 'Archivé', ordre: 4 },
            { categorie: CategorieEnum.STATUT_DOCUMENT, code: 'SUPPRIME', libelle: 'Supprimé', ordre: 5 },

            // GENRE
            { categorie: CategorieEnum.GENRE, code: 'M', libelle: 'Masculin', ordre: 1 },
            { categorie: CategorieEnum.GENRE, code: 'F', libelle: 'Féminin', ordre: 2 },
            { categorie: CategorieEnum.GENRE, code: 'A', libelle: 'Autre', ordre: 3 },

            // TYPE_ETABLISSEMENT
            { categorie: CategorieEnum.TYPE_ETABLISSEMENT, code: 'MATERNELLE', libelle: 'Maternelle', ordre: 1 },
            { categorie: CategorieEnum.TYPE_ETABLISSEMENT, code: 'PRIMAIRE', libelle: 'Primaire', ordre: 2 },
            { categorie: CategorieEnum.TYPE_ETABLISSEMENT, code: 'COLLEGE', libelle: 'Collège', ordre: 3 },
            { categorie: CategorieEnum.TYPE_ETABLISSEMENT, code: 'LYCEE', libelle: 'Lycée', ordre: 4 },
            { categorie: CategorieEnum.TYPE_ETABLISSEMENT, code: 'MIXTE', libelle: 'Mixte', ordre: 5 },

            // STATUT_UTILISATEUR
            { categorie: CategorieEnum.STATUT_UTILISATEUR, code: 'ACTIF', libelle: 'Actif', ordre: 1 },
            { categorie: CategorieEnum.STATUT_UTILISATEUR, code: 'INACTIF', libelle: 'Inactif', ordre: 2 },
            { categorie: CategorieEnum.STATUT_UTILISATEUR, code: 'SUSPENDU', libelle: 'Suspendu', ordre: 3 },
            { categorie: CategorieEnum.STATUT_UTILISATEUR, code: 'EN_ATTENTE_VALIDATION', libelle: 'En attente de validation', ordre: 4 },
        ];

        let created = 0;
        for (const typeData of systemTypes) {
            const existing = await this.repo.findOne({
                where: {
                    categorie: typeData.categorie,
                    code: typeData.code,
                    estSysteme: true,
                },
            });

            if (!existing) {
                const typeEnum = this.repo.create({
                    ...typeData,
                    estSysteme: true,
                    estActif: true,
                });
                await this.repo.save(typeEnum);
                created++;
            }
        }

        if (created > 0) {
            logger.info(`[TypeEnum] ${created} types système initialisés`);
        }
    }
}

// Singleton exporté
export const typeEnumService = new TypeEnumService();
