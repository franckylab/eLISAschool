#!/bin/bash
# ==================================
# eLISAschool - Vérification Structure Académique Complète
# ==================================

echo "=========================================="
echo "🎓 Vérification Structure Académique"
echo "=========================================="
echo ""

PGPASSWORD=elisaschool_password psql -h localhost -p 7002 -U elisaschool_user -d elisaschool << 'EOF'

-- ==================================
-- RÉSUMÉ COMPLET
-- ==================================

\echo '📊 TYPES DE CYCLES'
SELECT code, nom, "dureeAnnees" as duree, "diplomeSanctionnant" as diplome
FROM types_cycles ORDER BY ordre;

\echo ''
\echo '📚 CYCLES'
SELECT c.code, c.nom, tc.nom as type
FROM cycles c
LEFT JOIN types_cycles tc ON c."typeCycleId" = tc.id
ORDER BY c.ordre;

\echo ''
\echo '🎒 NIVEAUX PAR SYSTÈME'
SELECT 
    n."sousSysteme" as systeme,
    c.nom as cycle,
    COUNT(*) as nombre,
    ARRAY_AGG(n.code ORDER BY n.ordre) as codes
FROM niveaux n
JOIN cycles c ON n."cycleId" = c.id
GROUP BY n."sousSysteme", c.nom, c.ordre
ORDER BY n."sousSysteme", c.ordre;

\echo ''
\echo '📝 EXAMENS NATIONAUX'
SELECT 
    e.nom,
    e.code,
    n.nom as niveau,
    n."sousSysteme" as systeme,
    e."estObligatoire" as obligatoire
FROM examens_nationaux e
JOIN niveaux n ON e."niveauId" = n.id
ORDER BY e."sousSysteme", n.ordre;

\echo ''
\echo '🎯 FILIÈRES'
SELECT 
    f.nom,
    f.code,
    c.nom as cycle,
    f.soussysteme as systeme
FROM filieres f
JOIN cycles c ON f."cycleId" = c.id
ORDER BY f.code;

\echo ''
\echo '📈 STATISTIQUES'
SELECT 'Types cycles' as element, COUNT(*) FROM types_cycles
UNION ALL SELECT 'Cycles', COUNT(*) FROM cycles
UNION ALL SELECT 'Niveaux FR', COUNT(*) FROM niveaux WHERE "sousSysteme" = 'FRANCOPHONE'
UNION ALL SELECT 'Niveaux EN', COUNT(*) FROM niveaux WHERE "sousSysteme" = 'ANGLOPHONE'
UNION ALL SELECT 'Total Niveaux', COUNT(*) FROM niveaux
UNION ALL SELECT 'Filières FR', COUNT(*) FROM filieres WHERE soussysteme = 'FRANCOPHONE'
UNION ALL SELECT 'Examens FR', COUNT(*) FROM examens_nationaux WHERE soussysteme = 'FRANCOPHONE'
UNION ALL SELECT 'Examens EN', COUNT(*) FROM examens_nationaux WHERE soussysteme = 'ANGLOPHONE'
UNION ALL SELECT 'Total Examens', COUNT(*) FROM examens_nationaux
ORDER BY element;

EOF

echo ""
echo "=========================================="
echo "✅ Vérification terminée"
echo "=========================================="
