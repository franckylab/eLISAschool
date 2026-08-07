export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

import { Router } from 'express';
import { emploiDuTempsController } from './controllers/emploi-du-temps.controller';
import { joursFeriesController } from './controllers/jours-feries.controller';
import { heureCoursController } from './controllers/heure-cours.controller';
import { remplacementHeureCoursController } from './controllers/remplacement-heure-cours.controller';

const emploiDuTempsModuleController = Router();
// Sous-routes AVANT les routes dynamiques (/:id) pour éviter les conflits de matching
emploiDuTempsModuleController.use('/jours-feries', joursFeriesController);
emploiDuTempsModuleController.use('/heures-cours/remplacements', remplacementHeureCoursController);
emploiDuTempsModuleController.use('/heures-cours', heureCoursController);
emploiDuTempsModuleController.use('/', emploiDuTempsController);

export { emploiDuTempsModuleController };
