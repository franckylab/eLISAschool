import { AppDataSource } from '@database/data-source';
import { MembrePersonnel } from '@modules/personnel/entities/personnel.entity';
import { AffectationPoste, StatutAffectation, TypeMutation } from '@modules/personnel/entities/affectation-poste.entity';
import { MembreFonction } from '@modules/personnel/entities/membre-fonction.entity';
import { Poste } from '@modules/organisation/entities/poste.entity';
import { UniteOrganisationnelle } from '@modules/organisation/entities/unite-organisationnelle.entity';
import { Fonction } from '@modules/organisation/entities/fonction.entity';
import { logger } from '@common/utils/logger.util';

interface AffectationDemo {
    email: string;
    posteCode: string;
    fonctionCode?: string;
}

const AFFECTATIONS: AffectationDemo[] = [
    { email: 'enseignant@elisaschool.cm', posteCode: 'PROF-MATH1', fonctionCode: 'PROF-TIT' },
    { email: 'prof.certifie@elisaschool.cm', posteCode: 'PROF-FR1', fonctionCode: 'PROF-CERT' },
    { email: 'prof.agrege@elisaschool.cm', posteCode: 'PROF-FR1', fonctionCode: 'PROF-TIT' },
    { email: 'comptable@elisaschool.cm', posteCode: 'COMPTABLE', fonctionCode: 'COMPTABLE' },
    { email: 'secretaire@elisaschool.cm', posteCode: 'SECRETAIRE-DIR', fonctionCode: undefined },
    { email: 'surveillant@elisaschool.cm', posteCode: 'SURV1', fonctionCode: 'SURV' },
    { email: 'technicien.info@elisaschool.cm', posteCode: 'TECH-INFO', fonctionCode: 'TECH-INFO' },
    { email: 'rh@elisaschool.cm', posteCode: 'RESP-RH', fonctionCode: 'RESP-RH' },
    { email: 'gestionnaire.paie@elisaschool.cm', posteCode: 'AGENT-COMPTA', fonctionCode: 'AGENT-COMPTA' },
    { email: 'validateur.paie@elisaschool.cm', posteCode: 'PROVISEUR-ADJ', fonctionCode: 'PROVISEUR-ADJ' },
];

export async function seedOrganisationDemo(etablissementId: string): Promise<void> {
    logger.info('🏗️ Création des affectations et fonctions de démonstration...');

    const membreRepo = AppDataSource.getRepository(MembrePersonnel);
    const posteRepo = AppDataSource.getRepository(Poste);
    const affectationRepo = AppDataSource.getRepository(AffectationPoste);
    const fonctionRepo = AppDataSource.getRepository(Fonction);
    const membreFonctionRepo = AppDataSource.getRepository(MembreFonction);

    const postes = await posteRepo.find({ where: { uniteOrganisationnelle: { etablissementId } } });
    const postesByCode = new Map(postes.map((p) => [p.code, p]));

    const fonctions = await fonctionRepo.find({ where: { etablissementId } });
    const fonctionsByCode = new Map(fonctions.map((f) => [f.code, f]));

    const uniteRepo = AppDataSource.getRepository(UniteOrganisationnelle);
    let countAffectations = 0;
    let countFonctions = 0;

    for (const a of AFFECTATIONS) {
        const membre = await membreRepo.findOne({ where: { utilisateur: { email: a.email } } });
        if (!membre) {
            logger.warn(`  ⚠ Membre non trouvé: ${a.email}, skip`);
            continue;
        }

        const poste = postesByCode.get(a.posteCode);
        if (!poste) {
            logger.warn(`  ⚠ Poste non trouvé: ${a.posteCode}, skip`);
            continue;
        }

        // Affectation poste
        const existingAff = await affectationRepo.findOne({
            where: { membrePersonnelId: membre.id, posteId: poste.id, statut: StatutAffectation.ACTIF },
        });
        if (!existingAff) {
            await affectationRepo.save(affectationRepo.create({
                membrePersonnelId: membre.id,
                posteId: poste.id,
                uniteOrganisationnelleId: poste.uniteOrganisationnelleId,
                etablissementId,
                statut: StatutAffectation.ACTIF,
                typeMutation: TypeMutation.NOUVELLE,
                dateDebut: new Date('2024-09-01'),
            }));
            // Update occupant count
            await posteRepo.increment({ id: poste.id }, 'occupantsCount', 1);
            countAffectations++;
            logger.debug(`  ✓ ${a.email} → ${poste.intitule}`);
        }

        // MembreFonction
        if (a.fonctionCode) {
            const fonc = fonctionsByCode.get(a.fonctionCode);
            if (fonc) {
                const existingMf = await membreFonctionRepo.findOne({
                    where: { membrePersonnelId: membre.id, fonctionId: fonc.id, estPrincipale: true },
                });
                if (!existingMf) {
                    await membreFonctionRepo.save(membreFonctionRepo.create({
                        membrePersonnelId: membre.id,
                        fonctionId: fonc.id,
                        dateDebut: new Date('2024-09-01'),
                        estPrincipale: true,
                        etablissementId,
                    }));
                    countFonctions++;
                    logger.debug(`  ✓ ${a.email} → fonction ${fonc.nom}`);
                }
            }
        }
    }

    // Affecter les responsables d'unités
    const responsableMapping: Record<string, string> = {
        'COMPTABLE': 'comptable@elisaschool.cm',
        'RESP-RH': 'rh@elisaschool.cm',
        'PROVISEUR-ADJ': 'validateur.paie@elisaschool.cm',
    };

    const unites = await uniteRepo.find({ where: { etablissementId } });
    const postesMap = new Map(postes.map((p) => [p.code, p]));

    for (const [posteCode, email] of Object.entries(responsableMapping)) {
        const poste = postesMap.get(posteCode);
        if (!poste) continue;

        const membre = await membreRepo.findOne({ where: { utilisateur: { email } } });
        if (!membre) continue;

        const unite = unites.find(u => u.id === poste.uniteOrganisationnelleId);
        if (!unite) continue;

        await uniteRepo.update(unite.id, { responsableId: membre.id });
        logger.debug(`  ✓ ${unite.nom} → responsable ${email}`);
    }

    logger.info(`✅ ${countAffectations} affectations et ${countFonctions} fonctions créées pour la démo`);
}
