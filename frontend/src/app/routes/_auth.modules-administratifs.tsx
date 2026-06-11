/**
 * ==================================
 * eLISAschool - Routes Modules Administratifs
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { CourriersPage } from '@/features/courriers';
import { ArchivesPage } from '@/features/archives';
import { InventairePage } from '@/features/inventaire';

const route = createFileRoute('/_auth/modules-administratifs');

function ModulesAdministratifs() {
    return null;
}

export const Route = route({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN']),
    component: ModulesAdministratifs,
});

// Route Courriers
const courriersRoute = createFileRoute('/_auth/modules-administratifs/courriers');

export const CourriersRoute = courriersRoute({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN']),
    component: () => <CourriersPage />,
});

// Route Archives
const archivesRoute = createFileRoute('/_auth/modules-administratifs/archives');

export const ArchivesRoute = archivesRoute({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN']),
    component: () => <ArchivesPage />,
});

// Route Inventaire
const inventaireRoute = createFileRoute('/_auth/modules-administratifs/inventaire');

export const InventaireRoute = inventaireRoute({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN']),
    component: () => <InventairePage />,
});
