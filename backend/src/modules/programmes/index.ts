/**
 * ==================================
 * eLISAschool - Module Programmes
 * ==================================
 * Module de gestion du programme pédagogique
 */

export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

// Combiner les routers
import { Router } from 'express';
import { programmeChapitreController } from './controllers/programme-chapitre.controller';
import { correlationController } from './controllers/correlation.controller';

const programmesController = Router();
programmesController.use('/chapitres', programmeChapitreController);
programmesController.use('/correlation', correlationController);

export { programmesController };
