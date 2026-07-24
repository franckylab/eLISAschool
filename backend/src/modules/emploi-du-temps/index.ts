export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

import { Router } from 'express';
import { emploiDuTempsController } from './controllers/emploi-du-temps.controller';

const emploiDuTempsModuleController = Router();
emploiDuTempsModuleController.use('/', emploiDuTempsController);

export { emploiDuTempsModuleController };
