-- ==================================
-- eLISAschool - Migration Structure Académique v4.0
-- ==================================
-- Version: 4.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-06-14
-- 
-- Description: Améliorations majeures de la structure académique
-- - AffectationEleve: ajout historique complet (dateSortie, motif)
-- - MatiereNiveau: support filière spécifique
-- - HeureCours: lien avec Salle et Periode obligatoire
-- - ProgrammeChapitre: suivi progression et prérequis
-- - Nouvelles entités: InscriptionOption, IndisponibiliteEnseignant, RepartitionHoraire
-- ==================================

BEGIN;

-- ==================================
-- 1. AMÉLIORATION: AffectationEleve (Historique)
-- ==================================

-- Ajouter colonne dateSortie
ALTER TABLE affectations_eleves 
ADD COLUMN IF NOT EXISTS "dateSortie" DATE;

-- Ajouter colonne motifChangement
ALTER TABLE affectations_eleves 
ADD COLUMN IF NOT EXISTS "motifChangement" VARCHAR(100);

-- Ajouter colonne commentaire
ALTER TABLE affectations_eleves 
ADD COLUMN IF NOT EXISTS commentaire TEXT;

-- Créer index pour optimisation requêtes d'historique
CREATE INDEX IF NOT EXISTS idx_affectations_eleves_statut 
ON affectations_eleves(statut);

CREATE INDEX IF NOT EXISTS idx_affectations_eleves_historique 
ON affectations_eleves("eleveId", "anneeScolaireId", statut);

COMMENT ON COLUMN affectations_eleves."dateSortie" IS 'Date de sortie de la classe (NULL si toujours actif)';
COMMENT ON COLUMN affectations_eleves."motifChangement" IS 'Motif: REDOUBLEMENT, CHANGEMENT_CLASSE, PASSAGE_NIVEAU, RADIATION, TRANSFERE';

-- ==================================
-- 2. AMÉLIORATION: MatiereNiveau (Support Filière)
-- ==================================

-- Ajouter colonne filiereId (optionnel)
ALTER TABLE matieres_niveaux 
ADD COLUMN IF NOT EXISTS "filiereId" UUID;

-- Ajouter contrainte FK vers filieres
ALTER TABLE matieres_niveaux
ADD CONSTRAINT fk_matiere_niveau_filiere 
FOREIGN KEY ("filiereId") REFERENCES filieres(id) 
ON DELETE SET NULL;

-- Créer index pour filtrage par filière
CREATE INDEX IF NOT EXISTS idx_matieres_niveaux_filiere 
ON matieres_niveaux("filiereId");

CREATE INDEX IF NOT EXISTS idx_matieres_niveaux_niveau_filiere 
ON matieres_niveaux("niveauId", "filiereId");

COMMENT ON COLUMN matieres_niveaux."filiereId" IS 'Si NULL: matière pour toutes filières. Si défini: matière spécifique à cette filière';

-- ==================================
-- 3. AMÉLIORATION: HeureCours (Salle et Periode)
-- ==================================

-- Rendre periodeId obligatoire (était nullable)
-- NOTE: Nécessite de définir une valeur par défaut pour les lignes existantes
UPDATE heures_cours 
SET "periodeId" = (
    SELECT id FROM periodes 
    WHERE "anneeScolaireId" = heures_cours."anneeScolaireId" 
    ORDER BY ordre ASC 
    LIMIT 1
)
WHERE "periodeId" IS NULL;

-- Maintenant on peut rendre la colonne NOT NULL
ALTER TABLE heures_cours 
ALTER COLUMN "periodeId" SET NOT NULL;

-- Ajouter colonne salleId (FK vers salles)
ALTER TABLE heures_cours 
ADD COLUMN IF NOT EXISTS "salleId" UUID;

-- Ajouter contrainte FK vers salles
ALTER TABLE heures_cours
ADD CONSTRAINT fk_heure_cours_salle 
FOREIGN KEY ("salleId") REFERENCES salles(id) 
ON DELETE SET NULL;

-- Renommer ancienne colonne salle en salleObsolète
ALTER TABLE heures_cours 
RENAME COLUMN salle TO "salleObsolète";

COMMENT ON COLUMN heures_cours."salleObsolète" IS '@deprecated Utiliser salleId à la place';

-- Ajouter colonne commentaire
ALTER TABLE heures_cours 
ADD COLUMN IF NOT EXISTS commentaire TEXT;

-- Créer index pour détection de conflits
CREATE INDEX IF NOT EXISTS idx_heures_cours_salle 
ON heures_cours("salleId");

CREATE INDEX IF NOT EXISTS idx_heures_cours_conflit_classe 
ON heures_cours("classeId", date, "heureDebut");

CREATE INDEX IF NOT EXISTS idx_heures_cours_conflit_salle 
ON heures_cours("salleId", date, "heureDebut");

COMMENT ON COLUMN heures_cours."periodeId" IS 'Période (trimestre) du cours - OBLIGATOIRE';
COMMENT ON COLUMN heures_cours."salleId" IS 'Salle physique affectée au cours';

-- ==================================
-- 4. AMÉLIORATION: ProgrammeChapitre (Suivi Pédagogique)
-- ==================================

-- Ajouter colonne prerequis (JSON array)
ALTER TABLE programme_chapitres 
ADD COLUMN IF NOT EXISTS prerequis JSONB;

-- Ajouter colonne progressionPourcentage
ALTER TABLE programme_chapitres 
ADD COLUMN IF NOT EXISTS "progressionPourcentage" INTEGER DEFAULT 0;

-- Ajouter colonne ressourcesPedagogiques (JSON array)
ALTER TABLE programme_chapitres 
ADD COLUMN IF NOT EXISTS "ressourcesPedagogiques" JSONB;

-- Ajouter colonne competencesAssociees (JSON array)
ALTER TABLE programme_chapitres 
ADD COLUMN IF NOT EXISTS "competencesAssociees" JSONB;

COMMENT ON COLUMN programme_chapitres.prerequis IS 'IDs des chapitres prérequis (optionnel)';
COMMENT ON COLUMN programme_chapitres."progressionPourcentage" IS 'Pourcentage de progression (0-100)';
COMMENT ON COLUMN programme_chapitres."ressourcesPedagogiques" IS 'Ressources: manuels, vidéos, documents';
COMMENT ON COLUMN programme_chapitres."competencesAssociees" IS 'IDs des compétences travaillées';

-- ==================================
-- 5. NOUVELLE ENTITÉ: inscriptions_options
-- ==================================

CREATE TABLE IF NOT EXISTS inscriptions_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "eleveId" UUID NOT NULL,
    "matiereId" UUID NOT NULL,
    "anneeScolaireId" UUID NOT NULL,
    "dateInscription" DATE NOT NULL DEFAULT CURRENT_DATE,
    "dateAbandon" DATE,
    "motifAbandon" TEXT,
    statut VARCHAR(30) DEFAULT 'ACTIVE',
    coefficient FLOAT DEFAULT 1,
    "estValidée" BOOLEAN DEFAULT FALSE,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes FK
ALTER TABLE inscriptions_options
ADD CONSTRAINT fk_inscription_option_eleve 
FOREIGN KEY ("eleveId") REFERENCES eleves(id) ON DELETE CASCADE;

ALTER TABLE inscriptions_options
ADD CONSTRAINT fk_inscription_option_matiere 
FOREIGN KEY ("matiereId") REFERENCES matieres(id) ON DELETE CASCADE;

ALTER TABLE inscriptions_options
ADD CONSTRAINT fk_inscription_option_annee 
FOREIGN KEY ("anneeScolaireId") REFERENCES annees_scolaires(id) ON DELETE CASCADE;

ALTER TABLE inscriptions_options
ADD CONSTRAINT fk_inscription_option_etablissement 
FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;

-- Index
CREATE INDEX idx_inscriptions_options_eleve ON inscriptions_options("eleveId");
CREATE INDEX idx_inscriptions_options_matiere ON inscriptions_options("matiereId");
CREATE INDEX idx_inscriptions_options_annee ON inscriptions_options("anneeScolaireId");
CREATE INDEX idx_inscriptions_options_etablissement ON inscriptions_options("etablissementId");
CREATE INDEX idx_inscriptions_options_historique ON inscriptions_options("eleveId", "anneeScolaireId", statut);

COMMENT ON TABLE inscriptions_options IS 'Inscription des élèves aux matières optionnelles (Latin, Arts, LV3, etc.)';

-- ==================================
-- 6. NOUVELLE ENTITÉ: indisponibilites_enseignants
-- ==================================

CREATE TABLE IF NOT EXISTS indisponibilites_enseignants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "enseignantId" UUID NOT NULL,
    "typeIndisponibilite" VARCHAR(50) DEFAULT 'AUTRE',
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "heureDebut" TIME,
    "heureFin" TIME,
    "frequenceRecurrence" VARCHAR(50) DEFAULT 'AUCUNE',
    "joursRecurrence" JSONB,
    motif TEXT NOT NULL,
    "estValidée" BOOLEAN DEFAULT TRUE,
    "valideePar" UUID,
    commentaire TEXT,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes FK
ALTER TABLE indisponibilites_enseignants
ADD CONSTRAINT fk_indisponibilite_enseignant 
FOREIGN KEY ("enseignantId") REFERENCES membres_personnel(id) ON DELETE CASCADE;

ALTER TABLE indisponibilites_enseignants
ADD CONSTRAINT fk_indisponibilite_etablissement 
FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;

-- Index
CREATE INDEX idx_indisponibilites_enseignant ON indisponibilites_enseignants("enseignantId");
CREATE INDEX idx_indisponibilites_etablissement ON indisponibilites_enseignants("etablissementId");
CREATE INDEX idx_indisponibilites_dates ON indisponibilites_enseignants("dateDebut", "dateFin");
CREATE INDEX idx_indisponibilites_type ON indisponibilites_enseignants("typeIndisponibilite");
CREATE INDEX idx_indisponibilites_conflit ON indisponibilites_enseignants("enseignantId", "dateDebut", "dateFin");

COMMENT ON TABLE indisponibilites_enseignants IS 'Indisponibilités des enseignants (congés, absences, créneaux non disponibles)';

-- ==================================
-- 7. NOUVELLE ENTITÉ: repartitions_horaires
-- ==================================

CREATE TABLE IF NOT EXISTS repartitions_horaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "affectationId" UUID NOT NULL,
    "jourSemaine" VARCHAR(20) NOT NULL,
    "heureDebut" TIME NOT NULL,
    "heureFin" TIME NOT NULL,
    "nombreHeures" FLOAT DEFAULT 2,
    "sallePrefereeId" UUID,
    priorite INTEGER DEFAULT 1,
    actif BOOLEAN DEFAULT TRUE,
    commentaire TEXT,
    "etablissementId" UUID NOT NULL,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contraintes FK
ALTER TABLE repartitions_horaires
ADD CONSTRAINT fk_repartition_affectation 
FOREIGN KEY ("affectationId") REFERENCES affectations_matieres(id) ON DELETE CASCADE;

ALTER TABLE repartitions_horaires
ADD CONSTRAINT fk_repartition_salle 
FOREIGN KEY ("sallePrefereeId") REFERENCES salles(id) ON DELETE SET NULL;

ALTER TABLE repartitions_horaires
ADD CONSTRAINT fk_repartition_etablissement 
FOREIGN KEY ("etablissementId") REFERENCES etablissements(id) ON DELETE CASCADE;

-- Index
CREATE INDEX idx_repartitions_affectation ON repartitions_horaires("affectationId");
CREATE INDEX idx_repartitions_jour ON repartitions_horaires("jourSemaine");
CREATE INDEX idx_repartitions_etablissement ON repartitions_horaires("etablissementId");
CREATE INDEX idx_repartitions_conflit ON repartitions_horaires("affectationId", "jourSemaine", "heureDebut");

COMMENT ON TABLE repartitions_horaires IS 'Répartition hebdomadaire des heures d''enseignement pour génération automatique de l''emploi du temps';

-- ==================================
-- 8. MISE À JOUR: Suppression Niveau.filiereId (déjà fait dans le code)
-- ==================================

-- Si la colonne existe encore, la supprimer
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'niveaux' AND column_name = 'filiereId'
    ) THEN
        ALTER TABLE niveaux DROP COLUMN "filiereId";
        RAISE NOTICE 'Colonne niveaux.filiereId supprimée';
    ELSE
        RAISE NOTICE 'Colonne niveaux.filiereId déjà supprimée';
    END IF;
END $$;

-- ==================================
-- 9. CRÉATION: Enums personnalisés (si nécessaire)
-- ==================================

-- Vérifier et créer le type enum pour TypeIndisponibilite si PostgreSQL l'exige
-- NOTE: Nous utilisons VARCHAR avec validation dans le code, pas d'enum PostgreSQL natif

-- ==================================
-- VÉRIFICATION FINALE
-- ==================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Vérifier AffectationEleve
    SELECT COUNT(*) INTO v_count FROM information_schema.columns 
    WHERE table_name = 'affectations_eleves' AND column_name = 'dateSortie';
    RAISE NOTICE '✓ AffectationEleve - dateSortie: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'MANQUANT' END;

    -- Vérifier MatiereNiveau
    SELECT COUNT(*) INTO v_count FROM information_schema.columns 
    WHERE table_name = 'matieres_niveaux' AND column_name = 'filiereId';
    RAISE NOTICE '✓ MatiereNiveau - filiereId: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'MANQUANT' END;

    -- Vérifier HeureCours
    SELECT COUNT(*) INTO v_count FROM information_schema.columns 
    WHERE table_name = 'heures_cours' AND column_name = 'salleId';
    RAISE NOTICE '✓ HeureCours - salleId: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'MANQUANT' END;

    -- Vérifier ProgrammeChapitre
    SELECT COUNT(*) INTO v_count FROM information_schema.columns 
    WHERE table_name = 'programme_chapitres' AND column_name = 'progressionPourcentage';
    RAISE NOTICE '✓ ProgrammeChapitre - progressionPourcentage: %', CASE WHEN v_count > 0 THEN 'OK' ELSE 'MANQUANT' END;

    -- Vérifier nouvelles tables
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_name = 'inscriptions_options';
    RAISE NOTICE '✓ Table inscriptions_options: %', CASE WHEN v_count > 0 THEN 'CRÉÉE' ELSE 'MANQUANTE' END;

    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_name = 'indisponibilites_enseignants';
    RAISE NOTICE '✓ Table indisponibilites_enseignants: %', CASE WHEN v_count > 0 THEN 'CRÉÉE' ELSE 'MANQUANTE' END;

    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_name = 'repartitions_horaires';
    RAISE NOTICE '✓ Table repartitions_horaires: %', CASE WHEN v_count > 0 THEN 'CRÉÉE' ELSE 'MANQUANTE' END;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration v4.0 terminée avec succès!';
    RAISE NOTICE '========================================';
END $$;

COMMIT;
