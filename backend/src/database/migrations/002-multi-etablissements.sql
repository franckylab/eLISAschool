-- ==================================
-- eLISAschool - Migration Multi-Établissements v2.0
-- ==================================
-- Cette migration permet de passer d'un modèle single-établissement
-- à un modèle multi-établissements sans perte de données.
-- 
-- Étapes :
-- 1. Créer la table utilisateur_etablissements
-- 2. Migrer les données existantes depuis utilisateurs.etablissementId
-- 3. Vérifier l'intégrité des données

-- ÉTAPE 1 : Créer la table utilisateur_etablissements
CREATE TABLE IF NOT EXISTS utilisateur_etablissements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utilisateur_id UUID NOT NULL,
    etablissement_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    etablissement_principal BOOLEAN DEFAULT FALSE,
    actif BOOLEAN DEFAULT TRUE,
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    motif VARCHAR(500),
    cree_par UUID,
    cree_at TIMESTAMP DEFAULT NOW(),
    maj_at TIMESTAMP DEFAULT NOW(),
    
    -- Contraintes de clé étrangère
    CONSTRAINT fk_utilisateur_etablissements_utilisateur 
        FOREIGN KEY (utilisateur_id) 
        REFERENCES utilisateurs(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_utilisateur_etablissements_etablissement 
        FOREIGN KEY (etablissement_id) 
        REFERENCES etablissements(id) 
        ON DELETE CASCADE,
    
    -- Contrainte d'unicité : un utilisateur ne peut avoir qu'une seule affectation par établissement
    CONSTRAINT uq_utilisateur_etablissement 
        UNIQUE (utilisateur_id, etablissement_id)
);

-- ÉTAPE 2 : Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_ue_utilisateur_actif 
    ON utilisateur_etablissements(utilisateur_id, actif);

CREATE INDEX IF NOT EXISTS idx_ue_etablissement_actif 
    ON utilisateur_etablissements(etablissement_id, actif);

CREATE INDEX IF NOT EXISTS idx_ue_utilisateur_principal 
    ON utilisateur_etablissements(utilisateur_id, etablissement_principal);

-- ÉTAPE 3 : Migrer les données existantes
-- Pour chaque utilisateur ayant un etablissementId, créer une entrée dans la nouvelle table
INSERT INTO utilisateur_etablissements (
    utilisateur_id,
    etablissement_id,
    role,
    etablissement_principal,
    actif,
    date_debut,
    cree_at,
    maj_at
)
SELECT 
    u.id AS utilisateur_id,
    u.etablissement_id AS etablissement_id,
    u.role AS role,
    TRUE AS etablissement_principal, -- C'était leur seul établissement, donc principal
    TRUE AS actif,
    NOW() AS date_debut,
    NOW() AS cree_at,
    NOW() AS maj_at
FROM utilisateurs u
WHERE u.etablissement_id IS NOT NULL
ON CONFLICT (utilisateur_id, etablissement_id) DO NOTHING;

-- ÉTAPE 4 : Vérification - Afficher les statistiques
SELECT 
    'Total utilisateurs avec etablissementId' AS description,
    COUNT(*) AS count
FROM utilisateurs
WHERE etablissement_id IS NOT NULL

UNION ALL

SELECT 
    'Total affectations créées dans utilisateur_etablissements' AS description,
    COUNT(*) AS count
FROM utilisateur_etablissements

UNION ALL

SELECT 
    'Total établissements principaux définis' AS description,
    COUNT(*) AS count
FROM utilisateur_etablissements
WHERE etablissement_principal = TRUE;

-- ÉTAPE 5 (OPTIONNELLE) : Vérifier les incohérences
-- Utilisateurs sans affectation mais avec etablissementId
SELECT 
    u.id,
    u.email,
    u.etablissement_id,
    'UTILISATEUR SANS AFFECTATION' AS warning
FROM utilisateurs u
LEFT JOIN utilisateur_etablissements ue 
    ON u.id = ue.utilisateur_id 
    AND u.etablissement_id = ue.etablissement_id
WHERE u.etablissement_id IS NOT NULL
AND ue.id IS NULL;

-- COMMENTAIRES :
-- ==============
-- Cette migration est SÉCURISÉE et peut être exécutée sans downtime.
-- 
-- La colonne utilisateurs.etablissementId est CONSERVÉE pour :
-- 1. Assurer la compatibilité ascendante (legacy)
-- 2. Permettre un rollback facile si nécessaire
-- 3. Donner du temps pour migrer le code progressivement
--
-- Dans une future migration (v3.0), on pourra :
-- - Supprimer utilisateurs.etablissementId
-- - Rendre obligatoire l'utilisation de utilisateur_etablissements
--
-- ROLLBACK (si nécessaire) :
-- ===========================
-- DROP TABLE IF EXISTS utilisateur_etablissements CASCADE;
