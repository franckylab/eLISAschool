/**
 * ==================================
 * eLISAschool - Module Options
 * ==================================
 * Module de gestion des matières optionnelles pour les élèves
 */

export * from './entities';
export * from './dto';
export * from './services';
export * from './controllers';

// Combiner les routers
import { Router } from 'express';
import { inscriptionOptionController } from './controllers/inscription-option.controller';

const optionsController = Router();
optionsController.use('/inscriptions', inscriptionOptionController);

export { optionsController };
