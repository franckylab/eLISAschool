#!/bin/bash

# ==================================
# eLISAschool - Script de Vérification de Cohérence
# ==================================
# Version: 1.0.0
# Auteur: franck arlos chendjou

echo "========================================"
echo "eLISAschool - Vérification de Cohérence"
echo "Architecture Académique v2"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Fonction pour vérifier un fichier
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo "✅ $description: $file"
    else
        echo "❌ $description: $file (MANQUANT)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Fonction pour vérifier un contenu
check_content() {
    local file=$1
    local pattern=$2
    local description=$3
    
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo "✅ $description"
    else
        echo "❌ $description (NON TROUVÉ)"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📋 Vérification des fichiers..."
echo ""

# 1. Vérifier les entités
echo "--- Entités ---"
check_file "backend/src/modules/classes/entities/classe-annee.entity.ts" "Entité ClasseAnnee"
check_file "backend/src/modules/classes/entities/classe.entity.ts" "Entité Classe"
check_file "backend/src/modules/matieres/entities/configuration-matiere-classe.entity.ts" "Entité ConfigurationMatiereClasse"
check_file "backend/src/modules/matieres/entities/affectation-matiere.entity.ts" "Entité AffectationMatiere"
check_file "backend/src/modules/bulletins/entities/bulletin.entity.ts" "Entité Bulletin"
check_file "backend/src/modules/emploi-du-temps/entities/emploi-du-temps.entity.ts" "Entité EmploiDuTemps"
check_file "backend/src/modules/scoring/entities/scoring.entity.ts" "Entité ConfigurationScoring"
echo ""

# 2. Vérifier les services
echo "--- Services ---"
check_file "backend/src/modules/classes/services/classes-annees.service.ts" "Service ClassesAnnees"
check_file "backend/src/modules/scoring/services/configuration-scoring.service.ts" "Service ConfigurationScoring"
echo ""

# 3. Vérifier les controllers
echo "--- Controllers ---"
check_file "backend/src/modules/classes/controllers/classes-annees.controller.ts" "Controller ClassesAnnees"
check_file "backend/src/modules/matieres/controllers/configuration-matiere-classe.controller.ts" "Controller ConfigurationMatiereClasse"
check_file "backend/src/modules/scoring/controllers/configuration-scoring.controller.ts" "Controller ConfigurationScoring"
echo ""

# 4. Vérifier les DTOs
echo "--- DTOs ---"
check_file "backend/src/modules/classes/dto/classes.dto.ts" "DTOs Classes"
check_file "backend/src/modules/matieres/dto/matieres.dto.ts" "DTOs Matieres"
check_file "backend/src/modules/scoring/dto/scoring.dto.ts" "DTOs Scoring"
echo ""

# 5. Vérifier les imports
echo "--- Imports ---"
check_content "backend/src/modules/bulletins/entities/bulletin.entity.ts" "from '@modules/classes/entities'" "Bulletin importe ClasseAnnee depuis classes"
check_content "backend/src/modules/emploi-du-temps/entities/emploi-du-temps.entity.ts" "from '@modules/matieres/entities'" "EmploiDuTemps importe AffectationMatiere"
check_content "backend/src/app.ts" "classesController, classesAnneesController" "app.ts importe controllers classes"
check_content "backend/src/app.ts" "matieresController, configurationMatiereClasseController" "app.ts importe controllers matieres"
check_content "backend/src/app.ts" "configurationScoringController" "app.ts importe controller scoring"
echo ""

# 6. Vérifier les exports
echo "--- Exports ---"
check_content "backend/src/modules/classes/entities/index.ts" "classe-annee.entity" "ClasseAnnee exportée"
check_content "backend/src/modules/classes/controllers/index.ts" "classes-annees.controller" "Controller ClassesAnnees exporté"
check_content "backend/src/modules/matieres/controllers/index.ts" "configuration-matiere-classe.controller" "Controller ConfigurationMatiereClasse exporté"
echo ""

# 7. Vérifier les routes dans app.ts
echo "--- Routes API ---"
check_content "backend/src/app.ts" "/api/classes-annees" "Route /api/classes-annees"
check_content "backend/src/app.ts" "/api/configuration-matiere-classe" "Route /api/configuration-matiere-classe"
check_content "backend/src/app.ts" "/api/scoring/config" "Route /api/scoring/config"
echo ""

# 8. Vérifier les migrations
echo "--- Migrations ---"
check_file "backend/database/migrations/088-refactorisation-architecture-academique.sql" "Migration 088"
check_file "backend/database/migrations/089-finalisation-architecture-academique-v2.sql" "Migration 089"
echo ""

# 9. Vérifier la permission RBAC
echo "--- Permission RBAC ---"
check_content "shared/src/enums/roles.enum.ts" "NOTES_EDITER_APRES_CLOTURE" "Permission notes:modifier_apres_cloture"
echo ""

# 10. Vérifier l'absence de modules dupliqués
echo "--- Modules Dupliqués ---"
if [ -d "backend/src/modules/classes-annees" ]; then
    echo "❌ Module dupliqué: backend/src/modules/classes-annees (DOIT ÊTRE SUPPRIMÉ)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Module classes-annees supprimé (utilise classes/)"
fi

if [ -d "backend/src/modules/configuration-matiere-classe" ]; then
    echo "❌ Module dupliqué: backend/src/modules/configuration-matiere-classe (DOIT ÊTRE SUPPRIMÉ)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Module configuration-matiere-classe supprimé (utilise matieres/)"
fi
echo ""

# 11. Vérifier les clés étrangères dans Bulletin
echo "--- Relations Bulletin ---"
check_content "backend/src/modules/bulletins/entities/bulletin.entity.ts" "classeAnneeId" "Bulletin a classeAnneeId"
check_content "backend/src/modules/bulletins/entities/bulletin.entity.ts" "ClasseAnnee" "Bulletin a relation ClasseAnnee"
echo ""

# 12. Vérifier les clés étrangères dans EmploiDuTemps
echo "--- Relations EmploiDuTemps ---"
check_content "backend/src/modules/emploi-du-temps/entities/emploi-du-temps.entity.ts" "affectationMatiereId" "EmploiDuTemps a affectationMatiereId"
check_content "backend/src/modules/emploi-du-temps/entities/emploi-du-temps.entity.ts" "AffectationMatiere" "EmploiDuTemps a relation AffectationMatiere"
echo ""

# Résumé
echo "========================================"
echo "📊 Résumé de la Vérification"
echo "========================================"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "✅ VÉRIFICATION RÉUSSIE !"
    echo ""
    echo "Tous les fichiers sont cohérents et complets."
    echo ""
    echo "📝 Prochaines étapes :"
    echo "   1. Exécuter: ./scripts/deploy-migrations.sh"
    echo "   2. Compiler: cd backend && npm run build"
    echo "   3. Démarrer: cd backend && npm start"
    echo "   4. Tester les endpoints API"
    echo ""
    exit 0
else
    echo "❌ ERREURS DÉTECTÉES: $ERRORS"
    echo ""
    echo "Veuillez corriger les erreurs ci-dessus avant de continuer."
    echo ""
    exit 1
fi
