import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import type {
    ParametreSysteme,
    ParametreFiltres,
    ConfigurationModule,
    UpdateConfigModuleDto,
    ToggleModuleDto,
    ModuleRegistryEntry,
    ModuleImpact,
    ModuleState,
    HistoriqueConfiguration,
    HistoriqueFiltres,
    BackupRecord,
    CreateBackupDto,
    CreateParametreDto,
    UpdateParametreDto,
} from '../types/configuration.types';

const CONFIG_KEYS = {
    all: ['configuration'] as const,
    params: () => [...CONFIG_KEYS.all, 'params'] as const,
    paramsList: (filtres: ParametreFiltres) => [...CONFIG_KEYS.params(), 'list', filtres] as const,
    modules: () => [...CONFIG_KEYS.all, 'modules'] as const,
    registry: () => [...CONFIG_KEYS.all, 'modules', 'registry'] as const,
    moduleState: (moduleNom: string) => [...CONFIG_KEYS.modules(), 'state', moduleNom] as const,
    moduleImpact: (moduleNom: string, actif: boolean) => [...CONFIG_KEYS.all, 'modules', 'impact', moduleNom, String(actif)] as const,
    history: () => [...CONFIG_KEYS.all, 'history'] as const,
    historyList: (filtres: HistoriqueFiltres) => [...CONFIG_KEYS.history(), 'list', filtres] as const,
    backups: () => [...CONFIG_KEYS.all, 'backups'] as const,
};

export function useModuleRegistry() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CONFIG_KEYS.registry(),
        queryFn: async () => {
            const [registryRes, configRes] = await Promise.all([
                apiClient.get<ModuleRegistryEntry[]>('/api/configuration/modules/registry'),
                apiClient.get<ConfigurationModule[]>('/api/configuration/modules'),
            ]);

            const entries = registryRes.data || [];
            const configs = configRes.data || [];
            const configMap = new Map(configs.map((c) => [c.moduleNom, c]));

            const states: ModuleState[] = [];
            for (const entry of entries) {
                const config = configMap.get(entry.name) || null;
                states.push({
                    entry,
                    config,
                    actif: entry.actif,
                    isLoading: false,
                    // Entitlement (migration 200)
                    estAccessible: entry.estAccessible ?? entry.actif,
                    estVisible: entry.estVisible ?? true,
                    raisonBlocage: entry.raisonBlocage ?? null,
                    messageBlocage: entry.messageBlocage ?? null,
                });
            }
            return states;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useToggleModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: ToggleModuleDto) => {
            const response = await apiClient.post<{ success: boolean; data: any; message: string }>(
                '/api/configuration/modules/toggle',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.modules() });
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.registry() });
        },
    });
}

export function useModuleImpact(moduleNom: string, actif: boolean) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CONFIG_KEYS.moduleImpact(moduleNom, actif),
        queryFn: async () => {
            const response = await apiClient.get<ModuleImpact>(
                `/api/configuration/modules/registry/impact`,
                { moduleNom, actif: String(actif) }
            );
            return response.data;
        },
        enabled: isAuthenticated && !!moduleNom,
        staleTime: 30 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useConfigModules() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CONFIG_KEYS.modules(),
        queryFn: async () => {
            const response = await apiClient.get<{ data: ConfigurationModule[] }>(
                '/api/configuration/modules'
            );
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useParametres(filtres: ParametreFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CONFIG_KEYS.paramsList(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{
                data: ParametreSysteme[];
                meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
            }>('/api/configuration/parametres', { params: filtres as any });

            if (!response.data) {
                throw new Error('Paramètres non disponibles');
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreerParametre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateParametreDto) => {
            const response = await apiClient.post<ParametreSysteme>(
                '/api/configuration/parametres',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.params() });
        },
    });
}

export function useModifierParametre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: { id: string } & UpdateParametreDto) => {
            const response = await apiClient.patch<ParametreSysteme>(
                `/api/configuration/parametres/${id}`,
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.params() });
        },
    });
}

export function useSupprimerParametre() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/configuration/parametres/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.params() });
        },
    });
}

export function useUpdateConfigModule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ moduleNom, ...dto }: { moduleNom: string } & UpdateConfigModuleDto) => {
            const response = await apiClient.patch<ConfigurationModule>(
                `/api/configuration/modules/${moduleNom}`,
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.modules() });
        },
    });
}

export function useHistoriqueConfiguration(filtres: HistoriqueFiltres = {}) {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CONFIG_KEYS.historyList(filtres),
        queryFn: async () => {
            const response = await apiClient.get<{
                data: HistoriqueConfiguration[];
                meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number };
            }>('/api/configuration/historique', { params: filtres as any });

            if (!response.data) {
                throw new Error('Historique non disponible');
            }

            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 2 * 60 * 1000,
    });
}

export function useRestaurerHistorique() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(
                `/api/configuration/historique/${id}/restaurer`
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.all });
        },
    });
}

export function useBackups() {
    const { isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: CONFIG_KEYS.backups(),
        queryFn: async () => {
            const response = await apiClient.get<{ data: BackupRecord[] }>(
                '/api/configuration/backups'
            );
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
}

export function useCreerBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreateBackupDto) => {
            const response = await apiClient.post<BackupRecord>(
                '/api/configuration/backups',
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.backups() });
        },
    });
}

export function useRestaurerBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const response = await apiClient.post(
                `/api/configuration/backups/${id}/restaurer`
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.all });
        },
    });
}

export function useSupprimerBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/api/configuration/backups/${id}`);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CONFIG_KEYS.backups() });
        },
    });
}
