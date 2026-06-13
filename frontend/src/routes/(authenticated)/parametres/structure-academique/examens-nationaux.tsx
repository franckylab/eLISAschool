import { createFileRoute } from '@tanstack/react-router';
import { ExamensNationauxPage } from '@/features/examens-nationaux';

export const Route = createFileRoute('/(authenticated)/parametres/structure-academique/examens-nationaux')({
    component: ExamensNationauxPage,
});
