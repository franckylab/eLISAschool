/**
 * ==================================
 * eLISAschool - Client API
 * ==================================
 * Client HTTP avec interceptors JWT (refresh automatique)
 * Utilise fetch natif avec gestion des erreurs et retry
 */

import type { ApiResponse, PaginatedResult, PaginationOptions } from '@shared/types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

interface LoginResponseData {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    utilisateur: {
        id: string;
        email: string;
        matricule: string;
        role: string;
        nom: string;
        prenom: string;
        etablissementActif?: string;
        etablissements?: Array<{
            etablissementId: string;
            role: string;
            etablissementPrincipal: boolean;
            actif: boolean;
        }>;
    };
    // NOUVEAU v3.0
    etablissementsDisponibles?: Array<{
        id: string;
        nom: string;
        code?: string;
        role: string;
        etablissementPrincipal: boolean;
        logoUrl?: string;
    }>;
    requiereSelectionEtablissement?: boolean;
    tokenTemporaire?: boolean;
}

export interface PreLoginResponse {
    requiereSelection: boolean;
    etablissements?: Array<{
        id: string;
        nom: string;
        code?: string;
        role: string;
        etablissementPrincipal: boolean;
        logoUrl?: string;
    }>;
    tokenTemporaire?: string;
    expiresIn?: number;
}

interface SwitchEtablissementResponse {
    accessToken: string;
    etablissementActif: {
        id: string;
        role: string;
    };
}

type RequestInterceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string };
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

class ApiClient {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private isRefreshing = false;
    private refreshSubscribers: Array<(token: string) => void> = [];
    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];

    constructor() {
        // Restaurer les tokens depuis localStorage
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        
        // Validation au démarrage
        this.validateTokenOnStartup();
    }

    /**
     * Valider le token au démarrage de l'application
     */
    private validateTokenOnStartup(): void {
        if (this.accessToken) {
            const payload = this.decodeJWT(this.accessToken);
            
            if (payload && !payload.etablissementId) {
                console.warn('[API] Token stocké sans etablissementId - sélection requise');
                
                // Vérifier si le modal n'est pas déjà affiché (éviter boucle infinie)
                try {
                    const { useAuthStore } = require('@/stores/auth.store');
                    const state = useAuthStore.getState();
                    
                    if (state.showEtablissementModal) {
                        console.log('[API] Modal déjà affiché, événement ignoré');
                        return;
                    }
                    
                    if (state.etablissementId) {
                        console.log('[API] Établissement déjà sélectionné, événement ignoré');
                        return;
                    }
                } catch (error) {
                    // Import échoué, continuer quand même
                }
                
                // Déclencher événement pour afficher modal
                window.dispatchEvent(new CustomEvent('auth:etablissement-required'));
            }
        }
    }

    /**
     * Décoder le JWT sans vérification de signature (pour validation client)
     */
    private decodeJWT(token: string): any {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    }

    /**
     * Valider que le token contient un etablissementId avant envoi
     */
    private validateTokenBeforeRequest(): boolean {
        if (!this.accessToken) return false;
        
        try {
            const payload = this.decodeJWT(this.accessToken);
            
            if (!payload) {
                console.error('[API] Token invalide');
                return false;
            }
            
            // Vérifier que etablissementId est présent
            if (!payload.etablissementId) {
                console.warn('[API] Token incomplet: etablissementId manquant');
                
                // Vérifier si le modal n'est pas déjà affiché (éviter boucle infinie)
                try {
                    const { useAuthStore } = require('@/stores/auth.store');
                    const state = useAuthStore.getState();
                    
                    if (state.showEtablissementModal) {
                        console.log('[API] Modal déjà affiché, événement ignoré');
                        return false;
                    }
                    
                    if (state.etablissementId) {
                        console.log('[API] Établissement déjà sélectionné, événement ignoré');
                        return false;
                    }
                } catch (error) {
                    // Import échoué, continuer quand même
                }
                
                // Déclencher événement pour afficher modal sélection
                window.dispatchEvent(new CustomEvent('auth:etablissement-required'));
                
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('[API] Erreur validation token:', error);
            return false;
        }
    }

    // ─── Gestion des tokens ──────────────────────────────

    setTokens(tokens: TokenPair): void {
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
    }

    clearTokens(): void {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    isAuthenticated(): boolean {
        return !!this.accessToken;
    }

    // ─── Intercepteurs ───────────────────────────────────

    addRequestInterceptor(interceptor: RequestInterceptor): () => void {
        this.requestInterceptors.push(interceptor);
        return () => {
            this.requestInterceptors = this.requestInterceptors.filter(i => i !== interceptor);
        };
    }

    addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
        this.responseInterceptors.push(interceptor);
        return () => {
            this.responseInterceptors = this.responseInterceptors.filter(i => i !== interceptor);
        };
    }

    // ─── Refresh token ───────────────────────────────────

    private async refreshAccessToken(): Promise<string> {
        if (!this.refreshToken) {
            // Aucun refresh token → session expirée
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            throw new Error('Aucun refresh token disponible');
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
            // Refresh token invalide ou expiré
            this.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            throw new Error('Session expirée');
        }

        const result: ApiResponse<TokenPair> = await response.json();
        if (!result.success || !result.data) {
            // Réponse invalide du serveur
            this.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            throw new Error('Échec du rafraîchissement du token');
        }

        this.setTokens(result.data);
        return result.data.accessToken;
    }

    private async processQueue(error: Error | null, token: string | null): Promise<void> {
        this.refreshSubscribers.forEach(callback => {
            if (error) {
                // En cas d'erreur, on ne fait rien — les requêtes en attente échoueront
            } else if (token) {
                callback(token);
            }
        });
        this.refreshSubscribers = [];
    }

    // ─── Méthodes HTTP ───────────────────────────────────

    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        retryCount = 0,
    ): Promise<T> {
        // EXCEPTIONS: Routes auth n'ont pas besoin de validation etablissementId
        const authRoutes = [
            '/api/auth/login',
            '/api/auth/register',
            '/api/auth/refresh',
            '/api/auth/pre-login',
            '/api/auth/complete-login',
            '/api/auth/etablissements-disponibles', // ← NOUVEAU: requis pour EtablissementSwitcher
        ];
        const isAuthRoute = authRoutes.some(route => endpoint.startsWith(route));
        
        // Valider le token AVANT envoi (sauf routes auth)
        if (!isAuthRoute && !this.validateTokenBeforeRequest()) {
            throw new Error('Token incomplet: veuillez sélectionner votre établissement');
        }
        
        let config: RequestInit & { url: string } = {
            ...options,
            url: `${API_BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        // Ajouter le Bearer token
        if (this.accessToken) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${this.accessToken}`,
            };
            
            // Log de débogage pour les requêtes API
            if (endpoint.includes('/niveaux')) {
                console.log('[API Client] Requête avec token:', {
                    endpoint,
                    hasToken: !!this.accessToken,
                    tokenPrefix: this.accessToken.substring(0, 20) + '...',
                    hasEtablissementId: this.decodeJWT(this.accessToken)?.etablissementId,
                });
            }
        }

        // Appliquer les intercepteurs de requête
        for (const interceptor of this.requestInterceptors) {
            config = interceptor(config);
        }

        let response: Response;
        try {
            response = await fetch(config.url, config);
        } catch (networkError) {
            // Retry réseau (max 2)
            if (retryCount < 2) {
                await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
                return this.request<T>(endpoint, options, retryCount + 1);
            }
            throw new Error('Erreur réseau, vérifiez votre connexion');
        }

        // Gestion du 401 → refresh token → retry
        if (response.status === 401 && this.refreshToken && retryCount === 0) {
            if (this.isRefreshing) {
                // Attendre que le refresh en cours se termine
                const newToken = await new Promise<string>((resolve) => {
                    this.refreshSubscribers.push(resolve);
                });
                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${newToken}`,
                };
                response = await fetch(config.url, config);
            } else {
                this.isRefreshing = true;
                try {
                    const newToken = await this.refreshAccessToken();
                    await this.processQueue(null, newToken);
                    config.headers = {
                        ...config.headers,
                        Authorization: `Bearer ${newToken}`,
                    };
                    response = await fetch(config.url, config);
                } catch (refreshError) {
                    await this.processQueue(refreshError as Error, null);
                    // Refresh échoué → déconnexion (l'événement est déjà dispatché dans refreshAccessToken)
                    this.clearTokens();
                    throw refreshError;
                } finally {
                    this.isRefreshing = false;
                }
            }
        }

        // Appliquer les intercepteurs de réponse
        for (const interceptor of this.responseInterceptors) {
            response = await interceptor(response);
        }

        // Gérer les erreurs
        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            const apiError = {
                status: response.status,
                code: errorBody?.error?.code || 'UNKNOWN_ERROR',
                message: errorBody?.error?.message || `Erreur ${response.status}`,
                details: errorBody?.error?.details,
            };
            
            // EXCEPTION: Routes auth (login, register) - NE PAS traiter 401 comme session expirée
            const isAuthRoute = endpoint.startsWith('/api/auth/login') || 
                               endpoint.startsWith('/api/auth/register');
            
            // 401 après refresh ou sans refresh token → déconnexion (SAUF pour login/register)
            if (response.status === 401 && !this.refreshToken && !isAuthRoute) {
                this.clearTokens();
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
                throw new Error('Session expirée - veuillez vous reconnecter');
            }
            
            // Pour login/register, toujours propager l'erreur API normale
            if (isAuthRoute) {
                throw apiError;
            }
            
            // 403 → Interdit
            if (response.status === 403) {
                console.error('[API] Accès interdit (403):', apiError.message);
            }
            
            throw apiError;
        }

        // Pas de contenu
        if (response.status === 204) {
            return undefined as T;
        }

        return response.json() as Promise<T>;
    }

    // ─── Helpers HTTP ────────────────────────────────────

    async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
        let url = endpoint;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }
        return this.request<ApiResponse<T>>(url);
    }

    async getPaginated<T>(endpoint: string, options?: PaginationOptions): Promise<ApiResponse<PaginatedResult<T>>> {
        const params: Record<string, string | number | undefined> = {};
        if (options?.page) params.page = options.page;
        if (options?.limit) params.limit = options.limit;
        if (options?.sortBy) params.sortBy = options.sortBy;
        if (options?.sortOrder) params.sortOrder = options.sortOrder;
        return this.get<PaginatedResult<T>>(endpoint, params);
    }

    async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<ApiResponse<T>>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<ApiResponse<T>>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        return this.request<ApiResponse<T>>(endpoint, {
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string, body?: Record<string, any>): Promise<ApiResponse<T>> {
        const options: RequestInit = body
            ? { method: 'DELETE', body: JSON.stringify(body) }
            : { method: 'DELETE' };
        return this.request<ApiResponse<T>>(endpoint, options);
    }

    async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
        const config: RequestInit & { url: string } = {
            method: 'POST',
            url: `${API_BASE_URL}${endpoint}`,
            body: formData,
            headers: {
                ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
            },
        };

        const response = await fetch(config.url, config);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw {
                status: response.status,
                code: errorBody?.error?.code || 'UPLOAD_ERROR',
                message: errorBody?.error?.message || 'Erreur lors de l\'upload',
            };
        }

        return response.json() as Promise<ApiResponse<T>>;
    }

    // ─── Endpoints auth spécifiques ──────────────────────

    async login(identifiant: string, motDePasse: string): Promise<LoginResponseData> {
        const response = await this.request<ApiResponse<LoginResponseData>>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifiant, motDePasse }),
        });
        if (response.data) {
            this.setTokens({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
            });
        }
        return response.data!;
    }

    async logout(): Promise<void> {
        try {
            await this.post('/api/auth/logout', { refreshToken: this.refreshToken });
        } finally {
            this.clearTokens();
        }
    }

    // ─── NOUVEAU v3.0 - Sélection d'établissement ──────────────────────────────

    /**
     * Étape 1 : Pré-login - Récupère les établissements disponibles
     * Retourne是否需要 sélection et token temporaire si multi-établissements
     */
    async preLogin(): Promise<PreLoginResponse> {
        const response = await this.request<ApiResponse<PreLoginResponse>>('/api/auth/pre-login', {
            method: 'POST',
        });
        return response.data!;
    }

    /**
     * Étape 2 : Complete-login - Finalise la connexion avec l'établissement sélectionné
     */
    async completeLogin(etablissementId: string): Promise<LoginResponseData> {
        const response = await this.request<ApiResponse<LoginResponseData>>('/api/auth/complete-login', {
            method: 'POST',
            body: JSON.stringify({ etablissementId }),
        });
        if (response.data) {
            this.setTokens({
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
            });
        }
        return response.data!;
    }

    /**
     * Récupère tous les établissements disponibles pour l'utilisateur
     */
    async getEtablissementsDisponibles(): Promise<Array<{
        id: string;
        nom: string;
        code?: string;
        role: string;
        etablissementPrincipal: boolean;
    }>> {
        const response = await this.request<ApiResponse<Array<{
            id: string;
            nom: string;
            code?: string;
            role: string;
            etablissementPrincipal: boolean;
        }>>>('/api/auth/etablissements-disponibles');
        return response.data || [];
    }

    async getMe() {
        return this.get('/api/auth/me');
    }

    async switchEtablissement(etablissementId: string): Promise<SwitchEtablissementResponse> {
        const response = await this.post<SwitchEtablissementResponse>(
            '/api/auth/switch-etablissement',
            { etablissementId },
        );
        if (response.data?.accessToken) {
            this.accessToken = response.data.accessToken;
            localStorage.setItem('accessToken', response.data.accessToken);
        }
        return response.data!;
    }
}

// Instance singleton exportée
export const apiClient = new ApiClient();
export default apiClient;
