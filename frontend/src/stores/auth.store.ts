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

interface EtablissementStore {
    id: string;
    nom?: string;
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
    etablissementsDisponibles: EtablissementDisponible[]; // Nouveau: avec noms
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
    setEtablissementsDisponibles: (etablissements: EtablissementDisponible[]) => void; // Nouveau
    fetchEtablissementsDisponibles: () => Promise<void>; // Nouveau
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
    etablissementsDisponibles: [], // Nouveau
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

            setEtablissementsDisponibles: (etablissements: EtablissementDisponible[]) => {
                console.log('[Auth Store] setEtablissementsDisponibles:', etablissements);
                set({ etablissementsDisponibles: etablissements });
            },

            fetchEtablissementsDisponibles: async () => {
                try {
                    const etablissements = await apiClient.getEtablissementsDisponibles();
                    console.log('[Auth Store] fetchEtablissementsDisponibles:', etablissements);
                    set({ etablissementsDisponibles: etablissements });
                } catch (error) {
                    console.warn('[Auth Store] Erreur chargement etablissementsDisponibles:', error);
                }
            },

            login: async (identifiant: string, motDePasse: string) => {
                set({ isLoading: true });
                try {
                    // Étape 1 : Login - retourne MAINTENANT requiereSelectionEtablissement
                    const data = await apiClient.login(identifiant, motDePasse);
                    
                    // Étape 2 : Stocker les infos utilisateur SANS token complet si multi-établissements
                    const newState = {
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
                        etablissementsDisponibles: data.etablissementsDisponibles || [], // Nouveau
                        etablissementId: data.utilisateur.etablissementActif || null,
                        isAuthenticated: true,
                        isLoading: false,
                    };
                    
                    const etabNom = data.etablissementsDisponibles?.find(e => e.id === newState.etablissementId)?.nom || 'Non trouvé';
                    console.log('[Auth Store] Login initialisé. Établissement actif:', newState.etablissementId, '- Nom:', etabNom);
                    
                    set(newState);

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
                                const resolvedEtablissementId = meResponse.data.etablissementActif || currentEtablissementId;
                                
                                console.log('[Auth Store] login/me - Établissement actif résolu par le backend:', meResponse.data.etablissementActif, 'conservé localement:', resolvedEtablissementId);
                                
                                set({ 
                                    utilisateur: {
                                        ...currentUtilisateur,
                                        ...meResponse.data,
                                        permissions: meResponse.data.permissions || [],
                                    },
                                    // ✅ Utiliser etablissementActif du /me OU préserver l'existant
                                    etablissementId: resolvedEtablissementId,
                                    // ✅ Mettre à jour la liste des établissements
                                    etablissements: meResponse.data.etablissements || get().etablissements,
                                });
                            }
                        } catch (error) {
                            console.warn('[Auth Store] Échec chargement profil dans login (non bloquant):', error);
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
                const resolvedId = actif?.etablissementId || etablissements[0]?.etablissementId || null;
                console.log('[Auth Store] setEtablissements - Établissement actif détecté:', resolvedId, 'depuis les établissements:', etablissements);
                set({
                    etablissements,
                    etablissementId: resolvedId,
                });
            },

            switchEtablissement: async (etablissementId: string) => {
                set({ isLoading: true });
                try {
                    const data = await apiClient.switchEtablissement(etablissementId);
                    
                    // ÉTAPE 1: Mettre à jour accessToken et etablissementId
                    const etabNom = get().etablissementsDisponibles?.find(e => e.id === etablissementId)?.nom || 'Non trouvé';
                    console.log('[Auth Store] switchEtablissement - Nouveau token reçu. Établissement actif:', data.etablissementActif.id, '- Nom:', etabNom);
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
                            console.log('[Auth Store] switchEtablissement/me - Profil rechargé. Établissement actif du profil:', meResponse.data.etablissementActif);
                            
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
                        console.log('[Auth Store] verifierSession - Session active valide. Établissement actif dans le profil:', userData.etablissementActif, 'Établissement actif actuel du store:', get().etablissementId);
                        
                        set({ 
                            utilisateur: {
                                ...userData,
                                permissions: userData.permissions || [],
                            },
                            // S'assurer de synchroniser l'établissement actif du /me
                            etablissementId: userData.etablissementActif || get().etablissementId,
                            isAuthenticated: true 
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.warn('[Auth Store] verifierSession - Échec vérification session (non bloquant):', error);
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
                        
                        const etabNom = data.etablissementsDisponibles?.find((e: any) => e.id === data.utilisateur.etablissementActif)?.nom || 'Non trouvé';
                        console.log('[Auth Store] completeLogin - Données reçues:', {
                            userId: data.utilisateur.id,
                            role: data.utilisateur.role,
                            etablissementId: data.utilisateur.etablissementActif,
                            etablissementNom: etabNom,
                            hasRefreshToken: !!data.refreshToken,
                        });
                        
                        // ÉTAPE 1: Mettre à jour les tokens et informations de base
                        set({
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken,
                            etablissementId: data.utilisateur.etablissementActif,
                            etablissements: data.utilisateur.etablissements,
                            etablissementsDisponibles: data.etablissementsDisponibles || [], // Nouveau
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
            initialize: async () => {
                const state = get();
                if (state._initialized) return;
                
                console.log('[Auth Store] Initialisation du store... État actuel:', {
                    isAuthenticated: state.isAuthenticated,
                    etablissementId: state.etablissementId,
                    etablissements: state.etablissements,
                    utilisateur: state.utilisateur ? { id: state.utilisateur.id, role: state.utilisateur.role } : null
                });
                
                // Synchroniser les tokens stockés avec api-client
                if (state.accessToken && state.refreshToken) {
                    apiClient.setTokens({
                        accessToken: state.accessToken,
                        refreshToken: state.refreshToken,
                    });
                    const etabNom = state.etablissementsDisponibles?.find(e => e.id === state.etablissementId)?.nom || 'Non trouvé';
                    console.log('[Auth Store] Tokens synchronisés avec API Client. Établissement actif initialisé au démarrage:', state.etablissementId, '- Nom:', etabNom);
                    
                    // Fetch etablissementsDisponibles if not already present
                    if (state.isAuthenticated && state.etablissementsDisponibles.length === 0) {
                        console.log('[Auth Store] Chargement des etablissementsDisponibles...');
                        await get().fetchEtablissementsDisponibles();
                    }
                }
                
                set({ _initialized: true });
                console.log('[Auth Store] Initialisation terminée');
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
                etablissementsDisponibles: state.etablissementsDisponibles, // Ajouté pour persister les noms d'établissements
                isAuthenticated: state.isAuthenticated,
            }),
        },
    ),
);

// Subscribe to store changes to log establishment state
useAuthStore.subscribe((state, prevState) => {
    if (state.etablissementId !== prevState.etablissementId) {
        const ancienNom = state.etablissementsDisponibles?.find(e => e.id === prevState.etablissementId)?.nom || 'Non trouvé';
        const nouveauNom = state.etablissementsDisponibles?.find(e => e.id === state.etablissementId)?.nom || 'Non trouvé';
        console.log('[Auth Store] ÉTAT CHANGÉ - Établissement actif:', {
            ancien: { id: prevState.etablissementId, nom: ancienNom },
            nouveau: { id: state.etablissementId, nom: nouveauNom },
            moment: new Date().toISOString()
        });
    }
    if (state.etablissementsDisponibles !== prevState.etablissementsDisponibles) {
        console.log('[Auth Store] ÉTAT CHANGÉ - Liste des établissements (disponibles):', {
            ancienne: prevState.etablissementsDisponibles,
            nouvelle: state.etablissementsDisponibles,
            moment: new Date().toISOString()
        });
    }
    // Log initial state on first subscription
    if (!prevState._initialized) {
        const initialEtabNom = state.etablissementsDisponibles?.find(e => e.id === state.etablissementId)?.nom || 'Non trouvé';
        console.log('[Auth Store] ÉTAT INITIAL - Établissement actif:', { id: state.etablissementId, nom: initialEtabNom }, 'Liste des établissements:', state.etablissementsDisponibles);
    }
});
