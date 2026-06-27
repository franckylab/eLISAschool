#!/bin/bash
# Diagnostic des exports du module scoring

echo "=== DIAGNOSTIC MODULE SCORING ==="
echo ""

echo "1. Fichiers dans le module scoring:"
find /mnt/DONNEES/projets/eLISAschool/backend/src/modules/scoring -name "*.ts" | sort

echo ""
echo "2. Export dans index.ts:"
cat /mnt/DONNEES/projets/eLISAschool/backend/src/modules/scoring/index.ts

echo ""
echo "3. Export dans controllers/index.ts:"
cat /mnt/DONNEES/projets/eLISAschool/backend/src/modules/scoring/controllers/index.ts

echo ""
echo "4. Export du controller:"
grep "export.*configurationScoringController" /mnt/DONNEES/projets/eLISAschool/backend/src/modules/scoring/controllers/configuration-scoring.controller.ts

echo ""
echo "5. Import dans app.ts:"
grep "configurationScoringController" /mnt/DONNEES/projets/eLISAschool/backend/src/app.ts

echo ""
echo "=== FIN DIAGNOSTIC ==="
