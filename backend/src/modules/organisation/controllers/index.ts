import { Router } from 'express';
import { unitesController } from './unites.controller';
import { hierarchieController } from './hierarchie.controller';
import { organigrammeController } from './organigramme.controller';
import { nomenclatureController } from './nomenclature.controller';
import { postesController } from './postes.controller';
import { fonctionsController } from './fonctions.controller';

const organisationController = Router();
organisationController.use('/', unitesController);
organisationController.use('/', hierarchieController);
organisationController.use('/', organigrammeController);
organisationController.use('/', nomenclatureController);
organisationController.use('/postes', postesController);
organisationController.use('/fonctions', fonctionsController);

export { organisationController };
export default organisationController;
