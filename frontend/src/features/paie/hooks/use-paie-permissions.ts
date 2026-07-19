import { useModulePermissions } from '@/hooks/use-permissions-advanced';

export function usePaiePermissions() {
    return useModulePermissions('paie');
}
