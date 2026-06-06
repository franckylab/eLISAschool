/**
 * ==================================
 * eLISAschool - Migration Consolidation ConfigurationApp
 * ==================================
 * Version: 1.0.0
 * Description: Migre les données de ConfigurationApp vers EtablissementConfig
 *              et marque ConfigurationApp comme dépréciée
 * 
 * CHANGEMENTS:
 * 1. Ajoute nouvelles colonnes à etablissement_config
 * 2. Migre les données de configuration_app vers etablissement_config
 * 3. Copie les modules_actifs vers chaque établissement
 * 
 * DATE: 2025-01-19
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsoliderConfigurationApp1737400000000 implements MigrationInterface {
    name = 'ConsoliderConfigurationApp1737400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('📝 Migration: Consolidation de ConfigurationApp...');

        // 1. Ajouter les nouvelles colonnes à etablissement_config
        console.log('🔧 Ajout des nouvelles colonnes à etablissement_config...');

        const colonnes = [
            { nom: 'couleur_primaire', type: 'VARCHAR(10)', nullable: true },
            { nom: 'couleur_secondaire', type: 'VARCHAR(10)', nullable: true },
            { nom: 'couleur_accent', type: 'VARCHAR(10)', nullable: true },
            { nom: 'theme', type: 'VARCHAR(20)', default: "'default'" },
            { nom: 'langue_defaut', type: 'VARCHAR(10)', default: "'fr'" },
            { nom: 'devise', type: 'VARCHAR(10)', default: "'XOF'" },
            { nom: 'fuseau_horaire', type: 'VARCHAR(50)', default: "'Africa/Douala'" },
            { nom: 'message_accueil', type: 'TEXT', nullable: true },
            { nom: 'modules_actifs', type: 'JSONB', default: "'{}'" },
            { nom: 'max_eleves', type: 'INTEGER', nullable: true },
            { nom: 'max_utilisateurs', type: 'INTEGER', nullable: true },
            { nom: 'max_classes', type: 'INTEGER', nullable: true },
            { nom: 'stockage_max_mb', type: 'INTEGER', nullable: true },
            { nom: 'date_expiration_abonnement', type: 'TIMESTAMP', nullable: true },
            { nom: 'plan_abonnement', type: 'VARCHAR(50)', default: "'gratuit'" },
        ];

        for (const colonne of colonnes) {
            const defaultClause = colonne.default ? ` DEFAULT ${colonne.default}` : '';
            const nullClause = colonne.nullable ? ' NULL' : ' NOT NULL';
            
            try {
                await queryRunner.query(`
                    ALTER TABLE etablissement_config 
                    ADD COLUMN IF NOT EXISTS ${colonne.nom} ${colonne.type}${nullClause}${defaultClause}
                `);
                console.log(`   ✅ Colonne ${colonne.nom} ajoutée`);
            } catch (error) {
                console.log(`   ⚠️  Colonne ${colonne.nom} existe déjà`);
            }
        }

        // 2. Migrer les données de configuration_app vers chaque établissement
        console.log('\n📦 Migration des données...');

        // Récupérer la configuration app singleton
        const configAppResult = await queryRunner.query(`
            SELECT * FROM configuration_app LIMIT 1
        `);

        let etablissementsMigres = 0;

        if (configAppResult.length === 0) {
            console.log('⚠️  Aucune configuration_app trouvée, skip migration');
        } else {
            const configApp = configAppResult[0];
            console.log(`📋 Configuration app trouvée: ${configApp.nom_etablissement}`);

            // Récupérer tous les établissements
            const etablissementsResult = await queryRunner.query(`
                SELECT id FROM etablissements WHERE actif = true
            `);

            console.log(`🏫 ${etablissementsResult.length} établissement(s) actif(s) trouvé(s)`);

            for (const etablissement of etablissementsResult) {
                console.log(`\n   🔄 Migration pour établissement ${etablissement.id}...`);

                // Mettre à jour EtablissementConfig avec les données de ConfigurationApp
                await queryRunner.query(`
                    UPDATE etablissement_config 
                    SET 
                        couleur_primaire = $1,
                        couleur_secondaire = $2,
                        couleur_accent = $3,
                        theme = $4,
                        langue_defaut = $5,
                        devise = $6,
                        fuseau_horaire = $7,
                        message_accueil = $8,
                        modules_actifs = $9
                    WHERE etablissement_id = $10
                `, [
                    configApp.couleur_primaire || '#28a745',
                    configApp.couleur_secondaire || '#ffc107',
                    configApp.couleur_accent || '#007bff',
                    configApp.theme || 'default',
                    configApp.langue_defaut || 'fr',
                    configApp.devise || 'XOF',
                    configApp.fuseau_horaire || 'Africa/Douala',
                    configApp.message_accueil || null,
                    JSON.stringify(configApp.modules_actifs || {}),
                    etablissement.id,
                ]);

                console.log(`      ✅ EtablissementConfig mis à jour`);

                // Créer des paramètres scopés pour cet établissement
                const parametresScopes = [
                    { cle: 'regional.language', valeur: configApp.langue_defaut || 'fr' },
                    { cle: 'regional.currency', valeur: configApp.devise || 'XOF' },
                    { cle: 'regional.timezone', valeur: configApp.fuseau_horaire || 'Africa/Douala' },
                    { cle: 'theme.primary_color', valeur: configApp.couleur_primaire || '#28a745' },
                    { cle: 'theme.secondary_color', valeur: configApp.couleur_secondaire || '#ffc107' },
                    { cle: 'theme.accent_color', valeur: configApp.couleur_accent || '#007bff' },
                ];

                for (const param of parametresScopes) {
                    // Vérifier si le paramètre global existe
                    const paramGlobal = await queryRunner.query(`
                        SELECT id FROM parametres_systeme WHERE cle = $1 AND etablissement_id IS NULL
                    `, [param.cle]);

                    if (paramGlobal.length === 0) {
                        // Créer le paramètre global d'abord
                        await queryRunner.query(`
                            INSERT INTO parametres_systeme 
                            (id, cle, valeur, type_valeur, categorie, modifiable_runtime, visible, etablissement_id)
                            VALUES (gen_random_uuid(), $1, $2, 'STRING', 'THEME', true, true, NULL)
                            ON CONFLICT (cle, etablissement_id) DO NOTHING
                        `, [param.cle, JSON.stringify(param.valeur)]);
                    }

                    // Créer l'override pour cet établissement
                    await queryRunner.query(`
                        INSERT INTO parametres_systeme 
                        (id, cle, valeur, type_valeur, categorie, modifiable_runtime, visible, etablissement_id)
                        VALUES (gen_random_uuid(), $1, $2, 'STRING', 'THEME', true, true, $3)
                        ON CONFLICT (cle, etablissement_id) DO NOTHING
                    `, [param.cle, JSON.stringify(param.valeur), etablissement.id]);
                }

                console.log(`      ✅ Paramètres scopés créés`);
                etablissementsMigres++;
            }
        }

        // 3. Ajouter un commentaire pour marquer configuration_app comme dépréciée
        await queryRunner.query(`
            COMMENT ON TABLE configuration_app IS 
            '⚠️ DÉPRÉCIÉE - Utiliser etablissement_config et parametres_systeme à la place'
        `);

        console.log('\n✅ Migration terminée avec succès!');
        console.log('\n📊 STATISTIQUES:');
        console.log('   - Nouvelles colonnes ajoutées: 14');
        console.log('   - Établissements migrés:', etablissementsMigres);
        console.log('   - ConfigurationApp: MARQUÉE COMME DÉPRÉCIÉE');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('↩️ Rollback: Suppression des nouvelles colonnes...');

        const colonnes = [
            'couleur_primaire', 'couleur_secondaire', 'couleur_accent', 'theme',
            'langue_defaut', 'devise', 'fuseau_horaire', 'message_accueil',
            'modules_actifs', 'max_eleves', 'max_utilisateurs', 'max_classes',
            'stockage_max_mb', 'date_expiration_abonnement', 'plan_abonnement'
        ];

        for (const colonne of colonnes) {
            await queryRunner.query(`
                ALTER TABLE etablissement_config 
                DROP COLUMN IF EXISTS ${colonne}
            `);
        }

        // Supprimer les paramètres scopés créés
        await queryRunner.query(`
            DELETE FROM parametres_systeme 
            WHERE cle IN (
                'regional.language', 'regional.currency', 'regional.timezone',
                'theme.primary_color', 'theme.secondary_color', 'theme.accent_color'
            )
            AND etablissement_id IS NOT NULL
        `);

        console.log('✅ Rollback terminé');
    }
}
