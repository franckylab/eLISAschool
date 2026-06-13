import { createFileRoute } from '@tanstack/react-router';
import { DiplomesElevesPage } from '@/features/diplomes-eleves';

export const Route = createFileRoute('/(authenticated)/parametres/structure-academique/diplomes-eleves')({
    component: DiplomesElevesPage,
});
