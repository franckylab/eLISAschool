/**
 * ==================================
 * eLISAschool - Service ProviderPaiement
 * ==================================
 * 
 * Gestion des providers de paiement au niveau plateforme.
 * CRUD + chiffrement credentials + test connexion + assignments.
 * 
 * Lot D v7 — Refonte SaaS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ProviderPaiement, TypeProviderPaiement } from '../entities/provider-paiement.entity';
import { ProviderAssignment, ScopeAssignment } from '../entities/provider-assignment.entity';
import { encrypt, decrypt } from '@common/utils/encryption.util';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface ProviderPaiementDTO {
    nom: string;
    slug: string;
    type: TypeProviderPaiement;
    icone?: string;
    description?: string;
    canaux: string[];
    credentials: Record<string, any>; // JSON clair → sera chiffré
    webhookSecret?: string; // sera chiffré
    sandbox?: boolean;
    actif?: boolean;
    metadata?: Record<string, any>;
}

export class ProviderPaiementService {
    private providerRepo: Repository<ProviderPaiement>;
    private assignmentRepo: Repository<ProviderAssignment>;

    constructor() {
        this.providerRepo = AppDataSource.getRepository(ProviderPaiement);
        this.assignmentRepo = AppDataSource.getRepository(ProviderAssignment);
    }

    // ─── CRUD Providers ──────────────────────────────────────────

    async create(data: ProviderPaiementDTO, creePar?: string): Promise<ProviderPaiement> {
        // Vérifier unicité du slug
        const existing = await this.providerRepo.findOne({ where: { slug: data.slug } });
        if (existing) {
            throw new AppError(`Un provider avec le slug '${data.slug}' existe déjà`, 409, 'PROVIDER_SLUG_EXISTS');
        }

        // Chiffrer les credentials
        const credentialsChiffrees = encrypt(JSON.stringify(data.credentials));
        const webhookSecretChiffre = data.webhookSecret ? encrypt(data.webhookSecret) : undefined;

        const provider = this.providerRepo.create({
            nom: data.nom,
            slug: data.slug,
            type: data.type,
            icone: data.icone,
            description: data.description,
            canaux: data.canaux,
            credentials: credentialsChiffrees,
            webhookSecret: webhookSecretChiffre,
            sandbox: data.sandbox ?? true,
            actif: data.actif ?? true,
            metadata: data.metadata,
            creePar,
        });

        await this.providerRepo.save(provider);
        logger.info(`[ProviderPaiement] Provider créé: ${provider.nom} (${provider.slug})`);

        // Retourner sans les credentials chiffrées
        return this.sanitizeProvider(provider);
    }

    async getAll(): Promise<ProviderPaiement[]> {
        const providers = await this.providerRepo.find({ order: { nom: 'ASC' } });
        return providers.map(p => this.sanitizeProvider(p));
    }

    async getActive(): Promise<ProviderPaiement[]> {
        const providers = await this.providerRepo.find({
            where: { actif: true },
            order: { nom: 'ASC' },
        });
        return providers.map(p => this.sanitizeProvider(p));
    }

    async getById(id: string): Promise<ProviderPaiement> {
        const provider = await this.providerRepo.findOne({ where: { id } });
        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }
        return this.sanitizeProvider(provider);
    }

    async getBySlug(slug: string): Promise<ProviderPaiement> {
        const provider = await this.providerRepo.findOne({ where: { slug } });
        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }
        return this.sanitizeProvider(provider);
    }

    async update(id: string, data: Partial<ProviderPaiementDTO>): Promise<ProviderPaiement> {
        const provider = await this.providerRepo.findOne({ where: { id } });
        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }

        // Mise à jour des champs simples
        if (data.nom !== undefined) provider.nom = data.nom;
        if (data.type !== undefined) provider.type = data.type;
        if (data.icone !== undefined) provider.icone = data.icone;
        if (data.description !== undefined) provider.description = data.description;
        if (data.canaux !== undefined) provider.canaux = data.canaux;
        if (data.sandbox !== undefined) provider.sandbox = data.sandbox;
        if (data.actif !== undefined) provider.actif = data.actif;
        if (data.metadata !== undefined) provider.metadata = data.metadata;

        // Chiffrer les nouvelles credentials si fournies
        if (data.credentials !== undefined) {
            provider.credentials = encrypt(JSON.stringify(data.credentials));
        }
        if (data.webhookSecret !== undefined) {
            provider.webhookSecret = data.webhookSecret ? encrypt(data.webhookSecret) : undefined;
        }

        await this.providerRepo.save(provider);
        logger.info(`[ProviderPaiement] Provider mis à jour: ${provider.id}`);

        return this.sanitizeProvider(provider);
    }

    async delete(id: string): Promise<void> {
        const provider = await this.providerRepo.findOne({ where: { id } });
        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }
        await this.providerRepo.remove(provider);
        logger.info(`[ProviderPaiement] Provider supprimé: ${provider.id}`);
    }

    // ─── Test connexion ──────────────────────────────────────────

    async testConnexion(id: string): Promise<{ success: boolean; message: string }> {
        const provider = await this.providerRepo.findOne({ where: { id } });
        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }

        try {
            // Déchiffrer les credentials
            const credentials = JSON.parse(decrypt(provider.credentials));

            // Test basique selon le type de provider
            // En production, implémenter les tests spécifiques par provider
            switch (provider.slug) {
                case 'stripe':
                    // Test Stripe API key
                    if (!credentials.secretKey) {
                        return { success: false, message: 'Clé secrète manquante' };
                    }
                    return { success: true, message: 'Connexion Stripe OK (simulation)' };

                case 'paystack':
                    if (!credentials.secretKey) {
                        return { success: false, message: 'Clé secrète manquante' };
                    }
                    return { success: true, message: 'Connexion Paystack OK (simulation)' };

                case 'flutterwave':
                    if (!credentials.secretKey) {
                        return { success: false, message: 'Clé secrète manquante' };
                    }
                    return { success: true, message: 'Connexion Flutterwave OK (simulation)' };

                case 'wave':
                    if (!credentials.apiKey) {
                        return { success: false, message: 'API key manquante' };
                    }
                    return { success: true, message: 'Connexion Wave OK (simulation)' };

                case 'mtn_momo':
                    if (!credentials.subscriptionKey) {
                        return { success: false, message: 'Subscription key manquante' };
                    }
                    return { success: true, message: 'Connexion MTN MoMo OK (simulation)' };

                case 'orange_money':
                    if (!credentials.apiKey) {
                        return { success: false, message: 'API key manquante' };
                    }
                    return { success: true, message: 'Connexion Orange Money OK (simulation)' };

                case 'manuel':
                    return { success: true, message: 'Provider manuel — pas de connexion à tester' };

                default:
                    return { success: true, message: 'Test non implémenté pour ce provider' };
            }
        } catch (error) {
            logger.error(`[ProviderPaiement] Erreur test connexion ${provider.slug}`, error);
            return { success: false, message: 'Erreur lors du test de connexion' };
        }
    }

    // ─── Assignments ─────────────────────────────────────────────

    async getAssignments(providerId: string): Promise<ProviderAssignment[]> {
        return this.assignmentRepo.find({
            where: { providerId },
            relations: ['plan'],
            order: { priorite: 'DESC' },
        });
    }

    async assign(data: {
        providerId: string;
        scope: ScopeAssignment;
        planId?: string;
        etablissementId?: string;
        priorite?: number;
    }): Promise<ProviderAssignment> {
        // Vérifier que le provider existe
        const provider = await this.providerRepo.findOne({ where: { id: data.providerId } });
        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }

        // Upsert
        let assignment = await this.assignmentRepo.findOne({
            where: {
                providerId: data.providerId,
                scope: data.scope,
                planId: data.planId ?? undefined,
                etablissementId: data.etablissementId ?? undefined,
            },
        });

        if (assignment) {
            assignment.actif = true;
            if (data.priorite !== undefined) assignment.priorite = data.priorite;
        } else {
            assignment = this.assignmentRepo.create({
                providerId: data.providerId,
                scope: data.scope,
                planId: data.planId,
                etablissementId: data.etablissementId,
                priorite: data.priorite ?? 0,
                actif: true,
            });
        }

        await this.assignmentRepo.save(assignment);
        logger.info(`[ProviderPaiement] Assignment créé: ${data.providerId} → ${data.scope}`);
        return assignment;
    }

    async unassign(assignmentId: string): Promise<void> {
        const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId } });
        if (!assignment) {
            throw new AppError('Assignment non trouvé', 404, 'ASSIGNMENT_NOT_FOUND');
        }
        await this.assignmentRepo.remove(assignment);
        logger.info(`[ProviderPaiement] Assignment supprimé: ${assignmentId}`);
    }

    /**
     * Résout le provider applicable pour un établissement/plan.
     * Cascade : établissement → plan → global.
     */
    async resolveProvider(etablissementId: string, planId?: string): Promise<ProviderPaiement | null> {
        // 1. Chercher assignment établissement
        if (etablissementId) {
            const etabAssignment = await this.assignmentRepo.findOne({
                where: { etablissementId, scope: ScopeAssignment.ETABLISSEMENT, actif: true },
                relations: ['provider'],
                order: { priorite: 'DESC' },
            });
            if (etabAssignment?.provider?.actif) {
                return this.sanitizeProvider(etabAssignment.provider);
            }
        }

        // 2. Chercher assignment plan
        if (planId) {
            const planAssignment = await this.assignmentRepo.findOne({
                where: { planId, scope: ScopeAssignment.PLAN, actif: true },
                relations: ['provider'],
                order: { priorite: 'DESC' },
            });
            if (planAssignment?.provider?.actif) {
                return this.sanitizeProvider(planAssignment.provider);
            }
        }

        // 3. Fallback global
        const globalAssignment = await this.assignmentRepo.findOne({
            where: { scope: ScopeAssignment.GLOBAL, actif: true },
            relations: ['provider'],
            order: { priorite: 'DESC' },
        });
        if (globalAssignment?.provider?.actif) {
            return this.sanitizeProvider(globalAssignment.provider);
        }

        return null;
    }

    /**
     * Déchiffre les credentials d'un provider pour usage interne.
     */
    async getDecryptedCredentials(providerId: string): Promise<Record<string, any>> {
        const provider = await this.providerRepo.findOne({ where: { id: providerId } });
        if (!provider) {
            throw new AppError('Provider non trouvé', 404, 'PROVIDER_NOT_FOUND');
        }
        return JSON.parse(decrypt(provider.credentials));
    }

    // ─── Helpers ─────────────────────────────────────────────────

    /**
     * Sanitize : retire les credentials chiffrées de la réponse API.
     */
    private sanitizeProvider(provider: ProviderPaiement): ProviderPaiement {
        const sanitized = { ...provider };
        // Masquer les credentials (ne jamais les envoyer en clair)
        (sanitized as any).credentials = '***CHIFFRÉ***';
        if (sanitized.webhookSecret) {
            (sanitized as any).webhookSecret = '***CHIFFRÉ***';
        }
        return sanitized;
    }
}

export default ProviderPaiementService;
export const providerPaiementService = new ProviderPaiementService();
