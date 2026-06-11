/**
 * ==================================
 * eLISAschool - Hook useSecuriteConfig
 * ==================================
 * Hook personnalisé pour la gestion des paramètres de sécurité
 * avec React Query, sauvegarde hybride (auto-save + manuel)
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

// Interface des valeurs de configuration sécurité
export interface SecuriteConfigValues {
    session_duration: number;
    max_login_attempts: number;
    lockout_duration: number;
    require_2fa: boolean;
    password_min_length: number;
    password_require_uppercase: boolean;
    password_require_number: boolean;
    password_require_lowercase: boolean;
    password_require_special: boolean;
    password_history_count: number;
    password_expiry_days: number;
    require_email_verification: boolean;
    allow_self_registration: boolean;
    inactivity_timeout: number;
    ip_whitelist: string;
    log_sensitive_actions: boolean;
    brute_force_protection: boolean;
    rate_limiting: 'low' | 'medium' | 'high';
    security_email_alerts: boolean;
    suspicious_activity_notifications: boolean;
}

// Clés de requête pour React Query
const SECURITE_KEYS = {
    all: ['configuration', 'securite'] as const,
    parametres: () => [...SECURITE_KEYS.all, 'parametres'] as const,
};

// Mapping des clés API vers les clés de l'interface
const PARAM_MAPPING: Record<string, keyof SecuriteConfigValues> = {
    'auth.session_duration': 'session_duration',
    'auth.max_login_attempts': 'max_login_attempts',
    'auth.lockout_duration': 'lockout_duration',
    'auth.require_2fa': 'require_2fa',
    'auth.password_min_length': 'password_min_length',
    'auth.password_require_uppercase': 'password_require_uppercase',
    'auth.password_require_number': 'password_require_number',
    'auth.password_require_lowercase': 'password_require_lowercase',
    'auth.password_require_special': 'password_require_special',
    'auth.password_history_count': 'password_history_count',
    'auth.password_expiry_days': 'password_expiry_days',
    'auth.require_email_verification': 'require_email_verification',
    'auth.allow_self_registration': 'allow_self_registration',
    'auth.inactivity_timeout': 'inactivity_timeout',
    'auth.ip_whitelist': 'ip_whitelist',
    'auth.log_sensitive_actions': 'log_sensitive_actions',
    'auth.brute_force_protection': 'brute_force_protection',
    'auth.rate_limiting': 'rate_limiting',
    'auth.security_email_alerts': 'security_email_alerts',
    'auth.suspicious_activity_notifications': 'suspicious_activity_notifications',
};

// Mapping inverse
const REVERSE_MAPPING: Record<keyof SecuriteConfigValues, string> = Object.fromEntries(
    Object.entries(PARAM_MAPPING).map(([k, v]) => [v, k])
) as Record<keyof SecuriteConfigValues, string>;

/**
 * Hook principal pour la gestion des paramètres de sécurité
 */
export function useSecuriteConfig() {
    const queryClient = useQueryClient();
    const [values, setValues] = useState<Partial<SecuriteConfigValues>>({});
    const [originalValues, setOriginalValues] = useState<Partial<SecuriteConfigValues>>({});
    const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Query: Charger tous les paramètres de sécurité
    const { data: parametresData, isLoading } = useQuery({
        queryKey: SECURITE_KEYS.parametres(),
        queryFn: async () => {
            const response = await apiClient.get('/api/configuration/parametres', {
                params: { categorie: 'SECURITE' }
            });
            return response.data;
        },
        retry: 1,
    });

    // Charger les valeurs depuis les paramètres
    useEffect(() => {
        if (parametresData?.data) {
            const newValues: Partial<SecuriteConfigValues> = {};
            
            parametresData.data.forEach((param: any) => {
                const mappedKey = PARAM_MAPPING[param.cle];
                if (mappedKey) {
                    // Parser la valeur selon le type
                    let valeur: any = param.valeur;
                    try {
                        valeur = JSON.parse(param.valeur);
                    } catch {
                        // Si ce n'est pas du JSON valide, garder la valeur brute
                    }
                    
                    // Convertir selon le type
                    if (param.typeValeur === 'NUMBER') {
                        valeur = Number(valeur);
                    } else if (param.typeValeur === 'BOOLEAN') {
                        valeur = Boolean(valeur);
                    }
                    
                    newValues[mappedKey] = valeur;
                }
            });
            
            setValues(newValues);
            setOriginalValues({ ...newValues });
            setDirtyFields(new Set());
        }
    }, [parametresData]);

    // Mutation: Sauvegarde individuelle d'un paramètre
    const saveParametreMutation = useMutation({
        mutationFn: async ({ cle, valeur }: { cle: string; valeur: any }) => {
            const apiCle = REVERSE_MAPPING[cle as keyof SecuriteConfigValues];
            if (!apiCle) throw new Error(`Clé non mappée: ${cle}`);
            
            return apiClient.put(`/api/configuration/parametres/${apiCle}`, {
                valeur: JSON.stringify(valeur)
            });
        },
        onSuccess: (_, variables) => {
            toast.success('Paramètre enregistré avec succès');
            queryClient.invalidateQueries({ queryKey: SECURITE_KEYS.parametres() });
            setDirtyFields(prev => {
                const next = new Set(prev);
                next.delete(variables.cle);
                return next;
            });
        },
        onError: () => {
            toast.error('Erreur lors de l\'enregistrement du paramètre');
        },
    });

    // Mutation: Sauvegarde en batch
    const saveBatchMutation = useMutation({
        mutationFn: async (params: Array<{ cle: string; valeur: any }>) => {
            const promises = params.map(param => {
                const apiCle = REVERSE_MAPPING[param.cle as keyof SecuriteConfigValues];
                if (!apiCle) throw new Error(`Clé non mappée: ${param.cle}`);
                
                return apiClient.put(`/api/configuration/parametres/${apiCle}`, {
                    valeur: JSON.stringify(param.valeur)
                });
            });
            
            return Promise.all(promises);
        },
        onSuccess: () => {
            toast.success(`${dirtyFields.size} paramètre(s) enregistré(s) avec succès`);
            queryClient.invalidateQueries({ queryKey: SECURITE_KEYS.parametres() });
            setDirtyFields(new Set());
        },
        onError: () => {
            toast.error('Erreur lors de l\'enregistrement des paramètres');
        },
    });

    // Mutation: Actions de sécurité
    const securityActionMutation = useMutation({
        mutationFn: async (action: 'invalidate-sessions' | 'reset-login-attempts' | 'force-password-reset') => {
            const endpoints = {
                'invalidate-sessions': '/api/auth/sessions/invalidate-all',
                'reset-login-attempts': '/api/auth/login-attempts/reset',
                'force-password-reset': '/api/auth/passwords/force-reset-all',
            };
            
            return apiClient.post(endpoints[action]);
        },
        onSuccess: (_, action) => {
            const messages = {
                'invalidate-sessions': 'Toutes les sessions ont été invalidées',
                'reset-login-attempts': 'Les compteurs d\'échec ont été réinitialisés',
                'force-password-reset': 'Le changement de mot de passe a été forcé pour tous les utilisateurs',
            };
            toast.success(messages[action]);
        },
        onError: () => {
            toast.error('Erreur lors de l\'exécution de l\'action de sécurité');
        },
    });

    // Mettre à jour une valeur
    const updateValue = useCallback(<K extends keyof SecuriteConfigValues>(
        key: K,
        value: SecuriteConfigValues[K]
    ) => {
        // Validation
        const validationError = validateField(key, value);
        if (validationError) {
            setErrors(prev => ({ ...prev, [key]: validationError }));
            return;
        }
        
        // Supprimer l'erreur s'il y en avait une
        setErrors(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        
        // Mettre à jour la valeur
        setValues(prev => ({ ...prev, [key]: value }));
        
        // Marquer comme modifié
        setDirtyFields(prev => new Set(prev).add(key));
    }, []);

    // Sauvegarder un paramètre individuel (auto-save pour toggles)
    const saveParametre = useCallback(async (key: string) => {
        const value = values[key as keyof SecuriteConfigValues];
        if (value === undefined) return;
        
        await saveParametreMutation.mutateAsync({ cle: key, valeur: value });
    }, [values, saveParametreMutation]);

    // Sauvegarder tous les paramètres modifiés
    const saveAll = useCallback(async () => {
        if (dirtyFields.size === 0) return;
        
        const params = Array.from(dirtyFields).map(key => ({
            cle: key,
            valeur: values[key as keyof SecuriteConfigValues],
        }));
        
        await saveBatchMutation.mutateAsync(params);
        setOriginalValues({ ...values });
    }, [values, dirtyFields, saveBatchMutation]);

    // Réinitialiser les modifications
    const resetChanges = useCallback(() => {
        setValues({ ...originalValues });
        setDirtyFields(new Set());
        setErrors({});
    }, [originalValues]);

    // Exécuter une action de sécurité
    const executeAction = useCallback(async (action: 'invalidate-sessions' | 'reset-login-attempts' | 'force-password-reset') => {
        await securityActionMutation.mutateAsync(action);
    }, [securityActionMutation]);

    // Vérifier s'il y a des modifications non sauvegardées
    const hasChanges = dirtyFields.size > 0;

    return {
        values,
        isLoading,
        isSaving: saveParametreMutation.isPending || saveBatchMutation.isPending || securityActionMutation.isPending,
        errors,
        dirtyFields,
        updateValue,
        saveParametre,
        saveAll,
        resetChanges,
        hasChanges,
        executeAction,
        modificationsCount: dirtyFields.size,
    };
}

/**
 * Validation d'un champ de configuration
 */
function validateField<K extends keyof SecuriteConfigValues>(
    key: K,
    value: SecuriteConfigValues[K]
): string | null {
    switch (key) {
        case 'session_duration':
            if (typeof value === 'number' && (value < 5 || value > 1440)) {
                return 'La durée de session doit être entre 5 et 1440 minutes';
            }
            break;
        case 'max_login_attempts':
            if (typeof value === 'number' && (value < 3 || value > 10)) {
                return 'Le nombre de tentatives doit être entre 3 et 10';
            }
            break;
        case 'lockout_duration':
            if (typeof value === 'number' && (value < 5 || value > 1440)) {
                return 'La durée de blocage doit être entre 5 et 1440 minutes';
            }
            break;
        case 'password_min_length':
            if (typeof value === 'number' && (value < 6 || value > 32)) {
                return 'La longueur minimale doit être entre 6 et 32 caractères';
            }
            break;
        case 'password_history_count':
            if (typeof value === 'number' && (value < 0 || value > 12)) {
                return 'L\'historique doit être entre 0 et 12';
            }
            break;
        case 'password_expiry_days':
            if (typeof value === 'number' && value < 0) {
                return 'L\'expiration ne peut pas être négative';
            }
            break;
        case 'inactivity_timeout':
            if (typeof value === 'number' && (value < 5 || value > 480)) {
                return 'Le délai d\'inactivité doit être entre 5 et 480 minutes';
            }
            break;
        case 'ip_whitelist':
            if (typeof value === 'string' && value.length > 0) {
                const ips = value.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
                const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
                for (const ip of ips) {
                    if (!ipRegex.test(ip)) {
                        return `Adresse IP invalide: ${ip}`;
                    }
                }
            }
            break;
    }
    
    return null;
}