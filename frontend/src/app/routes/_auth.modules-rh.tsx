/**
 * ==================================
 * eLISAschool - Routes Modules RH
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { requireRole } from '@/app/permission-guards';
import { CongesPage } from '@/features/conges';
import { PointagesPage } from '@/features/pointages';
import { EvaluationsPage } from '@/features/evaluations';

const route = createFileRoute('/_auth/modules-rh');

function ModulesRHPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Ressources Humaines</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CongesPage />
                <PointagesPage />
                <EvaluationsPage />
            </div>
        </div>
    );
}

export const Route = route({
    beforeLoad: () => requireRole(['ADMIN', 'SUPER_ADMIN', 'CHEF_ETABLISSEMENT']),
    component: ModulesRHPage,
});
