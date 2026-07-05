/**
 * ==================================
 * eLISAschool - Page Détail Examen National
 * ==================================
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, FileText, GraduationCap,
    CheckCircle, XCircle, Loader2, AlertCircle,
    Calendar, Award, BookOpen,
} from 'lucide-react';
import { useExamenNational } from '../hooks/use-examens-nationaux';
import { useModifierExamenNational } from '../hooks/use-examens-nationaux';
import { ExamenNationalFormModal } from './examen-national-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

const TYPE_LABELS: Record<string, string> = {
    NATIONAL: 'National',
    REGIONAL: 'Régional',
    INTERNATIONAL: 'International',
};

const SOUS_SYSTEME_LABELS: Record<string, string> = {
    FRANCOPHONE: 'Francophone',
    ANGLOPHONE: 'Anglophone',
};

function formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

export function ExamenNationalDetailPage() {
    const { id } = useParams({ from: '/_auth/examens-nationaux/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: examen, isLoading, error } = useExamenNational(id);
    const [formOpen, setFormOpen] = useState(false);
    const modifier = useModifierExamenNational();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: examen!.id, ...data });
        setFormOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Chargement...</p>
            </div>
        );
    }

    if (error || !examen) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Examen national non trouvé</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/examens-nationaux' })}>
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
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/examens-nationaux' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux examens nationaux
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <FileText className="h-8 w-8 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{examen.nom}</h1>
                            <p className="text-gray-500 font-mono text-sm">{examen.code}</p>
                        </div>
                    </div>
                    {hasPermission('examens-nationaux:edit') && (
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500">Code</dt>
                                    <dd className="text-sm font-medium text-gray-900 font-mono">{examen.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Type</dt>
                                    <dd className="text-sm font-medium text-gray-900">{TYPE_LABELS[examen.type] || examen.type}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Niveau</dt>
                                    <dd>
                                        {examen.niveau ? (
                                            <button
                                                onClick={() => navigate({ to: '/niveaux/$id', params: { id: examen.niveau!.id } })}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {examen.niveau.nom}
                                            </button>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Sous-système</dt>
                                    <dd className="text-sm font-medium text-gray-900">{SOUS_SYSTEME_LABELS[examen.sousSysteme] || examen.sousSysteme}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Obligatoire</dt>
                                    <dd className="text-sm font-medium text-gray-900">{examen.estObligatoire ? 'Oui' : 'Non'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Diplôme délivré</dt>
                                    <dd className="text-sm font-medium text-gray-900">{examen.diplomeDelivre || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Coefficient</dt>
                                    <dd className="text-sm font-medium text-gray-900">{examen.coefficient ?? '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Date programmation</dt>
                                    <dd className="text-sm font-medium text-gray-900">{formatDate(examen.dateProgrammation)}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${examen.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {examen.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {examen.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                            {examen.description && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <dt className="text-sm text-gray-500 mb-1">Description</dt>
                                    <dd className="text-sm text-gray-900">{examen.description}</dd>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${examen.actif ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                {examen.actif
                                    ? <CheckCircle className="h-5 w-5 text-green-600" />
                                    : <XCircle className="h-5 w-5 text-red-600" />
                                }
                                <span className={`font-semibold ${examen.actif ? 'text-green-800' : 'text-red-800'}`}>
                                    {examen.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                {examen.actif
                                    ? 'Cet examen est actuellement actif.'
                                    : 'Cet examen est actuellement inactif.'}
                            </p>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Type</span>
                                    <span className="font-medium">{TYPE_LABELS[examen.type] || examen.type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Niveau</span>
                                    <span className="font-medium">{examen.niveau?.nom || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Coefficient</span>
                                    <span className="font-medium">{examen.coefficient ?? '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Obligatoire</span>
                                    <span className="font-medium">{examen.estObligatoire ? 'Oui' : 'Non'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {formOpen && (
                <ExamenNationalFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    examen={examen}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
