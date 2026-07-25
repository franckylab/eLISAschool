import { AppDataSource } from '@database/data-source';
import { Utilisateur } from '@modules/auth/entities';
import { MembrePersonnel, StatutPersonnel } from '@modules/personnel/entities';
import { ContratPersonnel, StatutContrat } from '@modules/personnel/entities';
import { ModeRemunerationEntity } from '@modules/organisation/entities';
import { logger } from '@common/utils/logger.util';

interface StaffTemplate {
  email: string;
  matricule: string;
  posteExact: string;
  service: string;
  dateEmbauche: Date;
  salaireBase: number;
  tarifHoraire?: number;
  modeRemunerationCode: string;
  typeContrat: string;
  anneesExperience: number;
  educationNiveau: string;
  specialitePrincipale?: string;
}

const STAFF_MEMBERS: StaffTemplate[] = [
  {
    email: 'enseignant@elisaschool.cm',
    matricule: 'ENS-001',
    posteExact: 'Professeur de Mathématiques',
    service: 'Second Cycle Scientifique',
    dateEmbauche: new Date('2020-09-01'),
    salaireBase: 350000,
    tarifHoraire: 5000,
    modeRemunerationCode: 'MIXTE',
    typeContrat: 'CDI',
    anneesExperience: 8,
    educationNiveau: 'MASTER',
    specialitePrincipale: 'Mathématiques',
  },
  {
    email: 'prof.certifie@elisaschool.cm',
    matricule: 'PCERT-001',
    posteExact: 'Professeur Certifié de Français',
    service: 'Premier Cycle Littéraire',
    dateEmbauche: new Date('2019-10-15'),
    salaireBase: 280000,
    tarifHoraire: 4000,
    modeRemunerationCode: 'MIXTE',
    typeContrat: 'CDI',
    anneesExperience: 12,
    educationNiveau: 'MASTER',
    specialitePrincipale: 'Français',
  },
  {
    email: 'prof.agrege@elisaschool.cm',
    matricule: 'PAGREG-001',
    posteExact: 'Professeur Agrégé de Physique-Chimie',
    service: 'Second Cycle Scientifique',
    dateEmbauche: new Date('2021-01-05'),
    salaireBase: 500000,
    tarifHoraire: 7000,
    modeRemunerationCode: 'MIXTE',
    typeContrat: 'CDI',
    anneesExperience: 15,
    educationNiveau: 'DOCTORAT',
    specialitePrincipale: 'Physique-Chimie',
  },
  {
    email: 'comptable@elisaschool.cm',
    matricule: 'COMPT-001',
    posteExact: 'Comptable en Chef',
    service: 'Finances',
    dateEmbauche: new Date('2022-03-01'),
    salaireBase: 400000,
    modeRemunerationCode: 'MENSUEL',
    typeContrat: 'CDI',
    anneesExperience: 10,
    educationNiveau: 'MASTER',
  },
  {
    email: 'secretaire@elisaschool.cm',
    matricule: 'SECRET-001',
    posteExact: 'Secrétaire de Direction',
    service: 'Administration',
    dateEmbauche: new Date('2023-06-01'),
    salaireBase: 200000,
    modeRemunerationCode: 'MENSUEL',
    typeContrat: 'CDD',
    anneesExperience: 5,
    educationNiveau: 'LICENCE',
  },
  {
    email: 'surveillant@elisaschool.cm',
    matricule: 'SURV-001',
    posteExact: 'Surveillant Principal',
    service: 'Surveillance',
    dateEmbauche: new Date('2022-09-15'),
    salaireBase: 150000,
    modeRemunerationCode: 'MENSUEL',
    typeContrat: 'CDI',
    anneesExperience: 3,
    educationNiveau: 'LICENCE',
  },
  {
    email: 'technicien.info@elisaschool.cm',
    matricule: 'TECHINFO-001',
    posteExact: 'Technicien Informatique',
    service: 'Support Technique',
    dateEmbauche: new Date('2023-01-10'),
    salaireBase: 250000,
    modeRemunerationCode: 'MENSUEL',
    typeContrat: 'CDI',
    anneesExperience: 6,
    educationNiveau: 'LICENCE',
  },
  {
    email: 'rh@elisaschool.cm',
    matricule: 'RH-001',
    posteExact: 'Responsable des Ressources Humaines',
    service: 'Administration',
    dateEmbauche: new Date('2021-09-01'),
    salaireBase: 350000,
    modeRemunerationCode: 'MENSUEL',
    typeContrat: 'CDI',
    anneesExperience: 8,
    educationNiveau: 'MASTER',
  },
  {
    email: 'gestionnaire.paie@elisaschool.cm',
    matricule: 'GESTPAIE-001',
    posteExact: 'Gestionnaire de Paie',
    service: 'Administration',
    dateEmbauche: new Date('2022-01-15'),
    salaireBase: 300000,
    modeRemunerationCode: 'MENSUEL',
    typeContrat: 'CDI',
    anneesExperience: 5,
    educationNiveau: 'MASTER',
  },
  {
    email: 'validateur.paie@elisaschool.cm',
    matricule: 'VALIDPAIE-001',
    posteExact: 'Validateur Paie',
    service: 'Direction Financière',
    dateEmbauche: new Date('2020-03-01'),
    salaireBase: 450000,
    modeRemunerationCode: 'MENSUEL',
    typeContrat: 'CDI',
    anneesExperience: 12,
    educationNiveau: 'MASTER',
  },
];

export async function seedPersonnelDemo(etablissementId: string): Promise<number> {
  const userRepo = AppDataSource.getRepository(Utilisateur);
  const membreRepo = AppDataSource.getRepository(MembrePersonnel);
  const contratRepo = AppDataSource.getRepository(ContratPersonnel);
  const modeRemunRepo = AppDataSource.getRepository(ModeRemunerationEntity);

  // Charger les modes de rémunération pour résoudre les FK
  const modesRemun = await modeRemunRepo.find();
  const modeRemunMap = new Map<string, string>();
  for (const m of modesRemun) {
    modeRemunMap.set(m.code, m.id);
  }

  logger.info('👔 Création des membres du personnel de démonstration...');
  let count = 0;

  for (const staff of STAFF_MEMBERS) {
    const user = await userRepo.findOne({ where: { email: staff.email } });
    if (!user) {
      logger.warn(`  ⚠ Utilisateur non trouvé: ${staff.email}, skip`);
      continue;
    }

    let membre = await membreRepo.findOne({ where: { utilisateurId: user.id } });
    if (membre) {
      logger.debug(`  ⏭ Membre déjà existant: ${staff.email}`);
      // Still create contrat if missing
    } else {
      membre = membreRepo.create({
        utilisateurId: user.id,
        matricule: staff.matricule,
        posteExact: staff.posteExact,
        service: staff.service,
        dateEmbauche: staff.dateEmbauche,
        statut: StatutPersonnel.ACTIF,
        anneesExperience: staff.anneesExperience,
        educationNiveau: staff.educationNiveau,
        specialitePrincipale: staff.specialitePrincipale,
        competences: [],
        etablissementId,
      });
      await membreRepo.save(membre);
      logger.debug(`  ✓ Membre créé: ${staff.email}`);
    }

    const contratExistant = await contratRepo.findOne({
      where: { membrePersonnelId: membre.id, statut: StatutContrat.ACTIF },
    });
    if (!contratExistant) {
      const modeRemunerationId = modeRemunMap.get(staff.modeRemunerationCode) || null;
      const contrat = contratRepo.create({
        membrePersonnelId: membre.id,
        typeContrat: staff.typeContrat,
        dateDebut: staff.dateEmbauche,
        salaireBase: staff.salaireBase,
        tarifHoraire: staff.tarifHoraire,
        modeRemunerationId,
        statut: StatutContrat.ACTIF,
        etablissementId,
      });
      await contratRepo.save(contrat);
      logger.debug(`  ✓ Contrat créé pour ${staff.email} (base: ${staff.salaireBase} FCFA)`);
    }
    count++;
  }

  logger.info(`✅ ${count} membres du personnel traités`);
  return count;
}
