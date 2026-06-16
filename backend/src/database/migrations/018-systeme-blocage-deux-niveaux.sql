-- ==================================
-- eLISAschool - Migration: Système de blocage à deux niveaux
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- Description: Ajoute la table de traçage des tentatives de connexion avec distinction par machine
-- ==================================

-- Table principale pour le traçage des tentatives
CREATE TABLE IF NOT EXISTS tentatives_connexion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification
    identifiant VARCHAR(255) NOT NULL,
    "adresseIp" VARCHAR(45) NOT NULL,
    "empreinteMachine" VARCHAR(255),
    
    -- Type de blocage
    "typeBlocage" VARCHAR(20) NOT NULL DEFAULT 'specifique',
    
    -- Comptage
    "nombreTentatives" INTEGER NOT NULL DEFAULT 0,
    
    -- Blocage
    "bloqueJusqua" TIMESTAMP,
    "motifBlocage" VARCHAR(255),
    
    -- Traçage temporel
    "derniereTentative" TIMESTAMP NOT NULL DEFAULT NOW(),
    "nbDeblocagesAuto" INTEGER NOT NULL DEFAULT 0,
    
    -- Métadonnées
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tentatives_identifiant_ip 
    ON tentatives_connexion(identifiant, "adresseIp");

CREATE INDEX IF NOT EXISTS idx_tentatives_ip_bloque 
    ON tentatives_connexion("adresseIp", "bloqueJusqua");

CREATE INDEX IF NOT EXISTS idx_tentatives_type_bloque 
    ON tentatives_connexion("typeBlocage", "bloqueJusqua");

CREATE INDEX IF NOT EXISTS idx_tentatives_derniere 
    ON tentatives_connexion("derniereTentative");

-- Commentaires
COMMENT ON TABLE tentatives_connexion IS 'Traçage des tentatives de connexion échouées avec blocage à deux niveaux';
COMMENT ON COLUMN tentatives_connexion.identifiant IS 'Identifiant utilisé (email, matricule, pseudonyme)';
COMMENT ON COLUMN tentatives_connexion."adresseIp" IS 'Adresse IP de la machine';
COMMENT ON COLUMN tentatives_connexion."empreinteMachine" IS 'Hash SHA-256 du user-agent + IP';
COMMENT ON COLUMN tentatives_connexion."typeBlocage" IS 'specifique (par identifiant) ou general (par machine)';
COMMENT ON COLUMN tentatives_connexion."nombreTentatives" IS 'Nombre de tentatives échouées';
COMMENT ON COLUMN tentatives_connexion."bloqueJusqua" IS 'Date de fin de blocage (null si pas bloqué)';
COMMENT ON COLUMN tentatives_connexion."motifBlocage" IS 'Raison du blocage';
COMMENT ON COLUMN tentatives_connexion."derniereTentative" IS 'Date de la dernière tentative';
COMMENT ON COLUMN tentatives_connexion."nbDeblocagesAuto" IS 'Nombre de fois où le blocage a expiré naturellement';

-- Paramètres de configuration du système de blocage
INSERT INTO parametres_systeme (cle, valeur, "typeValeur", categorie, module, description, "modifiableRuntime", visible) VALUES
('auth.max_tentatives_specifique', '3', 'NUMBER', 'SECURITE', 'auth', 
 'Nombre maximum de tentatives échouées par identifiant avant blocage spécifique', 
 true, true),
('auth.duree_blocage_specifique', '1', 'NUMBER', 'SECURITE', 'auth', 
 'Durée de blocage spécifique en minutes après 3 échecs sur le même identifiant', 
 true, true),
('auth.max_tentatives_general', '20', 'NUMBER', 'SECURITE', 'auth', 
 'Nombre maximum de tentatives échouées par machine avant blocage général', 
 true, true),
('auth.duree_blocage_general', '2', 'NUMBER', 'SECURITE', 'auth', 
 'Durée de blocage général en minutes après 20 échecs depuis la même machine', 
 true, true)
ON CONFLICT (cle) DO UPDATE SET
    valeur = EXCLUDED.valeur,
    description = EXCLUDED.description,
    "updatedAt" = NOW();

-- Nettoyage automatique des anciennes tentatives (> 24h) via fonction
CREATE OR REPLACE FUNCTION nettoyer_anciennes_tentatives()
RETURNS INTEGER AS $$
DECLARE
    nb_supprimes INTEGER;
BEGIN
    DELETE FROM tentatives_connexion
    WHERE "derniereTentative" < NOW() - INTERVAL '24 hours'
    AND ("bloqueJusqua" IS NULL OR "bloqueJusqua" < NOW());
    
    GET DIAGNOSTICS nb_supprimes = ROW_COUNT;
    
    RETURN nb_supprimes;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION nettoyer_anciennes_tentatives() IS 'Supprime les tentatives de connexion de plus de 24h';
