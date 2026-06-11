/**
 * ==================================
 * eLISAschool - Routes Modules Critiques
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { UtilisateursPage } from '@/features/utilisateurs/components/utilisateurs-page';
import { NotesPage } from '@/features/notes/components/notes-page';
import { BulletinsPage } from '@/features/bulletins/components/bulletins-page';

// Route placeholder pour éviter le warning TanStack Router
export const Route = createFileRoute('/-auth/modules-critiques')({
    component: () => null,
});

export const UtilisateursRoute = createFileRoute('/_auth/utilisateurs')({
    component: UtilisateursPage,
});

export const NotesRoute = createFileRoute('/_auth/notes')({
    component: NotesPage,
});

export const BulletinsRoute = createFileRoute('/_auth/bulletins')({
    component: BulletinsPage,
});
