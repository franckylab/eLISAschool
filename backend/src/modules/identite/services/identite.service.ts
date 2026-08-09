/**
 * ==================================
 * eLISAschool - Service Identité (Dual-Plane)
 * ==================================
 * Modèle C — Auth0 Internalisé
 *
 * CRUD sur la table identites (source unique de vérité).
 * Une identité = un email + credentials + MFA.
 * Peut avoir N memberships (plateforme + établissements).
 */

import { AppDataSource } from '@database/data-source';
import { Identite } from '../entities/identite.entity';
import { UtilisateurPlateforme } from '../entities/utilisateur-plateforme.entity';
import { Membership } from '../entities/membership.entity';
import { StatutIdentite, RolePlateforme, ContexteType } from '@shared/enums/platform-roles.enum';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

const utilisateurPlateformeRepo = AppDataSource.getRepository(UtilisateurPlateforme);
const membershipRepo = AppDataSource.getRepository(Membership);

export class IdentiteService {
    private repo = AppDataSource.getRepository(Identite);

    // =============================================
    // RECHERCHE PAR EMAIL
    // =============================================

    async findByEmail(email: string): Promise<Identite | null> {
        return this.repo.findOne({ where: { email } });
    }

    // =============================================
    // RECHERCHE PAR ID (avec relations)
    // =============================================

    async findById(id: string): Promise<Identite | null> {
        return this.repo.findOne({
            where: { id },
            relations: ['utilisateurPlateforme', 'memberships'],
        });
    }

    // =============================================
    // LISTE PAGINÉE
    // =============================================

    async getListeIdentites(filters: {
        search?: string;
        statut?: StatutIdentite;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
    }) {
        const qb = this.repo.createQueryBuilder('i')
            .leftJoinAndSelect('i.memberships', 'membership')
            .leftJoinAndSelect('i.utilisateurPlateforme', 'up');

        if (filters.search) {
            qb.andWhere(
                '(i.email ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        if (filters.statut) {
            qb.andWhere('i.statut = :statut', { statut: filters.statut });
        }

        const colonnesAutorisees = ['createdAt', 'email', 'statut', 'derniereConnexion'];
        const tri = colonnesAutorisees.includes(filters.sortBy || '') ? filters.sortBy : 'createdAt';

        const [items, total] = await qb
            .orderBy(`i.${tri}`, filters.sortOrder || 'DESC')
            .skip(filters.offset || 0)
            .take(filters.limit || 20)
            .getManyAndCount();

        return { items, total, limit: filters.limit || 20, offset: filters.offset || 0 };
    }

    // =============================================
    // CRÉATION
    // =============================================

    async create(data: {
        email: string;
        motDePasse?: string;
        emailVerifie?: boolean;
        mfaActive?: boolean;
    }): Promise<Identite> {
        // Vérifier unicité email
        const existing = await this.repo.findOne({ where: { email: data.email } });
        if (existing) {
            throw new AppError('Email déjà utilisé', 409, 'EMAIL_ALREADY_EXISTS');
        }

        const identite = this.repo.create({
            email: data.email,
            motDePasseHash: data.motDePasse, // hashé par @BeforeInsert
            emailVerifie: data.emailVerifie ?? false,
            mfaActive: data.mfaActive ?? false,
            statut: StatutIdentite.ACTIF,
        });

        const saved = await this.repo.save(identite);
        logger.info(`[Identite] Créée: ${saved.email} (${saved.id})`);
        return saved;
    }

    // =============================================
    // MISE À JOUR
    // =============================================

    async update(id: string, data: Partial<{
        email: string;
        emailVerifie: boolean;
        mfaActive: boolean;
        mfaSecret: string;
        statut: StatutIdentite;
        motDePasse: string;
    }>): Promise<Identite> {
        const identite = await this.repo.findOne({ where: { id } });
        if (!identite) {
            throw new AppError('Identité non trouvée', 404, 'IDENTITY_NOT_FOUND');
        }

        // Vérifier unicité email si modifié
        if (data.email && data.email !== identite.email) {
            const existing = await this.repo.findOne({ where: { email: data.email } });
            if (existing) {
                throw new AppError('Email déjà utilisé', 409, 'EMAIL_ALREADY_EXISTS');
            }
            identite.email = data.email;
        }

        if (data.emailVerifie !== undefined) identite.emailVerifie = data.emailVerifie;
        if (data.mfaActive !== undefined) identite.mfaActive = data.mfaActive;
        if (data.mfaSecret !== undefined) identite.mfaSecret = data.mfaSecret;
        if (data.statut !== undefined) identite.statut = data.statut;
        if (data.motDePasse) identite.motDePasseHash = data.motDePasse; // hashé par @BeforeInsert

        const saved = await this.repo.save(identite);
        logger.info(`[Identite] Mise à jour: ${saved.id}`);
        return saved;
    }

    // =============================================
    // VÉRIFICATION EMAIL
    // =============================================

    async verifyEmail(id: string): Promise<Identite> {
        return this.update(id, { emailVerifie: true });
    }

    // =============================================
    // DERNIÈRE CONNEXION
    // =============================================

    async updateLastLogin(id: string): Promise<void> {
        await this.repo.update(id, { derniereConnexion: new Date() });
    }

    // =============================================
    // SUPPRESSION (si pas de membership actif)
    // =============================================

    async delete(id: string): Promise<{ success: boolean; message: string }> {
        const identite = await this.repo.findOne({
            where: { id },
            relations: ['memberships'],
        });
        if (!identite) {
            throw new AppError('Identité non trouvée', 404, 'IDENTITY_NOT_FOUND');
        }

        // Vérifier qu'aucun membership actif n'existe
        const activeMemberships = identite.memberships?.filter(m => m.estActif) || [];
        if (activeMemberships.length > 0) {
            throw new AppError(
                'Impossible de supprimer : cette identité possède des memberships actifs',
                409,
                'ACTIVE_MEMBERSHIPS',
            );
        }

        await this.repo.remove(identite);
        logger.info(`[Identite] Supprimée: ${id}`);
        return { success: true, message: 'Identité supprimée' };
    }

    // =============================================
    // KPIs IDENTITÉS
    // =============================================

    async getKpis() {
        const total = await this.repo.count();

        const parStatut = await this.repo
            .createQueryBuilder('i')
            .select('i.statut', 'statut')
            .addSelect('COUNT(*)', 'count')
            .groupBy('i.statut')
            .getRawMany();

        const mfaActif = await this.repo
            .createQueryBuilder('i')
            .where('i."mfaActive" = :mfa', { mfa: true })
            .getCount();

        const emailVerifies = await this.repo
            .createQueryBuilder('i')
            .where('i."emailVerifie" = :v', { v: true })
            .getCount();

        return {
            total,
            parStatut: parStatut.reduce((acc: Record<string, number>, r: any) => {
                acc[r.statut] = parseInt(r.count, 10);
                return acc;
            }, {}),
            mfaActif,
            mfaPourcentage: total > 0 ? Math.round((mfaActif / total) * 100) : 0,
            emailVerifies,
            emailVerifiePourcentage: total > 0 ? Math.round((emailVerifies / total) * 100) : 0,
        };
    }
}

export const identiteService = new IdentiteService();
