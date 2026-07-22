import { createFileRoute } from '@tanstack/react-router';
import { TabHierarchie } from '@/features/organisation/components/tab-hierarchie';

export const Route = createFileRoute('/_auth/organisation/hierarchie/')({
    component: TabHierarchie,
});
