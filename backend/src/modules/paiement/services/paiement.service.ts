/**
 * ==================================
 * eLISAschool - Service Paiement (Orchestrateur)
 * ==================================
 * 
 * Orchestre les paiements multi-providers avec fallback,
 * retry et gestion des configurations par tenant.
 * 
 * Phase 5.1 — Refonte SaaS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { ProviderConfig, Transaction, StatutTransaction, TypeTransaction, PaiementWebhook, StatutWebhook } from '../entities';
import {
    PaymentProvider,
    PaymentMethod,
    InitierPaiementDTO,
    PaiementResult,
    StatutPaiement,
    RemboursementResult,
} from '../providers';
import { MtnMomoProvider } from '../providers/mtn-momo.provider';
import { StripeProvider } from '../providers/stripe.provider';
import { OrangeMoneyProvider } from '../providers/orange-money.provider';
import crypto from 'crypto';
import { encryptJSON, decryptJSON, isEncrypted } from '@common/utils/encryption.util';

// Chiffrement AES-256 pour les credentials (legacy — migré vers encryption.util)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-prod-32c';
const ALGORITHM_LEGACY = 'aes-256-cbc';
const IV_LENGTH_LEGACY = 16;

export class PaiementService {
    private configRepo: Repository<ProviderConfig>;
    private transactionRepo: Repository<Transaction>;
    private webhookRepo: Repository<PaiementWebhook>;
    private providers: Map<string, PaymentProvider>;

    constructor() {
        this.configRepo = AppDataSource.getRepository(ProviderConfig);
        this.transactionRepo = AppDataSource.getRepository(Transaction);
        this.webhookRepo = AppDataSource.getRepository(PaiementWebhook);

        // Registry des providers disponibles
        this.providers = new Map<string, PaymentProvider>();
        this.providers.set('mtn-momo', new MtnMomoProvider());
        this.providers.set('stripe', new StripeProvider());
        this.providers.set('orange-money', new OrangeMoneyProvider());
    }

    // =============================================
    // PAIEMENT
    // =============================================

    /**
     * Initie un paiement via le provider choisi.
     */
    async initierPaiement(
        etablissementId: string,
        providerName: string,
        dto: Omit<InitierPaiementDTO, 'reference'>,
        factureId?: string
    ): Promise<Transaction> {
        // Vérifier que le provider existe
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} non supporté`);
        }

        // Récupérer la configuration du provider pour cet établissement
        const config = await this.configRepo.findOne({
            where: { etablissementId, providerName, actif: true },
        });

        if (!config) {
            throw new Error(`Provider ${providerName} non configuré pour cet établissement`);
        }

        // Déchiffrer les credentials
        const credentials = this.dechiffrerCredentials(config.credentials);

        // Générer une référence unique
        const reference = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

        // Créer la transaction
        const transaction = this.transactionRepo.create({
            reference,
            etablissementId,
            factureId,
            type: TypeTransaction.PAIEMENT,
            montant: dto.montant,
            devise: dto.devise,
            provider: providerName,
            methodePaiement: dto.methodePaiement,
            statut: StatutTransaction.INITIEE,
            description: dto.description,
            dateExpiration: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        });

        const savedTx = await this.transactionRepo.save(transaction);

        // Appeler le provider
        const fullDto: InitierPaiementDTO = {
            ...dto,
            reference,
            notifyUrl: dto.notifyUrl || `${process.env.API_URL || 'http://localhost:3000'}/api/paiement/webhooks/${providerName}`,
        };

        const result = await provider.initierPaiement(fullDto, credentials);

        // Mettre à jour la transaction
        if (result.success) {
            savedTx.statut = result.statut === 'INITIEE' ? StatutTransaction.EN_ATTENTE : this.mapStatut(result.statut);
            savedTx.referenceProvider = result.referenceProvider;
            savedTx.urlPaiement = result.urlPaiement;
            savedTx.metadata = JSON.stringify(result.metadata || {});
        } else {
            savedTx.statut = StatutTransaction.ECHEC;
            savedTx.metadata = JSON.stringify({ error: result.message });
        }

        await this.transactionRepo.save(savedTx);

        logger.info(
            `[Paiement] Initiation — Provider: ${providerName} — Référence: ${reference} ` +
            `— Montant: ${dto.montant} ${dto.devise} — Succès: ${result.success}`
        );

        return savedTx;
    }

    /**
     * Vérifie le statut d'une transaction.
     */
    async verifierStatut(reference: string): Promise<StatutPaiement> {
        const transaction = await this.transactionRepo.findOne({ where: { reference } });
        if (!transaction) {
            throw new Error(`Transaction ${reference} introuvable`);
        }

        const config = await this.configRepo.findOne({
            where: { etablissementId: transaction.etablissementId, providerName: transaction.provider, actif: true },
        });

        if (!config) {
            return { reference, statut: transaction.statut as any };
        }

        const credentials = this.dechiffrerCredentials(config.credentials);
        const provider = this.providers.get(transaction.provider);
        if (!provider) {
            return { reference, statut: transaction.statut as any };
        }

        const statut = await provider.verifierStatut(
            transaction.referenceProvider || reference,
            credentials
        );

        // Mettre à jour la transaction si le statut a changé
        const nouveauStatut = this.mapStatut(statut.statut);
        if (nouveauStatut !== transaction.statut) {
            transaction.statut = nouveauStatut;
            if (statut.datePaiement) transaction.datePaiement = statut.datePaiement;
            await this.transactionRepo.save(transaction);
        }

        return statut;
    }

    // =============================================
    // WEBHOOKS (idempotent)
    // =============================================

    /**
     * Traite un webhook entrant d'un provider.
     * Garantit le traitement idempotent.
     */
    async traiterWebhook(
        providerName: string,
        payload: any,
        signature?: string
    ): Promise<PaiementWebhook> {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} non supporté`);
        }

        // Extraire un ID unique du webhook pour idempotence
        const webhookId = payload.id || payload.transaction_id || payload.referenceId || `wh-${Date.now()}`;

        // Vérifier si ce webhook a déjà été traité
        const existing = await this.webhookRepo.findOne({
            where: { provider: providerName, webhookId },
        });

        if (existing && existing.statut === StatutWebhook.TRAITE) {
            logger.info(`[Paiement] Webhook doublon ignoré — ${providerName}:${webhookId}`);
            return existing;
        }

        // Créer l'enregistrement webhook
        const webhook = this.webhookRepo.create({
            provider: providerName,
            webhookId,
            payload: JSON.stringify(payload),
            signature: signature || null,
            statut: StatutWebhook.RECU,
        });

        // Trouver la configuration pour déchiffrer les credentials
        // (les webhooks n'ont pas d'etablissementId au début)
        let credentials: Record<string, any> = {};
        const configs = await this.configRepo.find({
            where: { providerName, actif: true },
        });

        if (configs.length > 0) {
            try {
                credentials = this.dechiffrerCredentials(configs[0].credentials);
            } catch (e) {
                // Ignorer si le déchiffrement échoue
            }
        }

        // Traiter le webhook via le provider
        try {
            const result = await provider.traiterWebhook(payload, signature, credentials);

            webhook.statut = StatutWebhook.TRAITE;
            webhook.signatureValide = true;

            // Mettre à jour la transaction liée
            if (result.reference) {
                const transaction = await this.transactionRepo.findOne({
                    where: { reference: result.reference },
                });

                if (transaction) {
                    webhook.transactionId = transaction.id;
                    webhook.etablissementId = transaction.etablissementId;
                    transaction.statut = this.mapStatut(result.statut);
                    if (result.montant) {
                        transaction.datePaiement = new Date();
                    }
                    await this.transactionRepo.save(transaction);

                    // Si paiement réussi, mettre à jour la facture liée
                    if (result.statut === 'REUSSIE' && transaction.factureId) {
                        await this.mettreAJourFacture(transaction.factureId, result.montant || Number(transaction.montant));
                    }
                }
            }
        } catch (error: any) {
            webhook.statut = StatutWebhook.ERREUR;
            webhook.erreur = error.message;
            webhook.tentativesTraitement += 1;
            logger.error(`[Paiement] Erreur traitement webhook ${webhookId}: ${error.message}`);
        }

        return this.webhookRepo.save(webhook);
    }

    // =============================================
    // CONFIGURATION PROVIDERS
    // =============================================

    /**
     * Configure un provider pour un établissement.
     */
    async configurerProvider(
        etablissementId: string,
        providerName: string,
        channel: string,
        credentials: Record<string, any>,
        options?: { sandbox?: boolean; webhookSecret?: string }
    ): Promise<ProviderConfig> {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} non supporté`);
        }

        // Vérifier que les credentials sont valides
        const estConfigure = await provider.estConfigure(credentials);
        if (!estConfigure) {
            throw new Error(`Credentials invalides pour ${providerName}`);
        }

        // Chiffrer les credentials
        const encryptedCredentials = this.chiffrerCredentials(credentials);

        // Upsert
        let config = await this.configRepo.findOne({
            where: { etablissementId, providerName },
        });

        if (config) {
            config.credentials = encryptedCredentials;
            config.channel = channel;
            config.sandbox = options?.sandbox ?? config.sandbox;
            config.webhookSecret = options?.webhookSecret;
            config.actif = true;
        } else {
            config = this.configRepo.create({
                etablissementId,
                providerName,
                channel,
                credentials: encryptedCredentials,
                sandbox: options?.sandbox ?? false,
                webhookSecret: options?.webhookSecret,
                actif: true,
            });
        }

        return this.configRepo.save(config);
    }

    /**
     * Liste les providers configurés pour un établissement.
     */
    async getProvidersConfigures(etablissementId: string): Promise<ProviderConfig[]> {
        const configs = await this.configRepo.find({
            where: { etablissementId },
        });

        // Ne pas exposer les credentials chiffrées
        return configs.map((c) => ({
            ...c,
            credentials: '***',
        }));
    }

    /**
     * Liste tous les providers disponibles.
     */
    getProvidersDisponibles(): Array<{ name: string; displayName: string; supportedMethods: PaymentMethod[] }> {
        return Array.from(this.providers.values()).map((p) => ({
            name: p.name,
            displayName: p.displayName,
            supportedMethods: p.supportedMethods,
        }));
    }

    /**
     * Récupère l'historique des transactions.
     */
    async getTransactions(etablissementId: string): Promise<Transaction[]> {
        return this.transactionRepo.find({
            where: { etablissementId },
            order: { createdAt: 'DESC' },
        });
    }

    // =============================================
    // UTILITAIRES
    // =============================================

    /**
     * Chiffre les credentials avec AES-256-GCM (centralisé).
     * Phase P5.3 — Refonte SaaS v6
     */
    private chiffrerCredentials(data: Record<string, any>): string {
        return encryptJSON(data);
    }

    /**
     * Déchiffre les credentials avec compatibilité ascendante.
     * Supporte le nouveau format (AES-256-GCM) et l'ancien (AES-256-CBC hex).
     */
    private dechiffrerCredentials(encrypted: string): Record<string, any> {
        // Nouveau format (v6) : iv:tag:encrypted en base64
        if (isEncrypted(encrypted)) {
            const result = decryptJSON(encrypted);
            if (result) return result;
        }

        // Legacy format (v5) : iv_hex:data_hex en AES-256-CBC
        const [ivHex, data] = encrypted.split(':');
        if (ivHex && data) {
            const iv = Buffer.from(ivHex, 'hex');
            const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
            const decipher = crypto.createDecipheriv(ALGORITHM_LEGACY, key, iv);
            let decrypted = decipher.update(data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }

        throw new Error('Format de credentials non reconnu');
    }

    private mapStatut(statut: string): StatutTransaction {
        switch (statut) {
            case 'REUSSIE': return StatutTransaction.REUSSIE;
            case 'ECHEC': return StatutTransaction.ECHEC;
            case 'EXPIREE': return StatutTransaction.EXPIREE;
            case 'REMBOURSEE': return StatutTransaction.REMBOURSEE;
            case 'EN_ATTENTE': return StatutTransaction.EN_ATTENTE;
            default: return StatutTransaction.INITIEE;
        }
    }

    private async mettreAJourFacture(factureId: string, montantPaye: number): Promise<void> {
        try {
            const { Facture, StatutFacture } = await import('@modules/billing/entities');
            const factureRepo = AppDataSource.getRepository(Facture);
            const facture = await factureRepo.findOne({ where: { id: factureId } });

            if (facture) {
                facture.montantPaye = Number(facture.montantPaye) + montantPaye;
                if (facture.montantPaye >= Number(facture.montantTotal)) {
                    facture.statut = StatutFacture.PAYEE;
                    facture.datePaiement = new Date();
                } else {
                    facture.statut = StatutFacture.PARTIELLEMENT_PAYEE;
                }
                await factureRepo.save(facture);
            }
        } catch (error: any) {
            logger.error(`[Paiement] Erreur mise à jour facture: ${error.message}`);
        }
    }
}

export default PaiementService;
