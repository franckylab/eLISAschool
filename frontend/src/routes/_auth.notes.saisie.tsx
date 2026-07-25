/**
 * ==================================
 * eLISAschool - Route Saisie en masse des Notes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { NotesSaisieMassePage } from '@/features/notes';

export const Route = createFileRoute('/_auth/notes/saisie')({
    beforeLoad: () => requireModulePermission('notes'),
    component: NotesSaisieMassePage,
});
