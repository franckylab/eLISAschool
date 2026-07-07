import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, List, Settings, FileText, BookOpen } from 'lucide-react';
import { useCreneaux } from '../hooks/use-emploi-du-temps';
import { EDTCalendar } from './edt-calendar';
import { EDTPreferencesPage } from './edt-preferences';
import { EDTTemplatesPage } from './edt-templates';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ListLoading } from '@/components/feedback/ListLoading';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CustomModal } from '@/components/modals/CustomModal';
import { EDTGenerationModal } from './edt-generation-modal';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';

type EDTTab = 'calendrier' | 'liste' | 'preferences' | 'templates';

const TABS: { id: EDTTab; label: string; icon: any }[] = [
    { id: 'calendrier', label: 'Calendrier', icon: Calendar },
    { id: 'liste', label: 'Liste', icon: List },
    { id: 'preferences', label: 'Préférences', icon: Settings },
    { id: 'templates', label: 'Templates', icon: FileText },
];

export function EDTStandalonePage() {
    const [tab, setTab] = useState<EDTTab>('calendrier');
    const [classeFilter, setClasseFilter] = useState('');
    const [genModalOpen, setGenModalOpen] = useState(false);

    const { data: classes } = useToutesClasses();
    const classeOptions = (classes ?? [])
        .filter(c => c.classeAnneeId && c.actif)
        .map(c => ({
            value: c.classeAnneeId!,
            label: `${c.nom}${c.anneeScolaire?.libelle ? ` — ${c.anneeScolaire.libelle}` : ''}`,
        }));

    const { data: paginated, isLoading } = useCreneaux(
        classeFilter ? { classeAnneeId: classeFilter } : { limit: 100 }
    );
    const creneaux = paginated?.items ?? [];

    const renderTab = () => {
        switch (tab) {
            case 'calendrier':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">Filtrer par classe:</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={classeFilter}
                                    onChange={(e) => setClasseFilter(e.target.value)}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Tous les créneaux</option>
                                    {classeOptions.map(o => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                <ElisaButton variant="primary" size="sm" icon={<Calendar className="h-4 w-4" />}
                                    onClick={() => setGenModalOpen(true)}
                                >
                                    Générer
                                </ElisaButton>
                            </div>
                        </div>
                        {isLoading ? (
                            <ListLoading />
                        ) : creneaux.length === 0 ? (
                            <EmptyState
                                icon={Calendar}
                                title="Aucun créneau"
                                description="Aucun créneau trouvé. Générez l'emploi du temps ou ajustez les filtres."
                                actionLabel="Générer l'emploi du temps"
                                onAction={() => setGenModalOpen(true)}
                            />
                        ) : (
                            <EDTCalendar creneaux={creneaux} />
                        )}
                        <CustomModal
                            open={genModalOpen}
                            onOpenChange={setGenModalOpen}
                            title="Générer l'emploi du temps"
                            description="Configurez les paramètres de génération"
                            size="2xl"
                        >
                            {classeFilter && (
                                <EDTGenerationModal
                                    classeAnneeId={classeFilter}
                                    onSuccess={() => { setGenModalOpen(false); }}
                                    onClose={() => setGenModalOpen(false)}
                                />
                            )}
                        </CustomModal>
                    </div>
                );

            case 'liste':
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filtrer par classe:</span>
                            <select
                                value={classeFilter}
                                onChange={(e) => setClasseFilter(e.target.value)}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Tous les créneaux</option>
                            </select>
                        </div>
                        {isLoading ? (
                            <ListLoading />
                        ) : creneaux.length === 0 ? (
                            <EmptyState icon={List} title="Aucun créneau" description="Aucun créneau trouvé." />
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-medium text-gray-600">Jour</th>
                                            <th className="text-left px-4 py-3 font-medium text-gray-600">Horaire</th>
                                            <th className="text-left px-4 py-3 font-medium text-gray-600">Matière</th>
                                            <th className="text-left px-4 py-3 font-medium text-gray-600">Enseignant</th>
                                            <th className="text-left px-4 py-3 font-medium text-gray-600">Classe</th>
                                            <th className="text-left px-4 py-3 font-medium text-gray-600">Salle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {creneaux.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium">{c.jour}</td>
                                                <td className="px-4 py-3 font-mono text-gray-700">
                                                    {c.heureDebut?.slice(0, 5)} - {c.heureFin?.slice(0, 5)}
                                                </td>
                                                <td className="px-4 py-3">{c.matiere?.nom || '-'}</td>
                                                <td className="px-4 py-3">
                                                    {c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : '-'}
                                                </td>
                                                <td className="px-4 py-3">{c.classeAnnee?.classe?.nom || '-'}</td>
                                                <td className="px-4 py-3">{c.salle?.nom || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );

            case 'preferences':
                return <EDTPreferencesPage />;

            case 'templates':
                return <EDTTemplatesPage />;

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-[var(--color-dominant-600)]" />
                    Emploi du Temps
                </h1>
            </motion.div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6">
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        return (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                                    tab === t.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {t.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {renderTab()}
            </motion.div>
        </div>
    );
}
