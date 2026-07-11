import { useNavigate } from '@tanstack/react-router';
import { Briefcase, ArrowRight } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { useModulePermissions } from '@/hooks';

interface Props { organisationId: string }

export function TabPostes({ organisationId: _organisationId }: Props) {
    const navigate = useNavigate();
    const { canAccess } = useModulePermissions('postes');

    if (!canAccess) return null;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Postes</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Gérer les postes, affectations et fiches de poste
                        </p>
                    </div>
                </div>
                <ElisaButton
                    variant="primary"
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => navigate({ to: '/postes' })}
                >
                    Voir tous les postes
                </ElisaButton>
            </div>
        </div>
    );
}
