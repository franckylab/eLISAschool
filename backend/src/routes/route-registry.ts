import { Application, Router, RequestHandler } from 'express';
import { authMiddleware } from '@modules/auth/middlewares';
import { filterByEtablissement } from '@modules/auth/middlewares/etablissement.middleware';
import { requireModuleActive } from '@modules/configuration/middlewares/module-active.middleware';
import { ModuleName } from '@shared/enums/modules.enum';

export interface ModuleRoute {
  path: string;
  module?: ModuleName;
  router: Router;
  auth?: boolean;
  requireModule?: boolean;
  filterByEtablissement?: boolean;
  rateLimit?: RequestHandler;
}

const MODULES_CRITIQUES: ModuleName[] = [
  ModuleName.AUTH,
  ModuleName.UTILISATEURS,
  ModuleName.CONFIGURATION,
  ModuleName.NOTIFICATIONS,
  ModuleName.ORGANISATION,
];

function shouldSkipModuleCheck(module?: ModuleName): boolean {
  return !module || MODULES_CRITIQUES.includes(module);
}

export function registerModuleRoutes(app: Application, routes: ModuleRoute[]): void {
  const processed = new Set<string>();

  for (const route of routes) {
    if (processed.has(route.path)) {
      continue;
    }
    processed.add(route.path);

    const middlewares: RequestHandler[] = [];

    if (route.rateLimit) {
      middlewares.push(route.rateLimit);
    }

    if (route.auth !== false) {
      middlewares.push(authMiddleware);
    }

    if (route.requireModule !== false && route.module && !shouldSkipModuleCheck(route.module)) {
      middlewares.push(requireModuleActive(route.module));
    }

    if (route.filterByEtablissement !== false) {
      middlewares.push(filterByEtablissement());
    }

    middlewares.push(route.router);

    app.use(route.path, ...middlewares);
  }
}

export default { registerModuleRoutes };
