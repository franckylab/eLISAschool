import { AppDataSource } from '@database/data-source';
import { Utilisateur } from '@modules/auth/entities';
import { MembrePersonnel, ContratPersonnel, StatutContrat } from '@modules/personnel/entities';
import { BulletinPaie, StatutBulletinPaie } from '@modules/paie/entities/bulletin-paie.entity';
import { ElementSalaire, TypeElementSalaire, CategorieElementSalaire } from '@modules/paie/entities/element-salaire.entity';
import { Cotisation, TypeCotisation } from '@modules/paie/entities/cotisation.entity';
import { TypePrime, TypePrimeCalcul } from '@modules/paie/entities/type-prime.entity';
import { logger } from '@common/utils/logger.util';

interface PaieConfig {
  email: string;
  mois: number;
  heuresEffectuees: number;
  montantHs: number;
  notes: string;
}

function buildPaieConfigs(): PaieConfig[] {
  const emails = [
    'enseignant@elisaschool.cm',
    'prof.agrege@elisaschool.cm',
    'comptable@elisaschool.cm',
    'secretaire@elisaschool.cm',
  ];
  const configs: PaieConfig[] = [];
  for (const email of emails) {
    configs.push({ email, mois: 4, heuresEffectuees: 120, montantHs: email.includes('enseignant') ? 20000 : 0, notes: `Bulletin avril ${ANNEE}` });
    configs.push({ email, mois: 5, heuresEffectuees: 110, montantHs: email.includes('enseignant') ? 15000 : 0, notes: `Bulletin mai ${ANNEE}` });
    configs.push({ email, mois: 6, heuresEffectuees: 130, montantHs: email.includes('enseignant') ? 25000 : 0, notes: `Bulletin juin ${ANNEE}` });
  }
  return configs;
}

const ANNEE = 2026;

export async function seedBulletinsPaieDemo(etablissementId: string): Promise<number> {
  const userRepo = AppDataSource.getRepository(Utilisateur);
  const membreRepo = AppDataSource.getRepository(MembrePersonnel);
  const contratRepo = AppDataSource.getRepository(ContratPersonnel);
  const bulletinRepo = AppDataSource.getRepository(BulletinPaie);
  const elementRepo = AppDataSource.getRepository(ElementSalaire);
  const cotisationRepo = AppDataSource.getRepository(Cotisation);
  const primeRepo = AppDataSource.getRepository(TypePrime);

  logger.info('💰 Création des bulletins de paie de démonstration...');

  const cotisations = await cotisationRepo.find({ where: { etablissementId, actif: true } });
  const primesFixes = (await primeRepo.find({ where: { etablissementId, actif: true } }))
    .filter((p) => p.typeCalcul === TypePrimeCalcul.FIXE);

  const configs = buildPaieConfigs();
  let count = 0;

  for (const config of configs) {
    const user = await userRepo.findOne({ where: { email: config.email } });
    if (!user) {
      logger.warn(`  ⚠ Utilisateur non trouvé: ${config.email}, skip`);
      continue;
    }

    const membre = await membreRepo.findOne({ where: { utilisateurId: user.id } });
    if (!membre) {
      logger.warn(`  ⚠ Membre du personnel non trouvé pour: ${config.email}, skip`);
      continue;
    }

    const contrat = await contratRepo.findOne({
      where: { membrePersonnelId: membre.id, statut: StatutContrat.ACTIF },
    });
    if (!contrat) {
      logger.warn(`  ⚠ Contrat actif non trouvé pour: ${config.email}, skip`);
      continue;
    }

    const existant = await bulletinRepo.findOne({
      where: { membrePersonnelId: membre.id, mois: config.mois, annee: ANNEE },
    });
    if (existant) {
      logger.debug(`  ⏭ Bulletin existant: ${config.email} ${config.mois}/${ANNEE}`);
      count++;
      continue;
    }

    const salaireBase = Number(contrat.salaireBase);
    const totalPrimes = primesFixes.reduce((sum, p) => sum + Number(p.valeur), 0);

    const cotisationsSalariales = cotisations.filter(
      (c) => c.type === TypeCotisation.SALARIALE || c.type === TypeCotisation.MIXTE,
    );
    const totalDeductions = cotisationsSalariales.reduce(
      (sum, c) => sum + salaireBase * (Number(c.tauxSalarial) / 100),
      0,
    );

    const salaireNet = salaireBase + totalPrimes + config.montantHs - totalDeductions;

    const bulletin = bulletinRepo.create({
      membrePersonnelId: membre.id,
      contratId: contrat.id,
      mois: config.mois,
      annee: ANNEE,
      salaireBase,
      heuresEffectuees: config.heuresEffectuees,
      montantHeuresSup: config.montantHs,
      primes: totalPrimes,
      deductions: totalDeductions,
      salaireNet,
      statut: StatutBulletinPaie.PAYE,
      datePaiement: new Date(ANNEE, config.mois, 5),
      notes: config.notes,
      etablissementId,
    });
    await bulletinRepo.save(bulletin);

    const elements: Partial<ElementSalaire>[] = [
      {
        bulletinPaieId: bulletin.id,
        type: TypeElementSalaire.GAIN,
        categorie: CategorieElementSalaire.SALAIRE_BASE,
        libelle: 'Salaire de Base',
        montant: salaireBase,
        baseCalcul: salaireBase,
        ordreAffichage: 1,
        etablissementId,
      },
    ];

    let ordre = 2;
    for (const prime of primesFixes) {
      elements.push({
        bulletinPaieId: bulletin.id,
        type: TypeElementSalaire.GAIN,
        categorie: CategorieElementSalaire.PRIME,
        libelle: prime.nom,
        montant: Number(prime.valeur),
        ordreAffichage: ordre++,
        etablissementId,
      });
    }

    if (config.montantHs > 0) {
      elements.push({
        bulletinPaieId: bulletin.id,
        type: TypeElementSalaire.GAIN,
        categorie: CategorieElementSalaire.HEURE_SUP,
        libelle: 'Heures Supplémentaires',
        montant: config.montantHs,
        ordreAffichage: ordre++,
        etablissementId,
      });
    }

    for (const c of cotisationsSalariales) {
      const taux = Number(c.tauxSalarial);
      const montant = salaireBase * (taux / 100);
      if (montant <= 0) continue;

      elements.push({
        bulletinPaieId: bulletin.id,
        type: TypeElementSalaire.RETENUE,
        categorie: CategorieElementSalaire.COTISATION,
        libelle: c.nom,
        montant,
        baseCalcul: salaireBase,
        taux,
        ordreAffichage: ordre++,
        etablissementId,
      });
    }

    await elementRepo.save(elementRepo.create(elements as ElementSalaire[]));
    count++;
  }

  logger.info(`✅ ${count} bulletins de paie créés`);
  return count;
}
