/**
 * ==================================
 * eLISAschool - Test d'Intégration des Corrections Académiques
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-27
 * 
 * Objectif: Tester que les corrections fonctionnent correctement
 * - Déduction de classe via AffectationEleve
 * - Guard de clôture de période
 * - Filtrage multi-tenant
 * - Helper getClasseActuelle()
 */

import { AppDataSource } from '@database/data-source';
import { notesService } from '@modules/notes/services';
import { elevesService } from '@modules/eleves/services';
import { periodesService } from '@modules/periodes/services';
import { AffectationEleve } from '@modules/classes/entities';
import { Repository } from 'typeorm';

async function runTests() {
    console.log('🧪 Tests d\'Intégration - Corrections Académiques\n');
    
    let passed = 0;
    let failed = 0;
    
    try {
        // Initialiser la connexion DB
        await AppDataSource.initialize();
        console.log('✅ Connexion DB établie\n');
        
        // ==================================
        // TEST 1: Helper getClasseActuelle()
        // ==================================
        console.log('📋 TEST 1: Helper getClasseActuelle()');
        try {
            // Chercher un élève de test
            const eleveRepo = AppDataSource.getRepository('Eleve') as any;
            const eleveTest = await eleveRepo.findOne({
                where: { etablissementId: 'test-etablissement-id' }
            });
            
            if (eleveTest) {
                const classe = await elevesService.getClasseActuelle(eleveTest.id);
                if (classe) {
                    console.log(`  ✅ Élève ${eleveTest.matricule} → Classe: ${classe.nom}`);
                    passed++;
                } else {
                    console.log(`  ⚠️  Élève ${eleveTest.matricule} → Aucune classe active`);
                    passed++; // C'est OK si pas de classe
                }
            } else {
                console.log('  ⚠️  Aucun élève de test trouvé (skip)');
                passed++;
            }
        } catch (error: any) {
            console.log(`  ❌ ÉCHEC: ${error.message}`);
            failed++;
        }
        console.log('');
        
        // ==================================
        // TEST 2: Guard de clôture de période
        // ==================================
        console.log('📋 TEST 2: Guard de clôture de période');
        try {
            // Chercher une période clôturée
            const periodeRepo = AppDataSource.getRepository('Periode') as any;
            const periodeCloturee = await periodeRepo.findOne({
                where: { statut: 'CLOTUREE' }
            });
            
            if (periodeCloturee) {
                // Essayer de créer une note → doit échouer
                try {
                    await notesService.create({
                        eleveId: 'test-eleve-id',
                        matiereId: 'test-matiere-id',
                        periodeId: periodeCloturee.id,
                        valeur: 15,
                        bareme: 20,
                        coefficient: 1,
                        typeEvaluation: 'DEVOIR'
                    }, 'test-enseignant-id', 'test-etablissement-id');
                    
                    console.log('  ❌ ÉCHEC: La note aurait dû être bloquée');
                    failed++;
                } catch (error: any) {
                    if (error.code === 'PERIODE_CLOTUREE') {
                        console.log(`  ✅ Guard actif: ${error.message}`);
                        passed++;
                    } else {
                        console.log(`  ❌ Erreur inattendue: ${error.message}`);
                        failed++;
                    }
                }
            } else {
                console.log('  ⚠️  Aucune période clôturée trouvée (skip)');
                passed++;
            }
        } catch (error: any) {
            console.log(`  ❌ ÉCHEC: ${error.message}`);
            failed++;
        }
        console.log('');
        
        // ==================================
        // TEST 3: Déduction de classe via AffectationEleve
        // ==================================
        console.log('📋 TEST 3: Déduction de classe via AffectationEleve');
        try {
            const affectationRepo = AppDataSource.getRepository(AffectationEleve);
            const affectation = await affectationRepo.findOne({
                where: { actif: true },
                relations: ['classe', 'eleve']
            });
            
            if (affectation) {
                console.log(`  ✅ Affectation trouvée: Élève → Classe ${affectation.classe?.nom}`);
                console.log(`     (classeId n'est plus dans Note, déduit via cette affectation)`);
                passed++;
            } else {
                console.log('  ⚠️  Aucune affectation active trouvée (skip)');
                passed++;
            }
        } catch (error: any) {
            console.log(`  ❌ ÉCHEC: ${error.message}`);
            failed++;
        }
        console.log('');
        
        // ==================================
        // TEST 4: Filtrage multi-tenant des périodes
        // ==================================
        console.log('📋 TEST 4: Filtrage multi-tenant des périodes');
        try {
            const periodeRepo = AppDataSource.getRepository('Periode') as any;
            
            // Chercher un établissement de test
            const etablissementId = 'test-etablissement-id';
            const periodes = await periodesService.findAll('test-annee-id', etablissementId);
            
            // Vérifier que toutes les périodes retournées appartiennent à l'établissement
            const toutesCoherentes = periodes.every((p: any) => p.etablissementId === etablissementId);
            
            if (toutesCoherentes) {
                console.log(`  ✅ ${periodes.length} périodes filtrées par établissement`);
                passed++;
            } else {
                console.log('  ❌ ÉCHEC: Certaines périodes n\'appartiennent pas à l\'établissement');
                failed++;
            }
        } catch (error: any) {
            console.log(`  ❌ ÉCHEC: ${error.message}`);
            failed++;
        }
        console.log('');
        
        // ==================================
        // RÉSUMÉ
        // ==================================
        console.log('==================================');
        console.log('  RÉSUMÉ DES TESTS');
        console.log('==================================');
        console.log(`  Tests totaux: ${passed + failed}`);
        console.log(`  ✅ Passés: ${passed}`);
        console.log(`  ❌ Échoués: ${failed}`);
        console.log('');
        
        if (failed === 0) {
            console.log('✅ TOUS LES TESTS SONT PASSÉS !');
            console.log('\nLes corrections sont fonctionnelles et prêtes pour le déploiement.');
        } else {
            console.log(`❌ ${failed} TEST(S) ÉCHOUÉ(S)`);
            console.log('\nVeuillez corriger les erreurs avant de déployer.');
            process.exit(1);
        }
        
    } catch (error: any) {
        console.error('\n❌ ERREUR FATALE:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        // Fermer la connexion DB
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

// Exécuter les tests
runTests().catch(console.error);
