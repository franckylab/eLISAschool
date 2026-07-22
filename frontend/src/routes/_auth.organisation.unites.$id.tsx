import { createFileRoute } from '@tanstack/react-router';
import { UniteDetailPage } from '@/features/organisation/components/unite-detail-page';

export const Route = createFileRoute('/_auth/organisation/unites/$id')({
    component: UniteDetailPage,
});
