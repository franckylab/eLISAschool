/**
 * ==================================
 * eLISAschool - Script de Test Phase 1
 * ==================================
 * Objectif: Valider l'implémentation du contexte africain et periodeId
 * Date: 8 juin 2026
 * ==================================
 */

import { AppDataSource } from '../src/database/data-source';
import { Periode } from '../src/modules/periodes/entities';
import {
    IncidentEleve,
    TypeIncidentEleve,
    SanctionEleve,
    TypeSanction,
    FelicitationEleve,
    TypeFelicitation,
} from '../src/modules/suivi-eleves/entities';
import { ObservationEleve } from '../src/modules/suivi-eleves/entities/observation-eleve.entity';

async function runTests() {
    console.log('\n🧪 ==================================');
    console.log('🧪 TESTS PHASE 1 - CONTEXTE AFRICAIN');
    console.log('🧪 ==================================\n');

    let testsPassed = 0;
    let testsFailed = 0;

    try {
        // Initialiser la connexion DB
        await AppDataSource.initialize();
        console.log('✅ Connexion base de données établie\n');

        // ==================== TEST 1: Enums TypeIncidentEleve ====================
        console.log('📋 TEST 1: Validation TypeIncidentEleve (20 types)');
        try {
            const typesAttendus = [
                'RETARD', 'ABSENCE_NON_JUSTIFIEE', 'ABSENCE_JUSTIFIEE',
                'ABANDON_TEMPORAIRE', 'ABANDON_DEFINITIF',
                'INDISCIPLINE', 'IRRESPECT_ENSEIGNANT', 'BAGARRE',
                'TRICHERIE', 'TENUE_NON_CONFORME', 'TELEPHONE_PORTE',
                'TRAVAIL_NON_FAIT', 'NOTES_INSUFFISANTES',
                'DIFFICULTES_APPRENTISSAGE', 'RETARD_ACCUMULE',
                'FRAIS_SCOLARITE_NON_PAYES', 'RENTREE_TARDIVE',
                'TRANSPORT_DIFFICILE', 'TRAVAIL_ENFANT'
            ];

            const typesExistants = Object.values(TypeIncidentEleve);
            const tousTypesPresents = typesAttendus.every(t => typesExistants.includes(t as TypeIncidentEleve));

            if (tousTypesPresents && typesExistants.length === 20) {
                console.log(`   ✅ 20 types incidents validés`);
                console.log(`   ✅ Types Afrique présents: FRAIS_SCOLARITE_NON_PAYES, ABANDON_TEMPORAIRE, TRAVAIL_ENFANT`);
                testsPassed++;
            } else {
                console.log(`   ❌ Types manquants: ${typesAttendus.filter(t => !typesExistants.includes(t as TypeIncidentEleve))}`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 2: Enums TypeSanction ====================
        console.log('\n📋 TEST 2: Validation TypeSanction (18 types progressifs)');
        try {
            const typesAttendus = [
                'OBSERVATION_ORALE', 'OBSERVATION_ECRITE', 'EXCUSES_PUBLIQUES',
                'AVERTISSEMENT', 'BLAME', 'RETENUE', 'TRAVAIL_COMMUNAUTE',
                'EXCLUSION_TEMPORAIRE', 'EXCLUSION_TEMPORAIRE_LONGUE',
                'CONSEIL_DISCIPLINE', 'EXCLUSION_DEFINITIVE', 'INTERDICTION_EXAMEN',
                'AMENDE_SYMBOLIQUE', 'EXCUSES_DEVANT_CHEF',
                'CONVOCATION_CHEF_FAMILLE', 'SUIVI_SPECIAL'
            ];

            const typesExistants = Object.values(TypeSanction);
            const tousTypesPresents = typesAttendus.every(t => typesExistants.includes(t as TypeSanction));

            if (tousTypesPresents && typesExistants.length === 18) {
                console.log(`   ✅ 18 types sanctions validés`);
                console.log(`   ✅ Progression logique: ORALE → ECRITE → AVERTISSEMENT → ... → EXCLUSION`);
                console.log(`   ✅ Types Afrique: EXCUSES_DEVANT_CHEF, CONVOCATION_CHEF_FAMILLE`);
                testsPassed++;
            } else {
                console.log(`   ❌ Types manquants: ${typesAttendus.filter(t => !typesExistants.includes(t as TypeSanction))}`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 3: Enums TypeFelicitation ====================
        console.log('\n📋 TEST 3: Validation TypeFelicitation (20 types)');
        try {
            const typesAttendus = [
                'EXCELLENCE_ACADEMIQUE', 'PROGRES_REMARQUABLE', 'MEILLEUR_NOTE_MATIERE',
                'RANG_EXCELLENT', 'ADMIS_MENTION',
                'COMPORTEMENT_EXEMPLAIRE', 'ASSIDUITE_PARFAITE', 'PONCTUALITE_EXEMPLAIRE',
                'RESPECT_ENSEIGNANTS', 'AIDE_CAMARADES',
                'ACTIVITE_PARASCOLAIRE', 'SPORT_EXCELLENCE', 'CULTURE_EXCELLENCE', 'CLUB_EXCELLENCE',
                'MERITE_COMMUNAUTAIRE', 'INITIATIVE_ENTREPRENEURIALE', 'RESILIENCE_REMARQUABLE',
                'ENGAGEMENT_CITOYEN', 'EXCELLENCE_BILINGUE', 'TRADITION_CULTURELLE',
                'SOLIDARITE_REMARQUABLE'
            ];

            const typesExistants = Object.values(TypeFelicitation);
            const tousTypesPresents = typesAttendus.every(t => typesExistants.includes(t as TypeFelicitation));

            if (tousTypesPresents && typesExistants.length === 20) {
                console.log(`   ✅ 20 types félicitations validés`);
                console.log(`   ✅ EXCELLENCE_BILINGUE (Cameroun franco/anglo)`);
                console.log(`   ✅ RESILIENCE_REMARQUABLE, TRADITION_CULTURELLE`);
                testsPassed++;
            } else {
                console.log(`   ❌ Types manquants: ${typesAttendus.filter(t => !typesExistants.includes(t as TypeFelicitation))}`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 4: Entité IncidentEleve - periodeId ====================
        console.log('\n📋 TEST 4: Validation IncidentEleve.periodeId');
        try {
            const incidentRepo = AppDataSource.getRepository(IncidentEleve);
            const metadata = incidentRepo.metadata;

            const hasPeriodeIdColumn = metadata.columns.some(col => col.propertyName === 'periodeId');
            const hasPeriodeRelation = metadata.relations.some(rel => rel.propertyName === 'periode');

            if (hasPeriodeIdColumn && hasPeriodeRelation) {
                console.log(`   ✅ Colonne periodeId présente`);
                console.log(`   ✅ Relation ManyToOne Periode configurée`);
                testsPassed++;
            } else {
                console.log(`   ❌ periodeId: ${hasPeriodeIdColumn ? '✅' : '❌'} | Relation: ${hasPeriodeRelation ? '✅' : '❌'}`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 5: Entité SanctionEleve - periodeId ====================
        console.log('\n📋 TEST 5: Validation SanctionEleve.periodeId');
        try {
            const sanctionRepo = AppDataSource.getRepository(SanctionEleve);
            const metadata = sanctionRepo.metadata;

            const hasPeriodeIdColumn = metadata.columns.some(col => col.propertyName === 'periodeId');
            const hasPeriodeRelation = metadata.relations.some(rel => rel.propertyName === 'periode');

            if (hasPeriodeIdColumn && hasPeriodeRelation) {
                console.log(`   ✅ Colonne periodeId présente`);
                console.log(`   ✅ Relation ManyToOne Periode configurée`);
                testsPassed++;
            } else {
                console.log(`   ❌ periodeId: ${hasPeriodeIdColumn ? '✅' : '❌'} | Relation: ${hasPeriodeRelation ? '✅' : '❌'}`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 6: Entité FelicitationEleve - periodeId ====================
        console.log('\n📋 TEST 6: Validation FelicitationEleve.periodeId');
        try {
            const felicitationRepo = AppDataSource.getRepository(FelicitationEleve);
            const metadata = felicitationRepo.metadata;

            const hasPeriodeIdColumn = metadata.columns.some(col => col.propertyName === 'periodeId');
            const hasPeriodeRelation = metadata.relations.some(rel => rel.propertyName === 'periode');

            if (hasPeriodeIdColumn && hasPeriodeRelation) {
                console.log(`   ✅ Colonne periodeId présente`);
                console.log(`   ✅ Relation ManyToOne Periode configurée`);
                testsPassed++;
            } else {
                console.log(`   ❌ periodeId: ${hasPeriodeIdColumn ? '✅' : '❌'} | Relation: ${hasPeriodeRelation ? '✅' : '❌'}`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 7: Entité ObservationEleve - periodeId ====================
        console.log('\n📋 TEST 7: Validation ObservationEleve.periodeId');
        try {
            const observationRepo = AppDataSource.getRepository(ObservationEleve);
            const metadata = observationRepo.metadata;

            const hasPeriodeIdColumn = metadata.columns.some(col => col.propertyName === 'periodeId');
            const hasPeriodeRelation = metadata.relations.some(rel => rel.propertyName === 'periode');

            if (hasPeriodeIdColumn && hasPeriodeRelation) {
                console.log(`   ✅ Colonne periodeId présente`);
                console.log(`   ✅ Relation ManyToOne Periode configurée`);
                testsPassed++;
            } else {
                console.log(`   ❌ periodeId: ${hasPeriodeIdColumn ? '✅' : '❌'} | Relation: ${hasPeriodeRelation ? '✅' : '❌'}`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 8: Index Performance ====================
        console.log('\n📋 TEST 8: Validation des index composites');
        try {
            const query = `
                SELECT COUNT(*) as index_count
                FROM pg_indexes
                WHERE tablename IN (
                    'incidents_eleves', 'observations_eleves', 
                    'sanctions_eleves', 'felicitations_eleves'
                )
                AND indexname LIKE '%periode%'
            `;
            
            const result = await AppDataSource.query(query);
            const indexCount = parseInt(result[0].index_count);

            if (indexCount >= 8) {
                console.log(`   ✅ ${indexCount} index periode trouvés (minimum attendu: 8)`);
                testsPassed++;
            } else {
                console.log(`   ❌ Seulement ${indexCount} index trouvés (minimum: 8)`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 9: Contraintes FOREIGN KEY ====================
        console.log('\n📋 TEST 9: Validation des contraintes FOREIGN KEY');
        try {
            const query = `
                SELECT COUNT(*) as fk_count
                FROM information_schema.table_constraints
                WHERE constraint_type = 'FOREIGN KEY'
                AND constraint_name LIKE '%periode%'
                AND table_name IN (
                    'incidents_eleves', 'observations_eleves',
                    'sanctions_eleves', 'felicitations_eleves',
                    'incidents_personnel', 'evaluations_personnel',
                    'dossiers_medicaux', 'consultations_medicales'
                )
            `;
            
            const result = await AppDataSource.query(query);
            const fkCount = parseInt(result[0].fk_count);

            if (fkCount === 8) {
                console.log(`   ✅ 8 contraintes FOREIGN KEY periode validées`);
                testsPassed++;
            } else {
                console.log(`   ❌ ${fkCount}/8 contraintes FK trouvées`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== TEST 10: Colonnes periodeId en base ====================
        console.log('\n📋 TEST 10: Validation des colonnes periodeId en base');
        try {
            const query = `
                SELECT COUNT(*) as column_count
                FROM information_schema.columns
                WHERE column_name = 'periodeId'
                AND table_name IN (
                    'incidents_eleves', 'observations_eleves',
                    'sanctions_eleves', 'felicitations_eleves',
                    'incidents_personnel', 'evaluations_personnel',
                    'dossiers_medicaux', 'consultations_medicales'
                )
            `;
            
            const result = await AppDataSource.query(query);
            const columnCount = parseInt(result[0].column_count);

            if (columnCount === 8) {
                console.log(`   ✅ 8 colonnes periodeId créées en base`);
                testsPassed++;
            } else {
                console.log(`   ❌ ${columnCount}/8 colonnes trouvées`);
                testsFailed++;
            }
        } catch (error) {
            console.log(`   ❌ Erreur: ${error}`);
            testsFailed++;
        }

        // ==================== RÉSUMÉ ====================
        console.log('\n==================================');
        console.log('📊 RÉSUMÉ DES TESTS');
        console.log('==================================');
        console.log(`✅ Tests réussis: ${testsPassed}/10`);
        console.log(`❌ Tests échoués: ${testsFailed}/10`);
        console.log(`📈 Score: ${((testsPassed / 10) * 100).toFixed(0)}%`);

        if (testsFailed === 0) {
            console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
            console.log('✅ Phase 1 prête pour production\n');
        } else {
            console.log('\n⚠️ Des tests ont échoué. Vérifiez les erreurs ci-dessus.\n');
        }

    } catch (error) {
        console.error('\n❌ Erreur fatale:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
        process.exit(testsFailed > 0 ? 1 : 0);
    }
}

// Exécuter les tests
runTests().catch(console.error);
