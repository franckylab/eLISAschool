import { createFileRoute } from '@tanstack/react-router';
import { OrganisationPage } from '@/features/organisation/components/organisation-page';

export const Route = createFileRoute('/_auth/organisation/')({
    component: OrganisationPage,
});
