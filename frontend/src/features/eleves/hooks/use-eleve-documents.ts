/**
 * ==================================
 * eLISAschool - Hook Documents d'un Élève
 * ==================================
 * Récupère les documents justificatifs d'un élève
 */

import { useQuery } from '@tanstack/react-query';
import { useEleve } from './use-eleves';

export interface DocumentJustificatif {
    url: string;
    type: string;
    dateUpload: string;
}

export function useEleveDocuments(eleveId: string) {
    const { data: eleve, isLoading } = useEleve(eleveId);
    
    return {
        data: eleve?.documentsJustificatifs || [],
        isLoading,
    };
}
