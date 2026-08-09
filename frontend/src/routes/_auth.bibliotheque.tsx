/**
 * ==================================
 * eLISAschool - Route Bibliothèque
 * ==================================
 * [FE-2] Ajout guard avantLoad — Rapport audit SaaS 2026-08-07
 */

import { createFileRoute } from '@tanstack/react-router';
import { BibliothequePage } from '@/features/bibliotheque';
import { requireModulePermission } from '@/app/permission-guards';

export const Route = createFileRoute('/_auth/bibliotheque')({
    beforeLoad: () => requireModulePermission('bibliotheque'),
    component: BibliothequePage,
});
