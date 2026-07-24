import { createFileRoute } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { BulletinDetailPage } from '@/features/bulletins';

export const Route = createFileRoute('/_auth/bulletins/$id')({
    beforeLoad: () => requireModulePermission('bulletins'),
    component: RouteComponent,
});

function RouteComponent() {
    const { id } = Route.useParams();
    return <BulletinDetailPage bulletinId={id} />;
}