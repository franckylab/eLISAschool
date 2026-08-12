/**
 * ==================================
 * eLISAschool - Migration 176 : Nettoyage Rôles SuperAdmin
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Nettoyage du système de rôles :
 * - Suppression de PLATEFORME_SUPER_ADMIN (doublon avec SUPER_ADMIN)
 * - Suppression des 5 rôles legacy obsolètes
 * - Suppression de l'utilisateur platform.super@elisaschool.cm
 * - Réaffectation des utilisateurs vers SUPER_ADMIN
 * 
 * ADR-005 — Source unique de vérité
 */

-- =============================================
-- ÉTAPE 1 : Réaffecter les utilisateurs PLATEFORME_SUPER_ADMIN vers SUPER_ADMIN
-- =============================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Compter les utilisateurs concernés
    SELECT COUNT(*) INTO v_count FROM utilisateurs WHERE role = 'PLATEFORME_SUPER_ADMIN';
    
    IF v_count > 0 THEN
        RAISE NOTICE 'Réaffectation de % utilisateur(s) PLATEFORME_SUPER_ADMIN vers SUPER_ADMIN', v_count;
        
        UPDATE utilisateurs 
        SET role = 'SUPER_ADMIN',
            "updatedAt" = NOW()
        WHERE role = 'PLATEFORME_SUPER_ADMIN';
    END IF;
END $$;

-- =============================================
-- ÉTAPE 2 : Supprimer l'utilisateur platform.super@elisaschool.cm
-- =============================================

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur à supprimer
    SELECT id INTO v_user_id FROM utilisateurs WHERE email = 'platform.super@elisaschool.cm';
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'Suppression de l''utilisateur platform.super@elisaschool.cm (ID: %)', v_user_id;
        
        -- Supprimer les sessions (refresh tokens)
        DELETE FROM refresh_tokens WHERE "utilisateurId" = v_user_id;
        
        -- Supprimer les affectations établissements
        DELETE FROM utilisateur_etablissements WHERE "utilisateurId" = v_user_id;
        
        -- Supprimer les logs d'audit (optionnel — peut être conservé pour traçabilité)
        -- DELETE FROM audit_logs WHERE "utilisateurId" = v_user_id;
        
        -- Supprimer l'utilisateur
        DELETE FROM utilisateurs WHERE id = v_user_id;
    END IF;
END $$;

-- =============================================
-- ÉTAPE 3 : Supprimer les 6 rôles obsolètes de la table roles
-- =============================================

DO $$
DECLARE
    v_roles_a_supprimer TEXT[] := ARRAY[
        'PLATEFORME_SUPER_ADMIN',
        'ADMINISTRATION_PLATEFORME',
        'SECURITE_PLATEFORME',
        'SUPPORT_PLATEFORME',
        'COMMERCIAL_PLATEFORME',
        'MONITORING_PLATEFORME'
    ];
    v_role_code TEXT;
    v_role_id UUID;
    v_count INTEGER;
BEGIN
    FOREACH v_role_code IN ARRAY v_roles_a_supprimer
    LOOP
        -- Récupérer l'ID du rôle
        SELECT id INTO v_role_id FROM roles WHERE code = v_role_code;
        
        IF v_role_id IS NOT NULL THEN
            -- Compter les permissions associées
            SELECT COUNT(*) INTO v_count FROM role_permissions WHERE "roleId" = v_role_id;
            
            IF v_count > 0 THEN
                RAISE NOTICE 'Suppression de % permission(s) pour le rôle %', v_count, v_role_code;
                -- Supprimer les permissions associées
                DELETE FROM role_permissions WHERE "roleId" = v_role_id;
            END IF;
            
            -- Supprimer le rôle
            RAISE NOTICE 'Suppression du rôle % (ID: %)', v_role_code, v_role_id;
            DELETE FROM roles WHERE id = v_role_id;
        END IF;
    END LOOP;
END $$;

-- =============================================
-- ÉTAPE 4 : Vérification finale
-- =============================================

DO $$
DECLARE
    v_count_roles INTEGER;
    v_count_users INTEGER;
BEGIN
    -- Vérifier qu'il ne reste aucun utilisateur avec les rôles supprimés
    SELECT COUNT(*) INTO v_count_users FROM utilisateurs 
    WHERE role IN (
        'PLATEFORME_SUPER_ADMIN',
        'ADMINISTRATION_PLATEFORME',
        'SECURITE_PLATEFORME',
        'SUPPORT_PLATEFORME',
        'COMMERCIAL_PLATEFORME',
        'MONITORING_PLATEFORME'
    );
    
    IF v_count_users > 0 THEN
        RAISE EXCEPTION 'Il reste % utilisateur(s) avec des rôles supprimés', v_count_users;
    END IF;
    
    -- Vérifier qu'il ne reste aucun rôle supprimé dans la table
    SELECT COUNT(*) INTO v_count_roles FROM roles 
    WHERE code IN (
        'PLATEFORME_SUPER_ADMIN',
        'ADMINISTRATION_PLATEFORME',
        'SECURITE_PLATEFORME',
        'SUPPORT_PLATEFORME',
        'COMMERCIAL_PLATEFORME',
        'MONITORING_PLATEFORME'
    );
    
    IF v_count_roles > 0 THEN
        RAISE EXCEPTION 'Il reste % rôle(s) supprimés dans la table', v_count_roles;
    END IF;
    
    RAISE NOTICE 'Migration 176 terminée avec succès : Nettoyage rôles SuperAdmin';
END $$;

-- =============================================
-- NOTES
-- =============================================
-- Le type enum PostgreSQL 'role' n'est PAS modifié (les valeurs restent dans le type).
-- Seules les entrées de la table 'roles' sont supprimées.
-- Les utilisateurs avec ces rôles ont été réaffectés vers SUPER_ADMIN.
-- 
-- Rôles conservés :
-- - SUPER_ADMIN (admin@elisaschool.cm) — Super Admin unifié
-- - PLATEFORME_ADMIN — Admin Plateforme
-- - PLATEFORME_SUPPORT — Support Plateforme
-- - PLATEFORME_BILLING — Facturation Plateforme
-- - PLATEFORME_ANALYST — Analyste Plateforme
-- - PLATEFORME_AUDITOR — Auditeur Plateforme
