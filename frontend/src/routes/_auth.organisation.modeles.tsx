import { createFileRoute } from '@tanstack/react-router';
import { ModelesPage } from '@/features/organisation/components/modeles-page';

export const Route = createFileRoute('/_auth/organisation/modeles')({
    component: ModelesPage,
});
