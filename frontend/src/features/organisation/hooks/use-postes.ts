/**
 * ==================================
 * eLISAschool - Hooks Postes Organisation (délègue à features/postes)
 * ==================================
 * Ces hooks délèguent les appels aux hooks centralisés dans
 * features/postes et ajoutent les invalidations organigramme.
 */

import { useQueryClient } from '@tanstack/react-query';
import {
    useCreerPoste as useCreerPosteCentral,
    useModifierPoste as useModifierPosteCentral,
    useSupprimerPoste as useSupprimerPosteCentral,
} from '@/features/postes/hooks/use-postes';
import type { ModifierPosteDto } from '../types/organisation.types';
import type { CreatePosteDto } from '@/features/postes/types/poste.types';
import { ORGA_KEYS } from './query-keys';

function invaliderCacheOrg(qc: ReturnType<typeof useQueryClient>) {
    qc.invalidateQueries({ queryKey: ORGA_KEYS.organigramme.all });
    qc.invalidateQueries({ queryKey: ORGA_KEYS.unites.all });
    qc.invalidateQueries({ queryKey: ORGA_KEYS.stats.all });
}

export function useCreerPoste() {
    const qc = useQueryClient();
    const { mutateAsync, ...rest } = useCreerPosteCentral();

    return {
        ...rest,
        mutateAsync: async (dto: CreatePosteDto) => {
            const result = await mutateAsync(dto);
            invaliderCacheOrg(qc);
            return result;
        },
    };
}

export function useModifierPoste() {
    const qc = useQueryClient();
    const { mutateAsync, ...rest } = useModifierPosteCentral();

    return {
        ...rest,
        mutateAsync: async ({ id, ...dto }: { id: string } & ModifierPosteDto) => {
            const result = await mutateAsync({ id, dto });
            invaliderCacheOrg(qc);
            return result;
        },
    };
}

export function useSupprimerPoste() {
    const qc = useQueryClient();
    const { mutateAsync, ...rest } = useSupprimerPosteCentral();

    return {
        ...rest,
        mutateAsync: async (id: string) => {
            const result = await mutateAsync(id);
            invaliderCacheOrg(qc);
            return result;
        },
    };
}
