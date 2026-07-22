import { createFileRoute } from '@tanstack/react-router';
import { NiveauxOrganisationPage } from '@/features/organisation/components/niveaux-organisation-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/niveaux-organisation/')({
    component: NiveauxOrganisationPage,
});
