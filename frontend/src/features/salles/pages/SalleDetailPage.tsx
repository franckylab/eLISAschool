import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useSalle, useStatistiquesSalles } from '../hooks/use-salles';
import { TypeSalle, StatutSalle } from '../types/salle.types';
import { SalleFormModal } from '../components/SalleFormModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import {
    ArrowLeft,
    Edit,
    Building2,
    Wrench,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
} from 'lucide-react';

const TYPE_SALLE_LABELS: Record<TypeSalle, string> = {
    [TypeSalle.CLASSIQUE]: 'Classique',
    [TypeSalle.LABORATOIRE]: 'Laboratoire',
    [TypeSalle.INFORMATIQUE]: 'Informatique',
    [TypeSalle.AMPHITHEATRE]: 'Amphithéâtre',
    [TypeSalle.SPORT]: 'Sport',
    [TypeSalle.MUSIQUE]: 'Musique',
    [TypeSalle.ARTS]: 'Arts',
    [TypeSalle.BIBLIOTHEQUE]: 'Bibliothèque',
    [TypeSalle.ADMINISTRATION]: 'Administration',
    [TypeSalle.AUTRE]: 'Autre',
};

const STATUT_STYLES: Record<StatutSalle, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    [StatutSalle.DISPONIBLE]: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        label: 'Disponible',
    },
    [StatutSalle.EN_MAINTENANCE]: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        icon: <Wrench className="h-5 w-5 text-yellow-600" />,
        label: 'En maintenance',
    },
    [StatutSalle.INDISPONIBLE]: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        label: 'Indisponible',
    },
};

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const CRENEAUX = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

export function SalleDetailPage() {
    const { salleId } = useParams({ from: '/_auth/salles/$salleId' });
    const navigate = useNavigate();
    const { data: salle, isLoading, error } = useSalle(salleId);
    const { data: stats } = useStatistiquesSalles();
    const [formOpen, setFormOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Chargement...</p>
            </div>
        );
    }

    if (error || !salle) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-red-600 mb-4">Salle non trouvée</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/salles' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    const statutStyle = STATUT_STYLES[salle.statut] || STATUT_STYLES[StatutSalle.INDISPONIBLE];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/salles' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux salles
                </ElisaButton>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Building2 className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{salle.nom}</h1>
                            <p className="text-gray-500 font-mono text-sm">{salle.code}</p>
                        </div>
                    </div>
                    <ElisaButton
                        onClick={() => setFormOpen(true)}
                        icon={<Edit className="h-4 w-4" />}
                        variant="primary"
                    >
                        Modifier
                    </ElisaButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <dt className="text-sm text-gray-500">Type</dt>
                                    <dd className="text-sm font-medium text-gray-900">{TYPE_SALLE_LABELS[salle.typeSalle]}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Capacité</dt>
                                    <dd className="text-sm font-medium text-gray-900">{salle.capacite} places</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Localisation</dt>
                                    <dd className="text-sm font-medium text-gray-900">{salle.localisation || '-'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statutStyle.bg} ${statutStyle.text}`}>
                                            {statutStyle.icon}
                                            {statutStyle.label}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                            {salle.description && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <dt className="text-sm text-gray-500 mb-1">Description</dt>
                                    <dd className="text-sm text-gray-900">{salle.description}</dd>
                                </div>
                            )}
                        </div>

                        {salle.equipements && salle.equipements.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Équipements</h2>
                                <div className="flex flex-wrap gap-2">
                                    {salle.equipements.map((equip) => (
                                        <span key={equip} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                            {equip}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-5 w-5 text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Planning d'occupation</h2>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">Aperçu hebdomadaire des créneaux réservés</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-left font-medium text-gray-500 w-16">Horaire</th>
                                            {JOURS.map((jour) => (
                                                <th key={jour} className="p-2 text-center font-medium text-gray-500 min-w-[100px]">
                                                    {jour.charAt(0) + jour.slice(1).toLowerCase()}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CRENEAUX.map((heure) => (
                                            <tr key={heure} className="border-t border-gray-100">
                                                <td className="p-2 text-gray-500 font-mono">{heure}</td>
                                                {JOURS.map((jour) => (
                                                    <td key={`${jour}-${heure}`} className="p-1">
                                                        <div className="h-6 rounded bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-xl shadow-sm border p-6 ${statutStyle.bg}`}>
                            <div className="flex items-center gap-3 mb-3">
                                {statutStyle.icon}
                                <span className={`font-semibold ${statutStyle.text}`}>{statutStyle.label}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                                {salle.disponible
                                    ? 'Cette salle est actuellement disponible pour les réservations.'
                                    : 'Cette salle n\'est pas disponible pour le moment.'}
                            </p>
                        </div>

                        {stats && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Aperçu des salles</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Total</span>
                                        <span className="font-medium">{stats.total}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-green-600">Disponibles</span>
                                        <span className="font-medium text-green-600">{stats.disponibles}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-orange-600">En maintenance</span>
                                        <span className="font-medium text-orange-600">{stats.enMaintenance}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-red-600">Indisponibles</span>
                                        <span className="font-medium text-red-600">{stats.indisponibles}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <SalleFormModal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                salleId={salle.id}
            />
        </div>
    );
}
