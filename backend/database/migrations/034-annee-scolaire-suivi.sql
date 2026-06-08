-- ==================================
-- eLISAschool - Migration 034
-- ==================================
-- Ajout lien période académique au système de suivi
-- Date: 8 juin 2026
-- 
-- Modifications:
-- 1. anneeScolaireId sur 8 entités de suivi
-- 2. Contexte pédagogique sur incidents élèves (classe, matiere, enseignant)
-- 3. periodeId sur evaluations_personnel
-- 4. Index composites pour performance
-- ==================================

-- ==================== 1. INCIDENTS ÉLÈVES ====================

-- Ajouter colonne anneeScolaireId
ALTER TABLE incidents_eleves 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

-- Remplir avec année scolaire en cours
DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE incidents_eleves 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
        
        ALTER TABLE incidents_eleves 
        ALTER COLUMN annee_scolaire_id SET NOT NULL;
    ELSE
        RAISE WARNING 'Aucune année scolaire en cours trouvée - annee_scolaire_id reste NULL';
    END IF;
END $$;

-- Ajouter contexte pédagogique (optionnel)
ALTER TABLE incidents_eleves 
ADD COLUMN IF NOT EXISTS classe_id UUID,
ADD COLUMN IF NOT EXISTS matiere_id UUID,
ADD COLUMN IF NOT EXISTS enseignant_id UUID;

-- Créer index
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_annee_scolaire 
ON incidents_eleves(annee_scolaire_id);

CREATE INDEX IF NOT EXISTS idx_incidents_eleves_annee_eleve 
ON incidents_eleves(annee_scolaire_id, eleve_id);

CREATE INDEX IF NOT EXISTS idx_incidents_eleves_annee_gravite 
ON incidents_eleves(annee_scolaire_id, gravite);

CREATE INDEX IF NOT EXISTS idx_incidents_eleves_classe 
ON incidents_eleves(classe_id);

CREATE INDEX IF NOT EXISTS idx_incidents_eleves_matiere 
ON incidents_eleves(matiere_id);

-- Contraintes FK
ALTER TABLE incidents_eleves 
ADD CONSTRAINT fk_incidents_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE RESTRICT;

ALTER TABLE incidents_eleves 
ADD CONSTRAINT fk_incidents_classe 
FOREIGN KEY (classe_id) 
REFERENCES classes(id) 
ON DELETE SET NULL;

ALTER TABLE incidents_eleves 
ADD CONSTRAINT fk_incidents_matiere 
FOREIGN KEY (matiere_id) 
REFERENCES matieres(id) 
ON DELETE SET NULL;

ALTER TABLE incidents_eleves 
ADD CONSTRAINT fk_incidents_enseignant 
FOREIGN KEY (enseignant_id) 
REFERENCES utilisateurs(id) 
ON DELETE SET NULL;


-- ==================== 2. OBSERVATIONS ÉLÈVES ====================

ALTER TABLE observations_eleves 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE observations_eleves 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
        
        ALTER TABLE observations_eleves 
        ALTER COLUMN annee_scolaire_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_observations_eleves_annee_scolaire 
ON observations_eleves(annee_scolaire_id);

CREATE INDEX IF NOT EXISTS idx_observations_eleves_annee_eleve 
ON observations_eleves(annee_scolaire_id, eleve_id);

ALTER TABLE observations_eleves 
ADD CONSTRAINT fk_observations_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE RESTRICT;


-- ==================== 3. SANCTIONS ÉLÈVES ====================

ALTER TABLE sanctions_eleves 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE sanctions_eleves 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
        
        ALTER TABLE sanctions_eleves 
        ALTER COLUMN annee_scolaire_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_annee_scolaire 
ON sanctions_eleves(annee_scolaire_id);

CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_annee_eleve 
ON sanctions_eleves(annee_scolaire_id, eleve_id);

ALTER TABLE sanctions_eleves 
ADD CONSTRAINT fk_sanctions_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE RESTRICT;


-- ==================== 4. FÉLICITATIONS ÉLÈVES ====================

ALTER TABLE felicitations_eleves 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE felicitations_eleves 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
        
        ALTER TABLE felicitations_eleves 
        ALTER COLUMN annee_scolaire_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_felicitations_eleves_annee_scolaire 
ON felicitations_eleves(annee_scolaire_id);

CREATE INDEX IF NOT EXISTS idx_felicitations_eleves_annee_eleve 
ON felicitations_eleves(annee_scolaire_id, eleve_id);

ALTER TABLE felicitations_eleves 
ADD CONSTRAINT fk_felicitations_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE RESTRICT;


-- ==================== 5. INCIDENTS PERSONNEL ====================

ALTER TABLE incidents_personnel 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE incidents_personnel 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
        
        ALTER TABLE incidents_personnel 
        ALTER COLUMN annee_scolaire_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incidents_personnel_annee_scolaire 
ON incidents_personnel(annee_scolaire_id);

CREATE INDEX IF NOT EXISTS idx_incidents_personnel_annee_membre 
ON incidents_personnel(annee_scolaire_id, membre_personnel_id);

ALTER TABLE incidents_personnel 
ADD CONSTRAINT fk_incidents_personnel_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE RESTRICT;


-- ==================== 6. ÉVALUATIONS PERSONNEL ====================

ALTER TABLE evaluations_personnel 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID,
ADD COLUMN IF NOT EXISTS periode_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE evaluations_personnel 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
        
        ALTER TABLE evaluations_personnel 
        ALTER COLUMN annee_scolaire_id SET NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_annee_scolaire 
ON evaluations_personnel(annee_scolaire_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_annee_membre 
ON evaluations_personnel(annee_scolaire_id, membre_personnel_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_periode 
ON evaluations_personnel(periode_id);

ALTER TABLE evaluations_personnel 
ADD CONSTRAINT fk_evaluations_personnel_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE RESTRICT;

ALTER TABLE evaluations_personnel 
ADD CONSTRAINT fk_evaluations_personnel_periode 
FOREIGN KEY (periode_id) 
REFERENCES periodes(id) 
ON DELETE SET NULL;


-- ==================== 7. DOSSIERS MÉDICAUX ====================

ALTER TABLE dossiers_medicaux 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE dossiers_medicaux 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
    END IF;
END $$;

-- NOTE: Pas de NOT NULL car dossier médical peut être permanent
CREATE INDEX IF NOT EXISTS idx_dossiers_medicaux_annee_scolaire 
ON dossiers_medicaux(annee_scolaire_id);

ALTER TABLE dossiers_medicaux 
ADD CONSTRAINT fk_dossiers_medicaux_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE SET NULL;


-- ==================== 8. CONSULTATIONS MÉDICALES ====================

ALTER TABLE consultations_medicales 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE consultations_medicales 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultations_medicales_annee_scolaire 
ON consultations_medicales(annee_scolaire_id);

CREATE INDEX IF NOT EXISTS idx_consultations_medicales_annee_dossier 
ON consultations_medicales(annee_scolaire_id, dossier_medical_id);

ALTER TABLE consultations_medicales 
ADD CONSTRAINT fk_consultations_medicales_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE SET NULL;


-- ==================== 9. INCIDENTS SANTÉ ====================

ALTER TABLE incidents_sante 
ADD COLUMN IF NOT EXISTS annee_scolaire_id UUID;

DO $$
DECLARE
    annee_en_cours UUID;
BEGIN
    SELECT id INTO annee_en_cours
    FROM annees_scolaires
    WHERE en_cours = true
    LIMIT 1;
    
    IF annee_en_cours IS NOT NULL THEN
        UPDATE incidents_sante 
        SET annee_scolaire_id = annee_en_cours
        WHERE annee_scolaire_id IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incidents_sante_annee_scolaire 
ON incidents_sante(annee_scolaire_id);

ALTER TABLE incidents_sante 
ADD CONSTRAINT fk_incidents_sante_annee_scolaire 
FOREIGN KEY (annee_scolaire_id) 
REFERENCES annees_scolaires(id) 
ON DELETE SET NULL;


-- ==================== VÉRIFICATION ====================

-- Compter les lignes modifiées
DO $$
DECLARE
    count_incidents_eleves INTEGER;
    count_observations_eleves INTEGER;
    count_sanctions_eleves INTEGER;
    count_felicitations_eleves INTEGER;
    count_incidents_personnel INTEGER;
    count_evaluations_personnel INTEGER;
    count_dossiers_medicaux INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_incidents_eleves FROM incidents_eleves WHERE annee_scolaire_id IS NOT NULL;
    SELECT COUNT(*) INTO count_observations_eleves FROM observations_eleves WHERE annee_scolaire_id IS NOT NULL;
    SELECT COUNT(*) INTO count_sanctions_eleves FROM sanctions_eleves WHERE annee_scolaire_id IS NOT NULL;
    SELECT COUNT(*) INTO count_felicitations_eleves FROM felicitations_eleves WHERE annee_scolaire_id IS NOT NULL;
    SELECT COUNT(*) INTO count_incidents_personnel FROM incidents_personnel WHERE annee_scolaire_id IS NOT NULL;
    SELECT COUNT(*) INTO count_evaluations_personnel FROM evaluations_personnel WHERE annee_scolaire_id IS NOT NULL;
    SELECT COUNT(*) INTO count_dossiers_medicaux FROM dossiers_medicaux WHERE annee_scolaire_id IS NOT NULL;
    
    RAISE NOTICE '=== Migration 034 - Résumé ===';
    RAISE NOTICE 'Incidents élèves: % lignes mises à jour', count_incidents_eleves;
    RAISE NOTICE 'Observations élèves: % lignes mises à jour', count_observations_eleves;
    RAISE NOTICE 'Sanctions élèves: % lignes mises à jour', count_sanctions_eleves;
    RAISE NOTICE 'Félicitations élèves: % lignes mises à jour', count_felicitations_eleves;
    RAISE NOTICE 'Incidents personnel: % lignes mises à jour', count_incidents_personnel;
    RAISE NOTICE 'Évaluations personnel: % lignes mises à jour', count_evaluations_personnel;
    RAISE NOTICE 'Dossiers médicaux: % lignes mises à jour', count_dossiers_medicaux;
END $$;

-- Afficher index créés
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN (
    'incidents_eleves', 
    'observations_eleves', 
    'sanctions_eleves', 
    'felicitations_eleves',
    'incidents_personnel',
    'evaluations_personnel',
    'dossiers_medicaux',
    'consultations_medicales',
    'incidents_sante'
)
AND indexname LIKE '%annee%'
ORDER BY tablename, indexname;
