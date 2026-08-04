/**
 * ==================================
 * eLISAschool - Gestion des Administrateurs d'un Groupe
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant pour ajouter/retirer des administrateurs d'un groupe.
 */

import { useState } from 'react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { UserPlus, UserMinus, Search, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
    useAjouterAdmin,
    useRetirerAdmin,
} from '../hooks/use-groupes-etablissements';
import type { GroupeEtablissement } from '../types/groupe-etablissement.types';

interface GestionAdminsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupe: GroupeEtablissement;
    utilisateursDisponibles: Array<{
        id: string;
        nom: string;
        prenom: string;
        email: string;
        role: string;
    }>;
    adminsActuels: Array<{
        id: string;
        utilisateurId: string;
        utilisateur: {
            nom: string;
            prenom: string;
            email: string;
        };
    }>;
    onRefresh?: () => void;
}

export function GestionAdminsModal({
    open,
    onOpenChange,
    groupe,
    utilisateursDisponibles,
    adminsActuels,
    onRefresh,
}: GestionAdminsProps) {
    const [search, setSearch] = useState('');

    const ajouterMutation = useAjouterAdmin();
    const retirerMutation = useRetirerAdmin();

    // IDs des admins actuels
    const adminsIds = new Set(adminsActuels.map(a => a.utilisateurId));
    const disponibles = utilisateursDisponibles.filter(u => !adminsIds.has(u.id));

    // Filtrer par recherche
    const filteredDisponibles = disponibles.filter(u =>
        (u.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.prenom || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredAdmins = adminsActuels.filter(a => {
        const nom = a.utilisateur?.nom || '';
        const prenom = a.utilisateur?.prenom || '';
        const email = a.utilisateur?.email || '';
        return nom.toLowerCase().includes(search.toLowerCase()) ||
            prenom.toLowerCase().includes(search.toLowerCase()) ||
            email.toLowerCase().includes(search.toLowerCase());
    });

    const handleAjouter = async (utilisateurId: string) => {
        try {
            await ajouterMutation.mutateAsync({ groupeId: groupe.id, utilisateurId });
            toast.success('Administrateur ajouté');
            onRefresh?.();
        } catch (error) {
            toast.error('Erreur lors de l\'ajout');
        }
    };

    const handleRetirer = async (utilisateurId: string) => {
        try {
            await retirerMutation.mutateAsync({ groupeId: groupe.id, utilisateurId });
            toast.success('Administrateur retiré');
            onRefresh?.();
        } catch (error) {
            toast.error('Erreur lors du retrait');
        }
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={`Gérer les administrateurs - ${groupe.nom}`}
            description="Ajoutez ou retirez des administrateurs de ce groupe"
            size="2xl"
        >
            <div className="space-y-6">
                {/* Barre de recherche */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-texte-secondaire)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full pl-10 pr-4 py-2 border border-[var(--color-bordure)] rounded-lg bg-[var(--color-surface)] text-[var(--color-texte)] focus:ring-2 focus:ring-[var(--color-dominant-500)] focus:border-transparent placeholder-[var(--color-texte-secondaire)]"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Utilisateurs disponibles */}
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--color-texte)] mb-3 flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Disponibles ({filteredDisponibles.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto border border-[var(--color-bordure)] rounded-lg p-2 bg-[var(--color-surface)]">
                            {filteredDisponibles.length === 0 ? (
                                <p className="text-sm text-[var(--color-texte-secondaire)] text-center py-4">
                                    Aucun utilisateur disponible
                                </p>
                            ) : (
                                filteredDisponibles.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-200)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-[var(--color-dominant-500)]/10 flex items-center justify-center">
                                                <UserPlus className="h-5 w-5 text-[var(--color-dominant-500)]" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-sm text-[var(--color-texte)]">
                                                    {user.prenom || ''} {user.nom || ''}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-[var(--color-texte-secondaire)]">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <ElisaButton
                                            variant="primary"
                                            size="xs"
                                            onClick={() => handleAjouter(user.id)}
                                            isLoading={ajouterMutation.isPending}
                                            icon={<UserPlus className="h-3 w-3" />}
                                        >
                                            Ajouter
                                        </ElisaButton>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Administrateurs actuels */}
                    <div>
                        <h3 className="font-semibold text-sm text-[var(--color-texte)] mb-3 flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            Administrateurs ({filteredAdmins.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto border border-[var(--color-bordure)] rounded-lg p-2 bg-[var(--color-surface)]">
                            {filteredAdmins.length === 0 ? (
                                <p className="text-sm text-[var(--color-texte-secondaire)] text-center py-4">
                                    Aucun administrateur
                                </p>
                            ) : (
                                filteredAdmins.map((admin) => (
                                    <div
                                        key={admin.id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-200)]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium text-sm text-[var(--color-texte)]">
                                                    {admin.utilisateur?.prenom || ''} {admin.utilisateur?.nom || ''}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-[var(--color-texte-secondaire)]">
                                                    <Mail className="h-3 w-3" />
                                                    {admin.utilisateur?.email || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <ElisaButton
                                            variant="outline"
                                            size="xs"
                                            onClick={() => handleRetirer(admin.utilisateurId)}
                                            isLoading={retirerMutation.isPending}
                                            icon={<UserMinus className="h-3 w-3" />}
                                        >
                                            Retirer
                                        </ElisaButton>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomModal>
    );
}
