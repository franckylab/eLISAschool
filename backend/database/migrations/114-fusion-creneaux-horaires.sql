-- ==================================
-- eLISAschool - Migration 114 : Fusion EmploiDuTemps + RepartitionHoraire → CreneauHoraire
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Date: 2026-07-24
--
-- Objectif : Créer l'entité unique CreneauHoraire qui fusionne les créneaux
-- d'emploi du temps (emploi_du_temps) et les répartitions horaires (repartitions_horaires).
-- Le nouveau créneau référence affectationMatiereId comme source d'enseignant+matière+classe.
-- ==================================

-- 1. Créer la table creneaux_horaires
CREATE TABLE IF NOT EXISTS creneaux_horaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source : affectation matière (enseignant + matière + classe-année)
    "affectationMatiereId" UUID,
    
    -- Planification hebdomadaire
    "jour" VARCHAR(10) NOT NULL CHECK ("jour" IN ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI')),
    "heureDebut" TIME NOT NULL,
    "heureFin" TIME NOT NULL,
    "typeCreneau" VARCHAR(20) NOT NULL DEFAULT 'COURS' CHECK ("typeCreneau" IN ('COURS', 'TD', 'TP', 'ETUDE', 'RECREATION')),
    
    -- Statut du créneau
    "statut" VARCHAR(20) NOT NULL DEFAULT 'PLANIFIE' CHECK ("statut" IN ('PLANIFIE', 'VALIDE')),
    
    -- Localisation
    "salleId" UUID,
    
    -- Contexte temporel
    "periodeId" UUID,
    "anneeScolaireId" UUID,
    "etablissementId" UUID NOT NULL,
    
    -- Affichage
    "couleur" VARCHAR(20),
    "notes" TEXT,
    
    -- Origine
    "genereAutomatiquement" BOOLEAN DEFAULT false,
    
    -- Audit
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_creneaux_horaires_affectation ON creneaux_horaires("affectationMatiereId");
CREATE INDEX IF NOT EXISTS idx_creneaux_horaires_etablissement ON creneaux_horaires("etablissementId");
CREATE INDEX IF NOT EXISTS idx_creneaux_horaires_periode ON creneaux_horaires("periodeId");
CREATE INDEX IF NOT EXISTS idx_creneaux_horaires_annee ON creneaux_horaires("anneeScolaireId");
CREATE INDEX IF NOT EXISTS idx_creneaux_horaires_jour ON creneaux_horaires("jour");
CREATE INDEX IF NOT EXISTS idx_creneaux_horaires_statut ON creneaux_horaires("statut");

-- Index composite pour détection de conflits (même classe, même jour, plages qui se chevauchent)
CREATE INDEX IF NOT EXISTS idx_creneaux_horaires_conflit ON creneaux_horaires("affectationMatiereId", "jour");

-- 3. Migrer les données depuis emploi_du_temps
-- EmploiDuTemps a : classeAnneeId, matiereId, enseignantId, salleId, jour, heureDebut, heureFin, typeCreneau, periodeId, anneeScolaireId, etablissementId, couleur, genereAutomatiquement
-- On doit résoudre affectationMatiereId via la jointure affectations_matieres
INSERT INTO creneaux_horaires (
    "affectationMatiereId", "jour", "heureDebut", "heureFin", "typeCreneau",
    "statut", "salleId", "periodeId", "anneeScolaireId", "etablissementId",
    "couleur", "notes", "genereAutomatiquement", "createdAt", "updatedAt"
)
SELECT
    am.id AS "affectationMatiereId",
    edt."jour",
    edt."heureDebut",
    edt."heureFin",
    COALESCE(edt."typeCreneau", 'COURS') AS "typeCreneau",
    CASE WHEN edt."actif" = true THEN 'PLANIFIE' ELSE 'PLANIFIE' END AS "statut",
    edt."salleId",
    edt."periodeId",
    edt."anneeScolaireId",
    edt."etablissementId",
    edt."couleur",
    NULL AS "notes",
    COALESCE(edt."genereAutomatiquement", false) AS "genereAutomatiquement",
    COALESCE(edt."createdAt", NOW()) AS "createdAt",
    COALESCE(edt."updatedAt", NOW()) AS "updatedAt"
FROM emploi_du_temps edt
LEFT JOIN affectations_matieres am ON (
    am."matiereId" = edt."matiereId"
    AND am."classeAnneeId" = edt."classeAnneeId"
    AND am."enseignantId" = edt."enseignantId"
    AND am."etablissementId" = edt."etablissementId"
    AND am."actif" = true
)
WHERE edt."actif" = true;

-- 4. Migrer les données depuis repartitions_horaires
-- RepartitionHoraire a : affectationId, jourSemaine, heureDebut, heureFin, nombreHeures, salleId, priorite, actif, etablissementId
INSERT INTO creneaux_horaires (
    "affectationMatiereId", "jour", "heureDebut", "heureFin", "typeCreneau",
    "statut", "salleId", "etablissementId",
    "genereAutomatiquement", "createdAt", "updatedAt"
)
SELECT
    rh."affectationId" AS "affectationMatiereId",
    rh."jourSemaine" AS "jour",
    rh."heureDebut",
    rh."heureFin",
    'COURS' AS "typeCreneau",
    'PLANIFIE' AS "statut",
    rh."salleId",
    rh."etablissementId",
    false AS "genereAutomatiquement",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM repartitions_horaires rh
WHERE rh."actif" = true
-- Éviter les doublons : ne pas insérer si déjà migré depuis emploi_du_temps
AND NOT EXISTS (
    SELECT 1 FROM creneaux_horaires ch
    WHERE ch."affectationMatiereId" = rh."affectationId"
    AND ch."jour" = rh."jourSemaine"
    AND ch."heureDebut" = rh."heureDebut"
    AND ch."heureFin" = rh."heureFin"
);

-- 5. Mettre à jour heures_cours.creneauId pour pointer vers creneaux_horaires
-- D'abord, ajouter une colonne temporaire pour la migration
ALTER TABLE heures_cours ADD COLUMN IF NOT EXISTS "creneauHoraireId" UUID;

-- Migrer les FK existantes (si creneauId pointait vers emploi_du_temps)
-- Note : si creneauId référençait emploi_du_temps.id, on doit mapper vers creneaux_horaires.id
-- On utilise une jointure sur les données migrées
UPDATE heures_cours hc
SET "creneauHoraireId" = ch.id
FROM creneaux_horaires ch
JOIN emploi_du_temps edt ON (
    edt."matiereId" = (SELECT am."matiereId" FROM affectations_matieres am WHERE am.id = ch."affectationMatiereId")
    AND edt."classeAnneeId" = (SELECT am."classeAnneeId" FROM affectations_matieres am WHERE am.id = ch."affectationMatiereId")
    AND edt."jour" = ch."jour"
    AND edt."heureDebut" = ch."heureDebut"
)
WHERE hc."creneauId" = edt.id;

-- 6. Supprimer l'ancienne colonne creneauId et renommer
ALTER TABLE heures_cours DROP COLUMN IF EXISTS "creneauId";
ALTER TABLE heures_cours RENAME COLUMN "creneauHoraireId" TO "creneauId";

-- 7. Supprimer les anciennes tables
DROP TABLE IF EXISTS emploi_du_temps;
DROP TABLE IF EXISTS repartitions_horaires;

-- 8. Contrainte : heureFin > heureDebut
ALTER TABLE creneaux_horaires ADD CONSTRAINT chk_creneau_heures CHECK ("heureFin" > "heureDebut");
