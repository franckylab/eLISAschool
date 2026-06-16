#!/bin/bash

# ==================================
# eLISAschool - Diagnostic Matricule
# ==================================
# Vérifie si les matricules existent dans la base de données

echo "========================================"
echo "DIAGNOSTIC MATRICULES eLISAschool"
echo "========================================"
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration DB
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-elisaschool}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

echo "📊 Connexion à la base: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# Vérifier les matricules des utilisateurs de test
echo "🔍 Vérification des matricules dans la base..."
echo ""

docker exec -i elisaschool_db psql -U $DB_USER -d $DB_NAME << 'SQL'

-- 1. Compter total utilisateurs avec matricule
SELECT 
    'Total utilisateurs avec matricule' as description,
    COUNT(*) as count
FROM utilisateurs 
WHERE matricule IS NOT NULL AND matricule != '';

-- 2. Vérifier les matricules de test
SELECT 
    'Matricules de test' as description,
    matricule,
    email,
    role,
    statut
FROM utilisateurs 
WHERE matricule IN ('ELV-001', 'ENS-001', 'ADMIN-001', 'CHEF-001', 'PAR-001')
ORDER BY matricule;

-- 3. Vérifier les établissements associés
SELECT 
    'Établissements associés' as description,
    u.matricule,
    u.email,
    ue."etablissementId",
    ue.role,
    ue."etablissementPrincipal",
    ue.actif
FROM utilisateurs u
LEFT JOIN "utilisateur_etablissements" ue ON ue."utilisateurId" = u.id
WHERE u.matricule IN ('ELV-001', 'ENS-001', 'ADMIN-001')
ORDER BY u.matricule;

-- 4. Compter utilisateurs SANS établissement
SELECT 
    'Utilisateurs SANS établissement' as description,
    COUNT(*) as count
FROM utilisateurs u
LEFT JOIN "utilisateur_etablissements" ue ON ue."utilisateurId" = u.id
WHERE ue.id IS NULL;

-- 5. Voir tous les matricules uniques (sample 20)
SELECT 
    'Sample de matricules (20 premiers)' as description,
    matricule,
    email,
    role
FROM utilisateurs
WHERE matricule IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 20;

SQL

echo ""
echo "========================================"
echo "💡 DIAGNOSTIC TERMINÉ"
echo "========================================"
echo ""
echo "📋 Si les matricules n'existent pas:"
echo "   → Exécuter: npm run seed"
echo ""
echo "📋 Si les matricules existent mais SANS établissement:"
echo "   → Exécuter: npm run seed:multi-tenant"
echo ""
