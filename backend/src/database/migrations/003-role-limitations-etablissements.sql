-- ==================================
-- eLISAschool - Migration Limitations Multi-Établissements v2.1
-- ==================================
-- Cette migration ajoute :
-- 1. La table role_limitations_etablissements (configuration des limites par rôle)
-- 2. Données initiales pour tous les rôles
-- 3. Index optimisés

-- ÉTAPE 1 : Créer la table role_limitations_etablissements
CREATE TABLE IF NOT EXISTS role_limitations_etablissements (
    role VARCHAR(50) PRIMARY KEY,
    max_etablissements INT NOT NULL DEFAULT 1,
    peut_changer BOOLEAN NOT NULL DEFAULT true,
    necessite_validation BOOLEAN NOT NULL DEFAULT false,
    description VARCHAR(500),
    cree_at TIMESTAMP DEFAULT NOW(),
    maj_at TIMESTAMP DEFAULT NOW()
);

-- ÉTAPE 2 : Insérer les limitations par défaut pour chaque rôle
INSERT INTO role_limitations_etablissements (
    role, 
    max_etablissements, 
    peut_changer, 
    necessite_validation,
    description
) VALUES
    ('SUPER_ADMIN', 999, true, false, 'Accès illimité à tous les établissements'),
    ('ADMIN', 10, true, false, 'Administrateur peut gérer jusqu''à 10 établissements'),
    ('CHEF_ETABLISSEMENT', 5, true, false, 'Directeur de groupe scolaire (max 5)'),
    ('ENSEIGNANT', 5, true, false, 'Enseignant vacataire multi-sites (max 5)'),
    ('PERSONNEL', 3, true, false, 'Personnel administratif partagé (max 3)'),
    ('RESPONSABLE_CANTINE', 2, true, true, 'Responsable cantine (max 2, nécessite validation)'),
    ('RESPONSABLE_TRANSPORT', 2, true, true, 'Responsable transport (max 2, nécessite validation)'),
    ('PARENT', 10, true, false, 'Parent avec enfants dans différents établissements (max 10)'),
    ('ELEVE', 1, false, false, 'Élève inscrit dans un seul établissement (interdiction multi-sites)')
ON CONFLICT (role) DO NOTHING;

-- ÉTAPE 3 : Créer des index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_role_limitations_max 
    ON role_limitations_etablissements(max_etablissements);

CREATE INDEX IF NOT EXISTS idx_role_limitations_validation 
    ON role_limitations_etablissements(necessite_validation) 
    WHERE necessite_validation = true;

-- ÉTAPE 4 : Vérification - Afficher la configuration
SELECT 
    role,
    max_etablissements,
    peut_changer,
    necessite_validation,
    description
FROM role_limitations_etablissements
ORDER BY max_etablissements DESC;

-- ÉTAPE 5 : Requête pour modifier les limitations (exemple)
-- UPDATE role_limitations_etablissements 
-- SET max_etablissements = 8, maj_at = NOW()
-- WHERE role = 'ENSEIGNANT';

-- COMMENTAIRES :
-- ==============
-- Cette table permet de configurer DYNAMIQUEMENT les limitations sans redéployer le code.
-- 
-- SUPER_ADMIN peut modifier ces limitations via une interface d'administration.
-- 
-- Exemple d'utilisation :
-- - Augmenter le nombre max d'établissements pour les enseignants pendant les remplacements
-- - Activer la validation pour certains rôles temporairement
-- - Désactiver le changement d'établissement pour audit
--
-- ROLLBACK :
-- ==========
-- DROP TABLE IF EXISTS role_limitations_etablissements CASCADE;
