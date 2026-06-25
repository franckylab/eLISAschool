-- ==================================
-- eLISAschool - Migration Paramètres Régionaux par Établissement
-- ==================================
-- Version: 3.0.0
-- Auteur: franck arlos chendjou
-- Description: Ajoute les colonnes langueDefaut, devise, fuseauHoraire à la table etablissements
-- ==================================

-- Ajouter la colonne langueDefaut
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS langueDefaut VARCHAR(10) DEFAULT 'fr';

-- Ajouter la colonne devise
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS devise VARCHAR(10) DEFAULT 'XAF';

-- Ajouter la colonne fuseauHoraire
ALTER TABLE etablissements 
ADD COLUMN IF NOT EXISTS fuseauHoraire VARCHAR(50) DEFAULT 'Africa/Douala';

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN etablissements.langueDefaut IS 'Langue par défaut (fr, en, pt). Fallback: ParametreSysteme → ConfigurationApp → ''fr''';
COMMENT ON COLUMN etablissements.devise IS 'Devise monétaire (XAF, XOF, EUR, USD). Fallback: ParametreSysteme → ConfigurationApp → ''XAF''';
COMMENT ON COLUMN etablissements.fuseauHoraire IS 'Fuseau horaire IANA. Fallback: ParametreSysteme → ConfigurationApp → ''Africa/Douala''';

-- Mettre à jour les établissements existants avec les valeurs par défaut (au cas où)
UPDATE etablissements 
SET 
    langueDefaut = COALESCE(langueDefaut, 'fr'),
    devise = COALESCE(devise, 'XAF'),
    fuseauHoraire = COALESCE(fuseauHoraire, 'Africa/Douala')
WHERE 
    langueDefaut IS NULL 
    OR devise IS NULL 
    OR fuseauHoraire IS NULL;

-- Créer un index pour les requêtes de filtrage (optionnel mais utile pour les statistiques)
CREATE INDEX IF NOT EXISTS idx_etablissements_langue ON etablissements(langueDefaut);
CREATE INDEX IF NOT EXISTS idx_etablissements_devise ON etablissements(devise);
