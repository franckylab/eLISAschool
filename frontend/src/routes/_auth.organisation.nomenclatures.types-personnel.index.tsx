import { createFileRoute } from '@tanstack/react-router';
import { TypesPersonnelPage } from '@/features/organisation/components/types-personnel-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/types-personnel/')({
    component: TypesPersonnelPage,
});
