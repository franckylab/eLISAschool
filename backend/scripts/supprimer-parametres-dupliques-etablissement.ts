/**
 * ==================================
 * eLISAschool - Supprimer paramètres dupliqués établissement
 * ==================================
 * Supprime les paramètres de ParametreSysteme qui dupliquent
 * les informations déjà présentes dans la table etablissements.
 */

import * as path from 'path';
import * as dotenv from 'dotenv';

// Charger .env depuis la racine du projet
const rootEnvPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: rootEnvPath });

// Import dynamique de pg
const { Pool } = require('pg');

// Paramètres à supprimer (dupliqués de etablissements)
const PARAMS_A_SUPPRIMER = [
    'app.nom_etablissement',
    'app.type_etablissement',
    'app.message_accueil',
    'app.email',
    'app.telephone',
    'app.adresse',
    'app.code_etablissement',
];

async function main() {
    console.log('🔍 Vérification des paramètres dupliqués...\n');

    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        // 1. Compter les paramètres avant suppression
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM parametres_systeme WHERE cle = ANY($1)`,
            [PARAMS_A_SUPPRIMER]
        );
        const countBefore = parseInt(countResult.rows[0].count);
        console.log(`📊 Paramètres dupliqués trouvés: ${countBefore}\n`);

        if (countBefore === 0) {
            console.log('✅ Aucun paramètre dupliqué à supprimer.');
            return;
        }

        // 2. Lister les paramètres à supprimer
        const listResult = await pool.query(
            `SELECT cle, "etablissementId" FROM parametres_systeme WHERE cle = ANY($1) ORDER BY cle`,
            [PARAMS_A_SUPPRIMER]
        );
        console.log('📋 Paramètres à supprimer:');
        listResult.rows.forEach((row: any) => {
            console.log(`   - ${row.cle} (etablissementId: ${row.etablissementId || 'NULL (global)'})`);
        });
        console.log('');

        // 3. Supprimer les paramètres dupliqués
        console.log('🗑️  Suppression des paramètres dupliqués...');
        const deleteResult = await pool.query(
            `DELETE FROM parametres_systeme WHERE cle = ANY($1)`,
            [PARAMS_A_SUPPRIMER]
        );
        console.log(`✅ ${deleteResult.rowCount} paramètres supprimés\n`);

        // 4. Vérification post-suppression
        const verifyResult = await pool.query(
            `SELECT COUNT(*) FROM parametres_systeme WHERE cle = ANY($1)`,
            [PARAMS_A_SUPPRIMER]
        );
        const countAfter = parseInt(verifyResult.rows[0].count);
        
        console.log('📈 Résumé:');
        console.log(`   Avant: ${countBefore} paramètres`);
        console.log(`   Après: ${countAfter} paramètres`);
        console.log(`   Supprimés: ${countBefore - countAfter} ✅\n`);

        // 5. Rappel des paramètres valides qui restent
        console.log('💡 Paramètres applicatifs valides (conservés):');
        const validParams = await pool.query(
            `SELECT cle FROM parametres_systeme 
             WHERE cle LIKE 'app.%' 
             AND cle NOT LIKE 'app.nom_etablissement'
             AND cle NOT LIKE 'app.type_etablissement'
             AND cle NOT LIKE 'app.message_accueil'
             AND cle NOT LIKE 'app.email'
             AND cle NOT LIKE 'app.telephone'
             AND cle NOT LIKE 'app.adresse'
             AND cle NOT LIKE 'app.code_etablissement'
             ORDER BY cle`
        );
        validParams.rows.forEach((row: any) => {
            console.log(`   ✓ ${row.cle}`);
        });

        console.log('\n✅ Migration terminée avec succès!');
        console.log('📚 Source de vérité pour les infos établissement: Table ETABLISSEMENTS uniquement');

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
