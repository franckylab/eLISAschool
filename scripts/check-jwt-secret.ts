/**
 * Script de diagnostic pour vérifier quel JWT_SECRET est utilisé par le backend
 * 
 * Usage: npx tsx scripts/check-jwt-secret.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

async function main() {
    // Charger .env
    const envPath = path.resolve(__dirname, '../.env');
    dotenv.config({ path: envPath });

    console.log('=== DIAGNOSTIC JWT_SECRET ===\n');

    // 1. Vérifier process.env
    console.log('1. process.env.JWT_SECRET:');
    if (process.env.JWT_SECRET) {
        console.log(`   ✅ Présent: ${process.env.JWT_SECRET.substring(0, 15)}...`);
        console.log(`   Longueur: ${process.env.JWT_SECRET.length} caractères`);
    } else {
        console.log('   ❌ ABSENT - sera généré dynamiquement !');
    }

    // 2. Vérifier ENCRYPTION_KEY
    console.log('\n2. process.env.ENCRYPTION_KEY:');
    if (process.env.ENCRYPTION_KEY) {
        console.log(`   ✅ Présent: ${process.env.ENCRYPTION_KEY.substring(0, 15)}...`);
        console.log(`   Longueur: ${process.env.ENCRYPTION_KEY.length} caractères`);
    } else {
        console.log('   ❌ ABSENT - sera générée dynamiquement !');
    }

    // 3. Charger envConfig
    console.log('\n3. Chargement envConfig...');
    try {
        const { envConfig } = await import('../backend/src/config/env.config');
        
        console.log(`   JWT_SECRET utilisé: ${envConfig.jwt.secret.substring(0, 15)}...`);
        console.log(`   Longueur: ${envConfig.jwt.secret.length} caractères`);
        
        // 4. Comparer
        console.log('\n4. Comparaison:');
        if (envConfig.jwt.secret === process.env.JWT_SECRET) {
            console.log('   ✅ JWT_SECRET du .env est utilisé (STABLE)');
        } else {
            console.log('   ❌ JWT_SECRET DIFFÉRENT du .env (GÉNÉRÉ DYNAMIQUEMENT)');
            console.log(`   .env: ${process.env.JWT_SECRET?.substring(0, 15)}...`);
            console.log(`   envConfig: ${envConfig.jwt.secret.substring(0, 15)}...`);
        }
        
        // 5. Test de signature
        console.log('\n5. Test de signature JWT...');
        
        const testPayload = { sub: 'test', email: 'test@test.com' };
        const token = jwt.sign(testPayload, envConfig.jwt.secret, { expiresIn: '1h' });
        
        try {
            const decoded = jwt.verify(token, envConfig.jwt.secret);
            console.log('   ✅ Token signé et vérifié avec succès');
            console.log(`   Token: ${token.substring(0, 30)}...`);
        } catch (error: any) {
            console.log(`   ❌ Erreur vérification: ${error.message}`);
        }
        
        // 6. Test avec process.env.JWT_SECRET
        if (process.env.JWT_SECRET) {
            console.log('\n6. Test avec process.env.JWT_SECRET...');
            const token2 = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
            
            try {
                const decoded2 = jwt.verify(token2, process.env.JWT_SECRET);
                console.log('   ✅ Token signé et vérifié avec process.env.JWT_SECRET');
                
                // Vérifier si les deux secrets sont compatibles
                try {
                    const crossVerify = jwt.verify(token, process.env.JWT_SECRET);
                    console.log('   ✅ Tokens compatibles (mêmes secrets)');
                } catch (error: any) {
                    console.log(`   ❌ Tokens INCOMPATIBLES: ${error.message}`);
                    console.log('   → Le backend utilise un secret différent du .env !');
                }
            } catch (error: any) {
                console.log(`   ❌ Erreur: ${error.message}`);
            }
        }
        
    } catch (error: any) {
        console.log(`   ❌ Erreur chargement: ${error.message}`);
    }

    console.log('\n=== FIN DIAGNOSTIC ===\n');

    // 7. Recommandations
    console.log('📋 RECOMMANDATIONS:\n');
    console.log('1. Si JWT_SECRET est ABSENT dans process.env:');
    console.log('   → Ajoutez JWT_SECRET=... dans .env\n');
    console.log('2. Si JWT_SECRET envConfig ≠ process.env:');
    console.log('   → Le backend utilise un secret généré dynamiquement');
    console.log('   → Redémarrez le backend pour utiliser .env\n');
    console.log('3. Si tokens incompatibles:');
    console.log('   → Déconnectez-vous et reconnectez-vous après redémarrage\n');
}

main().catch(console.error);
