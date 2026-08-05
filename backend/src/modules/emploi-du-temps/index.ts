export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

import { Router } from 'express';
import { emploiDuTempsController } from './controllers/emploi-du-temps.controller';
import { joursFeriesController } from './controllers/jours-feries.controller';

const emploiDuTempsModuleController = Router();
// Sous-routers AVANT les routes dynamiques (/:id) pour éviter les conflits de matching
emploiDuTempsModuleController.use('/jours-feries', joursFeriesController);
emploiDuTempsModuleController.use('/', emploiDuTempsController);

export { emploiDuTempsModuleController };
