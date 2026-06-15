/**
 * ==================================
 * eLISAschool - Module Emploi du Temps
 * ==================================
 * Module de gestion de l'emploi du temps et des créneaux horaires
 */

export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

// Combiner les routers
import { Router } from 'express';
import { repartitionHoraireController } from './controllers/repartition-horaire.controller';
import { emploiDuTempsController } from './controllers/emploi-du-temps.controller';

const emploiDuTempsModuleController = Router();
emploiDuTempsModuleController.use('/repartitions', repartitionHoraireController);
emploiDuTempsModuleController.use('/plannings', emploiDuTempsController);

export { emploiDuTempsModuleController };
