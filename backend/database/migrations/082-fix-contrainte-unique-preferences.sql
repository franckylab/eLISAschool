/**
 * ==================================
 * eLISAschool - Migration 082: Fix contrainte unique preferences_utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Problème: Deux contraintes uniques conflictuelles sur preferences_utilisateur
 * - IDX_1: (utilisateurId, cle) UNIQUE
 * - IDX_2: (utilisateurId, cle, etablissementId) UNIQUE
 * 
 * Quand etablissementId est NULL, la première contrainte empêche d'avoir
 * une préférence globale ET des préférences par établissement pour le même
 * couple (utilisateurId, cle).
 * 
 * Solution: Supprimer la contrainte IDX_1 et ne garder que la contrainte
 * composite à 3 colonnes qui permet la coexistence de NULL et non-NULL.
 */

-- Supprimer la contrainte unique conflictuelle (utilisateurId, cle)
-- Cette contrainte empêche d'avoir une préférence globale ET des préférences
-- par établissement pour le même utilisateur et la même clé
DO $$
BEGIN
    -- Trouver et supprimer la contrainte unique sur (utilisateurId, cle) uniquement
    -- On garde celle sur (utilisateurId, cle, etablissementId)
    DECLARE
        constraint_name TEXT;
    BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'preferences_utilisateur'::regclass
          AND contype = 'u'
          AND array_length(conkey, 1) = 2  -- Exactement 2 colonnes
          AND EXISTS (
              SELECT 1 FROM unnest(conkey) k
              JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k
              WHERE a.attname = 'utilisateurId'
          )
          AND EXISTS (
              SELECT 1 FROM unnest(conkey) k
              JOIN pg_attribute a ON a.attrelid = conrelid AND a.attnum = k
              WHERE a.attname = 'cle'
          );
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE preferences_utilisateur DROP CONSTRAINT %I', constraint_name);
            RAISE NOTICE 'Contrainte unique conflictuelle supprimée: %', constraint_name;
        ELSE
            RAISE NOTICE 'Aucune contrainte unique conflictuelle trouvée sur (utilisateurId, cle)';
        END IF;
    END;
$$;

-- Vérifier que la contrainte composite existe toujours
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'preferences_utilisateur'::regclass
          AND contype = 'u'
          AND array_length(conkey, 1) = 3  -- 3 colonnes
    ) THEN
        -- Recréer la contrainte composite si elle n'existe pas
        ALTER TABLE preferences_utilisateur
        ADD CONSTRAINT uq_preferences_utilisateur_user_cle_etablissement
        UNIQUE (utilisateurId, cle, etablissementId);
        
        RAISE NOTICE 'Contrainte composite recréée: uq_preferences_utilisateur_user_cle_etablissement';
    ELSE
        RAISE NOTICE 'Contrainte composite (utilisateurId, cle, etablissementId) existe déjà';
    END IF;
END $$;

-- Vérification finale
DO $$
DECLARE
    constraint_count INT;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint
    WHERE conrelid = 'preferences_utilisateur'::regclass
      AND contype = 'u';
    
    RAISE NOTICE 'Nombre de contraintes uniques restantes sur preferences_utilisateur: %', constraint_count;
    
    -- Afficher les contraintes restantes
    FOR r IN (
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'preferences_utilisateur'::regclass
          AND contype = 'u'
    ) LOOP
        RAISE NOTICE '  - %: %', r.conname, r.definition;
    END LOOP;
END $$;
