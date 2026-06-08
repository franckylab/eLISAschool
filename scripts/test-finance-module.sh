#!/bin/bash
# ==================================
# eLISAschool - Script de Test Module Finances
# ==================================
# Version: 1.0.0
# Auteur: xAI Éducation
# 
# Script de test complet pour le module finances
# Usage: ./scripts/test-finance-module.sh
# ==================================

set -e

# ==================================
# CONFIGURATION
# ==================================

BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@elisaschool.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-password123}"
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================================
# FONCTIONS HELPERS
# ==================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    PASS_COUNT=$((PASS_COUNT + 1))
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
}

log_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

# ==================================
# PRÉ-REQUIS
# ==================================

echo "========================================"
echo "  eLISAschool - Test Module Finances"
echo "========================================"
echo ""

# Vérifier que le serveur est en cours d'exécution
log_info "Vérification du serveur..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    log_error "Serveur non disponible sur $BASE_URL"
    log_error "Démarrer le serveur : npm run start:dev"
    exit 1
fi
log_success "Serveur accessible"

# ==================================
# AUTHENTIFICATION
# ==================================

log_test "Authentification ADMIN..."

AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.data.accessToken // empty')

if [ -z "$TOKEN" ]; then
    log_error "Échec authentification ADMIN"
    echo "Réponse: $AUTH_RESPONSE"
    exit 1
fi

log_success "Token ADMIN obtenu"

# Headers pour les requêtes suivantes
AUTH_HEADER="Authorization: Bearer $TOKEN"
CONTENT_TYPE="Content-Type: application/json"

# ==================================
# TEST 1: Configuration Frais Scolarité
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 1: Configuration Frais Scolarité"
echo "----------------------------------------"

# Récupérer année scolaire active
ANNEE_ID=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/annees-scolaires" \
  | jq -r '.data[0].id // empty')

if [ -z "$ANNEE_ID" ]; then
    log_error "Aucune année scolaire trouvée"
    exit 1
fi
log_success "Année scolaire récupérée: $ANNEE_ID"

# Récupérer premier niveau
NIVEAU_ID=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/niveaux" \
  | jq -r '.data[0].id // empty')

if [ -z "$NIVEAU_ID" ]; then
    log_error "Aucun niveau trouvé"
    exit 1
fi
log_success "Niveau récupéré: $NIVEAU_ID"

# Configurer frais
CONFIG_RESPONSE=$(curl -s -X POST "$BASE_URL/finances/scolarite/config" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"anneeScolaireId\": \"$ANNEE_ID\",
    \"niveauId\": \"$NIVEAU_ID\",
    \"fraisInscription\": 50000,
    \"fraisScolariteAnnuel\": 500000,
    \"nombreTranches\": 3,
    \"datePremiereEcheance\": \"2026-09-15\",
    \"frequenceEcheance\": \"TRIMESTRIEL\",
    \"penaliteRetard\": 5,
    \"joursGrace\": 8
  }")

CONFIG_SUCCESS=$(echo "$CONFIG_RESPONSE" | jq -r '.success // false')

if [ "$CONFIG_SUCCESS" = "true" ]; then
    log_success "Configuration frais créée avec succès"
    CONFIG_ID=$(echo "$CONFIG_RESPONSE" | jq -r '.data.id')
else
    # Peut-être existe déjà (conflit 409)
    if echo "$CONFIG_RESPONSE" | jq -r '.error.code // empty' | grep -q "EXISTS"; then
        log_info "Configuration existe déjà (acceptable)"
        CONFIG_ID=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/finances/scolarite/config" \
          | jq -r '.data[0].id // empty')
    else
        log_error "Échec configuration frais"
        echo "Réponse: $CONFIG_RESPONSE"
        exit 1
    fi
fi

# ==================================
# TEST 2: Récupération Élève
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 2: Récupération Élève Test"
echo "----------------------------------------"

ELEVE_ID=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/eleves?limit=1" \
  | jq -r '.data[0].id // empty')

if [ -z "$ELEVE_ID" ]; then
    log_error "Aucun élève trouvé pour les tests"
    log_info "Créer un élève d'abord via l'API ou l'interface"
    exit 1
fi

log_success "Élève test récupéré: $ELEVE_ID"

# ==================================
# TEST 3: Génération Échéancier
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 3: Génération Échéancier Élève"
echo "----------------------------------------"

ECHEANCIER_RESPONSE=$(curl -s -X POST "$BASE_URL/finances/echeanciers/generer/$ELEVE_ID" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_TYPE" \
  -d "{\"fraisScolariteId\": \"$CONFIG_ID\"}")

ECHEANCIER_SUCCESS=$(echo "$ECHEANCIER_RESPONSE" | jq -r '.success // false')

if [ "$ECHEANCIER_SUCCESS" = "true" ]; then
    ECHEANCIER_COUNT=$(echo "$ECHEANCIER_RESPONSE" | jq -r '.data | length')
    log_success "Échéancier généré: $ECHEANCIER_COUNT tranches créées"
    
    ECHEANCIER_ID=$(echo "$ECHEANCIER_RESPONSE" | jq -r '.data[0].id')
    log_success "Premier écheancier: $ECHEANCIER_ID"
else
    log_error "Échec génération échéancier"
    echo "Réponse: $ECHEANCIER_RESPONSE"
    exit 1
fi

# ==================================
# TEST 4: Enregistrement Paiement
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 4: Enregistrement Paiement"
echo "----------------------------------------"

PAIEMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/finances/paiements" \
  -H "$AUTH_HEADER" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"eleveId\": \"$ELEVE_ID\",
    \"echeancierId\": \"$ECHEANCIER_ID\",
    \"montant\": 166667,
    \"methodePaiement\": \"ESPECES\",
    \"observations\": \"Paiement test automatisé\"
  }")

PAIEMENT_SUCCESS=$(echo "$PAIEMENT_RESPONSE" | jq -r '.success // false')

if [ "$PAIEMENT_SUCCESS" = "true" ]; then
    log_success "Paiement enregistré avec succès"
    
    NUMERO_RECUP=$(echo "$PAIEMENT_RESPONSE" | jq -r '.data.numeroRecu // empty')
    if [ -n "$NUMERO_RECUP" ]; then
        log_success "Reçu généré: $NUMERO_RECUP"
    fi
else
    log_error "Échec enregistrement paiement"
    echo "Réponse: $PAIEMENT_RESPONSE"
    exit 1
fi

# ==================================
# TEST 5: Consultation Reçu
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 5: Consultation Reçu"
echo "----------------------------------------"

if [ -n "$NUMERO_RECUP" ]; then
    RECU_RESPONSE=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/finances/recus/$NUMERO_RECUP")
    RECU_SUCCESS=$(echo "$RECU_RESPONSE" | jq -r '.success // false')
    
    if [ "$RECU_SUCCESS" = "true" ]; then
        log_success "Reçu consulté avec succès"
    else
        log_error "Échec consultation reçu"
        echo "Réponse: $RECU_RESPONSE"
    fi
fi

# ==================================
# TEST 6: Liste Catégories Dépenses
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 6: Catégories de Dépenses"
echo "----------------------------------------"

CATEGORIES_RESPONSE=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/finances/depenses/categories")
CATEGORIES_SUCCESS=$(echo "$CATEGORIES_RESPONSE" | jq -r '.success // false')

if [ "$CATEGORIES_SUCCESS" = "true" ]; then
    CAT_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data | length')
    log_success "Catégories récupérées: $CAT_COUNT catégories"
    
    # Vérifier qu'on a bien les 14 catégories par défaut
    if [ "$CAT_COUNT" -ge 14 ]; then
        log_success "✓ 14+ catégories présentes (seed OK)"
    else
        log_error "Moins de 14 catégories (seed peut-être incomplet)"
    fi
    
    CAT_ID=$(echo "$CATEGORIES_RESPONSE" | jq -r '.data[0].id')
else
    log_error "Échec récupération catégories"
    echo "Réponse: $CATEGORIES_RESPONSE"
fi

# ==================================
# TEST 7: Création Dépense
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 7: Création Dépense"
echo "----------------------------------------"

if [ -n "$CAT_ID" ]; then
    DEPENSE_RESPONSE=$(curl -s -X POST "$BASE_URL/finances/depenses" \
      -H "$AUTH_HEADER" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"categorieDepenseId\": \"$CAT_ID\",
        \"libelle\": \"Achat fournitures bureau - Test auto\",
        \"montantHT\": 100000,
        \"tva\": 19.25,
        \"dateFacture\": \"2026-01-15\",
        \"fournisseur\": \"Papeterie Test\",
        \"methodePaiement\": \"VIREMENT\"
      }")
    
    DEPENSE_SUCCESS=$(echo "$DEPENSE_RESPONSE" | jq -r '.success // false')
    
    if [ "$DEPENSE_SUCCESS" = "true" ]; then
        log_success "Dépense créée avec succès"
        
        NUMERO_PIECE=$(echo "$DEPENSE_RESPONSE" | jq -r '.data.numeroPiece // empty')
        if [ -n "$NUMERO_PIECE" ]; then
            log_success "Numéro pièce: $NUMERO_PIECE"
        fi
        
        DEPENSE_ID=$(echo "$DEPENSE_RESPONSE" | jq -r '.data.id')
    else
        log_error "Échec création dépense"
        echo "Réponse: $DEPENSE_RESPONSE"
    fi
fi

# ==================================
# TEST 8: Workflow Demande de Dépense
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 8: Workflow Demande de Dépense"
echo "----------------------------------------"

if [ -n "$CAT_ID" ]; then
    # Créer demande
    DEMANDE_RESPONSE=$(curl -s -X POST "$BASE_URL/finances/depenses/demandes" \
      -H "$AUTH_HEADER" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"categorieDepenseId\": \"$CAT_ID\",
        \"libelle\": \"Réparation matériel informatique - Test auto\",
        \"montantEstime\": 150000,
        \"urgence\": \"HAUTE\",
        \"justification\": \"Test automatisé du workflow de demande\"
      }")
    
    DEMANDE_SUCCESS=$(echo "$DEMANDE_RESPONSE" | jq -r '.success // false')
    
    if [ "$DEMANDE_SUCCESS" = "true" ]; then
        log_success "Demande de dépense créée"
        
        DEMANDE_ID=$(echo "$DEMANDE_RESPONSE" | jq -r '.data.id')
        
        # Valider demande
        VALIDATION_RESPONSE=$(curl -s -X PATCH "$BASE_URL/finances/depenses/demandes/$DEMANDE_ID/valider" \
          -H "$AUTH_HEADER" \
          -H "$CONTENT_TYPE" \
          -d '{"decision": "APPROUVEE"}')
        
        VALIDATION_SUCCESS=$(echo "$VALIDATION_RESPONSE" | jq -r '.success // false')
        
        if [ "$VALIDATION_SUCCESS" = "true" ]; then
            log_success "Demande validée avec succès"
        else
            log_error "Échec validation demande"
            echo "Réponse: $VALIDATION_RESPONSE"
        fi
    else
        log_error "Échec création demande"
        echo "Réponse: $DEMANDE_RESPONSE"
    fi
fi

# ==================================
# TEST 9: Liste Impayés
# ==================================

echo ""
echo "----------------------------------------"
log_test "TEST 9: Détection Impayés"
echo "----------------------------------------"

IMPAYES_RESPONSE=$(curl -s -H "$AUTH_HEADER" "$BASE_URL/finances/impayes")
IMPAYES_SUCCESS=$(echo "$IMPAYES_RESPONSE" | jq -r '.success // false')

if [ "$IMPAYES_SUCCESS" = "true" ]; then
    IMPAYES_COUNT=$(echo "$IMPAYES_RESPONSE" | jq -r '.data | length')
    log_success "Impayés détectés: $IMPAYES_COUNT"
else
    log_error "Échec détection impayés"
    echo "Réponse: $IMPAYES_RESPONSE"
fi

# ==================================
# RÉSUMÉ FINAL
# ==================================

echo ""
echo "========================================"
echo "  RÉSULTATS DES TESTS"
echo "========================================"
echo ""

PASS_RATE=0
if [ $TOTAL_COUNT -gt 0 ]; then
    PASS_RATE=$((PASS_COUNT * 100 / TOTAL_COUNT))
fi

echo -e "Tests réussis : ${GREEN}$PASS_COUNT${NC}/$TOTAL_COUNT"
echo -e "Tests échoués : ${RED}$FAIL_COUNT${NC}/$TOTAL_COUNT"
echo -e "Taux de succès : ${GREEN}${PASS_RATE}%${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS ONT RÉUSSI !${NC}"
    echo ""
    echo "Le module finances est opérationnel."
    exit 0
else
    echo -e "${RED}⚠️  $FAIL_COUNT TEST(S) ÉCHOUÉ(S)${NC}"
    echo ""
    echo "Vérifier les erreurs ci-dessus."
    exit 1
fi
