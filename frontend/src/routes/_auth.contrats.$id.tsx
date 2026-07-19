import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ContratDetailPage } from '@/features/contrats';

export const Route = createFileRoute('/_auth/contrats/$id')({
    beforeLoad: () => requireModulePermission('contrats'),
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = Route.useParams();
    return <ContratDetailPage contratId={id} />;
}
