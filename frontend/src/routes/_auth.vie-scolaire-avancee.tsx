/**
 * ==================================
 * eLISAschool - Routes Vie Scolaire Avancée
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { DisciplinePage } from '@/features/discipline';
import { SantePage } from '@/features/sante';
import { AbsencesPage } from '@/features/absences';

const route = createFileRoute('/_auth/vie-scolaire-avancee');

function VieScolaireAvancee() {
    return null;
}

export const Route = route({
    component: VieScolaireAvancee,
});

// Route Discipline
const disciplineRoute = createFileRoute('/_auth/vie-scolaire-avancee/discipline');

export const DisciplineRoute = disciplineRoute({
    component: () => <DisciplinePage />,
});

// Route Santé
const santeRoute = createFileRoute('/_auth/vie-scolaire-avancee/sante');

export const SanteRoute = santeRoute({
    component: () => <SantePage />,
});

// Route Absences
const absencesRoute = createFileRoute('/_auth/vie-scolaire-avancee/absences');

export const AbsencesRoute = absencesRoute({
    component: () => <AbsencesPage />,
});
