import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { BulletinDetailPage } from '@/features/paie';

export const Route = createFileRoute('/_auth/paie/bulletins/$id')({
    beforeLoad: () => requireModulePermission('paie'),
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = Route.useParams();
    return <BulletinDetailPage bulletinId={id} />;
}
