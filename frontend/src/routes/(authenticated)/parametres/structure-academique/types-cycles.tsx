import { createFileRoute } from '@tanstack/react-router';
import { TypesCyclesPage } from '@/features/types-cycles';

export const Route = createFileRoute('/(authenticated)/parametres/structure-academique/types-cycles')({
    component: TypesCyclesPage,
});
