/**
 * ==================================
 * eLISAschool - Export Config Button
 * ==================================
 * Bouton d'export de la configuration plateforme au format JSON.
 * Permet de télécharger un snapshot de tous les paramètres système
 * pour archivage, audit ou migration.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ParametreSysteme, CategorieParametre } from '@/features/configuration/types/configuration.types';

interface ExportConfigButtonProps {
    /** Variante du bouton */
    variant?: 'primary' | 'outline' | 'ghost';
    /** Taille du bouton */
    size?: 'sm' | 'md' | 'lg';
    /** Catégories à exporter (défaut: toutes) */
    categories?: CategorieParametre[];
    /** Inclure les valeurs ENCRYPTED (défaut: false — masquées) */
    includeEncrypted?: boolean;
}

const TOUTES_CATEGORIES: CategorieParametre[] = [
    'SYSTEME', 'SECURITE', 'ETABLISSEMENT', 'MODULE',
    'THEME', 'NOTIFICATION', 'REGIONAL', 'CUSTOM',
];

export function ExportConfigButton({
    variant = 'outline',
    size = 'sm',
    categories = TOUTES_CATEGORIES,
    includeEncrypted = false,
}: ExportConfigButtonProps) {
    const { t } = useTranslation('config-params');
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = useCallback(async () => {
        setIsLoading(true);

        try {
            // Charger tous les paramètres des catégories sélectionnées
            const promises = categories.map(cat =>
                apiClient.get<{ success: boolean; data: ParametreSysteme[] }>(
                    `/api/platform/configuration/parametres/categorie/${cat}`
                )
            );

            const responses = await Promise.all(promises);
            const allParams: ParametreSysteme[] = [];

            for (const res of responses) {
                const data = res.data?.data ?? res.data ?? [];
                allParams.push(...(Array.isArray(data) ? data : []));
            }

            // Filtrer les paramètres ENCRYPTED si demandé
            const filteredParams = includeEncrypted
                ? allParams
                : allParams.map(p =>
                    p.typeValeur === 'ENCRYPTED'
                        ? { ...p, valeur: '********' }
                        : p
                );

            // Construire le snapshot
            const snapshot = {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                totalParameters: filteredParams.length,
                categories: categories,
                parameters: filteredParams.map(p => ({
                    cle: p.cle,
                    valeur: p.valeur,
                    typeValeur: p.typeValeur,
                    categorie: p.categorie,
                    module: p.module,
                    description: p.description,
                })),
            };

            // Télécharger le fichier JSON
            const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `elisaschool-config-export-${dateStr}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success(t('export.succes', { count: filteredParams.length }));
        } catch {
            toast.error(t('export.erreur'));
        } finally {
            setIsLoading(false);
        }
    }, [categories, includeEncrypted, t]);

    return (
        <ElisaButton
            variant={variant}
            size={size}
            onClick={handleExport}
            chargement={isLoading}
            icon={<Download className="h-4 w-4" />}
        >
            {t('exporter')}
        </ElisaButton>
    );
}
