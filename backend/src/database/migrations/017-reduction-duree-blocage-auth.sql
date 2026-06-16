-- ==================================
-- eLISAschool - Réduction durée de blocage authentification
-- ==================================
-- Version: 1.0.0
-- Auteur: franck arlos chendjou
-- 
-- Description: Réduction de la durée de blocage après échecs de connexion
-- de 15 minutes à 2 minutes
-- ==================================

-- Mettre à jour le paramètre de configuration
UPDATE parametres_systeme
SET valeur = '2',
    updated_at = NOW()
WHERE cle = 'auth.lockout_duration';

-- Vérification
SELECT cle, valeur, description 
FROM parametres_systeme 
WHERE cle = 'auth.lockout_duration';

-- Résultat attendu:
-- cle                  | valeur | description
-- auth.lockout_duration | 2      | Durée de blocage après échecs (minutes)
