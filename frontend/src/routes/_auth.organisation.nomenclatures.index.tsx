import { createFileRoute } from '@tanstack/react-router';
import { NomenclaturesPage } from '@/features/organisation/components/nomenclatures-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/')({
    component: NomenclaturesPage,
});
