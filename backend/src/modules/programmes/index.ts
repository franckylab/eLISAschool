export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

import { Router } from 'express';
import { programmeChapitreController } from './controllers/programme-chapitre.controller';
import { correlationController } from './controllers/correlation.controller';
import { programmePedagogiqueController } from './controllers/programme-pedagogique.controller';

const programmesController = Router();
programmesController.use('/chapitres', programmeChapitreController);
programmesController.use('/correlation', correlationController);
programmesController.use('/', programmePedagogiqueController);

export { programmesController };
