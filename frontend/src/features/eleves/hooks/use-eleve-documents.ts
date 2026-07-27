/**
 * ==================================
 * eLISAschool - Hook Documents d'un Élève
 * ==================================
 */

import { useEleve } from './use-eleves';
import type { DocumentJustificatif } from '../types/eleve.types';

export function useEleveDocuments(eleveId: string) {
    const { data: eleve, isLoading } = useEleve(eleveId);

    return {
        data: (eleve as unknown as { documentsJustificatifs?: DocumentJustificatif[] })?.documentsJustificatifs || [],
        isLoading,
    };
}
