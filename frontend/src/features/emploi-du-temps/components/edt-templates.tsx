/**
 * ==================================
 * eLISAschool - Page Gestion des Templates EDT
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, FileText, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import {
    useTemplatesEDT,
    useCreerTemplateEDT,
    useSupprimerTemplateEDT,
    useDupliquerTemplateEDT,
} from '../hooks/use-emploi-du-temps';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { ListLoading } from '@/components/feedback/ListLoading';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';

export function EDTTemplatesPage() {
    const { data: templates, isLoading, refetch } = useTemplatesEDT();
    const creerTemplate = useCreerTemplateEDT();
    const supprimerTemplate = useSupprimerTemplateEDT();
    const dupliquerTemplate = useDupliquerTemplateEDT();

    const [creationModalOpen, setCreationModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    const handleDupliquer = async (id: string) => {
        await dupliquerTemplate.mutateAsync({ id });
    };

    const handleSupprimer = async () => {
        if (templateToDelete) {
            await supprimerTemplate.mutateAsync(templateToDelete);
            setTemplateToDelete(null);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* En-tête */}
            <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                        <FileText className="h-8 w-8 text-[var(--color-dominant-600)]" />
                        Templates d'Emploi du Temps
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        Gérez les modèles réutilisables pour générer rapidement des emplois du temps
                    </p>
                </div>

                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setCreationModalOpen(true)}
                >
                    Nouveau Template
                </ElisaButton>
            </motion.div>

            {/* Liste des templates */}
            {isLoading ? (
                <ListLoading />
            ) : !templates || templates.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Aucun template"
                    description="Créez votre premier template pour standardiser la génération des emplois du temps"
                    actionLabel="Créer un template"
                    onAction={() => setCreationModalOpen(true)}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template: { id: string; nom: string; description?: string; actif: boolean; configuration?: any; creneauxTypes?: any[]; estPartage?: boolean }, index: number) => (
                        <motion.div
                            key={template.id}
                            className="p-6 bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            {/* En-tête de la carte */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                        {template.nom}
                                    </h3>
                                    {template.description && (
                                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                                            {template.description}
                                        </p>
                                    )}
                                </div>

                                {/* Badge partagé */}
                                {template.estPartage && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                        Partagé
                                    </span>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex justify-between">
                                    <span>Créneaux types :</span>
                                    <span className="font-semibold">
                                        {template.creneauxTypes?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Jours travaillés :</span>
                                    <span className="font-semibold">
                                        {template.configuration?.joursTravailles?.length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Heure début :</span>
                                    <span className="font-semibold">
                                        {template.configuration?.heureDebutCours || '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Heure fin :</span>
                                    <span className="font-semibold">
                                        {template.configuration?.heureFinCours || '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <ElisaButton
                                    variant="outline"
                                    size="xs"
                                    icon={<Copy className="h-3 w-3" />}
                                    onClick={() => handleDupliquer(template.id)}
                                    disabled={dupliquerTemplate.isPending}
                                >
                                    Dupliquer
                                </ElisaButton>

                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    icon={<Edit2 className="h-3 w-3" />}
                                    onClick={() => toast.info('Fonctionnalité à venir')}
                                >
                                    Modifier
                                </ElisaButton>

                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    icon={<Trash2 className="h-3 w-3" />}
                                    onClick={() => setTemplateToDelete(template.id)}
                                    disabled={supprimerTemplate.isPending}
                                >
                                    Supprimer
                                </ElisaButton>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal de création (simplifié) */}
            <CustomModal
                open={creationModalOpen}
                onOpenChange={setCreationModalOpen}
                title="Créer un template"
                description="Fonctionnalité en cours de développement"
                size="lg"
            >
                <div className="p-6 text-center">
                    <p className="text-gray-600 mb-4">
                        La création de templates sera bientôt disponible.
                        <br />
                        En attendant, utilisez les templates par défaut fournis.
                    </p>
                    <ElisaButton
                        variant="primary"
                        onClick={() => setCreationModalOpen(false)}
                    >
                        Fermer
                    </ElisaButton>
                </div>
            </CustomModal>

            {/* Modal de confirmation de suppression */}
            <ConfirmationModal
                isOpen={!!templateToDelete}
                title="Supprimer le template"
                message="Êtes-vous sûr de vouloir supprimer ce template ? Cette action est irréversible."
                confirmLabel="Supprimer"
                variant="danger"
                onConfirm={handleSupprimer}
                onCancel={() => setTemplateToDelete(null)}
            />
        </div>
    );
}
