/**
 * ==================================
 * eLISAschool - Route Notes
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { NotesPage } from '@/features/notes';

export const Route = createFileRoute('/_auth/notes')({
    beforeLoad: () => requireModulePermission('notes'),
    component: () => <NotesPage />,
});
