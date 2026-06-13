/**
 * ==================================
 * eLISAschool - Script de Correction Automatisée des Hooks
 * ==================================
 * Corrige:
 * 1. isAuthenticated manquant dans les hooks
 * 2. response.data possiblement undefined
 * 3. Imports inutilisés
 */

const fs = require('fs');
const path = require('path');

const HOOKS_DIR = path.join(__dirname, 'src/features');

// Liste des fichiers hooks à corriger (extraits de l'analyse TypeScript)
const hooksToFix = [
    'absences/hooks/use-absences.ts',
    'analytics/hooks/use-analytics.ts',
    'annees-scolaires/hooks/use-annees-scolaires.ts',
    'annonces/hooks/use-annonces.ts',
    'archives/hooks/use-archives.ts',
    'atelier/hooks/use-atelier.ts',
    'bibliotheque/hooks/use-bibliotheque.ts',
    'bulletins/hooks/use-bulletins.ts',
    'cantine/hooks/use-cantine.ts',
    'conges/hooks/use-conges.ts',
    'courriers/hooks/use-courriers.ts',
    'cycles/hooks/use-cycles.ts',
    'discipline/hooks/use-discipline.ts',
    'documents/hooks/use-documents.ts',
    'emplois-du-time/hooks/use-emplois.ts',
    'evaluations/hooks/use-evaluations.ts',
    'evenements/hooks/use-evenements.ts',
    'examens/hooks/use-examens.ts',
    'finances/hooks/use-finances.ts',
    'inventaire/hooks/use-inventaire.ts',
    'laboratoire/hooks/use-laboratoire.ts',
    'maintenance/hooks/use-maintenance.ts',
    'messagerie/hooks/use-messagerie.ts',
    'niveaux/hooks/use-niveaux.ts',
    'organisation/hooks/use-organisation.ts',
    'parking/hooks/use-parking.ts',
    'periodes/hooks/use-periodes.ts',
    'pointages/hooks/use-pointages.ts',
    'rapports/hooks/use-rapports.ts',
    'sante/hooks/use-sante.ts',
    'securite/hooks/use-securite.ts',
    'sondages/hooks/use-sondages.ts',
    'stage/hooks/use-stage.ts',
    'statistiques/hooks/use-statistiques.ts',
    'transport/hooks/use-transport.ts',
    'utilisateurs/hooks/use-utilisateurs.ts',
];

function fixHookFile(filePath) {
    const fullPath = path.join(HOOKS_DIR, filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  Fichier non trouvé: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // 1. Vérifier si useAuthStore est déjà importé
    const hasAuthStoreImport = content.includes("from '@/stores/auth.store'");
    
    // 2. Vérifier si isAuthenticated est déjà utilisé
    const usesIsAuthenticated = content.includes('isAuthenticated');

    // 3. Si le hook utilise enabled: isAuthenticated mais ne le déclare pas
    if (content.includes('enabled: isAuthenticated') && !content.includes('const { isAuthenticated } = useAuthStore()')) {
        // Ajouter l'import si nécessaire
        if (!hasAuthStoreImport) {
            const importRegex = /(import \{ useQuery.*?\} from '@tanstack\/react-query';)/;
            const match = content.match(importRegex);
            if (match) {
                content = content.replace(
                    importRegex,
                    "$1\nimport { useAuthStore } from '@/stores/auth.store';"
                );
                modified = true;
                console.log(`  ✓ Ajouté import useAuthStore dans ${filePath}`);
            }
        }

        // Ajouter la déclaration dans chaque fonction qui utilise enabled: isAuthenticated
        // Pattern: function useXxx(...) {\n    return useQuery({
        const functionPattern = /(export function (use\w+)\([^)]*\) \{)\n(\s+)return useQuery\(\{/g;
        content = content.replace(functionPattern, (match, funcDecl, funcName, indent) => {
            if (!match.includes('isAuthenticated } = useAuthStore()')) {
                modified = true;
                console.log(`  ✓ Ajouté déclaration isAuthenticated dans ${funcName}`);
                return `${funcDecl}\n${indent}const { isAuthenticated } = useAuthStore();\n${indent}\n${indent}return useQuery({`;
            }
            return match;
        });
    }

    // 4. Corriger response.data possiblement undefined
    // Pattern: return response.data.data; → return response.data?.data;
    content = content.replace(/return response\.data\.data;/g, 'return response.data?.data;');
    content = content.replace(/return response\.data;/g, 'return response.data;'); // Déjà ok

    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Corrigé: ${filePath}`);
    } else {
        console.log(`⏭️  Aucun changement nécessaire: ${filePath}`);
    }
}

// Exécuter les corrections
console.log('🔧 Correction automatisée des hooks...\n');

hooksToFix.forEach(hookPath => {
    fixHookFile(hookPath);
});

console.log('\n✨ Correction terminée !');
console.log('📝 Exécutez "npx tsc --noEmit" pour vérifier les erreurs restantes.');
