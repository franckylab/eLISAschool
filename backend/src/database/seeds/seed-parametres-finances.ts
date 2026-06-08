/**
 * ==================================
 * eLISAschool - Seed Paramètres Module Finances
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * 74 paramètres de configuration pour le module finances
 */

import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';

interface ParametreSeed {
    cle: string;
    valeur: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'ENUM' | 'JSON' | 'DATE' | 'TIME' | 'UUID';
    description: string;
    categorie: string;
    actif: boolean;
}

const PARAMETRES_FINANCES: ParametreSeed[] = [
    // ==================================
    // SCOLARITÉ (10 paramètres)
    // ==================================
    {
        cle: 'finances.scolarite.frais_inscription_defaut',
        valeur: '50000',
        type: 'NUMBER',
        description: 'Frais d\'inscription par défaut (FCFA)',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.nombre_tranches_defaut',
        valeur: '3',
        type: 'NUMBER',
        description: 'Nombre de tranches par défaut',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.frequence_echeance_defaut',
        valeur: 'TRIMESTRIEL',
        type: 'ENUM',
        description: 'Fréquence échéances (MENSUEL, TRIMESTRIEL, SEMESTRIEL, ANNUEL)',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.jours_grace_defaut',
        valeur: '8',
        type: 'NUMBER',
        description: 'Jours de grâce avant pénalité',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.penalite_retard_pct',
        valeur: '5',
        type: 'NUMBER',
        description: 'Pénalité retard (% par mois)',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.penalite_plafond_pct',
        valeur: '25',
        type: 'NUMBER',
        description: 'Plafond pénalité (% du montant)',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.relance_auto_active',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Relances automatiques activées',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.relance_frequence_jours',
        valeur: '7',
        type: 'NUMBER',
        description: 'Fréquence relances (jours)',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.relance_seuil_min',
        valeur: '10000',
        type: 'NUMBER',
        description: 'Seuil minimum relance (FCFA)',
        categorie: 'SCOLARITE',
        actif: true,
    },
    {
        cle: 'finances.scolarite.mode_paiement_mobile_actif',
        valeur: 'false',
        type: 'BOOLEAN',
        description: 'Paiement Mobile Money activé',
        categorie: 'SCOLARITE',
        actif: true,
    },

    // ==================================
    // DÉPENSES (12 paramètres)
    // ==================================
    {
        cle: 'finances.depenses.double_validation_seuil',
        valeur: '500000',
        type: 'NUMBER',
        description: 'Seuil double validation (FCFA)',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.approbation_auto_active',
        valeur: 'false',
        type: 'BOOLEAN',
        description: 'Approbation automatique si < seuil',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.tva_defaut_pct',
        valeur: '19.25',
        type: 'NUMBER',
        description: 'TVA par défaut (%)',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.categorie_requise',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Catégorie obligatoire',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.facture_requise',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Facture obligatoire',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.budget_verification_active',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Vérification budget avant dépense',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.budget_bloquant',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Bloquer si budget dépassé',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.delai_paiement_jours',
        valeur: '30',
        type: 'NUMBER',
        description: 'Délai paiement fournisseur (jours)',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.escompte_pct',
        valeur: '2',
        type: 'NUMBER',
        description: 'Escompte paiement anticipé (%)',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.archivage_duree_mois',
        valeur: '60',
        type: 'NUMBER',
        description: 'Durée archivage (mois)',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.export_format_defaut',
        valeur: 'PDF',
        type: 'ENUM',
        description: 'Format export par défaut (PDF, EXCEL, CSV)',
        categorie: 'DEPENSES',
        actif: true,
    },
    {
        cle: 'finances.depenses.notification_demande_active',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Notifications demandes actives',
        categorie: 'DEPENSES',
        actif: true,
    },

    // ==================================
    // COMPTABILITÉ (8 paramètres)
    // ==================================
    {
        cle: 'finances.comptabilite.plan_comptable',
        valeur: 'OHADA',
        type: 'ENUM',
        description: 'Système comptable (OHADA, SYSCOHADA, SIMPLIFIE)',
        categorie: 'COMPTABILITE',
        actif: true,
    },
    {
        cle: 'finances.comptabilite.ecriture_auto_active',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Écritures automatiques activées',
        categorie: 'COMPTABILITE',
        actif: true,
    },
    {
        cle: 'finances.comptabilite.numero_sequence_prefix',
        valeur: 'EC',
        type: 'STRING',
        description: 'Préfixe numéro écriture',
        categorie: 'COMPTABILITE',
        actif: true,
    },
    {
        cle: 'finances.comptabilite.exercice_comptable_debut',
        valeur: '09-01',
        type: 'STRING',
        description: 'Début exercice comptable (MM-DD)',
        categorie: 'COMPTABILITE',
        actif: true,
    },
    {
        cle: 'finances.comptabilite.exercice_comptable_fin',
        valeur: '08-31',
        type: 'STRING',
        description: 'Fin exercice comptable (MM-DD)',
        categorie: 'COMPTABILITE',
        actif: true,
    },
    {
        cle: 'finances.comptabilite.cloture_auto_active',
        valeur: 'false',
        type: 'BOOLEAN',
        description: 'Clôture automatique exercice',
        categorie: 'COMPTABILITE',
        actif: true,
    },
    {
        cle: 'finances.comptabilite.validation_obligatoire',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Validation écritures obligatoire',
        categorie: 'COMPTABILITE',
        actif: true,
    },
    {
        cle: 'finances.comptabilite.archivage_legal_duree',
        valeur: '120',
        type: 'NUMBER',
        description: 'Durée archivage légal (mois)',
        categorie: 'COMPTABILITE',
        actif: true,
    },

    // ==================================
    // TRÉSORERIE (10 paramètres)
    // ==================================
    {
        cle: 'finances.tresorerie.seuil_alerte_caisse',
        valeur: '100000',
        type: 'NUMBER',
        description: 'Seuil alerte caisse (FCFA)',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.seuil_critique_caisse',
        valeur: '50000',
        type: 'NUMBER',
        description: 'Seuil critique caisse (FCFA)',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.plafond_caisse_especes',
        valeur: '5000000',
        type: 'NUMBER',
        description: 'Plafond espèces en caisse (FCFA)',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.verification_caisse_quotidienne',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Vérification quotidienne obligatoire',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.double_signature_seuil',
        valeur: '1000000',
        type: 'NUMBER',
        description: 'Seuil double signature (FCFA)',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.cloture_caisse_heure',
        valeur: '17:00',
        type: 'STRING',
        description: 'Heure clôture caisse (HH:MM)',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.ecart_tolerance',
        valeur: '5000',
        type: 'NUMBER',
        description: 'Tolérance écart caisse (FCFA)',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.virement_approval_requise',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Approval virements requise',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.releve_bancaire_import_actif',
        valeur: 'false',
        type: 'BOOLEAN',
        description: 'Import relevés bancaires',
        categorie: 'TRESORERIE',
        actif: true,
    },
    {
        cle: 'finances.tresorerie.mode_gestion_caisse',
        valeur: 'MULTI_CAISSE',
        type: 'ENUM',
        description: 'Mode gestion caisse (UNIQUE_CAISSE, MULTI_CAISSE)',
        categorie: 'TRESORERIE',
        actif: true,
    },

    // ==================================
    // BUDGET (10 paramètres)
    // ==================================
    {
        cle: 'finances.budget.exercice_annuel',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Budget annuel (vs pluriannuel)',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.validation_workflow_actif',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Workflow validation actif',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.seuil_alerte_pct',
        valeur: '80',
        type: 'NUMBER',
        description: 'Seuil alerte consommation (%)',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.seuil_critique_pct',
        valeur: '95',
        type: 'NUMBER',
        description: 'Seuil critique consommation (%)',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.blocage_depassement',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Bloquer si dépassement',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.report_excedent_actif',
        valeur: 'false',
        type: 'BOOLEAN',
        description: 'Report excédent sur N+1',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.virement_ligne_actif',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Virement entre lignes autorisé',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.virement_ligne_seuil_pct',
        valeur: '20',
        type: 'NUMBER',
        description: 'Seuil virement ligne (% du budget)',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.budget_additionnel_actif',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Budgets additionnels autorisés',
        categorie: 'BUDGET',
        actif: true,
    },
    {
        cle: 'finances.budget.notification_alerte_active',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Notifications alertes budget',
        categorie: 'BUDGET',
        actif: true,
    },

    // ==================================
    // DASHBOARD & RAPPORTS (8 paramètres)
    // ==================================
    {
        cle: 'finances.dashboard.kpi_taux_recouvrement_cible',
        valeur: '85',
        type: 'NUMBER',
        description: 'Objectif taux recouvrement (%)',
        categorie: 'DASHBOARD',
        actif: true,
    },
    {
        cle: 'finances.dashboard.kpi_depenses_budget_max_pct',
        valeur: '90',
        type: 'NUMBER',
        description: 'Ratio dépenses/budget max (%)',
        categorie: 'DASHBOARD',
        actif: true,
    },
    {
        cle: 'finances.dashboard.cache_ttl_secondes',
        valeur: '300',
        type: 'NUMBER',
        description: 'Cache dashboard TTL (secondes)',
        categorie: 'DASHBOARD',
        actif: true,
    },
    {
        cle: 'finances.dashboard.graphique_periode_defaut',
        valeur: '30',
        type: 'NUMBER',
        description: 'Période graphique par défaut (jours)',
        categorie: 'DASHBOARD',
        actif: true,
    },
    {
        cle: 'finances.rapports.generation_auto_active',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Rapports automatiques activés',
        categorie: 'DASHBOARD',
        actif: true,
    },
    {
        cle: 'finances.rapports.frequence_defaut',
        valeur: 'MENSUEL',
        type: 'ENUM',
        description: 'Fréquence rapports (MENSUEL, TRIMESTRIEL, ANNUEL)',
        categorie: 'DASHBOARD',
        actif: true,
    },
    {
        cle: 'finances.rapports.format_export_defaut',
        valeur: 'PDF',
        type: 'ENUM',
        description: 'Format export par défaut',
        categorie: 'DASHBOARD',
        actif: true,
    },
    {
        cle: 'finances.rapports.destinataires_defaut',
        valeur: '["CHEF_ETABLISSEMENT", "ADMIN"]',
        type: 'JSON',
        description: 'Destinataires automatiques rapports',
        categorie: 'DASHBOARD',
        actif: true,
    },

    // ==================================
    // WORKFLOW VALIDATION (6 paramètres)
    // ==================================
    {
        cle: 'finances.validation_paiement.require_validation',
        valeur: 'false',
        type: 'BOOLEAN',
        description: 'Validation paiement requise',
        categorie: 'WORKFLOW',
        actif: true,
    },
    {
        cle: 'finances.validation_paiement.levels',
        valeur: '[1]',
        type: 'JSON',
        description: 'Niveaux validation paiement',
        categorie: 'WORKFLOW',
        actif: true,
    },
    {
        cle: 'finances.validation_depense.require_validation',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Validation dépense requise',
        categorie: 'WORKFLOW',
        actif: true,
    },
    {
        cle: 'finances.validation_depense.levels',
        valeur: '[1, 2]',
        type: 'JSON',
        description: 'Niveaux validation dépense',
        categorie: 'WORKFLOW',
        actif: true,
    },
    {
        cle: 'finances.validation_budget.require_validation',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Validation budget requise',
        categorie: 'WORKFLOW',
        actif: true,
    },
    {
        cle: 'finances.validation_budget.levels',
        valeur: '[1, 2, 3]',
        type: 'JSON',
        description: 'Niveaux validation budget',
        categorie: 'WORKFLOW',
        actif: true,
    },

    // ==================================
    // GÉNÉRAL & SÉCURITÉ (10 paramètres)
    // ==================================
    {
        cle: 'finances.devise_defaut',
        valeur: 'FCFA',
        type: 'STRING',
        description: 'Devise par défaut',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.monnaie_symbole',
        valeur: 'FCFA',
        type: 'STRING',
        description: 'Symbole monétaire',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.arrondi_montant',
        valeur: 'SUPERIEUR',
        type: 'ENUM',
        description: 'Méthode arrondi (SUPERIEUR, INFERIEUR, STANDARD)',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.decimales_montant',
        valeur: '0',
        type: 'NUMBER',
        description: 'Nombre décimales montants',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.seuil_importance_montant',
        valeur: '10000000',
        type: 'NUMBER',
        description: 'Seuil montant important (FCFA)',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.audit_operations_actif',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Audit toutes opérations',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.audit_duree_retention_mois',
        valeur: '60',
        type: 'NUMBER',
        description: 'Rétention logs audit (mois)',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.chiffrement_donnees_actif',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Chiffrement données sensibles',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.backup_auto_actif',
        valeur: 'true',
        type: 'BOOLEAN',
        description: 'Backup automatique',
        categorie: 'GENERAL',
        actif: true,
    },
    {
        cle: 'finances.backup_frequence',
        valeur: 'QUOTIDIEN',
        type: 'ENUM',
        description: 'Fréquence backup (QUOTIDIEN, HEBDOMADAIRE)',
        categorie: 'GENERAL',
        actif: true,
    },
];

/**
 * Exécuter le seed des paramètres finances
 */
export async function seedParametresFinances(): Promise<void> {
    try {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        logger.info('[Seed] Insertion des 74 paramètres finances...');

        let insertedCount = 0;
        let updatedCount = 0;

        for (const param of PARAMETRES_FINANCES) {
            // Vérifier si le paramètre existe déjà
            const existing = await queryRunner.query(
                `SELECT id FROM parametres WHERE cle = $1 LIMIT 1`,
                [param.cle]
            );

            if (existing.length > 0) {
                // Mettre à jour
                await queryRunner.query(
                    `UPDATE parametres SET valeur = $1, type = $2, description = $3, categorie = $4, actif = $5, updated_at = NOW() WHERE cle = $6`,
                    [param.valeur, param.type, param.description, param.categorie, param.actif, param.cle]
                );
                updatedCount++;
            } else {
                // Insérer
                await queryRunner.query(
                    `INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
                    [param.cle, param.valeur, param.type, param.description, param.categorie, param.actif]
                );
                insertedCount++;
            }
        }

        await queryRunner.release();

        logger.info(`[Seed] ✅ Paramètres finances insérés: ${insertedCount} nouveaux, ${updatedCount} mis à jour`);
    } catch (error) {
        logger.error('[Seed] ❌ Erreur seed paramètres finances:', error);
        throw error;
    }
}
