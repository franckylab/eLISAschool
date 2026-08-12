#!/usr/bin/env bash
# ==================================
# eLISAschool — Génération de clés de sécurité
# ==================================
# Durcissement v9 — Séparation ENCRYPTION_KEY ≠ JWT_SECRET
#
# Usage : ./scripts/generate-security-keys.sh
# Génère des clés cryptographiquement sûres pour :
#   - JWT_SECRET (signature tokens)
#   - ENCRYPTION_KEY (chiffrement AES-256-GCM)
#   - AUDIT_HMAC_KEY (signature audit logs)
#
# Les clés sont affichées en sortie — à copier dans .env
# NE JAMAIS committer ces clés dans le code source.

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD} eLISAschool — Génération de clés sécurité${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# Vérifier que node est disponible
if ! command -v node &> /dev/null; then
    echo "❌ Node.js requis pour générer les clés"
    exit 1
fi

# Générer une clé aléatoire de N octets, affichée en hex (tronqué à la longueur voulue)
generate_key() {
    local bytes="$1"
    local length="$2"
    node -e "console.log(require('crypto').randomBytes(${bytes}).toString('hex').substring(0, ${length}))"
}

echo -e "${YELLOW}--- JWT_SECRET ---${NC}"
echo "  Usage  : Signature des tokens JWT (HMAC-SHA256)"
echo "  Longueur : 64 caractères"
JWT_SECRET=$(generate_key 48 64)
echo -e "  ${GREEN}JWT_SECRET=${JWT_SECRET}${NC}"
echo ""

echo -e "${YELLOW}--- ENCRYPTION_KEY ---${NC}"
echo "  Usage  : Chiffrement AES-256-GCM (credentials, MFA)"
echo "  Longueur : 32 caractères"
ENCRYPTION_KEY=$(generate_key 16 32)
echo -e "  ${GREEN}ENCRYPTION_KEY=${ENCRYPTION_KEY}${NC}"
echo ""

echo -e "${YELLOW}--- AUDIT_HMAC_KEY ---${NC}"
echo "  Usage  : Signature HMAC des audit logs (intégrité)"
echo "  Longueur : 64 caractères"
AUDIT_HMAC_KEY=$(generate_key 48 64)
echo -e "  ${GREEN}AUDIT_HMAC_KEY=${AUDIT_HMAC_KEY}${NC}"
echo ""

echo -e "${YELLOW}--- SEED_ADMIN_PASSWORD ---${NC}"
echo "  Usage  : Mot de passe initial des seeds (dev/staging uniquement)"
echo "  Longueur : 24 caractères"
SEED_PASSWORD=$(node -e "
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#\$%^&*';
const crypto = require('crypto');
const bytes = crypto.randomBytes(24);
let pwd = '';
for (let i = 0; i < 24; i++) pwd += chars[bytes[i] % chars.length];
console.log(pwd);
")
echo -e "  ${GREEN}SEED_ADMIN_PASSWORD=${SEED_PASSWORD}${NC}"
echo ""

# Vérification : les 3 clés doivent être distinctes
if [ "$JWT_SECRET" = "$ENCRYPTION_KEY" ] || [ "$JWT_SECRET" = "$AUDIT_HMAC_KEY" ] || [ "$ENCRYPTION_KEY" = "$AUDIT_HMAC_KEY" ]; then
    echo "❌ ERREUR : Des clés identiques ont été générées. Relancez le script."
    exit 1
fi

echo -e "${BOLD}--- Résumé .env ---${NC}"
echo ""
echo "# === Sécurité v9 — clés générées le $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "JWT_SECRET=${JWT_SECRET}"
echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}"
echo "AUDIT_HMAC_KEY=${AUDIT_HMAC_KEY}"
echo "SEED_ADMIN_PASSWORD=${SEED_PASSWORD}"
echo ""

echo -e "${YELLOW}⚠️  Copiez ces valeurs dans votre .env et protégez le fichier (chmod 600)${NC}"
echo -e "${YELLOW}⚠️  NE JAMAIS committer ces clés dans Git${NC}"
echo ""

# Proposer d'écrire directement dans un fichier .env.security
read -p "Voulez-vous sauvegarder dans .env.security ? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ENV_FILE=".env.security"
    cat > "$ENV_FILE" <<EOF
# === Sécurité v9 — clés générées le $(date -u +%Y-%m-%dT%H:%M:%SZ) ===
# PROTÉGER CE FICHIER : chmod 600 .env.security
# NE JAMAIS COMMITTER CE FICHIER
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
AUDIT_HMAC_KEY=${AUDIT_HMAC_KEY}
SEED_ADMIN_PASSWORD=${SEED_PASSWORD}
EOF
    chmod 600 "$ENV_FILE"
    echo -e "${GREEN}✅ Fichier ${ENV_FILE} créé (chmod 600)${NC}"
    
    # Vérifier .gitignore
    if ! grep -qF '.env.security' .gitignore 2>/dev/null; then
        echo ".env.security" >> .gitignore
        echo -e "${GREEN}✅ .env.security ajouté au .gitignore${NC}"
    fi
fi
