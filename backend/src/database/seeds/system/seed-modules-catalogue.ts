/**
 * ==========================================
 * eLISAschool - Seed : Catalogue modules unifié (migration 200)
 * ==========================================
 *
 * Seed idempotent complet — tous les modules (CRITIQUE, PREMIUM, ADDON).
 * Utilise ON CONFLICT DO NOTHING pour être sûr en re-exécution.
 *
 * Refonte SaaS — Unification Modules (migration 200)
 * EntitlementService = source unique de vérité.
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { ModuleCatalogue, CategorieModule } from '@modules/billing/entities/module-catalogue.entity';
import { logger } from '@common/utils/logger.util';

/**
 * Définition complète de tous les modules du système.
 * Utilisé pour le seed idempotent de modules_catalogue.
 */
const MODULES_CATALOGUE_COMPLET = [
    // =============================================
    // MODULES CRITIQUES — toujours accessibles, bypass entitlement
    // =============================================
    {
        code: 'auth', nom: 'Authentification', nomEn: 'Authentication',
        description: 'Gestion de l\'authentification, JWT, RBAC, sessions',
        categorie: CategorieModule.CRITIQUE, icone: 'Lock',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 1, estSysteme: true,
    },
    {
        code: 'utilisateurs', nom: 'Utilisateurs', nomEn: 'Users',
        description: 'Gestion des utilisateurs et des rôles établissement',
        categorie: CategorieModule.CRITIQUE, icone: 'Users',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: ['auth'], ordre: 2, estSysteme: true,
    },
    {
        code: 'configuration', nom: 'Configuration', nomEn: 'Settings',
        description: 'Configuration système, paramètres, apparence',
        categorie: CategorieModule.CRITIQUE, icone: 'Settings',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 3, estSysteme: true,
    },
    {
        code: 'notifications', nom: 'Notifications', nomEn: 'Notifications',
        description: 'Notifications multi-canal : email, SMS, push, in-app',
        categorie: CategorieModule.CRITIQUE, icone: 'Bell',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 4, estSysteme: true,
    },
    {
        code: 'monitoring', nom: 'Monitoring', nomEn: 'Monitoring',
        description: 'Supervision technique : métriques, alertes, health checks',
        categorie: CategorieModule.CRITIQUE, icone: 'Activity',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 5, estSysteme: true,
    },
    {
        code: 'audit', nom: 'Audit', nomEn: 'Audit',
        description: 'Journal d\'audit complet : actions, modifications, accès',
        categorie: CategorieModule.CRITIQUE, icone: 'FileText',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 6, estSysteme: true,
    },
    {
        code: 'facturation', nom: 'Facturation', nomEn: 'Billing',
        description: 'Facturation SaaS : abonnements, paiements, relances',
        categorie: CategorieModule.CRITIQUE, icone: 'Receipt',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 7, estSysteme: true,
    },
    {
        code: 'groupes-etablissements', nom: 'Groupes Établissements', nomEn: 'School Groups',
        description: 'Gestion des groupes d\'établissements multi-tenant',
        categorie: CategorieModule.CRITIQUE, icone: 'Network',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 8, estSysteme: true,
    },

    // =============================================
    // MODULES PREMIUM — nécessitent abonnement actif
    // =============================================
    {
        code: 'eleves', nom: 'Élèves', nomEn: 'Students',
        description: 'Gestion complète des élèves : inscriptions, dossiers, suivi',
        categorie: CategorieModule.PREMIUM, icone: 'GraduationCap',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: 'starter', dependencies: [], ordre: 10, estSysteme: false,
    },
    {
        code: 'notes', nom: 'Notes & Évaluations', nomEn: 'Grades',
        description: 'Saisie des notes, évaluations, coefficients, barèmes',
        categorie: CategorieModule.PREMIUM, icone: 'Edit',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: 'starter', dependencies: ['eleves'], ordre: 11, estSysteme: false,
    },
    {
        code: 'bulletins', nom: 'Bulletins Scolaires', nomEn: 'Report Cards',
        description: 'Génération et publication des bulletins scolaires',
        categorie: CategorieModule.PREMIUM, icone: 'FileText',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'starter', dependencies: ['notes'], ordre: 12, estSysteme: false,
    },
    {
        code: 'messagerie', nom: 'Messagerie', nomEn: 'Messaging',
        description: 'Messagerie interne : conversations, messages, pièces jointes',
        categorie: CategorieModule.PREMIUM, icone: 'MessageSquare',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: 'starter', dependencies: ['notifications'], ordre: 20, estSysteme: false,
    },
    {
        code: 'emploi-du-temps', nom: 'Emploi du Temps', nomEn: 'Timetable',
        description: 'Planification des cours, créneaux horaires, salles',
        categorie: CategorieModule.PREMIUM, icone: 'Calendar',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['eleves'], ordre: 21, estSysteme: false,
    },
    {
        code: 'orientation', nom: 'Orientation', nomEn: 'Guidance',
        description: 'Orientation des élèves : profil, suggestions, RDV',
        categorie: CategorieModule.PREMIUM, icone: 'Compass',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'pro', dependencies: ['notes'], ordre: 22, estSysteme: false,
    },
    {
        code: 'cantine', nom: 'Cantine', nomEn: 'Cafeteria',
        description: 'Menus, inscriptions, solde, consommation',
        categorie: CategorieModule.PREMIUM, icone: 'Utensils',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['eleves'], ordre: 30, estSysteme: false,
    },
    {
        code: 'transport', nom: 'Transport Scolaire', nomEn: 'School Transport',
        description: 'Lignes, inscriptions, présences QR code',
        categorie: CategorieModule.PREMIUM, icone: 'Bus',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['eleves'], ordre: 31, estSysteme: false,
    },
    {
        code: 'finances', nom: 'Finances Scolaires', nomEn: 'School Finances',
        description: 'Frais scolaires, paiements, relances, avoirs',
        categorie: CategorieModule.PREMIUM, icone: 'DollarSign',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'starter', dependencies: ['eleves'], ordre: 32, estSysteme: false,
    },
    {
        code: 'comptabilite', nom: 'Comptabilité', nomEn: 'Accounting',
        description: 'Comptabilité générale : journal, grand livre, bilan',
        categorie: CategorieModule.PREMIUM, icone: 'Calculator',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'pro', dependencies: ['finances'], ordre: 33, estSysteme: false,
    },
    {
        code: 'personnel', nom: 'Personnel RH', nomEn: 'HR Staff',
        description: 'Gestion du personnel : dossiers, contrats, postes',
        categorie: CategorieModule.PREMIUM, icone: 'UserCheck',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['auth'], ordre: 50, estSysteme: false,
    },

    // =============================================
    // MODULES ADDON — souscriptibles en supplément
    // =============================================
    {
        code: 'cms', nom: 'Site Web (CMS)', nomEn: 'Website (CMS)',
        description: 'Pages publiques white-label : galerie, contact, inscriptions',
        categorie: CategorieModule.ADDON, icone: 'Globe',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: null, dependencies: [], ordre: 40, estSysteme: false,
    },
    {
        code: 'clubs', nom: 'Clubs & Activités', nomEn: 'Clubs',
        description: 'Inscription aux clubs, limites, approbations',
        categorie: CategorieModule.ADDON, icone: 'Heart',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: null, dependencies: ['eleves'], ordre: 41, estSysteme: false,
    },
    {
        code: 'gamification', nom: 'Gamification', nomEn: 'Gamification',
        description: 'Points, badges, classement, récompenses',
        categorie: CategorieModule.ADDON, icone: 'Trophy',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: null, dependencies: ['eleves'], ordre: 42, estSysteme: false,
    },
    {
        code: 'bibliotheque', nom: 'Bibliothèque', nomEn: 'Library',
        description: 'Gestion de la bibliothèque : ouvrages, prêts, retours',
        categorie: CategorieModule.ADDON, icone: 'BookOpen',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: null, dependencies: ['eleves'], ordre: 43, estSysteme: false,
    },
    {
        code: 'cartes', nom: 'Cartes & Badges', nomEn: 'Cards',
        description: 'Cartes d\'identité, badges QR, expiration, renouvellement',
        categorie: CategorieModule.ADDON, icone: 'CreditCard',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: null, dependencies: ['eleves'], ordre: 60, estSysteme: false,
    },
    {
        code: 'scoring', nom: 'Scoring & KPI', nomEn: 'Scoring',
        description: 'Indicateurs de performance, scoring multi-critères',
        categorie: CategorieModule.ADDON, icone: 'BarChart2',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'pro', dependencies: ['notes', 'gamification'], ordre: 70, estSysteme: false,
    },
];

/**
 * Seed idempotent complet — tous les modules (CRITIQUE, PREMIUM, ADDON).
 * @param force Si true, réinitialise le catalogue (supprime puis réinsère)
 */
export async function seedModulesCatalogue(force: boolean = false): Promise<number> {
    const repo = AppDataSource.getRepository(ModuleCatalogue);
    const count = await repo.count();

    if (count > 0 && !force) {
        logger.info(`📦 Catalogue modules : ${count} entrées existantes (seed ignoré, utiliser force=true pour réinitialiser)`);
        return count;
    }

    if (force && count > 0) {
        logger.info(`🔄 Réinitialisation du catalogue modules (${count} entrées supprimées)`);
        await repo.clear();
    }

    let inserted = 0;
    for (const mod of MODULES_CATALOGUE_COMPLET) {
        const existing = await repo.findOne({ where: { code: mod.code } });
        if (!existing) {
            const entity = repo.create({
                code: mod.code,
                nom: mod.nom,
                nomEn: mod.nomEn,
                description: mod.description,
                categorie: mod.categorie,
                icone: mod.icone,
                prixMensuel: mod.prixMensuel,
                prixAnnuel: mod.prixAnnuel,
                estFacturable: mod.estFacturable,
                estSouscriptible: mod.estSouscriptible,
                actifParDefaut: mod.actifParDefaut,
                planMinimal: mod.planMinimal,
                dependencies: mod.dependencies,
                ordre: mod.ordre,
                estSysteme: mod.estSysteme,
                estActif: true,
            });
            await repo.save(entity);
            inserted++;
        }
    }

    const total = await repo.count();
    logger.info(`✅ Seed catalogue modules terminé : ${inserted} ajoutés, ${total} total`);
    return total;
}

export default seedModulesCatalogue;
