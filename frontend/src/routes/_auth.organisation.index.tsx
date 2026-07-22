import { createFileRoute } from '@tanstack/react-router';
import { OrganigrammePage } from '@/features/organisation/components/organigramme/OrganigrammePage';

export const Route = createFileRoute('/_auth/organisation/')({
    component: OrganigrammePage,
});
