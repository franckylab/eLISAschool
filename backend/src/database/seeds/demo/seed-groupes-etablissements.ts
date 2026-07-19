import { AppDataSource } from '../../data-source';
import { GroupeEtablissement } from '@modules/groupes-etablissements/entities/groupe-etablissement.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities/groupe-etablissement-lien.entity';
import { GroupeAdmin } from '@modules/groupes-etablissements/entities/groupe-admin.entity';
import { ParametreSysteme, TypeValeurParametre, CategorieParametre } from '@modules/configuration/entities/parametre-systeme.entity';
import { Etablissement } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';

export async function seedGroupesEtablissements(
    etablissementPrincipalId: string,
    superAdminId: string,
): Promise<void> {
    logger.info('[Seed] Début seed module groupes d\'établissements...');

    const groupeRepo = AppDataSource.getRepository(GroupeEtablissement);
    const lienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
    const adminRepo = AppDataSource.getRepository(GroupeAdmin);
    const paramRepo = AppDataSource.getRepository(ParametreSysteme);
    const etabRepo = AppDataSource.getRepository(Etablissement);

    const existingParam = await paramRepo.findOne({
        where: { cle: 'groupes-etablissements.actif' },
    });

    if (!existingParam) {
        await paramRepo.save(paramRepo.create({
            cle: 'groupes-etablissements.actif',
            valeur: 'true',
            typeValeur: TypeValeurParametre.BOOLEAN,
            module: 'groupes-etablissements',
            description: 'Activer le module groupes d\'établissements',
            categorie: CategorieParametre.MODULE,
            visible: true,
            modifiableRuntime: true,
        }));
        logger.info('[Seed] ✅ Paramètre groupes-etablissements.actif créé');
    }

    const groupeExistant = await groupeRepo.findOne({
        where: { code: 'GROUPE_DEMO' },
    });

    if (groupeExistant) {
        logger.info('[Seed] Groupe de démonstration déjà existant, skip...');
        return;
    }

    const groupe = groupeRepo.create({
        nom: 'Groupe Démonstration',
        description: 'Groupe de démonstration pour tester la consolidation multi-établissements',
        proprietaireId: superAdminId,
        code: 'GROUPE_DEMO',
        actif: true,
    });

    const savedGroupe = await groupeRepo.save(groupe);
    logger.info(`[Seed] ✅ Groupe de démonstration créé: ${savedGroupe.id}`);

    await lienRepo.save(lienRepo.create({
        groupeId: savedGroupe.id,
        etablissementId: etablissementPrincipalId,
        ajoutePar: superAdminId,
    }));
    logger.info('[Seed] ✅ Établissement principal ajouté au groupe');

    await adminRepo.save(adminRepo.create({
        groupeId: savedGroupe.id,
        utilisateurId: superAdminId,
        assignePar: superAdminId,
    }));
    logger.info('[Seed] ✅ Super admin ajouté comme administrateur du groupe');

    const allEtablissements = await etabRepo.find({
        order: { createdAt: 'ASC' },
        take: 2,
    });

    if (allEtablissements.length >= 2) {
        const secondEtablissement = allEtablissements[1];

        const groupe2 = groupeRepo.create({
            nom: 'Groupe Multi-Établissements',
            description: 'Groupe test pour la consolidation de plusieurs établissements',
            proprietaireId: superAdminId,
            code: 'GROUPE_MULTI',
            actif: true,
        });

        const savedGroupe2 = await groupeRepo.save(groupe2);
        logger.info(`[Seed] ✅ Second groupe créé: ${savedGroupe2.id}`);

        for (const etablissement of allEtablissements) {
            await lienRepo.save(lienRepo.create({
                groupeId: savedGroupe2.id,
                etablissementId: etablissement.id,
                ajoutePar: superAdminId,
            }));
        }
        logger.info('[Seed] ✅ 2 établissements ajoutés au second groupe');

        await adminRepo.save(adminRepo.create({
            groupeId: savedGroupe2.id,
            utilisateurId: superAdminId,
            assignePar: superAdminId,
        }));
    }

    logger.info('[Seed] ✅ Seed module groupes d\'établissements terminé avec succès');
}
