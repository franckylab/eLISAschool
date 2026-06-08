-- ==================================
-- eLISAschool - Migration Paramètres Finances (Partie 3)
-- ==================================
-- Version: 1.0.0
-- Description: 74 paramètres de configuration pour le module finances
-- ==================================

-- SCOLARITÉ (10 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.scolarite.frais_inscription_defaut', '50000', 'NUMBER', 'Frais d''inscription par défaut (FCFA)', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.nombre_tranches_defaut', '3', 'NUMBER', 'Nombre de tranches par défaut', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.frequence_echeance_defaut', 'TRIMESTRIEL', 'ENUM', 'Fréquence échéances', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.jours_grace_defaut', '8', 'NUMBER', 'Jours de grâce avant pénalité', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.penalite_retard_pct', '5', 'NUMBER', 'Pénalité retard (% par mois)', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.penalite_plafond_pct', '25', 'NUMBER', 'Plafond pénalité (% du montant)', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.relance_auto_active', 'true', 'BOOLEAN', 'Relances automatiques activées', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.relance_frequence_jours', '7', 'NUMBER', 'Fréquence relances (jours)', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.relance_seuil_min', '10000', 'NUMBER', 'Seuil minimum relance (FCFA)', 'SCOLARITE', TRUE, NOW(), NOW()),
('finances.scolarite.mode_paiement_mobile_actif', 'false', 'BOOLEAN', 'Paiement Mobile Money activé', 'SCOLARITE', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- DÉPENSES (12 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.depenses.double_validation_seuil', '500000', 'NUMBER', 'Seuil double validation (FCFA)', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.approbation_auto_active', 'false', 'BOOLEAN', 'Approbation automatique si < seuil', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.tva_defaut_pct', '19.25', 'NUMBER', 'TVA par défaut (%)', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.categorie_requise', 'true', 'BOOLEAN', 'Catégorie obligatoire', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.facture_requise', 'true', 'BOOLEAN', 'Facture obligatoire', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.budget_verification_active', 'true', 'BOOLEAN', 'Vérification budget avant dépense', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.budget_bloquant', 'true', 'BOOLEAN', 'Bloquer si budget dépassé', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.delai_paiement_jours', '30', 'NUMBER', 'Délai paiement fournisseur (jours)', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.escompte_pct', '2', 'NUMBER', 'Escompte paiement anticipé (%)', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.archivage_duree_mois', '60', 'NUMBER', 'Durée archivage (mois)', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.export_format_defaut', 'PDF', 'ENUM', 'Format export par défaut', 'DEPENSES', TRUE, NOW(), NOW()),
('finances.depenses.notification_demande_active', 'true', 'BOOLEAN', 'Notifications demandes actives', 'DEPENSES', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- COMPTABILITÉ (8 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.comptabilite.plan_comptable', 'OHADA', 'ENUM', 'Système comptable', 'COMPTABILITE', TRUE, NOW(), NOW()),
('finances.comptabilite.ecriture_auto_active', 'true', 'BOOLEAN', 'Écritures automatiques activées', 'COMPTABILITE', TRUE, NOW(), NOW()),
('finances.comptabilite.numero_sequence_prefix', 'EC', 'STRING', 'Préfixe numéro écriture', 'COMPTABILITE', TRUE, NOW(), NOW()),
('finances.comptabilite.exercice_comptable_debut', '09-01', 'STRING', 'Début exercice comptable (MM-DD)', 'COMPTABILITE', TRUE, NOW(), NOW()),
('finances.comptabilite.exercice_comptable_fin', '08-31', 'STRING', 'Fin exercice comptable (MM-DD)', 'COMPTABILITE', TRUE, NOW(), NOW()),
('finances.comptabilite.cloture_auto_active', 'false', 'BOOLEAN', 'Clôture automatique exercice', 'COMPTABILITE', TRUE, NOW(), NOW()),
('finances.comptabilite.validation_obligatoire', 'true', 'BOOLEAN', 'Validation écritures obligatoire', 'COMPTABILITE', TRUE, NOW(), NOW()),
('finances.comptabilite.archivage_legal_duree', '120', 'NUMBER', 'Durée archivage légal (mois)', 'COMPTABILITE', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- TRÉSORERIE (10 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.tresorerie.seuil_alerte_caisse', '100000', 'NUMBER', 'Seuil alerte caisse (FCFA)', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.seuil_critique_caisse', '50000', 'NUMBER', 'Seuil critique caisse (FCFA)', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.plafond_caisse_especes', '5000000', 'NUMBER', 'Plafond espèces en caisse (FCFA)', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.verification_caisse_quotidienne', 'true', 'BOOLEAN', 'Vérification quotidienne obligatoire', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.double_signature_seuil', '1000000', 'NUMBER', 'Seuil double signature (FCFA)', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.cloture_caisse_heure', '17:00', 'STRING', 'Heure clôture caisse (HH:MM)', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.ecart_tolerance', '5000', 'NUMBER', 'Tolérance écart caisse (FCFA)', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.virement_approval_requise', 'true', 'BOOLEAN', 'Approval virements requise', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.releve_bancaire_import_actif', 'false', 'BOOLEAN', 'Import relevés bancaires', 'TRESORERIE', TRUE, NOW(), NOW()),
('finances.tresorerie.mode_gestion_caisse', 'MULTI_CAISSE', 'ENUM', 'Mode gestion caisse', 'TRESORERIE', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- BUDGET (10 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.budget.exercice_annuel', 'true', 'BOOLEAN', 'Budget annuel (vs pluriannuel)', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.validation_workflow_actif', 'true', 'BOOLEAN', 'Workflow validation actif', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.seuil_alerte_pct', '80', 'NUMBER', 'Seuil alerte consommation (%)', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.seuil_critique_pct', '95', 'NUMBER', 'Seuil critique consommation (%)', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.blocage_depassement', 'true', 'BOOLEAN', 'Bloquer si dépassement', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.report_excedent_actif', 'false', 'BOOLEAN', 'Report excédent sur N+1', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.virement_ligne_actif', 'true', 'BOOLEAN', 'Virement entre lignes autorisé', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.virement_ligne_seuil_pct', '20', 'NUMBER', 'Seuil virement ligne (% du budget)', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.budget_additionnel_actif', 'true', 'BOOLEAN', 'Budgets additionnels autorisés', 'BUDGET', TRUE, NOW(), NOW()),
('finances.budget.notification_alerte_active', 'true', 'BOOLEAN', 'Notifications alertes budget', 'BUDGET', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- DASHBOARD & RAPPORTS (8 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.dashboard.kpi_taux_recouvrement_cible', '85', 'NUMBER', 'Objectif taux recouvrement (%)', 'DASHBOARD', TRUE, NOW(), NOW()),
('finances.dashboard.kpi_depenses_budget_max_pct', '90', 'NUMBER', 'Ratio dépenses/budget max (%)', 'DASHBOARD', TRUE, NOW(), NOW()),
('finances.dashboard.cache_ttl_secondes', '300', 'NUMBER', 'Cache dashboard TTL (secondes)', 'DASHBOARD', TRUE, NOW(), NOW()),
('finances.dashboard.graphique_periode_defaut', '30', 'NUMBER', 'Période graphique par défaut (jours)', 'DASHBOARD', TRUE, NOW(), NOW()),
('finances.rapports.generation_auto_active', 'true', 'BOOLEAN', 'Rapports automatiques activés', 'DASHBOARD', TRUE, NOW(), NOW()),
('finances.rapports.frequence_defaut', 'MENSUEL', 'ENUM', 'Fréquence rapports', 'DASHBOARD', TRUE, NOW(), NOW()),
('finances.rapports.format_export_defaut', 'PDF', 'ENUM', 'Format export par défaut', 'DASHBOARD', TRUE, NOW(), NOW()),
('finances.rapports.destinataires_defaut', '["CHEF_ETABLISSEMENT", "ADMIN"]', 'JSON', 'Destinataires automatiques rapports', 'DASHBOARD', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- WORKFLOW VALIDATION (6 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.validation_paiement.require_validation', 'false', 'BOOLEAN', 'Validation paiement requise', 'WORKFLOW', TRUE, NOW(), NOW()),
('finances.validation_paiement.levels', '[1]', 'JSON', 'Niveaux validation paiement', 'WORKFLOW', TRUE, NOW(), NOW()),
('finances.validation_depense.require_validation', 'true', 'BOOLEAN', 'Validation dépense requise', 'WORKFLOW', TRUE, NOW(), NOW()),
('finances.validation_depense.levels', '[1, 2]', 'JSON', 'Niveaux validation dépense', 'WORKFLOW', TRUE, NOW(), NOW()),
('finances.validation_budget.require_validation', 'true', 'BOOLEAN', 'Validation budget requise', 'WORKFLOW', TRUE, NOW(), NOW()),
('finances.validation_budget.levels', '[1, 2, 3]', 'JSON', 'Niveaux validation budget', 'WORKFLOW', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- GÉNÉRAL & SÉCURITÉ (10 paramètres)
INSERT INTO parametres (cle, valeur, type, description, categorie, actif, created_at, updated_at) VALUES
('finances.devise_defaut', 'FCFA', 'STRING', 'Devise par défaut', 'GENERAL', TRUE, NOW(), NOW()),
('finances.monnaie_symbole', 'FCFA', 'STRING', 'Symbole monétaire', 'GENERAL', TRUE, NOW(), NOW()),
('finances.arrondi_montant', 'SUPERIEUR', 'ENUM', 'Méthode arrondi', 'GENERAL', TRUE, NOW(), NOW()),
('finances.decimales_montant', '0', 'NUMBER', 'Nombre décimales montants', 'GENERAL', TRUE, NOW(), NOW()),
('finances.seuil_importance_montant', '10000000', 'NUMBER', 'Seuil montant important (FCFA)', 'GENERAL', TRUE, NOW(), NOW()),
('finances.audit_operations_actif', 'true', 'BOOLEAN', 'Audit toutes opérations', 'GENERAL', TRUE, NOW(), NOW()),
('finances.audit_duree_retention_mois', '60', 'NUMBER', 'Rétention logs audit (mois)', 'GENERAL', TRUE, NOW(), NOW()),
('finances.chiffrement_donnees_actif', 'true', 'BOOLEAN', 'Chiffrement données sensibles', 'GENERAL', TRUE, NOW(), NOW()),
('finances.backup_auto_actif', 'true', 'BOOLEAN', 'Backup automatique', 'GENERAL', TRUE, NOW(), NOW()),
('finances.backup_frequence', 'QUOTIDIEN', 'ENUM', 'Fréquence backup', 'GENERAL', TRUE, NOW(), NOW())
ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- ==================================
-- Vérification
-- ==================================
SELECT 
    categorie,
    COUNT(*) as nombre_parametres,
    COUNT(*) FILTER (WHERE actif = TRUE) as actifs
FROM parametres 
WHERE cle LIKE 'finances.%'
GROUP BY categorie
ORDER BY categorie;
