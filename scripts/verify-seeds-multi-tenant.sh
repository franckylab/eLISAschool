#!/bin/bash

# ==================================
# eLISAschool - Script de vérification des seeds multi-tenant
# ==================================
# Version: 1.0.0
# 
# Vérifie que les utilisateurs sont correctement liés à l'établissement par défaut

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Vérification des Seeds Multi-Tenant${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""

# Variables de connexion DB
DB_USER="elisaschool_user"
DB_PASS="elisaschool_password"
DB_NAME="elisaschool"
DB_HOST="localhost"
DB_PORT="7002"

# Fonction pour exécuter une requête SQL
run_sql() {
    PGPASSWORD=$DB_PASS psql -U $DB_USER -d $DB_NAME -h $DB_HOST -p $DB_PORT -t -A -c "$1"
}

# 1. Vérifier la connexion à la base
echo -e "${YELLOW}1️⃣  Vérification de la connexion à la base de données...${NC}"
if run_sql "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Connexion réussie${NC}"
else
    echo -e "${RED}   ❌ Échec de connexion${NC}"
    echo "   Vérifiez que PostgreSQL est démarré et que les identifiants sont corrects."
    exit 1
fi
echo ""

# 2. Vérifier l'établissement par défaut
echo -e "${YELLOW}2️⃣  Vérification de l'établissement par défaut...${NC}"
ETAB_COUNT=$(run_sql "SELECT COUNT(*) FROM etablissements WHERE \"codeEtablissement\" = 'ETAB-001';")
if [ "$ETAB_COUNT" -eq 1 ]; then
    ETAB_ID=$(run_sql "SELECT id FROM etablissements WHERE \"codeEtablissement\" = 'ETAB-001';")
    ETAB_NOM=$(run_sql "SELECT nom FROM etablissements WHERE \"codeEtablissement\" = 'ETAB-001';")
    echo -e "${GREEN}   ✅ Établissement trouvé: ${ETAB_NOM}${NC}"
    echo -e "      ID: ${ETAB_ID}"
else
    echo -e "${RED}   ❌ Établissement par défaut non trouvé${NC}"
    echo "   Exécutez: npm run db:seed"
    exit 1
fi
echo ""

# 3. Vérifier les utilisateurs créés
echo -e "${YELLOW}3️⃣  Vérification des utilisateurs de test...${NC}"
USER_COUNT=$(run_sql "SELECT COUNT(*) FROM utilisateurs WHERE email LIKE '%@elisaschool.cm';")
echo -e "   📊 Utilisateurs trouvés: ${GREEN}${USER_COUNT}${NC}"

if [ "$USER_COUNT" -lt 38 ]; then
    echo -e "${RED}   ⚠️  Nombre d'utilisateurs insuffisant (attendu: 38+)${NC}"
    echo "   Exécutez: npm run db:seed"
fi
echo ""

# 4. CRITIQUE: Vérifier les liens UtilisateurEtablissement
echo -e "${YELLOW}4️⃣  Vérification des liens UtilisateurEtablissement (CRITIQUE)...${NC}"
UE_COUNT=$(run_sql "
    SELECT COUNT(*)
    FROM utilisateur_etablissements ue
    JOIN utilisateurs u ON ue.\"utilisateurId\" = u.id
    WHERE u.email LIKE '%@elisaschool.cm';
")

echo -e "   📊 Liens trouvés: ${GREEN}${UE_COUNT}${NC}"

if [ "$UE_COUNT" -eq 0 ]; then
    echo -e "${RED}   ❌ AUCUN lien UtilisateurEtablissement trouvé !${NC}"
    echo "   Les utilisateurs ne pourront PAS se connecter correctement."
    echo ""
    echo "   Cause possible :"
    echo "   - Les seeds ont été exécutés avant la mise à jour du code"
    echo ""
    echo "   Solution :"
    echo "   1. Arrêter le backend: lsof -ti:7000 | xargs kill -9"
    echo "   2. Reset: npm run db:reset"
    echo "   3. Re-seed: npm run db:seed"
    exit 1
elif [ "$UE_COUNT" -lt "$USER_COUNT" ]; then
    echo -e "${YELLOW}   ⚠️  Certains utilisateurs n'ont pas de lien (${UE_COUNT}/${USER_COUNT})${NC}"
    echo ""
    echo "   Utilisateurs sans lien :"
    run_sql "
        SELECT u.email
        FROM utilisateurs u
        LEFT JOIN utilisateur_etablissements ue ON u.id = ue.\"utilisateurId\"
        WHERE u.email LIKE '%@elisaschool.cm'
        AND ue.id IS NULL;
    " | while read email; do
        echo "   - $email"
    done
    echo ""
    echo "   Solution : npm run db:reset && npm run db:seed"
else
    echo -e "${GREEN}   ✅ Tous les utilisateurs ont un lien établissement${NC}"
fi
echo ""

# 5. Vérifier les établissements principaux
echo -e "${YELLOW}5️⃣  Vérification des établissements principaux...${NC}"
PRINCIPAL_COUNT=$(run_sql "
    SELECT COUNT(*)
    FROM utilisateur_etablissements ue
    JOIN utilisateurs u ON ue.\"utilisateurId\" = u.id
    WHERE u.email LIKE '%@elisaschool.cm'
    AND ue.\"etablissementPrincipal\" = true;
")

echo -e "   📊 Établissements principaux: ${GREEN}${PRINCIPAL_COUNT}${NC}"

if [ "$PRINCIPAL_COUNT" -eq "$USER_COUNT" ]; then
    echo -e "${GREEN}   ✅ Tous les utilisateurs ont un établissement principal${NC}"
else
    echo -e "${YELLOW}   ⚠️  ${PRINCIPAL_COUNT}/${USER_COUNT} ont un établissement principal${NC}"
fi
echo ""

# 6. Vérifier le Super Admin
echo -e "${YELLOW}6️⃣  Vérification du Super Admin...${NC}"
SUPER_ADMIN_EXISTS=$(run_sql "
    SELECT COUNT(*)
    FROM utilisateurs u
    LEFT JOIN utilisateur_etablissements ue ON u.id = ue.\"utilisateurId\"
    WHERE u.email = 'admin@elisaschool.cm'
    AND u.role = 'SUPER_ADMIN'
    AND ue.id IS NOT NULL;
")

if [ "$SUPER_ADMIN_EXISTS" -eq 1 ]; then
    echo -e "${GREEN}   ✅ Super Admin correctement configuré${NC}"
    SA_MAX=$(run_sql "SELECT \"maxEtablissementsPersonnel\" FROM utilisateurs WHERE email = 'admin@elisaschool.cm';")
    echo "      maxEtablissementsPersonnel: $SA_MAX (0 = illimité)"
else
    echo -e "${RED}   ❌ Super Admin mal configuré ou sans lien établissement${NC}"
fi
echo ""

# 7. Liste des utilisateurs par rôle
echo -e "${YELLOW}7️⃣  Résumé des utilisateurs par rôle...${NC}"
run_sql "
    SELECT 
        u.role,
        COUNT(*) as nombre,
        COUNT(ue.id) as avec_lien
    FROM utilisateurs u
    LEFT JOIN utilisateur_etablissements ue ON u.id = ue.\"utilisateurId\"
    WHERE u.email LIKE '%@elisaschool.cm'
    GROUP BY u.role
    ORDER BY nombre DESC;
" | while IFS='|' read role nombre avec_lien; do
    if [ "$nombre" -eq "$avec_lien" ]; then
        echo -e "   ${GREEN}✓${NC} ${role}: ${nombre} utilisateurs"
    else
        echo -e "   ${RED}✗${NC} ${role}: ${nombre} utilisateurs (${avec_lien} avec lien)"
    fi
done
echo ""

# 8. Test de connexion (si backend démarré)
echo -e "${YELLOW}8️⃣  Test de connexion (optionnel)...${NC}"
if lsof -i:7000 > /dev/null 2>&1; then
    echo "   Backend détecté sur le port 7000"
    echo "   Test de connexion avec Super Admin..."
    
    RESPONSE=$(curl -s -X POST http://localhost:7000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{
            "identifiant": "admin@elisaschool.cm",
            "motDePasse": "AdminSecret123!"
        }')
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}   ✅ Connexion Super Admin réussie${NC}"
        
        # Vérifier le JWT
        HAS_ETABLISSEMENTS=$(echo "$RESPONSE" | grep -o '"etablissements"' || true)
        if [ -n "$HAS_ETABLISSEMENTS" ]; then
            echo -e "${GREEN}   ✅ JWT contient 'etablissements' (multi-tenant OK)${NC}"
        else
            echo -e "${YELLOW}   ⚠️  JWT ne contient pas 'etablissements' (peut être normal si legacy)${NC}"
        fi
    else
        echo -e "${RED}   ❌ Échec de connexion${NC}"
        echo "   Réponse: $RESPONSE"
    fi
else
    echo "   ⏭️  Backend non démarré (skip)"
    echo "   Pour tester: npm run dev (dans backend/)"
fi
echo ""

# Résumé final
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}  Résumé${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "   Établissement par défaut: ✅"
echo "   Utilisateurs créés: ${USER_COUNT}"
echo "   Liens établissement: ${UE_COUNT}"
echo ""

if [ "$UE_COUNT" -ge "$USER_COUNT" ] && [ "$USER_COUNT" -ge 38 ]; then
    echo -e "${GREEN}   🎉 TOUT EST CONFIGURÉ CORRECTEMENT !${NC}"
    echo ""
    echo "   Vous pouvez maintenant :"
    echo "   1. Démarrer le backend: cd backend && npm run dev"
    echo "   2. Démarrer le frontend: cd frontend && npm run dev"
    echo "   3. Vous connecter avec n'importe quel utilisateur de test"
    echo ""
    echo "   Mot de passe par défaut: Test123456!"
    echo "   Super Admin: AdminSecret123!"
else
    echo -e "${RED}   ⚠️  CONFIGURATION INCOMPLÈTE${NC}"
    echo ""
    echo "   Exécutez: npm run db:reset && npm run db:seed"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
