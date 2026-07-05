/**
 * ==================================
 * eLISAschool - Hook useDataTablePreferences
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Hook de persistance des préférences DataTable avec:
 * - Synchronisation hybrid (debounce + unmount + interval)
 * - Fallback offline avec file d'attente
 * - Cache localStorage pour chargement instantané
 * - Multi-tenant (par établissement)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    DataTablePreferences,
    DataTablePreferencesPartial,
    getPreferenceKey,
    DEFAULT_DATATABLE_PREFERENCES,
    validatePreferences,
} from '@/types/datatable-preferences.types';
import { useAuthStore } from '@/stores/auth.store';

// ============================================
// Configuration
// ============================================

const DEBOUNCE_DELAY = 500; // 500ms
const AUTO_SAVE_INTERVAL = 30000; // 30 secondes
const LOCAL_STORAGE_PREFIX = 'datatable.pending.';

// ============================================
// API Client minimal
// ============================================

async function apiSetPreference(cle: string, valeur: string, etablissementId?: string): Promise<void> {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
        throw new Error('Non authentifié');
    }
    
    const response = await fetch('/api/preferences/set', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ cle, valeur, etablissementId }),
    });

    if (!response.ok) {
        if (response.status === 404) {
            console.debug('[DataTable] Prefs API not available (404) - skipping save');
            return;
        }
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`HTTP ${response.status}: ${error.error?.message || response.statusText}`);
    }
}

async function apiGetPreference(cle: string): Promise<string | null> {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return null;

    try {
        const response = await fetch(`/api/preferences/my/${cle}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) return null;
        const json = await response.json();
        return json?.data?.valeur ?? null;
    } catch {
        return null;
    }
}

// ============================================
// Hook principal
// ============================================

interface UseDataTablePreferencesReturn {
    preferences: DataTablePreferences;
    updatePreferences: (partial: DataTablePreferencesPartial) => void;
    saveNow: () => Promise<void>;
    resetPreferences: () => void;
    isSaving: boolean;
    hasPendingChanges: boolean;
}

export function useDataTablePreferences(
    tableId: string,
    initialPreferences?: Partial<DataTablePreferences>
): UseDataTablePreferencesReturn {
    const { utilisateur } = useAuthStore();
    const etablissementId = utilisateur?.etablissementId;
    const preferenceKey = getPreferenceKey(tableId);
    const localStorageKey = `datatable.${preferenceKey}`;
    const pendingKey = `${LOCAL_STORAGE_PREFIX}${preferenceKey}`;

    // État
    const [preferences, setPreferences] = useState<DataTablePreferences>(() => {
        // 1. Essayer de charger depuis localStorage (instantané)
        try {
            const cached = localStorage.getItem(localStorageKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                const validated = validatePreferences(parsed);
                if (validated) {
                    return { ...DEFAULT_DATATABLE_PREFERENCES, ...validated, ...initialPreferences };
                }
            }
        } catch {
            // Ignorer erreurs de parsing
        }

        // 2. Fallback sur valeurs par défaut
        return { ...DEFAULT_DATATABLE_PREFERENCES, ...initialPreferences };
    });

    const [isSaving, setIsSaving] = useState(false);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);

    // Refs pour timers et état pending
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const autoSaveTimerRef = useRef<ReturnType<typeof setInterval>>();
    const pendingChangesRef = useRef<DataTablePreferencesPartial>({});
    const preferencesRef = useRef(preferences);

    // Garder la ref à jour
    useEffect(() => {
        preferencesRef.current = preferences;
    }, [preferences]);

    // ============================================
    // Chargement initial depuis le backend
    // ============================================
    useEffect(() => {
        let mounted = true;

        async function loadFromBackend() {
            try {
                const valeur = await apiGetPreference(preferenceKey);
                if (valeur && mounted) {
                    const parsed = JSON.parse(valeur);
                    const validated = validatePreferences(parsed);
                    if (validated) {
                        setPreferences(validated);
                        // Mettre en cache localStorage
                        localStorage.setItem(localStorageKey, valeur);
                    }
                }
            } catch {
                // Backend preferences API may not exist — silent fallback
            }
        }

        loadFromBackend();

        return () => {
            mounted = false;
        };
    }, [preferenceKey, tableId]);

    // ============================================
    // Retry des sauvegardes pending (offline → online)
    // ============================================
    useEffect(() => {
        // Vérifier s'il y a des sauvegardes pending au montage
        const pending = localStorage.getItem(pendingKey);
        if (pending && navigator.onLine) {
            retryPendingSaves();
        }

        // Écuteur le retour de la connexion
        function handleOnline() {
            retryPendingSaves();
        }

        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [pendingKey]);

    async function retryPendingSaves() {
        const pending = localStorage.getItem(pendingKey);
        if (!pending) return;

        try {
            const parsed = JSON.parse(pending);
            await apiSetPreference(preferenceKey, JSON.stringify(parsed), etablissementId);
            
            // Succès : supprimer de localStorage
            localStorage.removeItem(pendingKey);
            console.log(`[DataTable] Sauvegarde pending synchronisée: ${tableId}`);
        } catch (error) {
            console.warn(`[DataTable] Échec retry sauvegarde pending:`, error);
        }
    }

    // ============================================
    // Sauvegarde vers le backend
    // ============================================
    const saveToBackend = useCallback(async (prefs: DataTablePreferences) => {
        setIsSaving(true);
        try {
            const valeur = JSON.stringify(prefs);
            await apiSetPreference(preferenceKey, valeur, etablissementId);
            
            // Succès : mettre en cache localStorage et supprimer pending
            localStorage.setItem(localStorageKey, valeur);
            localStorage.removeItem(pendingKey);
            setHasPendingChanges(false);
            pendingChangesRef.current = {};
        } catch (error) {
            // Échec : stocker en localStorage pour retry plus tard
            localStorage.setItem(pendingKey, JSON.stringify(prefs));
            setHasPendingChanges(true);
            console.warn(`[DataTable] Sauvegarde échouée (offline?), mise en file d'attente:`, error);
        } finally {
            setIsSaving(false);
        }
    }, [preferenceKey, etablissementId, localStorageKey, pendingKey]);

    // ============================================
    // Sauvegarde immédiate (force save)
    // ============================================
    const saveNow = useCallback(async () => {
        const current = preferencesRef.current;
        const pending = pendingChangesRef.current;
        
        // Merge pending changes
        const toSave = { ...current, ...pending, lastSaved: new Date().toISOString() };
        
        await saveToBackend(toSave);
    }, [saveToBackend]);

    // ============================================
    // Mise à jour des préférences (avec debounce)
    // ============================================
    const updatePreferences = useCallback((partial: DataTablePreferencesPartial) => {
        // Mettre à jour l'état local immédiatement (réactif)
        setPreferences((prev) => {
            const updated = { ...prev, ...partial, lastSaved: new Date().toISOString() };
            return updated;
        });

        // Accumuler les changements pending
        pendingChangesRef.current = {
            ...pendingChangesRef.current,
            ...partial,
        };

        // Debounce save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            saveNow();
        }, DEBOUNCE_DELAY);
    }, [saveNow]);

    // ============================================
    // Reset aux valeurs par défaut
    // ============================================
    const resetPreferences = useCallback(() => {
        const defaults = { ...DEFAULT_DATATABLE_PREFERENCES, ...initialPreferences };
        setPreferences(defaults);
        pendingChangesRef.current = {};
        localStorage.removeItem(localStorageKey);
        localStorage.removeItem(pendingKey);
    }, [localStorageKey, pendingKey, initialPreferences]);

    // ============================================
    // Sauvegarde au démontage (cleanup)
    // ============================================
    useEffect(() => {
        return () => {
            // Clear debounce timer
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // Force save s'il y a des changements pending
            if (Object.keys(pendingChangesRef.current).length > 0) {
                saveNow();
            }
        };
    }, [saveNow]);

    // ============================================
    // Auto-save toutes les 30 secondes
    // ============================================
    useEffect(() => {
        autoSaveTimerRef.current = setInterval(() => {
            if (Object.keys(pendingChangesRef.current).length > 0) {
                saveNow();
            }
        }, AUTO_SAVE_INTERVAL);

        return () => {
            if (autoSaveTimerRef.current) {
                clearInterval(autoSaveTimerRef.current);
            }
        };
    }, [saveNow]);

    return {
        preferences,
        updatePreferences,
        saveNow,
        resetPreferences,
        isSaving,
        hasPendingChanges,
    };
}
