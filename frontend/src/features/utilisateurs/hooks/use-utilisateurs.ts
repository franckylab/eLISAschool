/**
 * ==================================
 * eLISAschool - Hooks Utilisateurs
 * ==================================
 * Version: 2.1.0
 * Auteur: franck arlos chendjou
 * 
 * Hooks complets pour la gestion des utilisateurs avec:
 * - CRUD complet
 * - Gestion multi-établissements
 * - Cache optimisé et invalidation intelligente
 * - Gestion d'erreurs avancée
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import type { Utilisateur, CreerUtilisateurDto, ModifierUtilisateurDto, UtilisateurFiltres, Role } from '../types/utilisateur.types';
import type { PaginatedResult } from '@shared/types/api.types';

const UTILISATEURS_KEYS = {
    all: ['utilisateurs'] as const,
    listes: () => [...UTILISATEURS_KEYS.all, 'liste'] as const,
    liste: (filtres: UtilisateurFiltres) => [...UTILISATEURS_KEYS.listes(), filtres] as const,
    details: () => [...UTILISATEURS_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...UTILISATEURS_KEYS.details(), id] as const,
    roles: () => [...UTILISATEURS_KEYS.all, 'roles'] as const,
    parEtablissement: (etablissementId: string) => [...UTILISATEURS_KEYS.all, 'etablissement', etablissementId] as const,
    disponibles: (etablissementId?: string) => [...UTILISATEURS_KEYS.all, 'disponibles', etablissementId || 'all'] as const,
    verificationSuppression: () => [...UTILISATEURS_KEYS.all, 'verification-suppression'] as const,
    verifierSuppression: (id: string) => [...UTILISATEURS_KEYS.verificationSuppression(), id] as const,
};

export function useUtilisateurs(filtres: UtilisateurFiltres = {}) {
    const { isAuthenticated } = useAuthStore();
    return useQuery({
        queryKey: UTILISATEURS_KEYS.liste(filtres),
        queryFn: async () => {
            const params: Record<string, any> = {
                page: filtres.page || 1,
                limit: filtres.limit || 20,
            };

            // Ajouter uniquement les filtres non vides
            if (filtres.recherche) params.search = filtres.recherche;
            if (filtres.role) params.role = filtres.role;
            if (filtres.statut) params.statut = filtres.statut;
            if (filtres.etablissementId) params.etablissementId = filtres.etablissementId;
            if (filtres.actifFiltre) params.actifFiltre = filtres.actifFiltre; // NOUVEAU: filtre statut d'affectation
            if (filtres.sortBy) params.sortBy = filtres.sortBy;
            if (filtres.sortOrder) params.sortOrder = filtres.sortOrder;

            // Utiliser apiClient.get au lieu de getPaginated pour transmettre TOUS les paramètres
            // getPaginated ne transmet que page/limit/sortBy/sortOrder et ignore les filtres métier
            const response = await apiClient.get<PaginatedResult<Utilisateur>>('/api/utilisateurs', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });
}

export function useUtilisateur(id: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: UTILISATEURS_KEYS.detail(id),
        queryFn: async () => {
            const response = await apiClient.get<Utilisateur>(`/api/utilisateurs/${id}`);
            return response.data;
        },
        enabled: isAuthenticated && !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
    });
}

/**
 * Hook pour lister les utilisateurs disponibles pour assignation
 */
export function useUtilisateursDisponibles(etablissementId?: string) {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: UTILISATEURS_KEYS.disponibles(etablissementId),
        queryFn: async () => {
            const params: Record<string, any> = {
                limit: 100,
                page: 1,
                actif: true,
            };
            
            // Si etablissementId fourni, exclure les utilisateurs déjà assignés
            if (etablissementId) {
                params.exclureEtablissement = etablissementId;
            }
            
            const response = await apiClient.getPaginated<Utilisateur>('/api/utilisateurs', params);
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 3 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });
}

export function useRoles() {
    const { isAuthenticated } = useAuthStore();
    
    return useQuery({
        queryKey: UTILISATEURS_KEYS.roles(),
        queryFn: async () => {
            const response = await apiClient.get<Role[]>('/api/roles');
            return response.data;
        },
        enabled: isAuthenticated,
        staleTime: 30 * 60 * 1000,
    });
}

export function useCreerUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: CreerUtilisateurDto) => {
            const response = await apiClient.post<Utilisateur>('/api/utilisateurs', dto);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            toast.success('Utilisateur créé avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la création');
        },
    });
}

export function useModifierUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...dto }: ModifierUtilisateurDto) => {
            const response = await apiClient.patch<Utilisateur>(`/api/utilisateurs/${id}`, dto);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.detail(variables.id) });
            toast.success('Utilisateur modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la modification');
        },
    });
}

/**
 * Hook pour assigner un utilisateur à un établissement
 */
export interface AffecterUtilisateurDto {
    etablissementId: string;
    role: string;
    etablissementPrincipal?: boolean;
    dateDebut?: string;
    dateFin?: string;
    motif?: string;
}

export function useAffecterUtilisateurEtablissement(etablissementId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ utilisateurId, ...dto }: AffecterUtilisateurDto & { utilisateurId: string }) => {
            const response = await apiClient.post(
                `/api/utilisateurs/${utilisateurId}/etablissements`,
                dto
            );
            return response.data;
        },
        onSuccess: () => {
            // Invalidation ciblée pour optimiser les performances
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.parEtablissement(etablissementId) });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.disponibles(etablissementId) });
            toast.success('Utilisateur assigné avec succès');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || 'Erreur lors de l\'assignation';
            const code = error.response?.data?.error?.code;
            
            // Messages d'erreur spécifiques selon le code
            if (code === 'ALREADY_ASSIGNED') {
                toast.error('Cet utilisateur est déjà assigné à cet établissement');
            } else if (code === 'ELEVE_MULTI_ETABLISSEMENT_NOT_ALLOWED') {
                toast.error('Un élève ne peut être affecté qu\'à un seul établissement');
            } else if (code === 'MAX_ETABLISSEMENTS_REACHED') {
                toast.error('Le nombre maximum d\'établissements est atteint pour ce rôle');
            } else {
                toast.error(message);
            }
        },
    });
}

/**
 * Hook pour vérifier les impacts avant le retrait d'un utilisateur (v5.0)
 * 
 * Retourne:
 * - peutRetirer: boolean
 * - blocages: array (empêchent le retrait)
 * - avertissements: array (confirmation requise)
 * - resume: object (statistiques)
 */
export function useVerifierRetraitUtilisateurEtablissement(etablissementId: string) {
    return useMutation<any, any, { utilisateurId: string }>({
        mutationFn: async ({ utilisateurId }) => {
            const response = await apiClient.post(
                `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}/verifier-retrait`
            );
            return response.data;
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message;
            toast.error(message || 'Erreur lors de la vérification');
        },
    });
}

/**
 * Hook pour retirer un utilisateur d'un établissement
 * 
 * Supporte maintenant:
 * - Motif de retrait (optionnel)
 * - Meilleure gestion d'erreurs
 */
export function useRetirerUtilisateurEtablissement(etablissementId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            utilisateurId, 
            motif, 
            nouveauPrincipalId 
        }: { 
            utilisateurId: string; 
            motif?: string;
            nouveauPrincipalId?: string;
        }) => {
            console.log('[RETRAIT][HOOK] mutationFn appelée avec:', {
                utilisateurId,
                etablissementId,
                motif,
                nouveauPrincipalId
            });
            
            // Construire l'URL avec les query parameters
            const params = new URLSearchParams();
            if (motif) params.set('motif', motif);
            if (nouveauPrincipalId) params.set('nouveauPrincipalId', nouveauPrincipalId);
            
            const url = params.toString()
                ? `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}?${params.toString()}`
                : `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}`;
            
            console.log('[RETRAIT][HOOK] URL de la requête:', url);
            
            await apiClient.delete(url);
            console.log('[RETRAIT][HOOK] Requête DELETE exécutée avec succès');
            return utilisateurId;
        },
        onSuccess: () => {
            console.log('[RETRAIT][SUCCESS] Début invalidation cache pour etablissementId:', etablissementId);
            
            // Invalider TOUTES les clés de cache liées aux utilisateurs pour cet établissement
            queryClient.invalidateQueries({
                queryKey: UTILISATEURS_KEYS.all,
                predicate: (query) => {
                    const queryKey = query.queryKey;
                    if (!Array.isArray(queryKey)) return false;
                    
                    if (queryKey.includes(etablissementId)) {
                        console.log('[RETRAIT][INVALIDATION] Clé trouvée (direct):', queryKey);
                        return true;
                    }
                    
                    if (queryKey.length >= 3 && typeof queryKey[2] === 'object' && queryKey[2] !== null) {
                        const filtres = queryKey[2] as Record<string, any>;
                        if (filtres.etablissementId === etablissementId) {
                            console.log('[RETRAIT][INVALIDATION] Clé trouvée (dans filtres):', queryKey);
                            return true;
                        }
                    }
                    
                    return false;
                }
            });
            
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.disponibles(etablissementId) });
            
            console.log('[RETRAIT][SUCCESS] Invalidation cache terminée');
            toast.success('Utilisateur retiré avec succès');
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message;
            toast.error(message || 'Erreur lors du retrait');
        },
    });
}

/**
 * Hook pour activer/désactiver un utilisateur dans un établissement
 * Avec motif obligatoire
 */
export function useToggleStatutUtilisateur(etablissementId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            utilisateurId, 
            actif, 
            motif 
        }: { 
            utilisateurId: string; 
            actif: boolean;
            motif: string;
        }) => {
            const response = await apiClient.patch(
                `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}/statut`,
                { actif, motif }
            );
            return response.data;
        },
        onSuccess: (_data, variables) => {
            // Invalider le cache pour rafraîchir la liste
            queryClient.invalidateQueries({
                queryKey: UTILISATEURS_KEYS.all,
                predicate: (query) => {
                    const queryKey = query.queryKey;
                    if (!Array.isArray(queryKey)) return false;
                    
                    if (queryKey.includes(etablissementId)) return true;
                    
                    if (queryKey.length >= 3 && typeof queryKey[2] === 'object' && queryKey[2] !== null) {
                        const filtres = queryKey[2] as Record<string, any>;
                        if (filtres.etablissementId === etablissementId) return true;
                    }
                    
                    return false;
                }
            });
            
            toast.success(
                variables.actif 
                    ? 'Utilisateur réactivé avec succès' 
                    : 'Utilisateur désactivé avec succès'
            );
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message;
            toast.error(message || 'Erreur lors du changement de statut');
        },
    });
}

/**
 * Hook pour changer le rôle d'un utilisateur dans un établissement
 */
export interface ChangerRoleDto {
    utilisateurId: string;
    etablissementId: string;
    nouveauRole: string;
}

export function useChangerRoleEtablissement(etablissementId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ utilisateurId, nouveauRole }: ChangerRoleDto) => {
            const response = await apiClient.patch(
                `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}/role`,
                { role: nouveauRole }
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.parEtablissement(etablissementId) });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            toast.success('Rôle modifié avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors du changement de rôle');
        },
    });
}

/**
 * Hook pour définir l'établissement principal d'un utilisateur
 */
export interface DefinirEtablissementPrincipalDto {
    utilisateurId: string;
    etablissementId: string;
}

export function useDefinirEtablissementPrincipal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ utilisateurId, etablissementId }: DefinirEtablissementPrincipalDto) => {
            const response = await apiClient.post(
                `/api/utilisateurs/${utilisateurId}/etablissements/${etablissementId}/principal`,
                {}
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.details() });
            toast.success('Établissement principal défini avec succès');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la définition de l\'établissement principal');
        },
    });
}

// =============================================
// VERIFICATION ET SUPPRESSION D'UTILISATEUR
// =============================================

/**
 * Types pour la vérification de suppression
 */
export interface VerificationSuppressionResponse {
    utilisateur: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
        roles: string[];
        statut: string;
    };
    contexte: {
        etablissementId?: string;
        aEtablissementContexte: boolean;
    };
    impacts: Record<string, any>;
    elementsCritiques: Record<string, any>;
    permissions: {
        peutSoftDelete: boolean;
        peutCascadeDelete: boolean;
        permissionRequiseSoft: string;
        permissionRequiseCascade: string;
    };
    resume: {
        totalElementsDirects: number;
        totalElementsIndirects: number;
        totalElementsMetier: number;
        totalElementsCritiques: number;
        totalGeneral: number;
        categoriesAvecElements: number;
    };
    peutSupprimer: boolean;
    modeRecommande: 'soft' | 'cascade' | 'aucun';
    blocageTotal: boolean;
    raisonBlocage?: string;
}

/**
 * Hook pour vérifier les impacts avant suppression d'un utilisateur
 */
export function useVerifierSuppressionUtilisateur() {
    return useMutation<
        VerificationSuppressionResponse, any, { 
            utilisateurId: string; 
            etablissementId?: string 
        }>({
        mutationFn: async ({ 
            utilisateurId, 
            etablissementId 
        }) => {
            const params: Record<string, any> = {};
            if (etablissementId) {
                params.etablissementId = etablissementId;
            }
            
            const url = `/api/utilisateurs/${utilisateurId}/verifier-suppression`;
            console.log('[useVerifierSuppression] Appel API:', url, params);
            
            try {
                const response = await apiClient.get<VerificationSuppressionResponse>(url, params);
                
                console.log('[useVerifierSuppression] Réponse brute:', JSON.stringify(response, null, 2));
                console.log('[useVerifierSuppression] response.success:', response.success);
                console.log('[useVerifierSuppression] response.data:', response.data);
                
                if (!response.success) {
                    console.error('[useVerifierSuppression] response.success est false');
                    throw new Error('Le serveur a retourné success: false');
                }
                
                if (!response.data) {
                    console.error('[useVerifierSuppression] response.data est undefined/null');
                    throw new Error('Réponse invalide du serveur: data manquante');
                }
                
                console.log('[useVerifierSuppression] Retourne les données:', response.data);
                return response.data;
            } catch (error: any) {
                console.error('[useVerifierSuppression] Erreur dans mutationFn:', error);
                console.error('[useVerifierSuppression] Error message:', error.message);
                console.error('[useVerifierSuppression] Error response:', error.response);
                throw error;
            }
        },
        onError: (error: any) => {
            console.error('[useVerifierSuppression] onError:', error);
            console.error('[useVerifierSuppression] onError message:', error.message);
        },
        onSuccess: (data) => {
            console.log('[useVerifierSuppression] onSuccess:', data);
        },
    });
}

/**
 * Hook pour supprimer un utilisateur (soft delete ou cascade)
 */
export function useSupprimerUtilisateur() {
    const queryClient = useQueryClient();

    return useMutation<
        unknown, any, {
            utilisateurId: string;
            mode: 'soft' | 'cascade';
            motif: string;
            etablissementId?: string;
        }>({
        mutationFn: async ({
            utilisateurId,
            mode,
            motif,
            etablissementId,
        }) => {
            const response = await apiClient.delete(`/api/utilisateurs/${utilisateurId}`, {
                mode,
                motif,
                etablissementId,
            });
            return response.data;
        },
        onSuccess: (_data, variables) => {
            // Invalider les caches
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.listes() });
            queryClient.invalidateQueries({ queryKey: UTILISATEURS_KEYS.details() });
            
            // Toast de succès selon le mode
            if (variables.mode === 'soft') {
                toast.success('Utilisateur désactivé avec succès');
            } else {
                toast.success('Utilisateur supprimé définitivement avec succès');
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error?.message || 'Erreur lors de la suppression');
        },
    });
}
