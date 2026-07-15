/**
 * ==================================
 * eLISAschool - Routes Modules Pédagogiques
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { EDTStandalonePage as EmploisDuTempsPage } from '@/features/emploi-du-temps';
import { ExamensPage } from '@/features/examens';
import { BibliothequePage } from '@/features/bibliotheque';

const route = createFileRoute('/_auth/modules-pedagogiques');

function ModulesPedagogiques() {
    return null;
}

export const Route = route({
    component: ModulesPedagogiques,
});

// Route Emplois du Temps
const emploisRoute = createFileRoute('/_auth/modules-pedagogiques/emplois-du-temps');

export const EmploisDuTempsRoute = emploisRoute({
    component: () => <EmploisDuTempsPage />,
});

// Route Examens
const examensRoute = createFileRoute('/_auth/modules-pedagogiques/examens');

export const ExamensRoute = examensRoute({
    component: () => <ExamensPage />,
});

// Route Bibliothèque
const bibliothequeRoute = createFileRoute('/_auth/modules-pedagogiques/bibliotheque');

export const BibliothequeRoute = bibliothequeRoute({
    component: () => <BibliothequePage />,
});
