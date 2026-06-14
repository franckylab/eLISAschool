/**
 * ==================================
 * eLISAschool - Store d'authentification
 * ==================================
 * Zustand store avec persist pour la gestion de l'authentification JWT
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

export interface UtilisateurConnecte {
    id: string;
    email: string;
    matricule: string;
    role: string;
    nom: string;
    prenom: string;
    permissions?: string[];
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

export interface PreLoginResponse {
    requiereSelection: boolean;
    etablissements?: EtablissementDisponible[];
    tokenTemporaire?: string;
    expiresIn?: number;
}

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    utilisateur: UtilisateurConnecte | null;
    etablissementId: string | null;
    etablissements: Etablissement[];
    isLoading: boolean;
    isAuthenticated: boolean;
    
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
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            ...initialState,

            login: async (identifiant: string, motDePasse: string) => {
                set({ isLoading: true });
                try {
                    const data = await apiClient.login(identifiant, motDePasse);
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
                        isAuthenticated: true,
                        isLoading: false,
                    });

                    // Récupérer le profil complet en arrière-plan (avec permissions)
                    try {
                        const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
                        if (meResponse.data) {
                            const currentUtilisateur = get().utilisateur;
                            set({ 
                                utilisateur: {
                                    ...currentUtilisateur,
                                    ...meResponse.data,
                                    permissions: meResponse.data.permissions || [],
                                } 
                            });
                        }
                    } catch {
                        // Non-bloquant
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
                    set({
                        accessToken: data.accessToken,
                        etablissementId: data.etablissementActif.id,
                        isLoading: false,
                    });
                    apiClient.setTokens({
                        accessToken: data.accessToken,
                        refreshToken: get().refreshToken!,
                    });
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
                    }
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            setShowEtablissementModal: (show: boolean) => {
                set({ showEtablissementModal: show });
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
