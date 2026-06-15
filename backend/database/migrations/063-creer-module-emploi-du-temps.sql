-- ==================================
-- eLISAschool - Migration 063: Module Emploi-du-Temps
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Objectif: Créer le module emploi-du-temps avec:
-- - Table emploi_du_temps (créneaux horaires)
-- - Table preferences_emploi_du_temps (configuration)
-- - Support génération automatique
-- ==================================

BEGIN;

-- ÉTAPE 1: Créer les types enum
DO $$ BEGIN
    CREATE TYPE jour_semaine_enum AS ENUM (
        'LUNDI',
        'MARDI',
        'MERCREDI',
        'JEUDI',
        'VENDREDI',
        'SAMEDI'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE type_creneau_enum AS ENUM (
        'COURS',
        'TD',
        'TP',
        'ETUDE',
        'RECREATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ÉTAPE 2: Créer la table emploi_du_temps
CREATE TABLE IF NOT EXISTS emploi_du_temps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classe_id UUID NOT NULL REFERENCES classes(id),
    matiere_id UUID NOT NULL REFERENCES matieres(id),
    enseignant_id UUID NOT NULL REFERENCES membres_personnel(id),
    salle_id UUID,  -- FK optionnelle vers salles (sera ajoutée quand la table existera)
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id),
    jour jour_semaine_enum NOT NULL,
    heure_debut TIME NOT NULL,
    heure_fin TIME NOT NULL,
    type_creneau type_creneau_enum NOT NULL DEFAULT 'COURS',
    couleur VARCHAR(7),
    actif BOOLEAN NOT NULL DEFAULT true,
    genere_automatiquement BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ÉTAPE 3: Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_emploi_du_temps_classe ON emploi_du_temps(classe_id);
CREATE INDEX IF NOT EXISTS idx_emploi_du_temps_matiere ON emploi_du_temps(matiere_id);
CREATE INDEX IF NOT EXISTS idx_emploi_du_temps_enseignant ON emploi_du_temps(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_emploi_du_temps_jour_heure ON emploi_du_temps(jour, heure_debut);
CREATE UNIQUE INDEX IF NOT EXISTS idx_emploi_du_temps_unique ON emploi_du_temps(classe_id, jour, heure_debut, heure_fin);

-- ÉTAPE 4: Créer la table preferences_emploi_du_temps
CREATE TABLE IF NOT EXISTS preferences_emploi_du_temps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    etablissement_id UUID NOT NULL,
    heure_debut_cours TIME NOT NULL DEFAULT '07:30',
    heure_fin_cours TIME NOT NULL DEFAULT '17:00',
    duree_creneau_standard INT NOT NULL DEFAULT 55,
    duree_recreation INT NOT NULL DEFAULT 15,
    jours_ouvrables TEXT[] NOT NULL DEFAULT ARRAY['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'],
    max_creneaux_par_jour INT NOT NULL DEFAULT 8,
    max_creneaux_matiere_par_jour INT NOT NULL DEFAULT 2,
    max_creneaux_consecutifs INT NOT NULL DEFAULT 2,
    pause_debut TIME,
    pause_fin TIME,
    repartition_equilibree BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ÉTAPE 5: Créer les index
CREATE INDEX IF NOT EXISTS idx_preferences_emploi_etablissement ON preferences_emploi_du_temps(etablissement_id);

-- ÉTAPE 6: Ajouter les commentaires
COMMENT ON TABLE emploi_du_temps IS 'Créneaux horaires de l''emploi du temps';
COMMENT ON COLUMN emploi_du_temps.genere_automatiquement IS 'Indique si le créneau a été généré automatiquement';
COMMENT ON TABLE preferences_emploi_du_temps IS 'Préférences de génération d''emploi du temps par établissement';

-- ÉTAPE 7: Vérification
DO $$
DECLARE
    table_edt BOOLEAN;
    table_pref BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'emploi_du_temps'
    ) INTO table_edt;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'preferences_emploi_du_temps'
    ) INTO table_pref;
    
    IF table_edt AND table_pref THEN
        RAISE NOTICE '✓ Module Emploi-du-Temps créé avec succès';
        RAISE NOTICE '✓ Table emploi_du_temps créée avec 7 index';
        RAISE NOTICE '✓ Table preferences_emploi_du_temps créée';
        RAISE NOTICE '✓ Types enum: jour_semaine_enum, type_creneau_enum';
        RAISE NOTICE '💡 Génération automatique disponible via POST /api/emploi-du-temps/generer';
    ELSE
        RAISE EXCEPTION '✗ Échec de la création du module Emploi-du-Temps';
    END IF;
END $$;

COMMIT;

-- ==================================
-- POST-MIGRATION: Utilisation
-- ==================================
-- 1. Configurer les préférences:
-- PUT /api/emploi-du-temps/preferences
-- {
--   "heureDebutCours": "07:30",
--   "heureFinCours": "17:00",
--   "dureeCreneauStandard": 55,
--   "dureeRecreation": 15,
--   "joursOuvrables": ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"]
-- }
--
-- 2. Générer l'emploi du temps:
-- POST /api/emploi-du-temps/generer
-- {
--   "classeId": "...",
--   "anneeScolaireId": "...",
--   "etablissementId": "...",
--   "options": {
--     "regenerer": true,
--     "respecterContraintes": true
--   }
-- }
--
-- 3. Lister l'emploi du temps d'une classe:
-- GET /api/emploi-du-temps/classe/:classeId?anneeScolaireId=...
--
-- 4. Créer un créneau manuel:
-- POST /api/emploi-du-temps
-- {
--   "classeId": "...",
--   "matiereId": "...",
--   "enseignantId": "...",
--   "jour": "LUNDI",
--   "heureDebut": "08:00",
--   "heureFin": "08:55",
--   "typeCreneau": "COURS"
-- }
-- ==================================
