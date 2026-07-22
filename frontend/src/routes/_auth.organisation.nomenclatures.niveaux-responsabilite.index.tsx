import { createFileRoute } from '@tanstack/react-router';
import { NiveauxResponsabilitePage } from '@/features/organisation/components/niveaux-responsabilite-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/niveaux-responsabilite/')({
    component: NiveauxResponsabilitePage,
});
