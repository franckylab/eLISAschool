import { createFileRoute } from '@tanstack/react-router';
import { CyclesPage } from '@/features/cycles';

export const Route = createFileRoute('/(authenticated)/parametres/structure-academique/cycles')({
    component: CyclesPage,
});
