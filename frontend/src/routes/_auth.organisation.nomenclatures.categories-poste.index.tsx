import { createFileRoute } from '@tanstack/react-router';
import { CategoriesPostePage } from '@/features/organisation/components/categories-poste-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/categories-poste/')({
    component: CategoriesPostePage,
});
