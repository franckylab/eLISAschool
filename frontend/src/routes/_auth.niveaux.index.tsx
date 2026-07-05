/**
 * ==================================
 * eLISAschool - Route Index Niveaux
 * ==================================
 * Affiche la liste des niveaux par défaut sur /niveaux
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { NiveauxPage } from '@/features/niveaux/components/niveaux-page';

export const Route = createFileRoute('/_auth/niveaux/')({
    beforeLoad: () => requireModulePermission('niveaux'),
    component: NiveauxPage,
});
