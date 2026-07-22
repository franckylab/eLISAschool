/**
 * ==================================
 * eLISAschool - Routes Modules Organisationnels
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { AnnoncesPage } from '@/features/annonces';
import { OrganigrammePage } from '@/features/organisation/components/organigramme/OrganigrammePage';
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
    component: () => <OrganigrammePage />,
});

// Route Finances
const financesRoute = createFileRoute('/_auth/modules-organisationnels/finances');

export const FinancesRoute = financesRoute({
    component: () => <FinancesPage />,
});
