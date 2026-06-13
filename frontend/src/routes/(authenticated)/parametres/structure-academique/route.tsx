import { createFileRoute } from '@tanstack/react-router';
import { StructureAcademiquePage } from '@/features/structure-academique';

export const Route = createFileRoute('/(authenticated)/parametres/structure-academique')({
    component: StructureAcademiquePage,
});
