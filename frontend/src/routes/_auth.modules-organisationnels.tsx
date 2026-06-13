/**
 * ==================================
 * eLISAschool - Routes Modules Organisationnels
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { AnnoncesPage } from '@/features/annonces';
import { OrganisationPage } from '@/features/organisation';
import { FinancesPage } from '@/features/finances';

const route = createFileRoute('/_auth/modules-organisationnels');

function ModulesOrganisationnels() {
    return null;
}

export const Route = route({
    component: ModulesOrganisationnels,
});

// Route Annonces
const annoncesRoute = createFileRoute('/_auth/modules-organisationnels/annonces');

export const AnnoncesRoute = annoncesRoute({
    component: () => <AnnoncesPage />,
});

// Route Organisation
const organisationRoute = createFileRoute('/_auth/modules-organisationnels/organisation');

export const OrganisationRoute = organisationRoute({
    component: () => <OrganisationPage />,
});

// Route Finances
const financesRoute = createFileRoute('/_auth/modules-organisationnels/finances');

export const FinancesRoute = financesRoute({
    component: () => <FinancesPage />,
});
