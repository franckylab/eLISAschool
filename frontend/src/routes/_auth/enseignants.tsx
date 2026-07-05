import { createFileRoute, Outlet } from '@tanstack/react-router';
import { requireModulePermission } from '@/app/permission-guards';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingState } from '@/components/feedback/LoadingState';

export const Route = createFileRoute('/_auth/enseignants')({
    beforeLoad: () => requireModulePermission('personnel'),
    errorComponent: ({ error }) => <ErrorState message={error?.message || "Erreur de chargement"} />,
    pendingComponent: () => <LoadingState message="Chargement..." />,
});
