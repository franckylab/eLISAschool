import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Briefcase,
    CheckCircle, XCircle, Loader2, AlertCircle,
} from 'lucide-react';
import { useFonction, useModifierFonction } from '../hooks/use-fonctions';
import { FonctionFormModal } from './fonction-form-modal';
import { FonctionArbre } from './fonction-arbre';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

export function FonctionDetailPage() {
    const { id } = useParams({ from: '/_auth/fonctions/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: fonction, isLoading, error } = useFonction(id);
    const [formOpen, setFormOpen] = useState(false);
    const modifier = useModifierFonction();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: fonction!.id, dto: data });
        setFormOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    if (error || !fonction) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Fonction non trouvée</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/fonctions' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Breadcrumbs currentLabel={fonction.nom} />
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/fonctions' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux fonctions
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <Briefcase className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{fonction.nom}</h1>
                            <p className="text-muted-foreground font-mono text-sm">{fonction.code}</p>
                        </div>
                    </div>
                    {hasPermission('config:edit') && (
                        <ElisaButton
                            onClick={() => setFormOpen(true)}
                            icon={<Edit className="h-4 w-4" />}
                            variant="primary"
                        >
                            Modifier
                        </ElisaButton>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                            <h2 className="text-lg font-semibold text-foreground mb-4">Informations</h2>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <dt className="text-sm text-muted-foreground">Code</dt>
                                    <dd className="text-sm font-medium text-foreground font-mono">{fonction.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">Niveau</dt>
                                    <dd className="text-sm font-medium text-foreground">{fonction.niveau}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">Fonction parente</dt>
                                    <dd>
                                        {fonction.parent ? (
                                            <button
                                                onClick={() => navigate({ to: '/fonctions/$id', params: { id: fonction.parent!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {fonction.parent.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">Racine</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-muted-foreground">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            fonction.actif ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                        }`}>
                                            {fonction.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {fonction.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                                {fonction.majorationDefaut != null && (
                                    <div>
                                        <dt className="text-sm text-muted-foreground">Majoration défaut</dt>
                                        <dd className="text-sm font-medium text-foreground">{fonction.majorationDefaut}%</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm text-muted-foreground">Ordre</dt>
                                    <dd className="text-sm font-medium text-foreground">{fonction.ordre}</dd>
                                </div>
                            </dl>
                            {fonction.description && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <dt className="text-sm text-muted-foreground mb-1">Description</dt>
                                    <dd className="text-sm text-foreground">{fonction.description}</dd>
                                </div>
                            )}
                        </div>

                        {fonction.enfants && fonction.enfants.length > 0 && (
                            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                                <h2 className="text-lg font-semibold text-foreground mb-4">
                                    Sous-fonctions ({fonction.enfants.length})
                                </h2>
                                <FonctionArbre
                                    fonctions={fonction.enfants.map(e => ({ ...e, enfants: [] }))}
                                    onEdit={() => {}}
                                    onDelete={() => {}}
                                    onView={(f) => navigate({ to: '/fonctions/$id', params: { id: f.id } })}
                                    compact
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${
                            fonction.actif
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        }`}>
                            <div className="flex items-center gap-3 mb-3">
                                {fonction.actif
                                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                                    : <XCircle className="h-5 w-5 text-red-600" />
                                }
                                <span className={`font-semibold ${fonction.actif ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                    {fonction.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {fonction.actif
                                    ? 'Cette fonction est actuellement active.'
                                    : 'Cette fonction est actuellement inactive.'}
                            </p>
                        </div>

                        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Hiérarchie</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Niveau</span>
                                    <span className="font-medium">{fonction.niveau}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Parent</span>
                                    <span className="font-medium">{fonction.parent?.nom || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Sous-fonctions</span>
                                    <span className="font-medium">{fonction.enfants?.length || 0}</span>
                                </div>
                            </div>
                        </div>

                        {(fonction.primesDefaut || fonction.majorationDefaut != null) && (
                            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                                <h3 className="text-sm font-semibold text-foreground mb-3">Paie</h3>
                                <div className="space-y-3">
                                    {fonction.majorationDefaut != null && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Majoration</span>
                                            <span className="font-medium">{fonction.majorationDefaut}%</span>
                                        </div>
                                    )}
                                    {fonction.primesDefaut && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground block mb-1">Primes par défaut</span>
                                            <pre className="text-xs bg-muted p-2 rounded">{JSON.stringify(fonction.primesDefaut, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {formOpen && (
                <FonctionFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    fonction={fonction}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
