import { createFileRoute } from '@tanstack/react-router';
import { FilieresPage } from '@/features/filieres';

export const Route = createFileRoute('/(authenticated)/parametres/structure-academique/filieres')({
    component: FilieresPage,
});
