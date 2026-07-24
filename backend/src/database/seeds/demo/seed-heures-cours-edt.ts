/**
 * ==================================
 * eLISAschool - Seed HeuresCours & EDT
 * ==================================
 * Version: 1.0.0
 *
 * Crée des données de démonstration pour l'emploi du temps
 * et les heures de cours d'un enseignant.
 */

import { AppDataSource } from '@database/data-source';
import { MembrePersonnel, StatutPersonnel, TypePersonnel, ContratPersonnel, StatutContrat, HeureCours, StatutEffectue } from '@modules/personnel/entities';
import { ModeRemunerationEntity } from '@modules/organisation/entities';
import { CreneauHoraire, JourSemaine, TypeCreneau, StatutCreneau } from '@modules/emploi-du-temps/entities';
import { AffectationMatiere } from '@modules/matieres/entities';
import { Classe, ClasseAnnee } from '@modules/classes/entities';
import { Matiere } from '@modules/matieres/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Utilisateur } from '@modules/auth/entities';
import { StatutAnneeScolaire } from '@modules/annees-scolaires/entities';
import { logger } from '@common/utils/logger.util';

const SLOTS_DEF: { jour: JourSemaine; heureDebut: string; heureFin: string }[] = [
    { jour: JourSemaine.LUNDI, heureDebut: '08:00', heureFin: '10:00' },
    { jour: JourSemaine.LUNDI, heureDebut: '10:15', heureFin: '12:00' },
    { jour: JourSemaine.MARDI, heureDebut: '08:00', heureFin: '10:00' },
    { jour: JourSemaine.MARDI, heureDebut: '14:00', heureFin: '16:00' },
    { jour: JourSemaine.MERCREDI, heureDebut: '09:00', heureFin: '11:00' },
    { jour: JourSemaine.JEUDI, heureDebut: '08:00', heureFin: '10:00' },
    { jour: JourSemaine.JEUDI, heureDebut: '10:15', heureFin: '12:00' },
    { jour: JourSemaine.VENDREDI, heureDebut: '08:00', heureFin: '10:00' },
];

export async function seedHeuresCoursEtEdt(etablissementId: string): Promise<void> {
    logger.info('📚 Seed HeuresCours & EDT...');

    const userRepo = AppDataSource.getRepository(Utilisateur);
    const membreRepo = AppDataSource.getRepository(MembrePersonnel);
    const contratRepo = AppDataSource.getRepository(ContratPersonnel);
    const classeRepo = AppDataSource.getRepository(Classe);
    const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
    const matiereRepo = AppDataSource.getRepository(Matiere);
    const anneeRepo = AppDataSource.getRepository(AnneeScolaire);
    const typePersonnelRepo = AppDataSource.getRepository(TypePersonnel);
    const edtRepo = AppDataSource.getRepository(CreneauHoraire);
    const affectationRepo = AppDataSource.getRepository(AffectationMatiere);
    const hcRepo = AppDataSource.getRepository(HeureCours);

    // 1. Trouver ou créer l'enseignant
    const enseignantUser = await userRepo.findOne({ where: { email: 'enseignant@elisaschool.cm' } });
    if (!enseignantUser) {
        logger.warn('⚠ Utilisateur enseignant non trouvé, skip HeureCours seed');
        return;
    }

    let enseignant = await membreRepo.findOne({ where: { utilisateurId: enseignantUser.id } });
    if (!enseignant) {
        const typeEns = await typePersonnelRepo.findOne({ where: { code: 'ENSEIGNANT' } });
        enseignant = new MembrePersonnel();
        Object.assign(enseignant, {
            utilisateurId: enseignantUser.id,
            matricule: 'ENS-001',
            typePersonnelId: typeEns?.id,
            statut: StatutPersonnel.ACTIF,
            dateEmbauche: new Date('2023-09-01'),
            etablissementId,
        });
        await membreRepo.save(enseignant);
        logger.info(`✅ Enseignant créé: ${enseignant.id}`);
    } else {
        logger.info(`✅ Enseignant déjà existant: ${enseignant.id}`);
    }

    // 2. Créer un contrat avec tarifHoraire
    let contrat = await contratRepo.findOne({
        where: { membrePersonnelId: enseignant.id, statut: StatutContrat.ACTIF },
    });
    if (!contrat) {
        // Résoudre le mode de rémunération HORAIRE
        const modeRemunRepo = AppDataSource.getRepository(ModeRemunerationEntity);
        const modeHoraire = await modeRemunRepo.findOne({ where: { code: 'HORAIRE' } });
        contrat = contratRepo.create({
            membrePersonnelId: enseignant.id,
            typeContrat: 'CDI',
            dateDebut: new Date('2023-09-01'),
            salaireBase: 250000,
            tarifHoraire: 5000,
            modeRemunerationId: modeHoraire?.id || null,
            statut: StatutContrat.ACTIF,
            etablissementId,
        });
        await contratRepo.save(contrat);
        logger.info(`✅ Contrat créé: ${contrat.id} (tarif: ${contrat.tarifHoraire} F/h)`);
    }

    // 3. Trouver les classes et matières
    const anneeActive = await anneeRepo.findOne({
        where: { etablissementId, statut: StatutAnneeScolaire.EN_COURS },
        order: { dateDebut: 'DESC' },
    });
    if (!anneeActive) {
        logger.warn('⚠ Aucune année scolaire active, skip');
        return;
    }

    const classesAnnee = await classeAnneeRepo.find({
        where: { anneeScolaireId: anneeActive.id, etablissementId },
        relations: ['classe'],
        take: 3,
    });
    if (classesAnnee.length === 0) {
        logger.warn('⚠ Aucune classe trouvée, skip');
        return;
    }

    const matieres = await matiereRepo.find({ where: { etablissementId }, take: 3 });
    if (matieres.length === 0) {
        logger.warn('⚠ Aucune matière trouvée, skip');
        return;
    }

    // 4. Créer les affectations + créneaux
    let edtCount = 0;
    const semaine = getLundi(new Date());
    for (let i = 0; i < SLOTS_DEF.length; i++) {
        const slot = SLOTS_DEF[i];
        const classeAnnee = classesAnnee[i % classesAnnee.length];
        const matiere = matieres[i % matieres.length];

        // Créer ou trouver l'affectation
        let affectation = await affectationRepo.findOne({
            where: {
                matiereId: matiere.id,
                classeAnneeId: classeAnnee.id,
                enseignantId: enseignant.id,
                etablissementId,
            },
        });
        if (!affectation) {
            const a = new AffectationMatiere();
            a.matiereId = matiere.id;
            a.classeAnneeId = classeAnnee.id;
            a.enseignantId = enseignant.id;
            a.etablissementId = etablissementId;
            a.obligatoire = true;
            a.statutValidation = 'VALIDE' as any;
            a.statut = 'ACTIVE' as any;
            a.dateDebut = new Date();
            await affectationRepo.save(a);
            affectation = a;
        }

        const existant = await edtRepo.findOne({
            where: {
                affectationMatiereId: affectation.id,
                jour: slot.jour,
                heureDebut: slot.heureDebut,
                etablissementId,
            },
        });
        if (existant) continue;

        const edt = edtRepo.create({
            affectationMatiereId: affectation.id,
            jour: slot.jour,
            heureDebut: slot.heureDebut,
            heureFin: slot.heureFin,
            typeCreneau: TypeCreneau.COURS,
            statut: StatutCreneau.PLANIFIE,
            anneeScolaireId: anneeActive.id,
            periodeId: anneeActive.id,
            etablissementId,
            genereAutomatiquement: true,
        });
        await edtRepo.save(edt);
        edtCount++;
    }
    logger.info(`✅ ${edtCount} créneaux EDT créés`);

    // 5. Créer des HeureCours pour la semaine courante
    let hcCount = 0;
    for (const slot of SLOTS_DEF) {
        const classeAnnee = classesAnnee[hcCount % classesAnnee.length];
        const matiere = matieres[hcCount % matieres.length];
        const date = new Date(semaine);
        const dayIndex = [6, 0, 1, 2, 3, 4, 5].indexOf(
            ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].indexOf(slot.jour) + 1
        );
        date.setDate(semaine.getDate() + dayIndex);
        if (date > new Date()) continue;

        const existant = await hcRepo.findOne({
            where: {
                enseignantId: enseignant.id,
                date: date as any,
                heureDebut: slot.heureDebut,
                etablissementId,
            },
        });
        if (existant) continue;

        const hc = hcRepo.create({
            enseignantId: enseignant.id,
            classeAnneeId: classeAnnee.id,
            matiereId: matiere.id,
            date,
            heureDebut: slot.heureDebut,
            heureFin: slot.heureFin,
            statutEffectue: StatutEffectue.EFFECTUE,
            etablissementId,
        });
        await hcRepo.save(hc);
        hcCount++;
    }
    logger.info(`✅ ${hcCount} HeureCours créés pour la semaine en cours`);

    logger.info('📚 Seed HeuresCours & EDT terminé');
}

function getLundi(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
