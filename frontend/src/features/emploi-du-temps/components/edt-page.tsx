import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Calendar, List, Settings, FileText, BookOpen, BarChart3 } from 'lucide-react';
import { useCreneaux } from '../hooks/use-emploi-du-temps';
import { EDTCalendar } from './edt-calendar';
import { EmploiDuTempsListe } from './edt-liste';
import { EDTPreferencesPage } from './edt-preferences';
import { EDTTemplatesPage } from './edt-templates';
import { EDTSynthese } from './edt-synthese';
import { EDTCreneauModal } from './edt-creneau-modal';
import type { CreneauHoraire } from '../hooks/use-emploi-du-temps';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { TabsBar } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { CustomModal } from '@/components/modals/CustomModal';
import { EDTGenerationModal } from './edt-generation-modal';
import { useToutesClasses } from '@/features/classes/hooks/use-toutes-classes';

type EDTTab = 'calendrier' | 'liste' | 'synthese' | 'preferences' | 'templates';
type ContexteType = 'classe' | 'enseignant' | 'salle';

export function EDTStandalonePage() {
    const { t } = useTranslation('emplois');
    const navigate = useNavigate();
    const [tab, setTab] = useState<EDTTab>('calendrier');
    const [contexteType, setContexteType] = useState<ContexteType>('classe');
    const [classeFilter, setClasseFilter] = useState('');
    const [genModalOpen, setGenModalOpen] = useState(false);
    const [creneauModalOpen, setCreneauModalOpen] = useState(false);
    const [selectedCreneau, setSelectedCreneau] = useState<CreneauHoraire | null>(null);

    const TABS: Tab[] = [
        { id: 'calendrier', label: t('onglets.calendrier'), icon: Calendar },
        { id: 'liste', label: t('onglets.liste'), icon: List },
        { id: 'synthese', label: t('onglets.synthese'), icon: BarChart3 },
        { id: 'preferences', label: t('onglets.preferences'), icon: Settings },
        { id: 'templates', label: t('onglets.templates'), icon: FileText },
    ];

    const { data: classes } = useToutesClasses();
    const classeOptions = (classes ?? [])
        .filter(c => c.classeAnneeId && c.actif)
        .map(c => ({
            value: c.classeAnneeId!,
            label: `${c.nom}${c.anneeScolaire?.libelle ? ` — ${c.anneeScolaire.libelle}` : ''}`,
        }));

    const filters = classeFilter
        ? contexteType === 'classe' ? { classeAnneeId: classeFilter } : { limit: 100 }
        : { limit: 100 };
    const { data: paginated, isLoading, error, refetch } = useCreneaux(filters);
    const creneaux = paginated?.data?.items ?? [];

    const handleCreneauClick = (creneau: CreneauHoraire) => {
        setSelectedCreneau(creneau);
        setCreneauModalOpen(true);
    };

    const handleCreneauCreate = () => {
        setSelectedCreneau(null);
        setCreneauModalOpen(true);
    };

    const renderCalendrier = () => (
        <div className="space-y-4">
            {/* Sélecteur contexte global */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                        {(['classe', 'enseignant', 'salle'] as ContexteType[]).map(ct => (
                            <button
                                key={ct}
                                onClick={() => setContexteType(ct)}
                                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                    contexteType === ct
                                        ? 'bg-[var(--color-dominant-600)] text-white'
                                        : 'bg-[var(--color-surface)] text-[var(--color-texte-secondaire)] hover:bg-[var(--color-surface-alt)]'
                                }`}
                            >
                                {t(`contexte.${ct}`)}
                            </button>
                        ))}
                    </div>
                    <select
                        value={classeFilter}
                        onChange={(e) => setClasseFilter(e.target.value)}
                        className="rounded-lg border border-[var(--color-bordure)] px-3 py-2 text-sm focus:ring-2 focus:ring-[var(--color-dominante)] dark:bg-[var(--color-surface)] dark:text-[var(--color-texte)]"
                    >
                        <option value="">{contexteType === 'classe' ? t('tousLesCreneaux') : t('selectionnerFiltre')}</option>
                        {classeOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <ElisaButton variant="secondary" size="xs" onClick={handleCreneauCreate}>
                        <Calendar className="h-4 w-4 mr-1" /> {t('creneau.ajouter')}
                    </ElisaButton>
                    <ElisaButton variant="primary" size="xs" icon={<Calendar className="h-4 w-4" />}
                        onClick={() => setGenModalOpen(true)}
                    >
                        {t('generer')}
                    </ElisaButton>
                </div>
            </div>
            {isLoading ? (
                <PageSkeleton showHeader={false} showStats={false} showTable />
            ) : creneaux.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface)] rounded-lg border border-[var(--color-bordure)]">
                    <Calendar className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] mb-2">{t('aucunCreneau')}</h3>
                    <p className="text-[var(--color-texte-secondaire)] mb-6 max-w-md mx-auto">{t('aucunCreneauDescription')}</p>
                    <ElisaButton variant="primary" size="sm" icon={<Calendar className="h-4 w-4" />} onClick={() => setGenModalOpen(true)}>
                        {t('genererEmploiDuTemps')}
                    </ElisaButton>
                </div>
            ) : (
                <EDTCalendar creneaux={creneaux} onCreneauClick={handleCreneauClick} />
            )}
            <CustomModal
                open={genModalOpen}
                onOpenChange={setGenModalOpen}
                title={t('genererEmploiDuTemps')}
                description={t('configurerGeneration')}
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

    const renderListe = () => {
        if (!classeFilter) {
            return (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-[var(--color-surface)] rounded-lg border border-[var(--color-bordure)]">
                    <List className="h-16 w-16 text-[var(--color-text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] mb-2">{t('aucuneClasseSelectionnee')}</h3>
                    <p className="text-[var(--color-texte-secondaire)] max-w-md mx-auto">{t('selectionnerClassePourVoirListe')}</p>
                </div>
            );
        }
        return <EmploiDuTempsListe classeAnneeId={classeFilter} anneeScolaireId="" />;
    };

    const renderTab = () => {
        switch (tab) {
            case 'calendrier': return renderCalendrier();
            case 'liste': return renderListe();
            case 'synthese': return <EDTSynthese classeAnneeId={classeFilter || undefined} />;
            case 'preferences': return <EDTPreferencesPage />;
            case 'templates': return <EDTTemplatesPage />;
            default: return null;
        }
    };

    if (error) {
        return (
            <div className="p-6">
                <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={Calendar}
                title={t('titre')}
                subtitle={t('description')}
                onBack={() => navigate({ to: '/' })}
            />

            <TabsBar tabs={TABS} activeTab={tab} onTabChange={(id) => setTab(id as EDTTab)} />

            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {renderTab()}
            </motion.div>

            {/* Modal édition CréneauHoraire */}
            <EDTCreneauModal
                open={creneauModalOpen}
                onOpenChange={setCreneauModalOpen}
                creneau={selectedCreneau}
                etablissementId=""
                onSuccess={() => refetch()}
            />
        </div>
    );
}