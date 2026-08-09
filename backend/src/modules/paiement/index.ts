/**
 * ==================================
 * eLISAschool - Module Paiement
 * ==================================
 * 
 * Multi-Providers Paiement pour la plateforme SaaS.
 * Architecture provider-agnostic avec fallback.
 * 
 * Phase 5 — Refonte SaaS
 * 
 * Providers supportés:
 * - MTN Mobile Money (mobile_money)
 * - Orange Money (mobile_money)
 * - Stripe (card)
 * 
 * Entités:
 * - ProviderConfig: configuration chiffrée par tenant
 * - Transaction: historique des transactions
 * - PaiementWebhook: traçabilité webhooks (idempotence)
 * 
 * Services:
 * - PaiementService: orchestrateur multi-providers
 * 
 * Routes:
 * - /api/paiement/* (authentifié)
 * - /api/paiement/webhooks/:provider (webhooks entrants)
 */

export { paiementController } from './controllers/paiement.controller';
export * from './entities';
export * from './services';
export * from './providers';
