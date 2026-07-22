import { createFileRoute } from '@tanstack/react-router';
import { UnitesPage } from '@/features/organisation/components/unites-page';

export const Route = createFileRoute('/_auth/organisation/unites/')({
    component: UnitesPage,
});
