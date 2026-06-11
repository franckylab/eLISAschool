#!/bin/bash

# ==================================
# eLISAschool - Correction permissions SUPER_ADMIN
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou
#
# Ce script corrige les permissions du super_admin
# ==================================

set -e

echo "=================================="
echo "Correction des permissions SUPER_ADMIN"
echo "=================================="
echo ""

# Vérifier que le fichier SQL existe
SQL_FILE="./scripts/fix-super-admin-permissions.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Erreur: Le fichier $SQL_FILE n'existe pas"
    exit 1
fi

# Demander les informations de connexion à la base de données
echo "📝 Informations de connexion à la base de données :"
read -p "  Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "  Port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "  Database (default: elisaschool): " DB_NAME
DB_NAME=${DB_NAME:-elisaschool}

read -p "  Username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "  Password: " DB_PASSWORD
echo ""

export PGPASSWORD=$DB_PASSWORD

echo ""
echo "🔍 ÉTAPE 1: Diagnostic..."
echo ""

# Exécuter uniquement les parties diagnostic du script
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<'SQL'
-- Vérifier si le rôle SUPER_ADMIN existe
SELECT '✓ Rôle SUPER_ADMIN:' AS info, code, actif 
FROM roles 
WHERE code = 'SUPER_ADMIN';

-- Vérifier les permissions du rôle SUPER_ADMIN
SELECT '✓ Permissions SUPER_ADMIN:' AS info, COUNT(*) as nombre
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
WHERE r.code = 'SUPER_ADMIN';

-- Vérifier les utilisateurs SUPER_ADMIN
SELECT '✓ Utilisateurs SUPER_ADMIN:' AS info, u.email, u.role
FROM utilisateurs u
WHERE u.role = 'SUPER_ADMIN';
SQL

echo ""
echo "📋 Instructions :"
echo ""
echo "1. Identifiez l'email de votre utilisateur super_admin dans la liste ci-dessus"
echo "2. Modifiez le fichier: $SQL_FILE"
echo "3. Remplacez 'super_admin@elisaschool.com' par l'email réel (3 occurrences)"
echo "4. Exécutez le script SQL complet avec:"
echo ""
echo "   PGPASSWORD='$DB_PASSWORD' psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $SQL_FILE"
echo ""
echo "OU utilisez la commande suivante pour une correction automatique:"
echo ""

# Demander l'email de l'utilisateur
read -p "📧 Entrez l'email de votre super_admin: " SUPER_ADMIN_EMAIL

if [ -z "$SUPER_ADMIN_EMAIL" ]; then
    echo "❌ Email vide. Annulation."
    exit 1
fi

echo ""
echo "🔧 ÉTAPE 2: Application des corrections..."
echo ""

# Exécuter les corrections SQL
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v user_email="'$SUPER_ADMIN_EMAIL'" <<'SQL'
-- Attribution de TOUTES les permissions au rôle SUPER_ADMIN
DO $$
DECLARE
    super_admin_role_id UUID;
BEGIN
    SELECT id INTO super_admin_role_id 
    FROM roles 
    WHERE code = 'SUPER_ADMIN';
    
    IF super_admin_role_id IS NOT NULL THEN
        INSERT INTO role_permissions ("roleId", "permissionId")
        SELECT super_admin_role_id, p.id
        FROM permissions p
        WHERE p.actif = true
        AND NOT EXISTS (
            SELECT 1 
            FROM role_permissions rp 
            WHERE rp."roleId" = super_admin_role_id AND rp."permissionId" = p.id
        );
        
        RAISE NOTICE '✓ Permissions attribuées au rôle SUPER_ADMIN';
    ELSE
        RAISE NOTICE '❌ Rôle SUPER_ADMIN non trouvé';
    END IF;
END $$;

-- Vérifier/créer le rôle utilisateur
DO $$
DECLARE
    super_admin_role_id UUID;
    user_id UUID;
    v_email TEXT := current_setting('var.user_email', true);
BEGIN
    -- Si la variable n'est pas définie, utiliser un email par défaut
    IF v_email IS NULL OR v_email = '' THEN
        v_email := 'super_admin@elisaschool.com';
    END IF;
    
    SELECT id INTO super_admin_role_id 
    FROM roles 
    WHERE code = 'SUPER_ADMIN';
    
    SELECT id INTO user_id 
    FROM utilisateurs 
    WHERE email = v_email;
    
    IF user_id IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM utilisateur_roles 
            WHERE "utilisateurId" = user_id AND "roleId" = super_admin_role_id
        ) THEN
            INSERT INTO utilisateur_roles ("utilisateurId", "roleId", "estPrincipal", "actif")
            VALUES (user_id, super_admin_role_id, true, true);
            
            RAISE NOTICE '✓ Rôle SUPER_ADMIN attribué à l''utilisateur: %', v_email;
        ELSE
            RAISE NOTICE '✓ L''utilisateur a déjà le rôle SUPER_ADMIN: %', v_email;
        END IF;
        
        UPDATE utilisateurs 
        SET role = 'SUPER_ADMIN'
        WHERE id = user_id AND role != 'SUPER_ADMIN';
    ELSE
        RAISE NOTICE '❌ Utilisateur non trouvé: %', v_email;
    END IF;
END $$;
SQL

echo ""
echo "✅ ÉTAPE 3: Vérification finale..."
echo ""

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<'SQL'
-- Vérifier les permissions totales
SELECT '✓ Total permissions système:' AS info, COUNT(*) as total
FROM permissions 
WHERE actif = true;

-- Vérifier les permissions du SUPER_ADMIN
SELECT '✓ Permissions SUPER_ADMIN:' AS info, COUNT(*) as total
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE r.code = 'SUPER_ADMIN' AND p.actif = true;

-- Vérifier les rôles de l'utilisateur
SELECT '✓ Rôles utilisateur:' AS info, u.email, r.code as role
FROM utilisateurs u
JOIN utilisateur_roles ur ON u.id = ur."utilisateurId"
JOIN roles r ON ur."roleId" = r.id
WHERE u.role = 'SUPER_ADMIN' OR r.code = 'SUPER_ADMIN'
LIMIT 5;
SQL

echo ""
echo "=================================="
echo "✅ Corrections appliquées avec succès !"
echo "=================================="
echo ""
echo "📌 IMPORTANT : Vous devez maintenant vous reconnecter pour que le JWT soit régénéré avec les nouvelles permissions."
echo ""
echo "1. Déconnectez-vous de l'application frontend"
echo "2. Reconnectez-vous avec votre compte super_admin"
echo "3. Testez l'accès à /api/eleves"
echo ""
