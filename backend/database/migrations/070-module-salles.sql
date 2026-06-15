-- ==================================
-- eLISAschool - Migration Module Salles
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Crée la table des salles physiques de l'établissement
-- et ajoute la contrainte FK dans emploi_du_temps
-- ==================================

-- ==================================
-- 1. Créer la table salles (si n'existe pas)
-- ==================================

CREATE TABLE IF NOT EXISTS salles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    capacite INTEGER NOT NULL DEFAULT 30,
    localisation VARCHAR(100),
    "typeSalle" VARCHAR(50) NOT NULL DEFAULT 'CLASSIQUE',
    equipements JSONB,
    description TEXT,
    statut VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE',
    disponible BOOLEAN NOT NULL DEFAULT true,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_salles_etablissement FOREIGN KEY ("etablissementId")
        REFERENCES etablissements(id) ON DELETE CASCADE,
    CONSTRAINT uq_salles_code_etablissement UNIQUE (code, "etablissementId"),
    CONSTRAINT chk_salles_capacite CHECK (capacite > 0 AND capacite <= 1000)
);

-- ==================================
-- 2. Index pour performance
-- ==================================

CREATE INDEX IF NOT EXISTS idx_salles_etablissement ON salles("etablissementId");
CREATE INDEX IF NOT EXISTS idx_salles_type ON salles("typeSalle");
CREATE INDEX IF NOT EXISTS idx_salles_disponible ON salles(disponible);
CREATE INDEX IF NOT EXISTS idx_salles_statut ON salles(statut);

-- ==================================
-- 3. Mettre à jour emploi_du_temps (activer FK salle_id)
-- ==================================

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'emploi_du_temps' AND column_name = 'salle_id'
    ) THEN
        -- La colonne existe, ajouter la contrainte FK
        ALTER TABLE emploi_du_temps
            ADD CONSTRAINT fk_emploi_salle
            FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Contrainte FK ajoutée: emploi_du_temps.salle_id -> salles.id';
    ELSE
        -- La colonne n'existe pas, la créer
        ALTER TABLE emploi_du_temps
            ADD COLUMN salle_id UUID;
        
        ALTER TABLE emploi_du_temps
            ADD CONSTRAINT fk_emploi_salle
            FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_emploi_salle ON emploi_du_temps(salle_id);
        
        RAISE NOTICE 'Colonne et FK créées: emploi_du_temps.salle_id';
    END IF;
END $$;

-- ==================================
-- 4. Supprimer sallePrincipale de classes (nettoyage)
-- ==================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'classes' AND column_name = 'salle_principale'
    ) THEN
        ALTER TABLE classes DROP COLUMN salle_principale;
        RAISE NOTICE 'Colonne supprimée: classes.salle_principale';
    ELSE
        RAISE NOTICE 'Colonne déjà absente: classes.salle_principale';
    END IF;
END $$;

-- ==================================
-- 5. Seeds - Salles par défaut
-- ==================================

-- Insérer des salles types pour le premier établissement
-- (À adapter selon l'etablissementId réel)
INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Salle 101',
    'S101',
    35,
    'Bâtiment A, Rez-de-chaussée',
    'CLASSIQUE',
    '["tableau", "projecteur"]'::jsonb,
    'Salle de cours standard',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Salle 102',
    'S102',
    35,
    'Bâtiment A, Rez-de-chaussée',
    'CLASSIQUE',
    '["tableau", "projecteur"]'::jsonb,
    'Salle de cours standard',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Salle 201',
    'S201',
    40,
    'Bâtiment A, 1er étage',
    'CLASSIQUE',
    '["tableau", "clim"]'::jsonb,
    'Salle de cours avec climatisation',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Amphithéâtre A',
    'AMPHI_A',
    150,
    'Bâtiment B, Rez-de-chaussée',
    'AMPHITHEATRE',
    '["projecteur", "micro", "clim"]'::jsonb,
    'Grand amphithéâtre pour les cours magistraux',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Labo Informatique 1',
    'LABO_INFO_1',
    30,
    'Bâtiment C, 1er étage',
    'INFORMATIQUE',
    '["ordinateurs", "projecteur", "internet"]'::jsonb,
    'Salle informatique avec 30 postes',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Labo Chimie',
    'LABO_CHIM',
    25,
    'Bâtiment C, Rez-de-chaussée',
    'LABORATOIRE',
    '["paillasses", "hotte", "eau", "gaz"]'::jsonb,
    'Laboratoire de chimie équipé',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Salle de Sport',
    'SPORT_1',
    50,
    'Complexe sportif',
    'SPORT',
    '["agrès", "ballons"]'::jsonb,
    'Salle polyvalente pour EPS',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

INSERT INTO salles (nom, code, capacite, localisation, "typeSalle", equipements, description, "etablissementId")
SELECT
    'Salle de Musique',
    'MUSIQUE_1',
    20,
    'Bâtiment D, 1er étage',
    'MUSIQUE',
    '["piano", "instruments"]'::jsonb,
    'Salle insonorisée pour cours de musique',
    id
FROM etablissements
WHERE id = (SELECT id FROM etablissements LIMIT 1)
ON CONFLICT (code, "etablissementId") DO NOTHING;

-- ==================================
-- 6. Logging
-- ==================================

DO $$
DECLARE
    salle_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO salle_count FROM salles;
    RAISE NOTICE 'Migration salles terminée. Nombre de salles: %', salle_count;
END $$;
