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
    };
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
            throw new Error('Aucun refresh token disponible');
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
            this.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            throw new Error('Session expirée');
        }

        const result: ApiResponse<TokenPair> = await response.json();
        if (!result.success || !result.data) {
            this.clearTokens();
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

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.request<ApiResponse<T>>(endpoint, { method: 'DELETE' });
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
