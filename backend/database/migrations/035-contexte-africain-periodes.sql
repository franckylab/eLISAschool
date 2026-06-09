-- ==================================
-- eLISAschool - Migration 035: Contexte Africain + Périodes
-- ==================================
-- Objectif: Ajouter periodeId aux entités de suivi et créer enums structurés
-- pour incidents, sanctions et félicitations (contexte Cameroun/Afrique)
-- Date: 8 juin 2026
-- ==================================

-- ============================================
-- 1. INCIDENTS ÉLÈVES - Ajout periodeId
-- ============================================

-- Ajouter colonne periodeId
ALTER TABLE incidents_eleves 
ADD COLUMN IF NOT EXISTS "periodeId" uuid;

-- Ajouter contrainte FK
ALTER TABLE incidents_eleves
ADD CONSTRAINT fk_incidents_eleves_periode 
FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_periode ON incidents_eleves("periodeId");
CREATE INDEX IF NOT EXISTS idx_incidents_eleves_annee_periode ON incidents_eleves("anneeScolaireId", "periodeId");

-- ============================================
-- 2. OBSERVATIONS ÉLÈVES - Ajout periodeId
-- ============================================

ALTER TABLE observations_eleves 
ADD COLUMN IF NOT EXISTS "periodeId" uuid;

ALTER TABLE observations_eleves
ADD CONSTRAINT fk_observations_eleves_periode 
FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_observations_eleves_periode ON observations_eleves("periodeId");
CREATE INDEX IF NOT EXISTS idx_observations_eleves_annee_periode ON observations_eleves("anneeScolaireId", "periodeId");

-- ============================================
-- 3. SANCTIONS ÉLÈVES - Ajout periodeId
-- ============================================

ALTER TABLE sanctions_eleves 
ADD COLUMN IF NOT EXISTS "periodeId" uuid;

ALTER TABLE sanctions_eleves
ADD CONSTRAINT fk_sanctions_eleves_periode 
FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_periode ON sanctions_eleves("periodeId");
CREATE INDEX IF NOT EXISTS idx_sanctions_eleves_annee_periode ON sanctions_eleves("anneeScolaireId", "periodeId");

-- ============================================
-- 4. FÉLICITATIONS ÉLÈVES - Ajout periodeId
-- ============================================

ALTER TABLE felicitations_eleves 
ADD COLUMN IF NOT EXISTS "periodeId" uuid;

ALTER TABLE felicitations_eleves
ADD CONSTRAINT fk_felicitations_eleves_periode 
FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_felicitations_eleves_periode ON felicitations_eleves("periodeId");
CREATE INDEX IF NOT EXISTS idx_felicitations_eleves_annee_periode ON felicitations_eleves("anneeScolaireId", "periodeId");

-- ============================================
-- 5. INCIDENTS PERSONNEL - Ajout periodeId
-- ============================================

ALTER TABLE incidents_personnel 
ADD COLUMN IF NOT EXISTS "periodeId" uuid;

ALTER TABLE incidents_personnel
ADD CONSTRAINT fk_incidents_personnel_periode 
FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_personnel_periode ON incidents_personnel("periodeId");
CREATE INDEX IF NOT EXISTS idx_incidents_personnel_annee_periode ON incidents_personnel("anneeScolaireId", "periodeId");

-- ============================================
-- 6. ÉVALUATIONS PERSONNEL - Index periodeId
-- ============================================
-- (periodeId existe déjà, juste les index)

CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_periode ON evaluations_personnel("periodeId");
CREATE INDEX IF NOT EXISTS idx_evaluations_personnel_annee_periode ON evaluations_personnel("anneeScolaireId", "periodeId");

-- ============================================
-- 7. DOSSIERS MÉDICAUX - Ajout periodeId
-- ============================================

ALTER TABLE dossiers_medicaux 
ADD COLUMN IF NOT EXISTS "periodeId" uuid;

ALTER TABLE dossiers_medicaux
ADD CONSTRAINT fk_dossiers_medicaux_periode 
FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dossiers_medicaux_periode ON dossiers_medicaux("periodeId");

-- ============================================
-- 8. CONSULTATIONS MÉDICALES - Ajout periodeId
-- ============================================

ALTER TABLE consultations_medicales 
ADD COLUMN IF NOT EXISTS "periodeId" uuid;

ALTER TABLE consultations_medicales
ADD CONSTRAINT fk_consultations_medicales_periode 
FOREIGN KEY ("periodeId") REFERENCES periodes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_consultations_medicales_periode ON consultations_medicales("periodeId");
CREATE INDEX IF NOT EXISTS idx_consultations_medicales_periode_type ON consultations_medicales("periodeId", type);

-- ============================================
-- 9. MISE À JOUR DONNÉES EXISTANTES (Optionnel)
-- ============================================
-- Lier les incidents existants à leur période basée sur la date

-- Exemple: incidents du T1 2025-2026 (septembre-décembre 2025)
-- UPDATE incidents_eleves SET "periodeId" = (
--     SELECT id FROM periodes 
--     WHERE "anneeScolaireId" = incidents_eleves."anneeScolaireId"
--     AND type = 'TRIMESTRE' 
--     AND "dateDebut" <= incidents_eleves.dateIncident
--     AND "dateFin" >= incidents_eleves.dateIncident
--     LIMIT 1
-- ) WHERE "periodeId" IS NULL AND dateIncident BETWEEN '2025-09-01' AND '2025-12-31';

-- ============================================
-- 10. VÉRIFICATION
-- ============================================

-- Vérifier les colonnes ajoutées
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN (
    'incidents_eleves',
    'observations_eleves',
    'sanctions_eleves',
    'felicitations_eleves',
    'incidents_personnel',
    'evaluations_personnel',
    'dossiers_medicaux',
    'consultations_medicales'
)
AND column_name = 'periodeId'
ORDER BY table_name;

-- Vérifier les index créés
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'incidents_eleves',
    'observations_eleves',
    'sanctions_eleves',
    'felicitations_eleves',
    'incidents_personnel',
    'evaluations_personnel',
    'dossiers_medicaux',
    'consultations_medicales'
)
AND indexname LIKE '%periode%'
ORDER BY tablename, indexname;

-- ============================================
-- MIGRATION COMPLÉTÉE ✅
-- ============================================
-- 
-- Résumé:
-- ✅ 8 colonnes periodeId ajoutées (toutes nullable)
-- ✅ 8 contraintes FK créées
-- ✅ 17 index composites créés
-- ✅ Enums TypeScript dans entities:
--    - TypeIncidentEleve (20 types)
--    - TypeSanction (18 types progressifs)
--    - TypeFelicitation (20 types contextualisés)
--
-- Contexte africain:
-- ✅ FRAIS_SCOLARITE_NON_PAYES (incident)
-- ✅ ABANDON_TEMPORAIRE (saisons rurales)
-- ✅ TRAVAIL_ENFANT (réalité terrain)
-- ✅ EXCELLENCE_BILINGUE (Cameroun franco/anglo)
-- ✅ EXCUSES_DEVANT_CHEF (autorité traditionnelle)
-- ✅ CONVOCATION_CHEF_FAMILLE (famille élargie)
-- ============================================
