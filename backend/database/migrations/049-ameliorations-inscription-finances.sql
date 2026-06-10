-- ==================================
-- eLISAschool - Migration 049
-- ==================================
-- Améliorations Inscription et Finances
-- Version: 1.0.0
-- Date: 10 juin 2026
-- ==================================

-- ==================================
-- 1. EXTENSION TABLE ELEVES
-- ==================================

-- Type d'inscription : AUTO (portail parent), MANUELLE (personnel), PORTAIL (auto avec compte)
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS typeInscription VARCHAR(20);

-- État du processus d'inscription
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS etatInscription VARCHAR(30) DEFAULT 'COMPLET';

-- Indique si c'est une préinscription
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS estPreinscription BOOLEAN DEFAULT FALSE;

-- Documents justificatifs (JSON)
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS documentsJustificatifs JSONB;

-- Classe souhaitée lors de la préinscription
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS classeSouhaiteeId UUID REFERENCES classes(id);

-- Commentaire en cas de refus
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS commentaireRefus TEXT;

-- Date de traitement de l'inscription
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS dateTraitementInscription TIMESTAMP;

-- Personnel qui a traité l'inscription
ALTER TABLE eleves 
ADD COLUMN IF NOT EXISTS traitePar UUID REFERENCES utilisateurs(id);

-- ==================================
-- 2. EXTENSION TABLE PAIEMENTS (Workflow Validation)
-- ==================================

-- Statut du workflow de validation financière
ALTER TABLE paiements 
ADD COLUMN IF NOT EXISTS statutValidation VARCHAR(20) DEFAULT 'NON_REQUIS';

-- Niveau de validation actuel
ALTER TABLE paiements 
ADD COLUMN IF NOT EXISTS niveauValidationActuel INTEGER DEFAULT 0;

-- Motif de refus du paiement
ALTER TABLE paiements 
ADD COLUMN IF NOT EXISTS motifRefus TEXT;

-- ==================================
-- 3. INDEX COMPOSITES POUR PERFORMANCE
-- ==================================

-- Index pour filtrage rapide des préinscriptions
CREATE INDEX IF NOT EXISTS idx_eleves_preinscription_etat 
ON eleves("etablissementId", estpreinscription, etatinscription) 
WHERE estpreinscription = TRUE;

-- Index pour workflow de validation des paiements
CREATE INDEX IF NOT EXISTS idx_paiements_validation 
ON paiements("etablissementId", statutvalidation, "datePaiement" DESC) 
WHERE statutvalidation != 'NON_REQUIS';

-- Index pour tri par type d'inscription
CREATE INDEX IF NOT EXISTS idx_eleves_type_inscription 
ON eleves("etablissementId", typeinscription, "dateInscription" DESC);

-- Index pour classe souhaitée
CREATE INDEX IF NOT EXISTS idx_eleves_classe_souhaitee 
ON eleves(classesouhaiteeid) 
WHERE classesouhaiteeid IS NOT NULL;

-- ==================================
-- 4. COMMENTAIRES SUR COLONNES
-- ==================================

COMMENT ON COLUMN eleves.typeInscription IS 'Mode d''inscription : AUTO (portail parent), MANUELLE (personnel), PORTAIL (auto avec compte)';
COMMENT ON COLUMN eleves.etatInscription IS 'État du processus d''inscription : BROUILLON, COMPLET, EN_ATTENTE_VALIDATION, VALIDE, REFUSE';
COMMENT ON COLUMN eleves.estPreinscription IS 'true = préinscription, false = inscription complète';
COMMENT ON COLUMN eleves.documentsJustificatifs IS 'Liste des documents justificatifs uploadés (JSON: [{url, type, dateUpload}])';
COMMENT ON COLUMN eleves.classeSouhaiteeId IS 'Classe souhaitée lors de la préinscription';
COMMENT ON COLUMN eleves.commentaireRefus IS 'Motif de refus de la préinscription';
COMMENT ON COLUMN eleves.dateTraitementInscription IS 'Date de traitement de la préinscription (conversion ou refus)';
COMMENT ON COLUMN eleves.traitePar IS 'Utilisateur (personnel) qui a traité la préinscription';

COMMENT ON COLUMN paiements.statutValidation IS 'Statut du workflow de validation financière : NON_REQUIS, EN_ATTENTE, VALIDE, REFUSE';
COMMENT ON COLUMN paiements.niveauValidationActuel IS 'Niveau de validation actuel atteint';
COMMENT ON COLUMN paiements.motifRefus IS 'Motif de refus du paiement par le validateur';

-- ==================================
-- 5. DONNÉES PAR DÉFAUT POUR COMPATIBILITÉ
-- ==================================

-- Mettre à jour les élèves existants
UPDATE eleves 
SET 
    etatInscription = 'COMPLET',
    estPreinscription = FALSE
WHERE etatInscription IS NULL;

-- Mettre à jour les paiements existants
UPDATE paiements 
SET 
    statutValidation = 'NON_REQUIS',
    niveauValidationActuel = 0
WHERE statutValidation IS NULL;
