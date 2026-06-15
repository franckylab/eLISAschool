/**
 * ==================================
 * eLISAschool - Store d'authentification
 * ==================================
 * Zustand store avec persist pour la gestion de l'authentification JWT
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import type { PreLoginResponse } from '@/lib/api-client';

export interface UtilisateurConnecte {
    id: string;
    email: string;
    matricule: string;
    role: string;
    nom: string;
    prenom: string;
    permissions?: string[];
    // NOUVEAU: Informations multi-tenant (retournées par /api/auth/me)
    etablissementActif?: string;
    etablissements?: Etablissement[];
    roles?: Array<{ code: string; libelle: string; estPrincipal: boolean }>;
    statut?: string;
    emailVerifie?: boolean;
    langue?: string;
    profil?: {
        nom: string;
        prenom: string;
        telephone?: string;
        photo?: string;
    };
}

export interface Etablissement {
    etablissementId: string;
    role: string;
    etablissementPrincipal: boolean;
    actif: boolean;
}

export interface EtablissementDisponible {
    id: string;
    nom: string;
    code?: string;
    role: string;
    etablissementPrincipal: boolean;
    logoUrl?: string;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    utilisateur: UtilisateurConnecte | null;
    etablissementId: string | null;
    etablissements: Etablissement[];
    isLoading: boolean;
    isAuthenticated: boolean;
    _initialized: boolean; // Pour l'initialisation unique
    
    // NOUVEAU v3.0 : Sélection d'établissement
    preLoginData: PreLoginResponse | null;
    showEtablissementModal: boolean;

    // Actions
    login: (identifiant: string, motDePasse: string) => Promise<void>;
    completeLogin: (etablissementId: string) => Promise<void>;
    logout: () => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setUtilisateur: (utilisateur: UtilisateurConnecte) => void;
    setEtablissements: (etablissements: Etablissement[]) => void;
    switchEtablissement: (etablissementId: string) => Promise<void>;
    verifierSession: () => Promise<boolean>;
    reset: () => void;
    setShowEtablissementModal: (show: boolean) => void;
    initialize: () => void; // NOUVEAU: Initialisation au démarrage
}

const initialState = {
    accessToken: null,
    refreshToken: null,
    utilisateur: null,
    etablissementId: null,
    etablissements: [],
    isLoading: false,
    isAuthenticated: false,
    preLoginData: null,
    showEtablissementModal: false,
    _initialized: false, // NOUVEAU: Pour l'initialisation unique
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            ...initialState,

            login: async (identifiant: string, motDePasse: string) => {
                set({ isLoading: true });
                try {
                    // Étape 1 : Login - retourne MAINTENANT requiereSelectionEtablissement
                    const data = await apiClient.login(identifiant, motDePasse);
                    
                    // Étape 2 : Stocker les infos utilisateur SANS token complet si multi-établissements
                    set({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                        utilisateur: {
                            id: data.utilisateur.id,
                            email: data.utilisateur.email,
                            matricule: data.utilisateur.matricule,
                            role: data.utilisateur.role,
                            nom: data.utilisateur.nom,
                            prenom: data.utilisateur.prenom,
                        },
                        etablissements: data.utilisateur.etablissements || [],
                        etablissementId: data.utilisateur.etablissementActif || null,
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // Étape 3 : Synchroniser avec api-client
                    apiClient.setTokens({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken,
                    });

                    // Étape 4 : Vérifier si sélection d'établissement requise
                    if (data.requiereSelectionEtablissement && data.etablissementsDisponibles) {
                        // Multi-établissements → afficher modal de sélection
                        set({
                            preLoginData: {
                                requiereSelection: true,
                                etablissements: data.etablissementsDisponibles,
                                tokenTemporaire: data.accessToken, // Token avec etablissementId undefined
                                expiresIn: 300, // 5 minutes
                            },
                            showEtablissementModal: true,
                        });
                    } else {
                        // Mono-établissement → redirection directe après récupération profil
                        try {
                            const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
                            if (meResponse.data) {
                                const currentUtilisateur = get().utilisateur;
                                const currentEtablissementId = get().etablissementId; // ✅ Préserver
                                
                                set({ 
                                    utilisateur: {
                                        ...currentUtilisateur,
                                        ...meResponse.data,
                                        permissions: meResponse.data.permissions || [],
                                    },
                                    // ✅ Utiliser etablissementActif du /me OU préserver l'existant
                                    etablissementId: meResponse.data.etablissementActif || currentEtablissementId,
                                    // ✅ Mettre à jour la liste des établissements
                                    etablissements: meResponse.data.etablissements || get().etablissements,
                                });
                            }
                        } catch {
                            // Non-bloquant - préserver l'état existant
                        }
                    }
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                try {
                    await apiClient.logout();
                } catch {
                    // Non-bloquant même si le logout backend échoue
                } finally {
                    apiClient.clearTokens();
                    set(initialState);
                    window.dispatchEvent(new CustomEvent('auth:logout'));
                }
            },

            setTokens: (accessToken: string, refreshToken: string) => {
                apiClient.setTokens({ accessToken, refreshToken });
                set({ accessToken, refreshToken, isAuthenticated: true });
            },

            setUtilisateur: (utilisateur: UtilisateurConnecte) => {
                set({ utilisateur });
            },

            setEtablissements: (etablissements: Etablissement[]) => {
                const actif = etablissements.find(e => e.actif);
                set({
                    etablissements,
                    etablissementId: actif?.etablissementId || etablissements[0]?.etablissementId || null,
                });
            },

            switchEtablissement: async (etablissementId: string) => {
                set({ isLoading: true });
                try {
                    const data = await apiClient.switchEtablissement(etablissementId);
                    
                    // ÉTAPE 1: Mettre à jour accessToken et etablissementId
                    set({
                        accessToken: data.accessToken,
                        etablissementId: data.etablissementActif.id,
                        isLoading: false,
                    });
                    
                    // ÉTAPE 2: Mettre à jour api-client
                    apiClient.setTokens({
                        accessToken: data.accessToken,
                        refreshToken: get().refreshToken!, // Conserver le même refreshToken
                    });

                    // ÉTAPE 3: Charger le profil complet AVEC permissions (CRITIQUE)
                    try {
                        const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
                        if (meResponse.data) {
                            const currentUtilisateur = get().utilisateur;
                            
                            set({ 
                                utilisateur: {
                                    ...currentUtilisateur,
                                    ...meResponse.data,
                                    permissions: meResponse.data.permissions || [],
                                },
                                // Mettre à jour la liste des établissements
                                etablissements: meResponse.data.etablissements || get().etablissements,
                            });
                            
                            console.log('[Auth Store] Permissions mises à jour après switchEtablissement:', 
                                meResponse.data.permissions?.length || 0, 'permissions');
                        }
                    } catch (error) {
                        console.warn('[Auth Store] Échec chargement profil après switchEtablissement (non bloquant):', error);
                    }
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            verifierSession: async () => {
                const { accessToken } = get();
                if (!accessToken) return false;

                try {
                    const response = await apiClient.get('/api/auth/me');
                    if (response.success && response.data) {
                        const userData = response.data as UtilisateurConnecte;
                        set({ 
                            utilisateur: {
                                ...userData,
                                permissions: userData.permissions || [],
                            },
                            isAuthenticated: true 
                        });
                        return true;
                    }
                    return false;
                } catch {
                    apiClient.clearTokens();
                    set(initialState);
                    return false;
                }
            },

            reset: () => {
                apiClient.clearTokens();
                set(initialState);
                
                // FORCER la purge immédiate du localStorage Zustand
                // Le middleware persist peut être asynchrone, on supprime manuellement
                try {
                    localStorage.removeItem('elisaschool-auth');
                } catch (error) {
                    console.error('[Auth Store] Erreur purge localStorage:', error);
                }
            },

            // NOUVEAU v3.0 : Compléter la login après sélection d'établissement
            completeLogin: async (etablissementId: string) => {
                set({ isLoading: true });
                try {
                    const response = await apiClient.post<any>('/api/auth/complete-login', {
                        etablissementId,
                    });

                    if (response.data) {
                        const data = response.data;
                        
                        console.log('[Auth Store] completeLogin - Données reçues:', {
                            userId: data.utilisateur.id,
                            role: data.utilisateur.role,
                            etablissementId: data.utilisateur.etablissementActif,
                            hasRefreshToken: !!data.refreshToken,
                        });
                        
                        // ÉTAPE 1: Mettre à jour les tokens et informations de base
                        set({
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken,
                            etablissementId: data.utilisateur.etablissementActif,
                            etablissements: data.utilisateur.etablissements,
                            utilisateur: {
                                id: data.utilisateur.id,
                                email: data.utilisateur.email,
                                matricule: data.utilisateur.matricule,
                                role: data.utilisateur.role,
                                nom: data.utilisateur.nom,
                                prenom: data.utilisateur.prenom,
                            },
                            isAuthenticated: true,
                            isLoading: false,
                            preLoginData: null,
                            showEtablissementModal: false,
                        });

                        apiClient.setTokens({
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken,
                        });
                        
                        console.log('[Auth Store] Tokens synchronisés avec apiClient:', {
                            hasAccessToken: !!apiClient.getAccessToken(),
                            tokenMatch: apiClient.getAccessToken() === data.accessToken,
                        });

                        console.log('[Auth Store] ÉTAPE 1 terminée - Store mis à jour');

                        // ÉTAPE 2: Charger le profil complet AVEC permissions (CRITIQUE)
                        try {
                            console.log('[Auth Store] Chargement profil complet...');
                            const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
                            console.log('[Auth Store] Réponse /api/auth/me:', {
                                success: meResponse.success,
                                hasData: !!meResponse.data,
                                permissionsCount: meResponse.data?.permissions?.length || 0,
                                role: meResponse.data?.role,
                            });
                            
                            if (meResponse.data) {
                                const currentUtilisateur = get().utilisateur;
                                const currentEtablissementId = get().etablissementId;
                                
                                set({ 
                                    utilisateur: {
                                        ...currentUtilisateur,
                                        ...meResponse.data,
                                        permissions: meResponse.data.permissions || [],
                                    },
                                    // Utiliser etablissementActif du /me OU préserver l'existant
                                    etablissementId: meResponse.data.etablissementActif || currentEtablissementId,
                                    // Mettre à jour la liste des établissements
                                    etablissements: meResponse.data.etablissements || get().etablissements,
                                });
                                
                                console.log('[Auth Store] ÉTAPE 2 terminée - Permissions chargées:', 
                                    meResponse.data.permissions?.length || 0, 'permissions');
                                
                                // ÉTAPE 3: FORCER la synchronisation immédiate avec localStorage
                                // Le middleware persist peut être asynchrone, on attend un tick
                                await new Promise(resolve => setTimeout(resolve, 50));
                                
                                // Vérification finale
                                const finalState = get();
                                console.log('[Auth Store] État final après completeLogin:', {
                                    isAuthenticated: finalState.isAuthenticated,
                                    etablissementId: finalState.etablissementId,
                                    hasPermissions: !!finalState.utilisateur?.permissions,
                                    permissionsCount: finalState.utilisateur?.permissions?.length || 0,
                                    role: finalState.utilisateur?.role,
                                });
                            }
                        } catch (error) {
                            console.warn('[Auth Store] Échec chargement profil après completeLogin (non bloquant):', error);
                            // Non-bloquant - l'utilisateur peut quand même accéder avec les infos de base
                        }
                    }
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            setShowEtablissementModal: (show: boolean) => {
                set({ showEtablissementModal: show });
            },

            // NOUVEAU: Initialisation unique au démarrage
            initialize: () => {
                const state = get();
                if (state._initialized) return;
                
                // Synchroniser les tokens stockés avec api-client
                if (state.accessToken && state.refreshToken) {
                    apiClient.setTokens({
                        accessToken: state.accessToken,
                        refreshToken: state.refreshToken,
                    });
                    console.log('[Auth Store] Tokens synchronisés avec API Client');
                }
                
                set({ _initialized: true });
            },
        }),
        {
            name: 'elisaschool-auth',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                utilisateur: state.utilisateur,
                etablissementId: state.etablissementId,
                etablissements: state.etablissements,
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);
