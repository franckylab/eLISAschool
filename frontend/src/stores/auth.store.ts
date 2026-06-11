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

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    utilisateur: UtilisateurConnecte | null;
    etablissementId: string | null;
    etablissements: Etablissement[];
    isLoading: boolean;
    isAuthenticated: boolean;

    // Actions
    login: (identifiant: string, motDePasse: string) => Promise<void>;
    logout: () => Promise<void>;
    setTokens: (accessToken: string, refreshToken: string) => void;
    setUtilisateur: (utilisateur: UtilisateurConnecte) => void;
    setEtablissements: (etablissements: Etablissement[]) => void;
    switchEtablissement: (etablissementId: string) => Promise<void>;
    verifierSession: () => Promise<boolean>;
    reset: () => void;
}

const initialState = {
    accessToken: null,
    refreshToken: null,
    utilisateur: null,
    etablissementId: null,
    etablissements: [],
    isLoading: false,
    isAuthenticated: false,
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

                    // Récupérer le profil complet en arrière-plan
                    try {
                        const meResponse = await apiClient.get<UtilisateurConnecte>('/api/auth/me');
                        if (meResponse.data) {
                            set({ utilisateur: meResponse.data });
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
                        set({ utilisateur: response.data as UtilisateurConnecte, isAuthenticated: true });
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
