#!/bin/bash
# Script d'exécution de la correction des permissions groupes

echo "=========================================="
echo "Correction des permissions Groupes Établissements"
echo "=========================================="

# Lire le mot de passe depuis .env si disponible
if [ -f .env ]; then
    export PGPASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2 | head -1)
fi

# Exécuter la migration SQL
psql -h localhost -p 7002 -U elisaschool -d elisaschool << 'EOF'

-- ==================================
-- Créer la permission 'chef:manage' manquante
-- ==================================

INSERT INTO permissions (code, libelle, description, module, action, actif)
VALUES 
    ('chef:manage', 'Gérer groupes d''établissements', 'Permission unifiée pour la gestion complète des groupes d''établissements', 'groupes-etablissements', 'manage', true)
ON CONFLICT (code) DO NOTHING;

-- ==================================
-- Attribuer aux rôles
-- ==================================

INSERT INTO role_permissions ("roleId", "permissionId")
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('SUPER_ADMIN', 'CHEF_ETABLISSEMENT', 'DIRECTEUR')
    AND p.code = 'chef:manage'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- ==================================
-- Vérifier
-- ==================================

SELECT 
    r.code as "Rôle",
    p.code as "Permission",
    '✅' as "Statut"
FROM role_permissions rp
JOIN roles r ON rp."roleId" = r.id
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.code = 'chef:manage'
ORDER BY r.code;

EOF

echo "=========================================="
echo "Migration terminée"
echo "=========================================="
