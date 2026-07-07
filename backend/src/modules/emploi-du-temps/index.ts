export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

import { Router } from 'express';
import { repartitionHoraireController } from './controllers/repartition-horaire.controller';
import { emploiDuTempsController } from './controllers/emploi-du-temps.controller';

const emploiDuTempsModuleController = Router();
emploiDuTempsModuleController.use('/repartitions', repartitionHoraireController);
emploiDuTempsModuleController.use('/', emploiDuTempsController);

export { emploiDuTempsModuleController };
