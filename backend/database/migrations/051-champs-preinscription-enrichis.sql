/**
 * ==================================
 * eLISAschool - Migration: Champs enrichis pour préinscriptions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-10
 * 
 * Description: Ajoute tous les champs manquants pour supporter
 * le formulaire de préinscription enrichi (v2.1)
 */

-- ==================================
// CHAMPS CRITIQUES : Identité de l'élève
-- ==================================
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS nom VARCHAR(100),
  ADD COLUMN IF NOT EXISTS prenom VARCHAR(100);

-- Index pour recherche par nom/prénom
CREATE INDEX IF NOT EXISTS idx_eleve_nom_prenom ON eleves(nom, prenom);

-- ==================================
// INFORMATIONS PÈRE (5 champs)
-- ==================================
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS professionPere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS telephonePere VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emailPere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS adressePere VARCHAR(300);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_eleve_telephone_pere ON eleves(telephonePere);
CREATE INDEX IF NOT EXISTS idx_eleve_email_pere ON eleves(emailPere);

-- ==================================
// INFORMATIONS MÈRE (5 champs)
-- ==================================
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS professionMere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS telephoneMere VARCHAR(20),
  ADD COLUMN IF NOT EXISTS emailMere VARCHAR(150),
  ADD COLUMN IF NOT EXISTS adresseMere VARCHAR(300);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_eleve_telephone_mere ON eleves(telephoneMere);
CREATE INDEX IF NOT EXISTS idx_eleve_email_mere ON eleves(emailMere);

-- ==================================
// INFORMATIONS TUTEUR (4 champs)
-- ==================================
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS lienParenteTuteur VARCHAR(50),
  ADD COLUMN IF NOT EXISTS professionTuteur VARCHAR(150),
  ADD COLUMN IF NOT EXISTS emailTuteur VARCHAR(150),
  ADD COLUMN IF NOT EXISTS adresseTuteur VARCHAR(300);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_eleve_telephone_tuteur ON eleves(telephoneTuteur);
CREATE INDEX IF NOT EXISTS idx_eleve_email_tuteur ON eleves(emailTuteur);

-- ==================================
// CONTACT PRINCIPAL ET SERVICES (5 champs)
-- ==================================
ALTER TABLE eleves 
  ADD COLUMN IF NOT EXISTS emailPrincipal VARCHAR(150),
  ADD COLUMN IF NOT EXISTS transportScolaire BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cantine BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS situationFamiliale VARCHAR(50),
  ADD COLUMN IF NOT EXISTS personneAutorisee VARCHAR(300);

-- Index pour email principal
CREATE INDEX IF NOT EXISTS idx_eleve_email_principal ON eleves(emailPrincipal);

-- ==================================
// MISE À JOUR DES DONNÉES EXISTANTES
-- ==================================

-- Pour les préinscriptions existantes, extraire nom/prénom depuis matricule
-- (cette requête est un exemple, à adapter selon vos données)
-- UPDATE eleves 
-- SET nom = SPLIT_PART(matricule, '-', 1),
--     prenom = SPLIT_PART(matricule, '-', 2)
-- WHERE nom IS NULL AND estPreinscription = true;

-- ==================================
// COMMENTAIRES
-- ==================================

-- 19 nouveaux champs ajoutés :
-- - 2 champs critiques : nom, prenom
-- - 5 champs père : professionPere, telephonePere, emailPere, adressePere
-- - 5 champs mère : professionMere, telephoneMere, emailMere, adresseMere  
-- - 4 champs tuteur : lienParenteTuteur, professionTuteur, emailTuteur, adresseTuteur
-- - 5 champs services : emailPrincipal, transportScolaire, cantine, situationFamiliale, personneAutorisee

-- 8 index créés pour optimisation des recherches

-- Les champs existants conservés :
-- - nomPere, nomMere, nomTuteur, telephoneTuteur
-- - Tous les autres champs de l'élève (adresse, ville, etc.)
