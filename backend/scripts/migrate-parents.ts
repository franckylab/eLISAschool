/**
 * ==================================
 * eLISAschool - Script de Migration des Parents Existants
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Description: Migre les données texte (nomPere, nomMere, telephoneTuteur)
 * depuis la table eleves vers la nouvelle table responsables_eleves.
 * 
 * Usage: npx ts-node backend/scripts/migrate-parents.ts
 */

import { AppDataSource } from '../src/database/data-source';
import { Repository } from 'typeorm';
import { Eleve } from '../src/modules/eleves/entities/eleve.entity';
import { Utilisateur } from '../src/modules/auth/entities/utilisateur.entity';
import { Role } from '../src/modules/auth/entities';
import { LienParente } from '../src/modules/responsables-eleves/entities';
import { logger } from '../src/common/utils/logger.util';

interface ResponsableEleveData {
    utilisateurId: string;
    enfantId: string;
    lienParente: LienParente;
    email?: string;
    telephone?: string;
}

async function migrateParents(): Promise<void> {
    logger.info('🚀 Début de la migration des parents...');

    let dataSource: any;

    try {
        // Initialiser la connexion
        dataSource = await AppDataSource.initialize();
        logger.info('✅ Connexion à la base de données établie');

        const eleveRepo = dataSource.getRepository(Eleve);
        const userRepo = dataSource.getRepository(Utilisateur);

        // Récupérer tous les élèves avec des informations de parents
        const eleves = await eleveRepo.find({
            where: [
                { nomPere: { not: null } },
                { nomMere: { not: null } },
                { nomTuteur: { not: null } },
            ],
            relations: ['utilisateur'],
        });

        logger.info(`📊 ${eleves.length} élèves trouvés avec des informations de parents`);

        const migrations: Array<{
            eleveMatricule: string;
            parentEmail: string;
            lienParente: string;
            action: 'CREATE' | 'LINK';
        }> = [];

        const responsablesToCreate: ResponsableEleveData[] = [];

        for (const eleve of eleves) {
            if (!eleve.utilisateurId) {
                logger.warn(`⚠️  Élève ${eleve.matricule} sans utilisateurId - ignoré`);
                continue;
            }

            // Traiter le père
            if (eleve.nomPere) {
                const parentData = await findOrCreateParent(
                    userRepo,
                    `pere.${eleve.id}@elisaschool.temp`,
                    eleve.nomPere,
                    'Père de ' + eleve.matricule
                );

                if (parentData) {
                    responsablesToCreate.push({
                        utilisateurId: parentData.id,
                        enfantId: eleve.utilisateurId,
                        lienParente: LienParente.PERE,
                        telephone: eleve.telephoneTuteur || undefined,
                    });

                    migrations.push({
                        eleveMatricule: eleve.matricule,
                        parentEmail: parentData.email,
                        lienParente: 'PÈRE',
                        action: parentData.isNew ? 'CREATE' : 'LINK',
                    });
                }
            }

            // Traiter la mère
            if (eleve.nomMere) {
                const parentData = await findOrCreateParent(
                    userRepo,
                    `mere.${eleve.id}@elisaschool.temp`,
                    eleve.nomMere,
                    'Mère de ' + eleve.matricule
                );

                if (parentData) {
                    responsablesToCreate.push({
                        utilisateurId: parentData.id,
                        enfantId: eleve.utilisateurId,
                        lienParente: LienParente.MERE,
                        telephone: eleve.telephoneTuteur || undefined,
                    });

                    migrations.push({
                        eleveMatricule: eleve.matricule,
                        parentEmail: parentData.email,
                        lienParente: 'MÈRE',
                        action: parentData.isNew ? 'CREATE' : 'LINK',
                    });
                }
            }

            // Traiter le tuteur
            if (eleve.nomTuteur && eleve.nomTuteur !== eleve.nomPere && eleve.nomTuteur !== eleve.nomMere) {
                const parentData = await findOrCreateParent(
                    userRepo,
                    `tuteur.${eleve.id}@elisaschool.temp`,
                    eleve.nomTuteur,
                    'Tuteur de ' + eleve.matricule
                );

                if (parentData) {
                    responsablesToCreate.push({
                        utilisateurId: parentData.id,
                        enfantId: eleve.utilisateurId,
                        lienParente: LienParente.TUTEUR_LEGAL,
                        telephone: eleve.telephoneTuteur || undefined,
                    });

                    migrations.push({
                        eleveMatricule: eleve.matricule,
                        parentEmail: parentData.email,
                        lienParente: 'TUTEUR',
                        action: parentData.isNew ? 'CREATE' : 'LINK',
                    });
                }
            }
        }

        // Créer les relations dans responsables_eleves
        logger.info(`🔗 Création de ${responsablesToCreate.length} relations parent-élève...`);

        for (const responsable of responsablesToCreate) {
            try {
                // Vérifier si la relation existe déjà
                const existing = await dataSource.query(`
                    SELECT id FROM responsables_eleves 
                    WHERE utilisateur_id = $1 AND enfant_id = $2
                `, [responsable.utilisateurId, responsable.enfantId]);

                if (existing.length > 0) {
                    logger.debug(`⏭️  Relation déjà existante pour ${responsable.utilisateurId} -> ${responsable.enfantId}`);
                    continue;
                }

                // Insérer la relation
                await dataSource.query(`
                    INSERT INTO responsables_eleves 
                    (utilisateur_id, enfant_id, lien_parente, responsable_legal, peut_consulter, peut_payer, telephone, actif)
                    VALUES ($1, $2, $3, true, true, false, $4, true)
                    ON CONFLICT (utilisateur_id, enfant_id) DO NOTHING
                `, [
                    responsable.utilisateurId,
                    responsable.enfantId,
                    responsable.lienParente,
                    responsable.telephone,
                ]);

                logger.debug(`✅ Relation créée: ${responsable.lienParente} -> ${responsable.enfantId}`);
            } catch (error: any) {
                logger.error(`❌ Erreur création relation: ${error.message}`);
            }
        }

        // Afficher le résumé
        logger.info('\n📋 ===== RÉSUMÉ DE LA MIGRATION =====');
        logger.info(`Total élèves traités: ${eleves.length}`);
        logger.info(`Total relations créées: ${responsablesToCreate.length}`);
        
        const created = migrations.filter(m => m.action === 'CREATE').length;
        const linked = migrations.filter(m => m.action === 'LINK').length;
        logger.info(`  - Parents créés: ${created}`);
        logger.info(`  - Parents liés (existants): ${linked}`);
        logger.info('========================================\n');

        logger.info('✅ Migration terminée avec succès!');
        logger.info('⚠️  IMPORTANT: Les comptes parent temporaires utilisent des emails @elisaschool.temp');
        logger.info('💡 Ces emails doivent être mis à jour manuellement par les administrateurs');

    } catch (error: any) {
        logger.error(`❌ Erreur pendant la migration: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
            logger.info('🔌 Connexion fermée');
        }
    }
}

/**
 * Trouve ou crée un utilisateur parent
 */
async function findOrCreateParent(
    userRepo: Repository<Utilisateur>,
    email: string,
    nom: string,
    description: string
): Promise<{ id: string; email: string; isNew: boolean } | null> {
    try {
        // Chercher un utilisateur existant avec cet email
        let user = await userRepo.findOne({
            where: { email },
        });

        if (user) {
            return { id: user.id, email: user.email, isNew: false };
        }

        // Créer un nouveau parent
        const matricule = `PARENT${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const motDePasseTemp = `Temp${Math.random().toString(36).substring(2, 10)}!`;

        user = userRepo.create({
            email,
            matricule,
            motDePasse: motDePasseTemp,
            role: Role.PARENT,
            statut: 'EN_ATTENTE_VALIDATION' as any,
            etablissementId: null,
        });

        await userRepo.save(user);

        logger.info(`👤 Parent créé: ${nom} (${email}) - Matricule: ${matricule}`);

        return { id: user.id, email: user.email, isNew: true };
    } catch (error: any) {
        logger.error(`❌ Erreur création parent ${nom}: ${error.message}`);
        return null;
    }
}

// Exécuter la migration
migrateParents().catch((error) => {
    console.error('Migration échouée:', error);
    process.exit(1);
});
