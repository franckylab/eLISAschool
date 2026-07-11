import { createFileRoute } from '@tanstack/react-router';
import { ContratsPaiePage } from '@/features/personnel/components/contrats-paie-page';

export const Route = createFileRoute('/_auth/contrats')({
    component: RouteComponent,
});

function RouteComponent() {
    return <ContratsPaiePage />;
}
