/**
 * ==================================
 * eLISAschool - Routes Modules Complémentaires
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { EvenementsPage } from '@/features/evenements';
import { DocumentsPage } from '@/features/documents';
import { SondagesPage } from '@/features/sondages';

const route = createFileRoute('/_auth/modules-complementaires');

function ModulesComplementaires() {
    return null;
}

export const Route = route({
    component: ModulesComplementaires,
});

// Route Événements
const evenementsRoute = createFileRoute('/_auth/modules-complementaires/evenements');

export const EvenementsRoute = evenementsRoute({
    component: () => <EvenementsPage />,
});

// Route Documents
const documentsRoute = createFileRoute('/_auth/modules-complementaires/documents');

export const DocumentsRoute = documentsRoute({
    component: () => <DocumentsPage />,
});

// Route Sondages
const sondagesRoute = createFileRoute('/_auth/modules-complementaires/sondages');

export const SondagesRoute = sondagesRoute({
    component: () => <SondagesPage />,
});
