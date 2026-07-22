import { createFileRoute } from '@tanstack/react-router';
import { UsagesUnitePage } from '@/features/organisation/components/usages-unite-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/usages-unite/')({
    component: UsagesUnitePage,
});
