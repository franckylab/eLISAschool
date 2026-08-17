/**
 * ==========================================
 * eLISAschool - Seed : Catalogue modules unifié (migration 200)
 * ==========================================
 *
 * Seed idempotent complet — tous les modules (GRATUIT | PAYANT).
 * Utilise ON CONFLICT DO NOTHING pour être sûr en re-exécution.
 *
 * Refonte v3 (migration 213) : classification binaire GRATUIT/PAYANT
 * (fin BASE/PREMIUM/ADDON) + colonne estCritique.
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
    // MODULES GRATUITS — sans paiement (critiques = toujours accessibles)
    // =============================================
    {
        code: 'auth', nom: 'Authentification', nomEn: 'Authentication',
        description: 'Gestion de l\'authentification, JWT, RBAC, sessions',
        categorie: CategorieModule.GRATUIT, icone: 'Lock', estCritique: true,
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 1, estSysteme: true,
        config: { sessionDuration: 1440, maxLoginAttempts: 5, lockoutDuration: 15, require2FA: false, passwordMinLength: 8 },
    },
    {
        code: 'utilisateurs', nom: 'Utilisateurs', nomEn: 'Users',
        description: 'Gestion des utilisateurs et des rôles établissement',
        categorie: CategorieModule.GRATUIT, icone: 'Users', estCritique: true,
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: ['auth'], ordre: 2, estSysteme: true,
        config: { allowSelfRegistration: false, requireEmailVerification: true, defaultRole: 'ELEVE' },
    },
    {
        code: 'configuration', nom: 'Configuration', nomEn: 'Settings',
        description: 'Configuration système, paramètres, apparence',
        categorie: CategorieModule.GRATUIT, icone: 'Settings', estCritique: true,
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 3, estSysteme: true,
        config: {},
    },
    {
        code: 'notifications', nom: 'Notifications', nomEn: 'Notifications',
        description: 'Notifications multi-canal : email, SMS, push, in-app',
        categorie: CategorieModule.GRATUIT, icone: 'Bell', estCritique: true,
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 4, estSysteme: true,
        config: { enablePush: true, enableEmail: true, enableSMS: false, defaultChannel: 'IN_APP' },
    },
    {
        code: 'monitoring', nom: 'Monitoring', nomEn: 'Monitoring',
        description: 'Supervision technique : métriques, alertes, health checks',
        categorie: CategorieModule.GRATUIT, icone: 'Activity',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 5, estSysteme: true,
        config: { retentionDays: 30 },
    },
    {
        code: 'audit', nom: 'Audit', nomEn: 'Audit',
        description: 'Journal d\'audit complet : actions, modifications, accès',
        categorie: CategorieModule.GRATUIT, icone: 'FileText',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 6, estSysteme: true,
        config: {},
    },
    {
        code: 'facturation', nom: 'Facturation', nomEn: 'Billing',
        description: 'Facturation SaaS : abonnements, paiements, relances',
        categorie: CategorieModule.GRATUIT, icone: 'Receipt',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 7, estSysteme: true,
        config: {},
    },
    {
        code: 'groupes-etablissements', nom: 'Groupes Établissements', nomEn: 'School Groups',
        description: 'Gestion des groupes d\'établissements multi-tenant',
        categorie: CategorieModule.GRATUIT, icone: 'Network',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 8, estSysteme: true,
        config: {},
    },

    // =============================================
    // MODULES PAYANTS — inclus par plan ou souscriptibles
    // =============================================
    {
        code: 'eleves', nom: 'Élèves', nomEn: 'Students',
        description: 'Gestion complète des élèves : inscriptions, dossiers, suivi',
        categorie: CategorieModule.PAYANT, icone: 'GraduationCap',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: 'starter', dependencies: [], ordre: 10, estSysteme: false,
        config: { requireValidation: false, validationLevels: 2, autoGenerateMatricule: true },
    },
    {
        code: 'notes', nom: 'Notes & Évaluations', nomEn: 'Grades',
        description: 'Saisie des notes, évaluations, coefficients, barèmes',
        categorie: CategorieModule.PAYANT, icone: 'Edit',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: 'starter', dependencies: ['eleves'], ordre: 11, estSysteme: false,
        config: { defaultBareme: 20, allowBulkEntry: true, requireValidation: true, showClassRanking: true },
    },
    {
        code: 'bulletins', nom: 'Bulletins Scolaires', nomEn: 'Report Cards',
        description: 'Génération et publication des bulletins scolaires',
        categorie: CategorieModule.PAYANT, icone: 'FileText',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'starter', dependencies: ['notes'], ordre: 12, estSysteme: false,
        config: { includeRanking: true, includeComments: true, templateId: 'default' },
    },
    {
        code: 'messagerie', nom: 'Messagerie', nomEn: 'Messaging',
        description: 'Messagerie interne : conversations, messages, pièces jointes',
        categorie: CategorieModule.PAYANT, icone: 'MessageSquare',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: 'starter', dependencies: ['notifications'], ordre: 20, estSysteme: false,
        config: { allowAttachments: true, maxAttachmentSize: 5242880, allowGroupChats: true },
    },
    {
        code: 'emploi-du-temps', nom: 'Emploi du Temps', nomEn: 'Timetable',
        description: 'Planification des cours, créneaux horaires, salles',
        categorie: CategorieModule.PAYANT, icone: 'Calendar',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['eleves'], ordre: 21, estSysteme: false,
        config: { heuresDebut: '07:00', heuresFin: '18:00', dureeCreneau: 60 },
    },
    {
        code: 'orientation', nom: 'Orientation', nomEn: 'Guidance',
        description: 'Orientation des élèves : profil, suggestions, RDV',
        categorie: CategorieModule.PAYANT, icone: 'Compass',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'pro', dependencies: ['notes'], ordre: 22, estSysteme: false,
        config: {},
    },
    {
        code: 'cantine', nom: 'Cantine', nomEn: 'Cafeteria',
        description: 'Menus, inscriptions, solde, consommation',
        categorie: CategorieModule.PAYANT, icone: 'Utensils',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['eleves'], ordre: 30, estSysteme: false,
        config: { defaultCurrency: 'XOF', menuPlanningDays: 7, allowPreorder: true },
    },
    {
        code: 'transport', nom: 'Transport Scolaire', nomEn: 'School Transport',
        description: 'Lignes, inscriptions, présences QR code',
        categorie: CategorieModule.PAYANT, icone: 'Bus',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['eleves'], ordre: 31, estSysteme: false,
        config: { enableGPS: false, enableQRCheckin: true },
    },
    {
        code: 'finances', nom: 'Finances Scolaires', nomEn: 'School Finances',
        description: 'Frais scolaires, paiements, relances, avoirs',
        categorie: CategorieModule.PAYANT, icone: 'DollarSign',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'starter', dependencies: ['eleves'], ordre: 32, estSysteme: false,
        config: { defaultCurrency: 'XOF', enableOnlinePayment: false },
    },
    {
        code: 'comptabilite', nom: 'Comptabilité', nomEn: 'Accounting',
        description: 'Comptabilité générale : journal, grand livre, bilan',
        categorie: CategorieModule.PAYANT, icone: 'Calculator',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: 'pro', dependencies: ['finances'], ordre: 33, estSysteme: false,
        config: {},
    },
    {
        code: 'personnel', nom: 'Personnel RH', nomEn: 'HR Staff',
        description: 'Gestion du personnel : dossiers, contrats, postes',
        categorie: CategorieModule.PAYANT, icone: 'UserCheck',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'standard', dependencies: ['auth'], ordre: 50, estSysteme: false,
        config: {},
    },

    // =============================================
    // MODULES PAYANTS — souscriptibles en supplément
    // =============================================
    {
        code: 'cms', nom: 'Site Web (CMS)', nomEn: 'Website (CMS)',
        description: 'Pages publiques white-label : galerie, contact, inscriptions',
        categorie: CategorieModule.PAYANT, icone: 'Globe',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: true,
        planMinimal: undefined, dependencies: [], ordre: 40, estSysteme: false,
        config: {},
    },
    {
        code: 'clubs', nom: 'Clubs & Activités', nomEn: 'Clubs',
        description: 'Inscription aux clubs, limites, approbations',
        categorie: CategorieModule.PAYANT, icone: 'Heart',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: undefined, dependencies: ['eleves'], ordre: 41, estSysteme: false,
        config: { maxClubsPerStudent: 3 },
    },
    {
        code: 'gamification', nom: 'Gamification', nomEn: 'Gamification',
        description: 'Points, badges, classement, récompenses',
        categorie: CategorieModule.PAYANT, icone: 'Trophy',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: undefined, dependencies: ['eleves'], ordre: 42, estSysteme: false,
        config: { pointsPerAttendance: 5, pointsPerGoodGrade: 10, enableLeaderboard: true, anonymizeRanking: false },
    },
    {
        code: 'bibliotheque', nom: 'Bibliothèque', nomEn: 'Library',
        description: 'Gestion de la bibliothèque : ouvrages, prêts, retours',
        categorie: CategorieModule.PAYANT, icone: 'BookOpen',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: undefined, dependencies: ['eleves'], ordre: 43, estSysteme: false,
        config: {},
    },
    {
        code: 'cartes', nom: 'Cartes & Badges', nomEn: 'Cards',
        description: 'Cartes d\'identité, badges QR, expiration, renouvellement',
        categorie: CategorieModule.PAYANT, icone: 'CreditCard',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: true, actifParDefaut: false,
        planMinimal: undefined, dependencies: ['eleves'], ordre: 60, estSysteme: false,
        config: { enableQRCode: true, cardValidityMonths: 12 },
    },
    {
        code: 'scoring', nom: 'Scoring & KPI', nomEn: 'Scoring',
        description: 'Indicateurs de performance, scoring multi-critères',
        categorie: CategorieModule.PAYANT, icone: 'BarChart2',
        prixMensuel: 0, prixAnnuel: 0,
        estFacturable: false, estSouscriptible: false, actifParDefaut: false,
        planMinimal: 'pro', dependencies: ['notes', 'gamification'], ordre: 70, estSysteme: false,
        config: {},
    },
];

/**
 * Seed idempotent complet — tous les modules (GRATUIT | PAYANT).
 * Crée les modules manquants et réconcilie categorie / estCritique
 * sur les modules existants (ex-valeurs CRITIQUE/PREMIUM/ADDON).
 * @param force Si true, réinitialise le catalogue (supprime puis réinsère)
 */
export async function seedModulesCatalogue(force: boolean = false): Promise<number> {
    const repo = AppDataSource.getRepository(ModuleCatalogue);
    const count = await repo.count();

    if (count > 0 && force) {
        logger.info(`🔄 Réinitialisation du catalogue modules (${count} entrées supprimées)`);
        await repo.clear();
    }

    let inserted = 0;
    let reconciled = 0;
    for (const mod of MODULES_CATALOGUE_COMPLET) {
        const existing = await repo.findOne({ where: { code: mod.code } });
        if (!existing) {
            const entity = repo.create({
                code: mod.code,
                nom: mod.nom,
                nomEn: mod.nomEn,
                description: mod.description,
                categorie: mod.categorie,
                estCritique: mod.estCritique ?? false,
                icone: mod.icone,
                prixMensuel: mod.prixMensuel,
                prixAnnuel: mod.prixAnnuel,
                estFacturable: mod.estFacturable,
                estSouscriptible: mod.estSouscriptible,
                actifParDefaut: mod.actifParDefaut,
                planMinimal: mod.planMinimal,
                dependencies: mod.dependencies,
                config: mod.config || {},
                ordre: mod.ordre,
                estSysteme: mod.estSysteme,
                estActif: true,
            });
            await repo.save(entity);
            inserted++;
        } else if (
            existing.categorie !== mod.categorie ||
            existing.estCritique !== (mod.estCritique ?? false)
        ) {
            // Réconciliation silencieuse : classification binaire v3 de référence
            existing.categorie = mod.categorie;
            existing.estCritique = mod.estCritique ?? false;
            await repo.save(existing);
            reconciled++;
        }
    }

    const total = await repo.count();
    logger.info(`✅ Seed catalogue modules terminé : ${inserted} ajoutés, ${reconciled} réconciliés, ${total} total`);
    return total;
}

export default seedModulesCatalogue;
