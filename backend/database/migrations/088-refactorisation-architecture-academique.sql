/**
 * ==================================
 * eLISAschool - Migration 088: Refactorisation Architecture Académique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Objectifs:
 * 1. Créer table configurations_matieres_classes
 * 2. Créer table classes_annees
 * 3. Modifier affectations_matieres (ajouter configurationId, dateDebut, dateFin, actif)
 * 4. Modifier affectations_eleves (remplacer classeId+anneeScolaireId par classeAnneeId)
 * 5. Modifier bulletins (remplacer classeId+anneeScolaireId par classeAnneeId)
 * 6. Modifier classes (supprimer anneeScolaireId, professeurPrincipalId → classes_annees)
 * 7. Migrer les données existantes
 * 8. Créer index et contraintes
 */

-- ==========================================
-- 1. CRÉER TABLE configurations_matieres_classes
-- ==========================================

CREATE TABLE IF NOT EXISTS configurations_matieres_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matiere_id UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
    classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    coefficient FLOAT,
    bareme INTEGER,
    volume_horaire_hebdo INTEGER,
    credits FLOAT,
    obligatoire BOOLEAN DEFAULT true,
    statut VARCHAR(30) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour configurations_matieres_classes
CREATE INDEX IF NOT EXISTS idx_cfg_mc_matiere ON configurations_matieres_classes(matiere_id);
CREATE INDEX IF NOT EXISTS idx_cfg_mc_classe ON configurations_matieres_classes(classe_id);
CREATE INDEX IF NOT EXISTS idx_cfg_mc_annee ON configurations_matieres_classes(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_cfg_mc_etablissement ON configurations_matieres_classes(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_cfg_mc_classe_annee_etab ON configurations_matieres_classes(classe_id, annee_scolaire_id, etablissement_id);

-- Contrainte unique : une matière ne peut avoir qu'une seule configuration par classe/année/établissement
CREATE UNIQUE INDEX IF NOT EXISTS idx_cfg_mc_unique ON configurations_matieres_classes(matiere_id, classe_id, annee_scolaire_id, etablissement_id);

-- ==========================================
-- 2. CRÉER TABLE classes_annees
-- ==========================================

CREATE TABLE IF NOT EXISTS classes_annees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classe_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    annee_scolaire_id UUID NOT NULL REFERENCES annees_scolaires(id) ON DELETE CASCADE,
    etablissement_id UUID NOT NULL REFERENCES etablissements(id) ON DELETE CASCADE,
    professeur_principal_id UUID REFERENCES membres_personnel(id),
    effectif_max INTEGER DEFAULT 50,
    effectif_actuel INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    statut VARCHAR(30) DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour classes_annees
CREATE INDEX IF NOT EXISTS idx_ca_classe ON classes_annees(classe_id);
CREATE INDEX IF NOT EXISTS idx_ca_annee ON classes_annees(annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_ca_etablissement ON classes_annees(etablissement_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ca_unique ON classes_annees(classe_id, annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_ca_etablissement_annee ON classes_annees(etablissement_id, annee_scolaire_id);
CREATE INDEX IF NOT EXISTS idx_ca_professeur ON classes_annees(professeur_principal_id);

-- ==========================================
-- 3. MIGRER DONNÉES : classes → classes_annees
-- ==========================================

-- Créer une entrée classes_annees pour chaque classe existante
INSERT INTO classes_annees (
    classe_id,
    annee_scolaire_id,
    etablissement_id,
    professeur_principal_id,
    effectif_max,
    effectif_actuel,
    actif,
    statut
)
SELECT 
    c.id AS classe_id,
    c.annee_scolaire_id,
    c.etablissement_id,
    c.professeur_principal_id,
    c.effectif_max,
    c.effectif_actuel,
    c.actif,
    'ACTIVE' AS statut
FROM classes c
WHERE c.annee_scolaire_id IS NOT NULL
ON CONFLICT (classe_id, annee_scolaire_id) DO NOTHING;

-- ==========================================
-- 4. MODIFIER TABLE affectations_matieres
-- ==========================================

-- Ajouter les nouvelles colonnes
ALTER TABLE affectations_matieres ADD COLUMN IF NOT EXISTS configuration_id UUID REFERENCES configurations_matieres_classes(id);
ALTER TABLE affectations_matieres ADD COLUMN IF NOT EXISTS date_debut DATE;
ALTER TABLE affectations_matieres ADD COLUMN IF NOT EXISTS date_fin DATE;
ALTER TABLE affectations_matieres ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_am_configuration ON affectations_matieres(configuration_id);

-- Contrainte unique partielle : un enseignant ne peut avoir qu'une seule affectation active par matière/classe/année
CREATE UNIQUE INDEX IF NOT EXISTS idx_am_unique_actif 
ON affectations_matieres(enseignant_id, matiere_id, classe_id, annee_scolaire_id, actif)
WHERE actif = true;

-- Initialiser dateDebut pour les affectations existantes
UPDATE affectations_matieres 
SET date_debut = created_at::DATE
WHERE date_debut IS NULL;

-- ==========================================
-- 5. PRÉPARER MIGRATION affectations_eleves
-- ==========================================

-- Ajouter temporairement la colonne classeAnneeId (nullable pour migration)
ALTER TABLE affectations_eleves ADD COLUMN IF NOT EXISTS classe_annee_id UUID;

-- Migrer les données : trouver le classeAnneeId correspondant
UPDATE affectations_eleves ae
SET classe_annee_id = ca.id
FROM classes_annees ca
WHERE ae.classe_id = ca.classe_id
  AND ae.annee_scolaire_id = ca.annee_scolaire_id;

-- Vérifier qu'aucun affectation_eleve n'a un classe_annee_id NULL
DO $$
DECLARE
    count_null INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_null
    FROM affectations_eleves
    WHERE classe_annee_id IS NULL;
    
    IF count_null > 0 THEN
        RAISE NOTICE 'ATTENTION: % affectations_eleves n''ont pas de classe_annee_id correspondant. Vérifiez les données.', count_null;
    END IF;
END $$;

-- Rendre la colonne NOT NULL si toutes les migrations sont réussies
-- (À exécuter manuellement après vérification)
-- ALTER TABLE affectations_eleves ALTER COLUMN classe_annee_id SET NOT NULL;

-- Ajouter la FK
ALTER TABLE affectations_eleves 
ADD CONSTRAINT fk_ae_classe_annee 
FOREIGN KEY (classe_annee_id) REFERENCES classes_annees(id) ON DELETE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS idx_ae_classe_annee ON affectations_eleves(classe_annee_id);

-- Supprimer les anciennes colonnes (après vérification)
-- ALTER TABLE affectations_eleves DROP COLUMN IF EXISTS classe_id;
-- ALTER TABLE affectations_eleves DROP COLUMN IF EXISTS annee_scolaire_id;

-- ==========================================
-- 6. PRÉPARER MIGRATION bulletins
-- ==========================================

-- Ajouter temporairement la colonne classeAnneeId
ALTER TABLE bulletins ADD COLUMN IF NOT EXISTS classe_annee_id UUID;

-- Migrer les données
UPDATE bulletins b
SET classe_annee_id = ca.id
FROM classes_annees ca
WHERE b.classe_id = ca.classe_id
  AND b.annee_scolaire_id = ca.annee_scolaire_id;

-- Vérifier
DO $$
DECLARE
    count_null INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_null
    FROM bulletins
    WHERE classe_annee_id IS NULL;
    
    IF count_null > 0 THEN
        RAISE NOTICE 'ATTENTION: % bulletins n''ont pas de classe_annee_id correspondant. Vérifiez les données.', count_null;
    END IF;
END $$;

-- Ajouter la FK
ALTER TABLE bulletins 
ADD CONSTRAINT fk_b_classe_annee 
FOREIGN KEY (classe_annee_id) REFERENCES classes_annees(id) ON DELETE CASCADE;

-- Index
CREATE INDEX IF NOT EXISTS idx_b_classe_annee ON bulletins(classe_annee_id);

-- Supprimer les anciennes colonnes (après vérification)
-- ALTER TABLE bulletins DROP COLUMN IF EXISTS classe_id;
-- ALTER TABLE bulletins DROP COLUMN IF EXISTS annee_scolaire_id;

-- ==========================================
-- 7. CRÉER TRIGGER updated_at
-- ==========================================

-- Trigger pour configurations_matieres_classes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_cfg_mc_updated_at ON configurations_matieres_classes;
CREATE TRIGGER trg_cfg_mc_updated_at
    BEFORE UPDATE ON configurations_matieres_classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour classes_annees
DROP TRIGGER IF EXISTS trg_ca_updated_at ON classes_annees;
CREATE TRIGGER trg_ca_updated_at
    BEFORE UPDATE ON classes_annees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 8. SEED: Configurations par défaut depuis MatiereNiveau
-- ==========================================

-- Créer des configurations par défaut pour chaque classe existante
-- en copiant les valeurs depuis MatiereNiveau
INSERT INTO configurations_matieres_classes (
    matiere_id,
    classe_id,
    annee_scolaire_id,
    etablissement_id,
    coefficient,
    bareme,
    volume_horaire_hebdo,
    credits,
    obligatoire,
    statut
)
SELECT DISTINCT
    mn.matiere_id,
    c.id AS classe_id,
    c.annee_scolaire_id,
    c.etablissement_id,
    mn.coefficient,
    mn.bareme,
    mn.volume_horaire,
    mn.credits,
    mn.obligatoire,
    'ACTIVE' AS statut
FROM matieres_niveaux mn
INNER JOIN classes c ON c.niveau_id = mn.niveau_id
WHERE c.annee_scolaire_id IS NOT NULL
  AND (mn.filiere_id IS NULL OR mn.filiere_id = c.filiere_id)
ON CONFLICT (matiere_id, classe_id, annee_scolaire_id, etablissement_id) DO NOTHING;

-- ==========================================
-- 9. VÉRIFICATIONS FINALES
-- ==========================================

DO $$
DECLARE
    count_cfg INTEGER;
    count_ca INTEGER;
    count_am_update INTEGER;
    count_ae_migrate INTEGER;
    count_b_migrate INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_cfg FROM configurations_matieres_classes;
    SELECT COUNT(*) INTO count_ca FROM classes_annees;
    SELECT COUNT(*) INTO count_am_update FROM affectations_matieres WHERE date_debut IS NOT NULL;
    SELECT COUNT(*) INTO count_ae_migrate FROM affectations_eleves WHERE classe_annee_id IS NOT NULL;
    SELECT COUNT(*) INTO count_b_migrate FROM bulletins WHERE classe_annee_id IS NOT NULL;
    
    RAISE NOTICE '=== Migration 088 - Résumé ===';
    RAISE NOTICE 'configurations_matieres_classes créées: %', count_cfg;
    RAISE NOTICE 'classes_annees créées: %', count_ca;
    RAISE NOTICE 'affectations_matieres avec date_debut: %', count_am_update;
    RAISE NOTICE 'affectations_eleves migrées: %', count_ae_migrate;
    RAISE NOTICE 'bulletins migrés: %', count_b_migrate;
    RAISE NOTICE '=== Migration terminée ===';
END $$;

-- ==========================================
-- NOTES POST-MIGRATION
-- ==========================================

-- Après vérification manuelle des données, exécuter :
-- ALTER TABLE affectations_eleves DROP COLUMN IF EXISTS classe_id;
-- ALTER TABLE affectations_eleves DROP COLUMN IF EXISTS annee_scolaire_id;
-- ALTER TABLE bulletins DROP COLUMN IF EXISTS classe_id;
-- ALTER TABLE bulletins DROP COLUMN IF EXISTS annee_scolaire_id;
-- ALTER TABLE classes DROP COLUMN IF EXISTS annee_scolaire_id;
-- ALTER TABLE classes DROP COLUMN IF EXISTS professeur_principal_id;
-- ALTER TABLE classes DROP COLUMN IF EXISTS effectif_max;
-- ALTER TABLE classes DROP COLUMN IF EXISTS effectif_actuel;

-- Rendre classe_annee_id NOT NULL après vérification :
-- ALTER TABLE affectations_eleves ALTER COLUMN classe_annee_id SET NOT NULL;
-- ALTER TABLE bulletins ALTER COLUMN classe_annee_id SET NOT NULL;
