import { createFileRoute } from '@tanstack/react-router';
import { NiveauxPage } from '@/features/niveaux';

export const Route = createFileRoute('/(authenticated)/parametres/structure-academique/niveaux')({
    component: NiveauxPage,
});
