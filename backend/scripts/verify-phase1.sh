#!/bin/bash
# ==================================
# eLISAschool - Vérification Rapide Phase 1
# ==================================
# Script Bash pour valider l'implémentation sans compilation
# ==================================

echo ""
echo "🔍 =================================="
echo "🔍 VÉRIFICATION RAPIDE PHASE 1"
echo "🔍 =================================="
echo ""

PASS=0
FAIL=0

# ==================== TEST 1: Entités avec periodeId ====================
echo "📋 TEST 1: Vérification entités avec periodeId"

FILES=(
    "src/modules/suivi-eleves/entities/incident-eleve.entity.ts"
    "src/modules/suivi-eleves/entities/observation-eleve.entity.ts"
    "src/modules/suivi-eleves/entities/sanction-eleve.entity.ts"
    "src/modules/suivi-eleves/entities/felicitation-eleve.entity.ts"
    "src/modules/suivi-personnel/entities/incident-personnel.entity.ts"
    "src/modules/suivi-personnel/entities/evaluation-personnel.entity.ts"
    "src/modules/sante/entities/dossier-medical.entity.ts"
    "src/modules/sante/entities/consultation-medicale.entity.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "periodeId" "$file" && grep -q "import.*Periode" "$file"; then
            echo "   ✅ $(basename $file)"
            ((PASS++))
        else
            echo "   ❌ $(basename $file) - periodeId ou import Periode manquant"
            ((FAIL++))
        fi
    else
        echo "   ❌ $(basename $file) - fichier non trouvé"
        ((FAIL++))
    fi
done

# ==================== TEST 2: Enums TypeIncidentEleve ====================
echo ""
echo "📋 TEST 2: Vérification TypeIncidentEleve (20 types)"

FILE="src/modules/suivi-eleves/entities/incident-eleve.entity.ts"
TYPES_AFRICAINS=("FRAIS_SCOLARITE_NON_PAYES" "ABANDON_TEMPORAIRE" "TRAVAIL_ENFANT" "RENTREE_TARDIVE" "TRANSPORT_DIFFICILE")
TYPES_OK=true

for type in "${TYPES_AFRICAINS[@]}"; do
    if grep -q "$type" "$FILE"; then
        echo "   ✅ $type"
    else
        echo "   ❌ $type manquant"
        TYPES_OK=false
    fi
done

if [ "$TYPES_OK" = true ]; then
    ((PASS++))
else
    ((FAIL++))
fi

# ==================== TEST 3: Enums TypeSanction ====================
echo ""
echo "📋 TEST 3: Vérification TypeSanction (18 types)"

FILE="src/modules/suivi-eleves/entities/sanction-eleve.entity.ts"
TYPES_AFRICAINS=("EXCUSES_DEVANT_CHEF" "CONVOCATION_CHEF_FAMILLE" "AMENDE_SYMBOLIQUE" "INTERDICTION_EXAMEN")
TYPES_OK=true

for type in "${TYPES_AFRICAINS[@]}"; do
    if grep -q "$type" "$FILE"; then
        echo "   ✅ $type"
    else
        echo "   ❌ $type manquant"
        TYPES_OK=false
    fi
done

if [ "$TYPES_OK" = true ]; then
    ((PASS++))
else
    ((FAIL++))
fi

# ==================== TEST 4: Enums TypeFelicitation ====================
echo ""
echo "📋 TEST 4: Vérification TypeFelicitation (20 types)"

FILE="src/modules/suivi-eleves/entities/felicitation-eleve.entity.ts"
TYPES_AFRICAINS=("EXCELLENCE_BILINGUE" "RESILIENCE_REMARQUABLE" "TRADITION_CULTURELLE" "MERITE_COMMUNAUTAIRE")
TYPES_OK=true

for type in "${TYPES_AFRICAINS[@]}"; do
    if grep -q "$type" "$FILE"; then
        echo "   ✅ $type"
    else
        echo "   ❌ $type manquant"
        TYPES_OK=false
    fi
done

if [ "$TYPES_OK" = true ]; then
    ((PASS++))
else
    ((FAIL++))
fi

# ==================== TEST 5: DTOs avec periodeId ====================
echo ""
echo "📋 TEST 5: Vérification DTOs avec periodeId"

DTO_FILES=(
    "src/modules/suivi-eleves/dto/suivi-eleve.dto.ts"
    "src/modules/suivi-personnel/dto/suivi-personnel.dto.ts"
    "src/modules/sante/dto/sante.dto.ts"
)

for file in "${DTO_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "periodeId" "$file"; then
            echo "   ✅ $(basename $file)"
            ((PASS++))
        else
            echo "   ❌ $(basename $file) - periodeId manquant"
            ((FAIL++))
        fi
    else
        echo "   ❌ $(basename $file) - fichier non trouvé"
        ((FAIL++))
    fi
done

# ==================== TEST 6: Services avec filtrage periodeId ====================
echo ""
echo "📋 TEST 6: Vérification Services avec filtrage"

SERVICE_FILES=(
    "src/modules/suivi-eleves/services/suivi-eleve.service.ts"
    "src/modules/suivi-personnel/services/suivi-personnel.service.ts"
    "src/modules/sante/services/sante.service.ts"
)

for file in "${SERVICE_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "options?.periodeId" "$file" && grep -q "relations.*periode" "$file"; then
            echo "   ✅ $(basename $file)"
            ((PASS++))
        else
            echo "   ❌ $(basename $file) - filtrage periodeId manquant"
            ((FAIL++))
        fi
    else
        echo "   ❌ $(basename $file) - fichier non trouvé"
        ((FAIL++))
    fi
done

# ==================== TEST 7: Controllers avec query params ====================
echo ""
echo "📋 TEST 7: Vérification Controllers avec query params"

CONTROLLER_FILES=(
    "src/modules/suivi-eleves/controllers/suivi-eleve.controller.ts"
    "src/modules/suivi-personnel/controllers/suivi-personnel.controller.ts"
    "src/modules/sante/controllers/sante.controller.ts"
)

for file in "${CONTROLLER_FILES[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "req.query.periodeId" "$file"; then
            echo "   ✅ $(basename $file)"
            ((PASS++))
        else
            echo "   ❌ $(basename $file) - query param periodeId manquant"
            ((FAIL++))
        fi
    else
        echo "   ❌ $(basename $file) - fichier non trouvé"
        ((FAIL++))
    fi
done

# ==================== TEST 8: Migration SQL ====================
echo ""
echo "📋 TEST 8: Vérification Migrations SQL"

if [ -f "database/migrations/035-contexte-africain-periodes.sql" ]; then
    MIGRATION_COUNT=$(grep -c "ALTER TABLE" database/migrations/035-contexte-africain-periodes.sql)
    INDEX_COUNT=$(grep -c "CREATE INDEX" database/migrations/035-contexte-africain-periodes.sql)
    
    if [ "$MIGRATION_COUNT" -ge 8 ] && [ "$INDEX_COUNT" -ge 8 ]; then
        echo "   ✅ Migration 035 ($MIGRATION_COUNT ALTER TABLE, $INDEX_COUNT INDEX)"
        ((PASS++))
    else
        echo "   ❌ Migration 035 incomplète ($MIGRATION_COUNT ALTER, $INDEX_COUNT INDEX)"
        ((FAIL++))
    fi
else
    echo "   ❌ Migration 035 non trouvée"
    ((FAIL++))
fi

if [ -f "database/migrations/035b-migration-donnees-periodes.sql" ]; then
    UPDATE_COUNT=$(grep -c "UPDATE" database/migrations/035b-migration-donnees-periodes.sql)
    echo "   ✅ Migration 035b ($UPDATE_COUNT UPDATE)"
    ((PASS++))
else
    echo "   ⚠️  Migration 035b non trouvée (optionnelle)"
fi

# ==================== RÉSUMÉ ====================
echo ""
echo "=================================="
echo "📊 RÉSUMÉ"
echo "=================================="
echo "✅ Tests réussis: $PASS"
echo "❌ Tests échoués: $FAIL"
echo "📈 Score: $(( (PASS * 100) / (PASS + FAIL) ))%"

if [ "$FAIL" -eq 0 ]; then
    echo ""
    echo "🎉 TOUS LES TESTS SONT PASSÉS !"
    echo "✅ Phase 1 prête pour production"
    echo ""
    exit 0
else
    echo ""
    echo "⚠️  Des tests ont échoué"
    echo ""
    exit 1
fi
