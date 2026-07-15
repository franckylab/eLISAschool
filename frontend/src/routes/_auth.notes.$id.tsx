import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { NoteDetailPage } from '@/features/notes';

export const Route = createFileRoute('/_auth/notes/$id')({
    beforeLoad: () => requireModulePermission('notes'),
    component: NoteDetailPage,
});