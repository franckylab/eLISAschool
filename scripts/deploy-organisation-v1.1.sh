#!/bin/bash

# ==================================
# eLISAschool - Déploiement Améliorations Organisation v1.1.0
# ==================================
# Version: 1.1.0
# Auteur: franck arlos chendjou
# Description: Applique les optimisations et améliorations du module organisation
# ==================================

set -e

# Couleurs pour l'affichage
VERT='\033[0;32m'
BLEU='\033[0;34m'
JAUNE='\033[1;33m'
ROUGE='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLEU}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLEU}║   eLISAschool - Améliorations Organisation v1.1.0   ║${NC}"
echo -e "${BLEU}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${ROUGE}❌ Erreur: Ce script doit être exécuté depuis le répertoire backend/${NC}"
    exit 1
fi

# Vérifier les variables d'environnement
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USERNAME" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_DATABASE" ]; then
    echo -e "${JAUNE}⚠️  Variables d'environnement de base de données non définies.${NC}"
    echo -e "${JAUNE}   Chargement depuis .env.local...${NC}"
    if [ -f ".env.local" ]; then
        export $(cat .env.local | grep -v '^#' | xargs)
    else
        echo -e "${ROUGE}❌ Fichier .env.local non trouvé${NC}"
        exit 1
    fi
fi

# Vérifier la connexion à la base de données
echo -e "${BLEU}📡 Vérification de la connexion à la base de données...${NC}"
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c '\q' 2>/dev/null; then
    echo -e "${VERT}✅ Connexion à la base de données réussie${NC}"
else
    echo -e "${ROUGE}❌ Impossible de se connecter à la base de données${NC}"
    exit 1
fi

# ==================================
# Étape 1: Appliquer la migration d'optimisation
# ==================================
echo ""
echo -e "${BLEU}📦 Étape 1: Application de la migration d'optimisation...${NC}"

MIGRATION_FILE="database/migrations/045-organisation-optimisations.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${ROUGE}❌ Fichier de migration non trouvé: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${JAUNE}   Exécution de $MIGRATION_FILE...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -f "$MIGRATION_FILE"

echo -e "${VERT}✅ Migration appliquée avec succès${NC}"

# ==================================
# Étape 2: Vérification des index
# ==================================
echo ""
echo -e "${BLEU}🔍 Étape 2: Vérification des index créés...${NC}"

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_DATABASE -c "
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE'
        ELSE 'STANDARD'
    END as type
FROM pg_indexes
WHERE tablename IN ('organisations', 'unites_organisationnelles', 'postes', 'hierarchie_personnel')
    AND indexname LIKE '%organisation%'
ORDER BY tablename, indexname;
"

echo -e "${VERT}✅ Vérification des index terminée${NC}"

# ==================================
# Étape 3: Compilation TypeScript
# ==================================
echo ""
echo -e "${BLEU}🔨 Étape 3: Compilation TypeScript...${NC}"

npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo -e "${VERT}✅ Compilation réussie - Aucune erreur${NC}"
else
    echo -e "${ROUGE}❌ Erreurs de compilation détectées${NC}"
    exit 1
fi

# ==================================
# Étape 4: Redémarrage du backend
# ==================================
echo ""
echo -e "${BLEU}🔄 Étape 4: Redémarrage du backend...${NC}"

# Vérifier si Docker est utilisé
if docker-compose ps >/dev/null 2>&1; then
    echo -e "${JAUNE}   Environnement Docker détecté${NC}"
    cd ..
    docker-compose restart backend
    cd backend
    echo -e "${VERT}✅ Backend redémarré via Docker${NC}"
elif [ -f "nodemon.json" ]; then
    echo -e "${JAUNE}   Environnement nodemon détecté${NC}"
    echo -e "${JAUNE}   Le redémarrage automatique sera effectué par nodemon${NC}"
else
    echo -e "${JAUNE}⚠️  Redémarrez manuellement votre backend pour appliquer les changements${NC}"
fi

# ==================================
# Résumé
# ==================================
echo ""
echo -e "${BLEU}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLEU}║              ✅ DÉPLOIEMENT TERMINÉ                  ║${NC}"
echo -e "${BLEU}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${VERT}🎉 Améliorations Organisation v1.1.0 déployées avec succès!${NC}"
echo ""
echo -e "${BLEU}📊 Résumé des améliorations:${NC}"
echo -e "   ${VERT}✓${NC} Détection de cycles hiérarchiques complète (DFS)"
echo -e "   ${VERT}✓${NC} Sécurité multi-tenancy sur toutes les routes"
echo -e "   ${VERT}✓${NC} Index uniques composites (code + organisationId)"
echo -e "   ${VERT}✓${NC} Pagination sur toutes les listes"
echo -e "   ${VERT}✓${NC} Résolution problèmes N+1 (60-98% de gain)"
echo -e "   ${VERT}✓${NC} Validation complète d'arborescence"
echo -e "   ${VERT}✓${NC] Types forts sur relations TypeORM"
echo -e "   ${VERT}✓${NC} Vérification avant suppression"
echo ""
echo -e "${BLEU}🧪 Test rapide:${NC}"
echo -e "   ${JAUNE}1.${NC} Vérifier les index:"
echo -e "      PGPASSWORD=\$DB_PASSWORD psql -h \$DB_HOST -p \$DB_PORT -U \$DB_USERNAME -d \$DB_DATABASE -c \"SELECT indexname FROM pg_indexes WHERE tablename LIKE '%organisation%';\""
echo ""
echo -e "   ${JAUNE}2.${NC} Tester l'API (remplacer TOKEN):"
echo -e "      curl -H 'Authorization: Bearer TOKEN' http://localhost:3000/api/organisation/organisations?page=1&limit=10"
echo ""
echo -e "   ${JAUNE}3.${NC} Valider une arborescence:"
echo -e "      curl -H 'Authorization: Bearer TOKEN' http://localhost:3000/api/organisation/valider-arborescence/{ORGANISATION_ID}"
echo ""
echo -e "${BLEU}📚 Documentation:${NC}"
echo -e "   - Guide complet: docs/MODULE-ORGANISATION.md"
echo -e "   - Démarrage rapide: docs/QUICKSTART-ORGANISATION.md"
echo -e "   - Améliorations: AMELIORATIONS-ORGANISATION-v1.1.md"
echo ""
echo -e "${VERT}🚀 Prêt pour la production!${NC}"
