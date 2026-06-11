import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { StatistiquesPage } from '@/features/statistiques';
import { RapportsPage } from '@/features/rapports';
import { AnalyticsPage } from '@/features/analytics';

export const Route = createFileRoute('/_auth/modules-reporting')({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT']),
    component: ModulesReportingPage,
});

function ModulesReportingPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Reporting & Analytics</h1>
            <div className="grid grid-cols-1 gap-6">
                <StatistiquesPage />
                <RapportsPage />
                <AnalyticsPage />
            </div>
        </div>
    );
}
