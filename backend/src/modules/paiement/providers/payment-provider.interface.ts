/**
 * ==================================
 * eLISAschool - Interface PaymentProvider
 * ==================================
 * 
 * Contrat commun pour tous les providers de paiement.
 * Permet l'orchestration multi-providers avec fallback.
 * 
 * Phase 5.2 — Refonte SaaS
 */

export type PaymentMethod = 'mobile_money' | 'card' | 'bank_transfer';

export interface InitierPaiementDTO {
    montant: number;
    devise: string;
    reference: string; // Référence interne (idempotence key)
    description: string;
    methodePaiement: PaymentMethod;
    returnUrl?: string;
    notifyUrl?: string;
    customerPhone?: string;
    customerEmail?: string;
    metadata?: Record<string, any>;
}

export interface PaiementResult {
    success: boolean;
    reference: string; // Référence interne
    referenceProvider?: string; // Référence côté provider
    urlPaiement?: string; // URL de redirection
    statut: 'INITIEE' | 'EN_ATTENTE' | 'REUSSIE' | 'ECHEC';
    message?: string;
    metadata?: Record<string, any>;
}

export interface StatutPaiement {
    reference: string;
    referenceProvider?: string;
    statut: 'INITIEE' | 'EN_ATTENTE' | 'REUSSIE' | 'ECHEC' | 'EXPIREE' | 'REMBOURSEE';
    montant?: number;
    datePaiement?: Date;
}

export interface WebhookResult {
    success: boolean;
    webhookId: string; // ID unique pour idempotence
    reference?: string; // Référence interne liée
    referenceProvider?: string;
    statut: 'REUSSIE' | 'ECHEC' | 'EN_ATTENTE' | 'REMBOURSEE';
    montant?: number;
    message?: string;
}

export interface RemboursementResult {
    success: boolean;
    reference: string;
    referenceProvider?: string;
    montantRembourse: number;
    statut: 'REUSSIE' | 'EN_ATTENTE' | 'ECHEC';
    message?: string;
}

/**
 * Interface PaymentProvider — contrat commun pour tous les providers.
 * Chaque provider doit implémenter ces méthodes.
 */
export interface PaymentProvider {
    readonly name: string;
    readonly displayName: string;
    readonly supportedMethods: PaymentMethod[];

    /**
     * Initialise un paiement et retourne une URL de redirection ou un code USSD.
     */
    initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult>;

    /**
     * Vérifie le statut d'un paiement auprès du provider.
     */
    verifierStatut(reference: string, credentials: Record<string, any>): Promise<StatutPaiement>;

    /**
     * Traite un webhook entrant du provider.
     * Vérifie la signature et extrait les informations pertinentes.
     */
    traiterWebhook(payload: any, signature: string | undefined, credentials: Record<string, any>): Promise<WebhookResult>;

    /**
     * Initie un remboursement.
     */
    initierRemboursement(reference: string, montant: number, credentials: Record<string, any>): Promise<RemboursementResult>;

    /**
     * Vérifie si le provider est correctement configuré pour un tenant.
     */
    estConfigure(credentials: Record<string, any>): Promise<boolean>;
}
