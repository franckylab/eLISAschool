-- ==================================
-- eLISAschool - Migration Groupes d'Établissements
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Crée le système de regroupement d'établissements
-- pour dashboards et rapports consolidés
-- 
-- Contexte : Permettre aux chefs d'établissements de consulter
-- des statistiques et rapports consolidés pour plusieurs établissements.

-- ==================================
-- ÉTAPE 1 : Table groupes_etablissements
-- ==================================

CREATE TABLE IF NOT EXISTS groupes_etablissements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    proprietaire_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    actif BOOLEAN DEFAULT TRUE,
    cree_at TIMESTAMP DEFAULT NOW(),
    maj_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_groupes_proprietaire 
        FOREIGN KEY (proprietaire_id) 
        REFERENCES utilisateurs(id) 
        ON DELETE RESTRICT
);

-- Index pour requêtes par propriétaire
CREATE INDEX IF NOT EXISTS idx_groupes_proprietaire 
    ON groupes_etablissements(proprietaire_id, actif);

-- Index pour recherche par code
CREATE INDEX IF NOT EXISTS idx_groupes_code 
    ON groupes_etablissements(code);

-- ==================================
-- ÉTAPE 2 : Table de jointure groupe <-> établissement
-- ==================================

CREATE TABLE IF NOT EXISTS groupe_etablissement_liens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groupe_id UUID NOT NULL,
    etablissement_id UUID NOT NULL,
    date_ajout TIMESTAMP DEFAULT NOW(),
    ajoute_par UUID,
    
    CONSTRAINT fk_lien_groupe 
        FOREIGN KEY (groupe_id) 
        REFERENCES groupes_etablissements(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_lien_etablissement 
        FOREIGN KEY (etablissement_id) 
        REFERENCES etablissements(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT uq_groupe_etablissement 
        UNIQUE (groupe_id, etablissement_id)
);

-- Index pour requêtes par groupe
CREATE INDEX IF NOT EXISTS idx_liens_groupe 
    ON groupe_etablissement_liens(groupe_id);

-- Index pour requêtes par établissement
CREATE INDEX IF NOT EXISTS idx_liens_etablissement 
    ON groupe_etablissement_liens(etablissement_id);

-- Index pour tri par date d'ajout
CREATE INDEX IF NOT EXISTS idx_liens_date_ajout 
    ON groupe_etablissement_liens(date_ajout);

-- ==================================
-- ÉTAPE 3 : Table admins du groupe (co-administrateurs)
-- ==================================

CREATE TABLE IF NOT EXISTS groupe_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groupe_id UUID NOT NULL,
    utilisateur_id UUID NOT NULL,
    date_assignation TIMESTAMP DEFAULT NOW(),
    assigne_par UUID,
    
    CONSTRAINT fk_admin_groupe 
        FOREIGN KEY (groupe_id) 
        REFERENCES groupes_etablissements(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_admin_utilisateur 
        FOREIGN KEY (utilisateur_id) 
        REFERENCES utilisateurs(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT uq_groupe_admin 
        UNIQUE (groupe_id, utilisateur_id)
);

-- Index pour requêtes par groupe
CREATE INDEX IF NOT EXISTS idx_groupe_admins_groupe 
    ON groupe_admins(groupe_id);

-- ==================================
-- ÉTAPE 4 : Vérification
-- ==================================

SELECT 
    'Tables créées' AS etape,
    COUNT(*) AS nombre_tables
FROM information_schema.tables
WHERE table_name IN ('groupes_etablissements', 'groupe_etablissement_liens', 'groupe_admins')
    AND table_schema = 'public';

SELECT 
    'Index créés' AS etape,
    COUNT(*) AS nombre_index
FROM pg_indexes
WHERE tablename IN ('groupes_etablissements', 'groupe_etablissement_liens', 'groupe_admins')
    AND schemaname = 'public';
