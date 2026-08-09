/**
 * ==================================
 * eLISAschool - Composant Gestion des Backups
 * ==================================
 * Section plateforme pour gérer les backups :
 * - Planification (schedule)
 * - Déclenchement manuel (trigger)
 * - Liste des backups
 * - Restauration
 *
 * Phase P2 — Refonte SaaS v6
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/Badge';
import {
    Database,
    Play,
    Clock,
    Download,
    Trash2,
    CheckCircle,
    XCircle,
    Loader2,
    Calendar,
    HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================================
// Types
// ==================================
interface BackupSchedule {
    id: string;
    etablissementId: string;
    frequence: 'daily' | 'weekly' | 'monthly';
    heureExecution: string;
    typeBackup: 'complet' | 'differentiel';
    providerName: string;
    retentionJours: number;
    actif: boolean;
    dernierBackupReussi?: string;
    prochainBackupPrevu?: string;
}

interface BackupRecord {
    id: string;
    etablissementId: string;
    type: string;
    statut: string;
    tailleBytes?: number;
    createdAt: string;
    providerName?: string;
}

// ==================================
// Hook queries
// ==================================
function useBackupSchedule(etablissementId: string) {
    return useQuery({
        queryKey: ['backup-schedule', etablissementId],
        queryFn: async () => {
            const res = await apiClient.get<{ data: BackupSchedule | null }>(`/api/backups/schedule`);
            return res.data?.data;
        },
        enabled: !!etablissementId,
    });
}

function useBackupList(etablissementId: string) {
    return useQuery({
        queryKey: ['backups', etablissementId],
        queryFn: async () => {
            const res = await apiClient.get<{ data: BackupRecord[] }>(`/api/backups`);
            return res.data?.data || [];
        },
        enabled: !!etablissementId,
    });
}

// ==================================
// Composant principal
// ==================================
export function BackupManagement({ etablissementId }: { etablissementId: string }) {
    const queryClient = useQueryClient();
    const { data: schedule, isLoading: scheduleLoading } = useBackupSchedule(etablissementId);
    const { data: backups, isLoading: backupsLoading } = useBackupList(etablissementId);
    const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'history'>('overview');

    // Trigger backup
    const triggerMutation = useMutation({
        mutationFn: (type: 'complet' | 'differentiel') =>
            apiClient.post(`/api/backups/trigger`, { type }),
        onSuccess: () => {
            toast.success('Backup déclenché avec succès');
            queryClient.invalidateQueries({ queryKey: ['backups'] });
        },
        onError: () => {
            toast.error('Erreur lors du déclenchement du backup');
        },
    });

    // Restore backup
    const restoreMutation = useMutation({
        mutationFn: (backupId: string) =>
            apiClient.post(`/api/backups/${backupId}/restore`, {}),
        onSuccess: () => {
            toast.success('Restauration initiée');
        },
        onError: () => {
            toast.error('Erreur lors de la restauration');
        },
    });

    const tabs = [
        { key: 'overview' as const, label: 'Vue d\'ensemble', icon: Database },
        { key: 'schedule' as const, label: 'Planification', icon: Calendar },
        { key: 'history' as const, label: 'Historique', icon: Clock },
    ];

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-muted p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <HardDrive className="h-4 w-4" />
                                <span className="text-sm">Backups totaux</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">{backups?.length ?? 0}</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Fréquence</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">
                                {schedule?.frequence || 'Non configuré'}
                            </p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Statut</span>
                            </div>
                            <p className="mt-1 text-2xl font-bold">
                                {schedule?.actif ? 'Actif' : 'Inactif'}
                            </p>
                        </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex gap-3">
                        <Button
                            onClick={() => triggerMutation.mutate('complet')}
                            disabled={triggerMutation.isPending}
                        >
                            {triggerMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="mr-2 h-4 w-4" />
                            )}
                            Backup complet
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => triggerMutation.mutate('differentiel')}
                            disabled={triggerMutation.isPending}
                        >
                            Backup différentiel
                        </Button>
                    </div>
                </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
                <div className="space-y-4">
                    {scheduleLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement...
                        </div>
                    ) : schedule ? (
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Planification active</h4>
                                <Badge variant={schedule.actif ? 'default' : 'secondary'}>
                                    {schedule.actif ? 'Actif' : 'Inactif'}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Fréquence :</span>
                                    <span className="ml-2 font-medium">{schedule.frequence}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Heure :</span>
                                    <span className="ml-2 font-medium">{schedule.heureExecution}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Type :</span>
                                    <span className="ml-2 font-medium">{schedule.typeBackup}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Rétention :</span>
                                    <span className="ml-2 font-medium">{schedule.retentionJours} jours</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Provider :</span>
                                    <span className="ml-2 font-medium">{schedule.providerName}</span>
                                </div>
                                {schedule.dernierBackupReussi && (
                                    <div>
                                        <span className="text-muted-foreground">Dernier succès :</span>
                                        <span className="ml-2 font-medium">
                                            {new Date(schedule.dernierBackupReussi).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p>Aucune planification configurée</p>
                            <p className="text-sm">Configurez un schedule pour automatiser les backups.</p>
                        </div>
                    )}
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="space-y-2">
                    {backupsLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Chargement...
                        </div>
                    ) : !backups?.length ? (
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            <Database className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            <p>Aucun backup enregistré</p>
                        </div>
                    ) : (
                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Date</th>
                                        <th className="text-left p-3 font-medium">Type</th>
                                        <th className="text-left p-3 font-medium">Statut</th>
                                        <th className="text-left p-3 font-medium">Taille</th>
                                        <th className="text-right p-3 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backups.map((backup) => (
                                        <tr key={backup.id} className="border-t">
                                            <td className="p-3">
                                                {new Date(backup.createdAt).toLocaleDateString('fr-FR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline">{backup.type}</Badge>
                                            </td>
                                            <td className="p-3">
                                                {backup.statut === 'succes' ? (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        <CheckCircle className="mr-1 h-3 w-3" />
                                                        Succès
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="danger">
                                                        <XCircle className="mr-1 h-3 w-3" />
                                                        Échec
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {backup.tailleBytes
                                                    ? `${(backup.tailleBytes / (1024 * 1024)).toFixed(1)} MB`
                                                    : '-'}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => restoreMutation.mutate(backup.id)}
                                                        disabled={restoreMutation.isPending}
                                                        title="Restaurer"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
