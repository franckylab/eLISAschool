import { Router } from 'express';
import { orgController } from './organisation.controller';
import { unitesController } from './unites.controller';
import { postesController } from './postes.controller';
import { hierarchieController } from './hierarchie.controller';
import { organigrammeController } from './organigramme.controller';
import { configController } from './configuration.controller';
import { nomenclatureController } from './nomenclature.controller';

const organisationController = Router();
organisationController.use('/', orgController);
organisationController.use('/', unitesController);
organisationController.use('/', postesController);
organisationController.use('/', hierarchieController);
organisationController.use('/', organigrammeController);
organisationController.use('/', configController);
organisationController.use('/', nomenclatureController);

export { organisationController };
export default organisationController;
