/**
 * ==================================
 * eLISAschool - Hooks Utilitaires Structure Académique
 * ==================================
 * Version: 2.0.0 (refactorisée - TypeCycle supprimé)
 * Auteur: franck arlos chendjou
 * 
 * Hooks pour les dropdowns, sélections et relations hiérarchiques
 */

import { useMemo } from 'react';
import { useTousCycles } from '@/features/cycles/hooks/use-tous-cycles';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useFilieres } from '@/features/filieres/hooks/use-filieres';
import { useExamensNationaux } from '@/features/examens-nationaux/hooks/use-examens-nationaux';

// ==================================
// Dropdowns - Listes plates pour selects
// ==================================

/**
 * Hook pour obtenir la liste de tous les cycles (pour dropdown)
 * Note: Les cycles incluent maintenant les attributs de TypeCycle fusionnés
 */
export function useCyclesDropdown() {
    const { data, isLoading } = useTousCycles();
    
    const options = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return data.map((c: any) => ({
            value: c.id,
            label: c.nom,
            code: c.code,
            description: c.description,
            dureeAnnees: c.dureeAnnees,
            diplomeSanctionnant: c.diplomeSanctionnant,
            ordre: c.ordre,
        }));
    }, [data]);

    return { options, isLoading };
}

/**
 * Hook pour obtenir la liste de tous les niveaux (pour dropdown)
 */
export function useNiveauxDropdown() {
    const { data, isLoading } = useTousNiveaux();
    
    const options = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        return data.map((n: any) => ({
            value: n.id,
            label: n.nom,
            code: n.code,
            ordre: n.ordre,
            cycleId: n.cycleId,
            cycle: n.cycle?.nom,
        }));
    }, [data]);

    return { options, isLoading };
}

/**
 * Hook pour obtenir la liste des filières (pour dropdown)
 */
export function useFilieresDropdown(sousSysteme?: string) {
    const { data, isLoading } = useFilieres({ 
        ...(sousSysteme ? { sousSysteme } : {})
    });
    
    const options = useMemo(() => {
        if (!data?.items) return [];
        return data.items.map((f: any) => ({
            value: f.id,
            label: f.nom,
            code: f.code,
            sousSysteme: f.sousSysteme,
            cycleId: f.cycleId,
        }));
    }, [data]);

    return { options, isLoading };
}

/**
 * Hook pour obtenir la liste des examens nationaux (pour dropdown)
 */
export function useExamensNationauxDropdown(sousSysteme?: string) {
    const { data, isLoading } = useExamensNationaux({ 
        ...(sousSysteme ? { sousSysteme } : {})
    });
    
    const options = useMemo(() => {
        if (!data?.items) return [];
        return data.items.map((e: any) => ({
            value: e.id,
            label: e.nom,
            code: e.code,
            type: e.type,
            niveauId: e.niveauId,
            niveau: e.niveau?.nom,
            diplomeDelivre: e.diplomeDelivre,
            sousSysteme: e.sousSysteme,
        }));
    }, [data]);

    return { options, isLoading };
}

// ==================================
// Filtres hiérarchiques
// ==================================

/**
 * Hook pour obtenir les niveaux filtrés par cycle
 */
export function useNiveauxByCycle(cycleId?: string) {
    const { data: allNiveaux, isLoading } = useTousNiveaux();
    
    const niveaux = useMemo(() => {
        if (!allNiveaux || !Array.isArray(allNiveaux)) return [];
        if (!cycleId) return allNiveaux;
        return allNiveaux
            .filter((n: any) => n.cycleId === cycleId)
            .sort((a: any, b: any) => a.ordre - b.ordre);
    }, [allNiveaux, cycleId]);

    return { niveaux, isLoading };
}

/**
 * Hook pour obtenir les niveaux filtrés par sous-système
 */
export function useNiveauxBySousSysteme(sousSysteme: string) {
    const { data: allNiveaux, isLoading } = useTousNiveaux();
    
    const niveaux = useMemo(() => {
        if (!allNiveaux || !Array.isArray(allNiveaux)) return [];
        return allNiveaux
            .filter((n: any) => n.sousSysteme === sousSysteme)
            .sort((a: any, b: any) => {
                // Tri par cycle puis par ordre
                if (a.cycleId !== b.cycleId) {
                    return a.cycleId.localeCompare(b.cycleId);
                }
                return a.ordre - b.ordre;
            });
    }, [allNiveaux, sousSysteme]);

    return { niveaux, isLoading };
}

/**
 * Hook pour obtenir les filières filtrées par cycle et sous-système
 */
export function useFilieresByCycleEtSysteme(cycleId?: string, sousSysteme?: string) {
    const { data: allFilieres, isLoading } = useFilieres();
    
    const filieres = useMemo(() => {
        if (!allFilieres?.items) return [];
        return allFilieres.items.filter((f: any) => {
            if (cycleId && f.cycleId !== cycleId) return false;
            if (sousSysteme && f.sousSysteme !== sousSysteme) return false;
            return true;
        });
    }, [allFilieres, cycleId, sousSysteme]);

    return { filieres, isLoading };
}

/**
 * Hook pour obtenir les examens filtrés par niveau
 */
export function useExamensByNiveau(niveauId?: string) {
    const { data: allExamens, isLoading } = useExamensNationaux();
    
    const examens = useMemo(() => {
        if (!allExamens?.items) return [];
        if (!niveauId) return allExamens.items;
        return allExamens.items.filter((e: any) => e.niveauId === niveauId);
    }, [allExamens, niveauId]);

    return { examens, isLoading };
}

// ==================================
// Helpers - Recherche et formatting
// ==================================

/**
 * Hook pour trouver un examen par son code
 */
export function useExamenByCode(code: string) {
    const { data: allExamens } = useExamensNationaux();
    
    const examen = useMemo(() => {
        if (!allExamens?.items) return null;
        return allExamens.items.find((e: any) => e.code === code);
    }, [allExamens, code]);

    return examen;
}

/**
 * Hook pour obtenir le nom d'un niveau par son ID
 */
export function useNiveauLabel(niveauId: string) {
    const { data: allNiveaux } = useTousNiveaux();
    
    const label = useMemo(() => {
        if (!allNiveaux || !Array.isArray(allNiveaux)) return niveauId;
        const niveau = allNiveaux.find((n: any) => n.id === niveauId);
        return niveau ? `${niveau.nom} (${niveau.code})` : niveauId;
    }, [allNiveaux, niveauId]);

    return label;
}

/**
 * Hook pour obtenir le nom d'un cycle par son ID
 */
export function useCycleLabel(cycleId: string) {
    const { data: allCycles } = useTousCycles();
    
    const label = useMemo(() => {
        if (!allCycles || !Array.isArray(allCycles)) return cycleId;
        const cycle = allCycles.find((c: any) => c.id === cycleId);
        return cycle ? cycle.nom : cycleId;
    }, [allCycles, cycleId]);

    return label;
}
