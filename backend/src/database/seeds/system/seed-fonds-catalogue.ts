import * as path from 'path';
import * as fs from 'fs';
import { AppDataSource } from '@database/data-source';
import { Fond, CategorieFond } from '@modules/apparence/entities/fond.entity';
import { logger } from '@common/utils/logger.util';

const FONDS_DIR = path.resolve(__dirname, '../../../../../public/fonds-catalogue');

const CATEGORIE_MAP: Record<string, CategorieFond> = {
  'instrument-mesure': CategorieFond.INSTRUMENT_MESURE,
  'instrument-calcul': CategorieFond.INSTRUMENT_CALCUL,
  'materiel-laboratoire': CategorieFond.MATERIEL_LABORATOIRE,
  'materiel-informatique': CategorieFond.MATERIEL_INFORMATIQUE,
  'materiel-electrique': CategorieFond.MATERIEL_ELECTRIQUE,
  'materiel-bureau': CategorieFond.MATERIEL_BUREAU,
  'materiel-batiment': CategorieFond.MATERIEL_BATIMENT,
  'objet-salle-classe': CategorieFond.OBJET_SALLE_CLASSE,
  'livres-documentation': CategorieFond.LIVRES_DOCUMENTATION,
  'sport-education-physique': CategorieFond.SPORT_EDUCATION_PHYSIQUE,
  'arts-creativite': CategorieFond.ARTS_CREATIVITE,
  'musique': CategorieFond.MUSIQUE,
};

const CATEGORIE_LABELS: Record<CategorieFond, { nom: string; description: string }> = {
  [CategorieFond.INSTRUMENT_MESURE]: { nom: 'Instruments de mesure', description: 'Règles, compas, rapporteurs, niveaux et instruments de mesure' },
  [CategorieFond.INSTRUMENT_CALCUL]: { nom: 'Instruments de calcul', description: 'Calculatrices, bouliers, abaques et formules mathématiques' },
  [CategorieFond.MATERIEL_LABORATOIRE]: { nom: 'Matériel de laboratoire', description: 'Verrerie, microscopes, balances et pipettes' },
  [CategorieFond.MATERIEL_INFORMATIQUE]: { nom: 'Matériel informatique', description: 'Ordinateurs, claviers, circuits et réseaux' },
  [CategorieFond.MATERIEL_ELECTRIQUE]: { nom: 'Matériel électrique', description: 'Schémas électriques, oscilloscopes et connecteurs' },
  [CategorieFond.MATERIEL_BUREAU]: { nom: 'Matériel de bureau', description: 'Stylos, agrafeuses, blocs-notes et accessoires' },
  [CategorieFond.MATERIEL_BATIMENT]: { nom: 'Matériel de bâtiment', description: 'Plans, outils de construction et échafaudages' },
  [CategorieFond.OBJET_SALLE_CLASSE]: { nom: 'Objets de salle de classe', description: 'Tableaux, mobilier scolaire et horloges' },
  [CategorieFond.LIVRES_DOCUMENTATION]: { nom: 'Livres et documentation', description: 'Bibliothèques, dictionnaires et manuels scolaires' },
  [CategorieFond.SPORT_EDUCATION_PHYSIQUE]: { nom: 'Sport et éducation physique', description: 'Ballons, chronomètres et équipements sportifs' },
  [CategorieFond.ARTS_CREATIVITE]: { nom: 'Arts et créativité', description: 'Palettes, pinceaux, ciseaux et formes créatives' },
  [CategorieFond.MUSIQUE]: { nom: 'Musique', description: 'Notes, instruments à cordes, piano et percussion' },
};

const FONDS_SEED: { categorie: CategorieFond; variation: string; nom: string; description: string }[] = [
  { categorie: CategorieFond.INSTRUMENT_MESURE, variation: '01', nom: 'Règles et équerres', description: 'Motif géométrique avec règles graduées et équerres en transparence' },
  { categorie: CategorieFond.INSTRUMENT_MESURE, variation: '02', nom: 'Compas et rapporteurs', description: 'Composition de compas, rapporteurs et pieds à coulisse stylisés' },
  { categorie: CategorieFond.INSTRUMENT_MESURE, variation: '03', nom: 'Niveaux et mètres', description: 'Patterns de niveaux à bulle, mètres pliants et rubans de mesure' },
  { categorie: CategorieFond.INSTRUMENT_CALCUL, variation: '01', nom: 'Calculatrices vintage', description: 'Grille de calculatrices scientifiques et graphiques rétro' },
  { categorie: CategorieFond.INSTRUMENT_CALCUL, variation: '02', nom: 'Bouliers et abaques', description: 'Motifs de bouliers asiatiques et abaques de calcul' },
  { categorie: CategorieFond.INSTRUMENT_CALCUL, variation: '03', nom: 'Formules mathématiques', description: 'Équations et symboles mathématiques en filigrane' },
  { categorie: CategorieFond.MATERIEL_LABORATOIRE, variation: '01', nom: 'Tubes à essai et béchers', description: 'Composition de verrerie de laboratoire stylisée' },
  { categorie: CategorieFond.MATERIEL_LABORATOIRE, variation: '02', nom: 'Microscopes et lentilles', description: 'Motifs géométriques inspirés de microscopes et systèmes optiques' },
  { categorie: CategorieFond.MATERIEL_LABORATOIRE, variation: '03', nom: 'Balance et pipettes', description: 'Patterns de balances de précision et pipettes graduées' },
  { categorie: CategorieFond.MATERIEL_INFORMATIQUE, variation: '01', nom: 'Circuits et processeurs', description: 'Motifs de circuits imprimés et puces électroniques' },
  { categorie: CategorieFond.MATERIEL_INFORMATIQUE, variation: '02', nom: 'Claviers et écrans', description: 'Composition de claviers, souris et moniteurs stylisés' },
  { categorie: CategorieFond.MATERIEL_INFORMATIQUE, variation: '03', nom: 'Réseaux et serveurs', description: 'Patterns de serveurs, routeurs et câbles réseau' },
  { categorie: CategorieFond.MATERIEL_ELECTRIQUE, variation: '01', nom: 'Schémas électriques', description: 'Motifs de schémas électriques et symboles de composants' },
  { categorie: CategorieFond.MATERIEL_ELECTRIQUE, variation: '02', nom: 'Oscilloscopes et multimètres', description: "Composition d'instruments de mesure électrique" },
  { categorie: CategorieFond.MATERIEL_ELECTRIQUE, variation: '03', nom: 'Fils et connecteurs', description: 'Patterns de câbles, connecteurs et borniers stylisés' },
  { categorie: CategorieFond.MATERIEL_BUREAU, variation: '01', nom: 'Stylos et crayons', description: 'Grille de stylos, crayons et marqueurs en diagonale' },
  { categorie: CategorieFond.MATERIEL_BUREAU, variation: '02', nom: 'Agrafeuses et ciseaux', description: "Motifs d'accessoires de bureau (agrafeuses, ciseaux, trombones)" },
  { categorie: CategorieFond.MATERIEL_BUREAU, variation: '03', nom: 'Blocs-notes et Post-it', description: 'Composition de blocs-notes, pense-bêtes et post-it colorés' },
  { categorie: CategorieFond.MATERIEL_BATIMENT, variation: '01', nom: "Plans d'architecte", description: "Motifs de plans de bâtiment avec cotes et annotations" },
  { categorie: CategorieFond.MATERIEL_BATIMENT, variation: '02', nom: 'Truelles et marteaux', description: "Composition d'outils de construction stylisés" },
  { categorie: CategorieFond.MATERIEL_BATIMENT, variation: '03', nom: 'Échelles et échafaudages', description: "Patterns géométriques inspirés d'échelles et structures" },
  { categorie: CategorieFond.OBJET_SALLE_CLASSE, variation: '01', nom: 'Tableau et craies', description: 'Motifs de tableaux noirs avec formules et dessins à la craie' },
  { categorie: CategorieFond.OBJET_SALLE_CLASSE, variation: '02', nom: 'Bureaux et chaises', description: 'Composition de mobilier scolaire en perspective isométrique' },
  { categorie: CategorieFond.OBJET_SALLE_CLASSE, variation: '03', nom: 'Horloge et planning', description: "Patterns d'horloges murales et plannings de classe" },
  { categorie: CategorieFond.LIVRES_DOCUMENTATION, variation: '01', nom: 'Bibliothèque de livres', description: 'Grille de livres empilés et ouverts en filigrane' },
  { categorie: CategorieFond.LIVRES_DOCUMENTATION, variation: '02', nom: 'Dictionnaires et encyclopédies', description: 'Motifs de dictionnaires, encyclopédies et atlas' },
  { categorie: CategorieFond.LIVRES_DOCUMENTATION, variation: '03', nom: 'Manuels scolaires', description: 'Composition de manuels scolaires avec marque-pages' },
  { categorie: CategorieFond.SPORT_EDUCATION_PHYSIQUE, variation: '01', nom: 'Ballons et sports', description: 'Motifs de ballons (foot, basket, volley) en pattern' },
  { categorie: CategorieFond.SPORT_EDUCATION_PHYSIQUE, variation: '011', nom: 'Ballons et sports II', description: 'Variante enrichie de motifs de ballons et équipements sportifs' },
  { categorie: CategorieFond.SPORT_EDUCATION_PHYSIQUE, variation: '02', nom: 'Chronomètres et sifflets', description: "Composition d'accessoires d'arbitrage et timing" },
  { categorie: CategorieFond.SPORT_EDUCATION_PHYSIQUE, variation: '03', nom: "Agrès et équipements", description: 'Patterns de barres, anneaux et matériel de gym' },
  { categorie: CategorieFond.ARTS_CREATIVITE, variation: '01', nom: 'Palettes et pinceaux', description: 'Grille de palettes de couleurs, pinceaux et pots de peinture' },
  { categorie: CategorieFond.ARTS_CREATIVITE, variation: '02', nom: 'Ciseaux et colle', description: "Motifs d'outils de découpage et collage artistique" },
  { categorie: CategorieFond.ARTS_CREATIVITE, variation: '03', nom: 'Formes géométriques créatives', description: 'Composition de formes, motifs et mandalas éducatifs' },
  { categorie: CategorieFond.MUSIQUE, variation: '01', nom: 'Notes de musique', description: 'Portées et notes de musique en filigrane élégant' },
  { categorie: CategorieFond.MUSIQUE, variation: '02', nom: 'Instruments à cordes', description: 'Motifs de guitares, violons et harpes stylisés' },
  { categorie: CategorieFond.MUSIQUE, variation: '03', nom: 'Piano et percussion', description: 'Composition de touches de piano et instruments de percussion' },
];

function hyphenToUnderscore(hyphenated: string): string {
  return hyphenated.replace(/-/g, '_');
}

export async function seedFondsCatalogue(): Promise<number> {
  const fondRepo = AppDataSource.getRepository(Fond);

  logger.info('🖼️ Seed du catalogue de fonds SVG...');

  const existants = await fondRepo.find({ select: ['cheminFichier', 'id'] });
  const cheminsExistants = new Set(existants.map((f) => f.cheminFichier));

  let crees = 0;
  let fichiersManquants = 0;

  if (!fs.existsSync(FONDS_DIR)) {
    logger.warn(`⚠ Répertoire des fonds introuvable: ${FONDS_DIR}`);
    return 0;
  }

  for (const seed of FONDS_SEED) {
    const categorieSlug = seed.categorie.replace(/_/g, '-');
    const nomFichier = `${categorieSlug}-${seed.variation}.svg`;
    const cheminFichier = `fonds-catalogue/${nomFichier}`;
    const cheminComplet = path.join(FONDS_DIR, nomFichier);

    if (!fs.existsSync(cheminComplet)) {
      logger.warn(`⚠ Fichier SVG manquant: ${cheminComplet}`);
      fichiersManquants++;
      continue;
    }

    const stats = fs.statSync(cheminComplet);
    const url = `/fonds-catalogue/${nomFichier}`;

    if (cheminsExistants.has(cheminFichier)) {
      await fondRepo.update(
        { cheminFichier },
        {
          nom: seed.nom,
          description: seed.description,
          categorie: seed.categorie,
          url,
          estActif: true,
          estSysteme: true,
          tailleFichier: stats.size,
        },
      );
    } else {
      const entity = fondRepo.create({
        nom: seed.nom,
        description: seed.description,
        categorie: seed.categorie,
        cheminFichier,
        url,
        source: 'catalogue',
        estActif: true,
        estSysteme: true,
        tailleFichier: stats.size,
      });
      await fondRepo.save(entity);
      cheminsExistants.add(cheminFichier);
      crees++;
    }
  }

  logger.info(`🖼️ Catalogue: ${crees} créés, ${FONDS_SEED.length - crees - fichiersManquants} déjà existants, ${fichiersManquants} fichiers manquants`);
  return crees;
}
