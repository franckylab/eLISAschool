-- ==================================
-- eLISAschool - Migration Module Finances
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Création des tables pour le module de gestion financière
--              (scolarité, dépenses, comptabilité, trésorerie, budget)
-- Date: 7 juin 2026
-- ==================================

-- ==================================
-- TABLES SCOLARITÉ & PAIEMENTS
-- ==================================

-- Configuration des frais de scolarité par niveau/année
CREATE TABLE IF NOT EXISTS frais_scolarite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    niveau_id UUID NOT NULL REFERENCES niveaux(id) ON DELETE CASCADE,
    classe_id UUID,
    
    frais_inscription DECIMAL(10, 2) DEFAULT 0,
    frais_scolarite_annuel DECIMAL(10, 2) NOT NULL,
    nombre_tranches INTEGER NOT NULL DEFAULT 3,
    date_premiere_echeance DATE NOT NULL,
    frequence_echeance VARCHAR(50) DEFAULT 'MENSUEL', -- MENSUEL, TRIMESTRIEL, SEMESTRIEL
    
    penalite_retard DECIMAL(5, 2) DEFAULT 0, -- Pourcentage
    jours_grace INTEGER DEFAULT 8,
    remises_possibles TEXT, -- JSON array de types de remises
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uk_frais_scolarite UNIQUE (etablissement_id, annee_scolaire_id, niveau_id)
);

CREATE INDEX idx_frais_scolarite_etablissement ON frais_scolarite(etablissement_id);
CREATE INDEX idx_frais_scolarite_annee ON frais_scolarite(annee_scolaire_id);
CREATE INDEX idx_frais_scolarite_niveau ON frais_scolarite(niveau_id);

-- Échéancier de paiement par élève
CREATE TABLE IF NOT EXISTS echeanciers_paiement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    frais_scolarite_id UUID NOT NULL REFERENCES frais_scolarite(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    numero_tranche INTEGER NOT NULL,
    montant_attendu DECIMAL(10, 2) NOT NULL,
    date_echeance DATE NOT NULL,
    montant_paye DECIMAL(10, 2) DEFAULT 0,
    statut VARCHAR(30) DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, PARTIELLEMENT_PAYE, PAYE, EN_RETARD
    
    date_paiement_reel TIMESTAMP,
    penalite_appliquee DECIMAL(10, 2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT uk_echeancier UNIQUE (eleve_id, frais_scolarite_id, numero_tranche)
);

CREATE INDEX idx_echeancier_eleve ON echeanciers_paiement(eleve_id);
CREATE INDEX idx_echeancier_etablissement_statut ON echeanciers_paiement(etablissement_id, statut);
CREATE INDEX idx_echeancier_date ON echeanciers_paiement(date_echeance);

-- Paiements
CREATE TABLE IF NOT EXISTS paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    echeancier_id UUID REFERENCES echeanciers_paiement(id) ON DELETE SET NULL,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    montant DECIMAL(10, 2) NOT NULL,
    montant_penalite DECIMAL(10, 2) DEFAULT 0,
    montant_total DECIMAL(10, 2) NOT NULL,
    type_paiement VARCHAR(30) DEFAULT 'SCOLARITE',
    methode_paiement VARCHAR(30) NOT NULL, -- ESPECES, MOBILE_MONEY, CARTE, VIREMENT, CHEQUE
    
    reference_transaction VARCHAR(100),
    numero_recu VARCHAR(50),
    date_paiement TIMESTAMP DEFAULT NOW(),
    statut VARCHAR(30) DEFAULT 'CONFIRME', -- CONFIRME, ANNULE, EN_ATTENTE
    
    effectue_par UUID NOT NULL REFERENCES utilisateurs(id),
    valide_par UUID REFERENCES utilisateurs(id),
    observations TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paiement_eleve ON paiements(eleve_id);
CREATE INDEX idx_paiement_echeancier ON paiements(echeancier_id);
CREATE INDEX idx_paiement_etablissement_date ON paiements(etablissement_id, date_paiement);

-- Reçus de paiement
CREATE TABLE IF NOT EXISTS recus_paiement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paiement_id UUID NOT NULL REFERENCES paiements(id) ON DELETE CASCADE,
    numero_recu VARCHAR(50) UNIQUE NOT NULL,
    date_emission TIMESTAMP DEFAULT NOW(),
    
    eleve_nom VARCHAR(150) NOT NULL,
    eleve_matricule VARCHAR(50) NOT NULL,
    classe_nom VARCHAR(100),
    montant DECIMAL(10, 2) NOT NULL,
    methode_paiement VARCHAR(30) NOT NULL,
    objet VARCHAR(255) NOT NULL,
    generer_par UUID NOT NULL REFERENCES utilisateurs(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    signature_numerique VARCHAR(255),
    pdf_path VARCHAR(500),
    envoye_par_email BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recu_numero ON recus_paiement(numero_recu);
CREATE INDEX idx_recu_paiement ON recus_paiement(paiement_id);

-- Relances de paiement
CREATE TABLE IF NOT EXISTS relances_paiement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    echeancier_id UUID NOT NULL REFERENCES echeanciers_paiement(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    numero_relance INTEGER NOT NULL,
    date_relance TIMESTAMP DEFAULT NOW(),
    type_relance VARCHAR(30) NOT NULL, -- SMS, EMAIL, LETTER, PHONE
    statut VARCHAR(30) DEFAULT 'ENVOYEE', -- ENVOYEE, LUE, REPONDUE
    
    message TEXT,
    reponse TEXT,
    effectue_par UUID NOT NULL REFERENCES utilisateurs(id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_relance_eleve ON relances_paiement(eleve_id);
CREATE INDEX idx_relance_echeancier ON relances_paiement(echeancier_id);

-- Remises
CREATE TABLE IF NOT EXISTS remises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eleve_id UUID NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    frais_scolarite_id UUID NOT NULL REFERENCES frais_scolarite(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    type_remise VARCHAR(30) NOT NULL, -- FRATRIE, BOURSE, PERSONNEL, ANTICIPE, AUTRE
    pourcentage DECIMAL(5, 2) DEFAULT 0,
    montant DECIMAL(10, 2) DEFAULT 0,
    motif TEXT,
    
    valide_par UUID NOT NULL REFERENCES utilisateurs(id),
    date_attribution TIMESTAMP DEFAULT NOW(),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_remise_eleve ON remises(eleve_id);
CREATE INDEX idx_remise_type ON remises(type_remise);

-- ==================================
-- TABLES DÉPENSES
-- ==================================

-- Catégories de dépenses
CREATE TABLE IF NOT EXISTS categories_depense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    code VARCHAR(10) UNIQUE NOT NULL,
    libelle VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL, -- CHARGE_FIXE, CHARGE_VARIABLE, INVESTISSEMENT
    
    compte_comptable_charge VARCHAR(6),
    compte_comptable_tva VARCHAR(6),
    responsable_id UUID REFERENCES utilisateurs(id),
    budget_annuel DECIMAL(12, 2),
    actif BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categorie_etablissement_type ON categories_depense(etablissement_id, type);

-- Dépenses
CREATE TABLE IF NOT EXISTS depenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categorie_depense_id UUID NOT NULL REFERENCES categories_depense(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    numero_piece VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    
    montant_ht DECIMAL(12, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 19.25,
    montant_ttc DECIMAL(12, 2) NOT NULL,
    montant_paye DECIMAL(12, 2) DEFAULT 0,
    
    date_facture DATE NOT NULL,
    date_echeance DATE,
    date_paiement TIMESTAMP,
    
    fournisseur VARCHAR(150) NOT NULL,
    reference_facture VARCHAR(100),
    justificatif_path VARCHAR(500),
    
    methode_paiement VARCHAR(30), -- ESPECES, MOBILE_MONEY, VIREMENT, CHEQUE
    reference_transaction VARCHAR(100),
    
    effectue_par UUID NOT NULL REFERENCES utilisateurs(id),
    valide_par UUID REFERENCES utilisateurs(id),
    statut VARCHAR(30) DEFAULT 'BROUILLON', -- BROUILLON, VALIDEE, PAYEE, PARTIELLEMENT_PAYEE, ANNULEE
    
    exercice_comptable VARCHAR(9),
    periode_comptable VARCHAR(7),
    observations TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_depense_categorie ON depenses(categorie_depense_id);
CREATE INDEX idx_depense_etablissement_date ON depenses(etablissement_id, date_facture);
CREATE INDEX idx_depense_statut ON depenses(statut);

-- Demandes de dépenses
CREATE TABLE IF NOT EXISTS demandes_depense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demandeur_id UUID NOT NULL REFERENCES utilisateurs(id),
    categorie_depense_id UUID NOT NULL REFERENCES categories_depense(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    libelle VARCHAR(255) NOT NULL,
    montant_estime DECIMAL(12, 2) NOT NULL,
    urgence VARCHAR(30) DEFAULT 'MOYENNE', -- BASSE, MOYENNE, HAUTE, CRITIQUE
    justification TEXT NOT NULL,
    
    statut VARCHAR(30) DEFAULT 'BROUILLON', -- BROUILLON, SOUMISE, APPROUVEE, REJETEE, ANNULEE
    valide_par UUID REFERENCES utilisateurs(id),
    date_validation TIMESTAMP,
    motif_rejet TEXT,
    
    depense_id UUID REFERENCES depenses(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_demande_demandeur ON demandes_depense(demandeur_id);
CREATE INDEX idx_demande_statut ON demandes_depense(statut);

-- Bons de commande
CREATE TABLE IF NOT EXISTS bons_commande (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    demandeur_id UUID NOT NULL REFERENCES utilisateurs(id),
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    numero_bon VARCHAR(50) UNIQUE NOT NULL,
    fournisseur VARCHAR(150) NOT NULL,
    date_commande DATE NOT NULL,
    date_livraison_prevue DATE,
    montant_total DECIMAL(12, 2) NOT NULL,
    
    articles JSONB NOT NULL, -- [{description, quantite, prixUnitaire, montantTotal}]
    statut VARCHAR(30) DEFAULT 'BROUILLON', -- BROUILLON, ENVOYÉ, RECU, FACTURE, ANNULE
    
    depense_id UUID REFERENCES depenses(id),
    observations TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bon_commande_demandeur ON bons_commande(demandeur_id);
CREATE INDEX idx_bon_commande_statut ON bons_commande(statut);

-- Factures fournisseur
CREATE TABLE IF NOT EXISTS factures_fournisseur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    depense_id UUID NOT NULL REFERENCES depenses(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    
    numero_facture VARCHAR(100) UNIQUE NOT NULL,
    date_facture DATE NOT NULL,
    date_echeance DATE NOT NULL,
    
    montant_ht DECIMAL(12, 2) NOT NULL,
    tva DECIMAL(5, 2) DEFAULT 19.25,
    montant_ttc DECIMAL(12, 2) NOT NULL,
    
    pdf_path VARCHAR(500),
    saisie_par UUID NOT NULL REFERENCES utilisateurs(id),
    verifiee_par UUID REFERENCES utilisateurs(id),
    statut VARCHAR(30) DEFAULT 'EN_ATTENTE', -- EN_ATTENTE, VERIFIEE, PAYEE, ANNULEE
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facture_depense ON factures_fournisseur(depense_id);
CREATE INDEX idx_facture_statut ON factures_fournisseur(statut);

-- ==================================
-- DONNÉES INITIALES
-- ==================================

-- Catégories de dépenses par défaut (système OHADA simplifié)
INSERT INTO categories_depense (code, libelle, type, compte_comptable_charge, compte_comptable_tva, actif)
VALUES
    ('FOURN', 'Fournitures scolaires', 'CHARGE_VARIABLE', '606100', '445660', TRUE),
    ('SALAIRE', 'Salaires personnel', 'CHARGE_FIXE', '641000', NULL, TRUE),
    ('MAINTEN', 'Maintenance bâtiments', 'CHARGE_FIXE', '615000', '445660', TRUE),
    ('ELECTR', 'Électricité', 'CHARGE_FIXE', '606110', '445660', TRUE),
    ('EAU', 'Eau', 'CHARGE_FIXE', '606120', '445660', TRUE),
    ('LOYER', 'Loyer', 'CHARGE_FIXE', '613000', NULL, TRUE),
    ('TRANSP', 'Transport', 'CHARGE_VARIABLE', '624000', '445660', TRUE),
    ('COMM', 'Communication', 'CHARGE_FIXE', '626000', '445660', TRUE),
    ('ASSUR', 'Assurances', 'CHARGE_FIXE', '616000', '445660', TRUE),
    ('FORMAT', 'Formation', 'CHARGE_VARIABLE', '628000', '445660', TRUE),
    ('EQUIP', 'Équipement', 'INVESTISSEMENT', '215000', '445660', TRUE),
    ('FRAISB', 'Frais bancaires', 'CHARGE_FIXE', '627000', NULL, TRUE),
    ('IMPOT', 'Impôts et taxes', 'CHARGE_FIXE', '630000', NULL, TRUE),
    ('AUTRE', 'Autres dépenses', 'CHARGE_VARIABLE', '650000', '445660', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- TRIGGERS pour updated_at
-- ==================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger sur toutes les tables
DO $$
DECLARE
    table_name TEXT;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'frais_scolarite', 'echeanciers_paiement', 'paiements', 
            'recus_paiement', 'relances_paiement', 'remises',
            'categories_depense', 'depenses', 'demandes_depense',
            'bons_commande', 'factures_fournisseur'
        )
    LOOP
        EXECUTE format('CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', table_name, table_name);
    END LOOP;
END $$;

-- ==================================
-- COMMENTAIRES
-- ==================================

COMMENT ON TABLE frais_scolarite IS 'Configuration des frais de scolarité par niveau et année scolaire';
COMMENT ON TABLE echeanciers_paiement IS 'Plan de paiement par élève (tranches)';
COMMENT ON TABLE paiements IS 'Transactions de paiement enregistrées';
COMMENT ON TABLE recus_paiement IS 'Reçus générés après chaque paiement';
COMMENT ON TABLE relances_paiement IS 'Suivi des relances pour impayés';
COMMENT ON TABLE remises IS 'Remises accordées aux élèves';
COMMENT ON TABLE categories_depense IS 'Catégories de dépenses avec comptabilité';
COMMENT ON TABLE depenses IS 'Dépenses effectives de l''établissement';
COMMENT ON TABLE demandes_depense IS 'Workflow de demande de dépenses';
COMMENT ON TABLE bons_commande IS 'Bons de commande fournisseurs';
COMMENT ON TABLE factures_fournisseur IS 'Suivi des factures fournisseurs';
