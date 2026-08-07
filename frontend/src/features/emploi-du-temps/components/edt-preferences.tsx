/**
 * ==================================
 * eLISAschool - Préférences EDT (Configuration)
 * ==================================
 * Organisé en 4 onglets horizontaux :
 *  1. Calendrier (jours travaillés + horaires + contraintes)
 *  2. Jours fériés (exclusion + gestion + génération)
 *  3. Automation (matérialisation automatique)
 *  4. Templates (gestion des modèles d'emploi du temps)
 * Version: 3.0.0 — Ajout onglet Templates
 * Auteur: franck arlos chendjou
 */

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, BarChart3, Loader2, Check, RefreshCw, Plus, Trash2, Globe, Shield, Edit, Sparkles, Search, ChevronLeft, ChevronRight, Zap, FileText } from 'lucide-react';
import { usePreferencesEDT, useUpdatePreferencesEDT } from '../hooks/use-emploi-du-temps';
import { useJoursFeries, useChargerModelePays, useDeleteJourFerie, useModelesPays, useGenererVariablesAnnee } from '../hooks/use-jours-feries';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { toast } from 'sonner';
import { JourFerieFormModal } from './jour-ferie-form-modal';
import { EDTTemplatesPage } from './edt-templates';
import type { JourFerie } from '../types/edt.types';

const PAYS_FALLBACK = ['CM', 'CI', 'SN', 'CG', 'CD', 'GA', 'BF', 'ML', 'BJ', 'TG', 'NE', 'GN', 'TD', 'CF', 'GQ'] as const;

const JOURS_SEMAINE = [
    { value: 'LUNDI', labelKey: 'calendrier.lundi' },
    { value: 'MARDI', labelKey: 'calendrier.mardi' },
    { value: 'MERCREDI', labelKey: 'calendrier.mercredi' },
    { value: 'JEUDI', labelKey: 'calendrier.jeudi' },
    { value: 'VENDREDI', labelKey: 'calendrier.vendredi' },
    { value: 'SAMEDI', labelKey: 'calendrier.samedi' },
] as const;

const DEFAULT_MATERIALISATION_AUTO = {
    actif: true,
    horaires: [
        { jour: 'SAMEDI', heure: '21:00' },
        { jour: 'MERCREDI', heure: '21:00' },
    ],
};

type ConfigTab = 'calendrier' | 'joursFeries' | 'automation' | 'templates';

const CONFIG_TABS: { id: ConfigTab; labelKey: string; icon: typeof Calendar }[] = [
    { id: 'calendrier', labelKey: 'preferences.tabs.calendrier', icon: Calendar },
    { id: 'joursFeries', labelKey: 'preferences.tabs.joursFeries', icon: Globe },
    { id: 'automation', labelKey: 'preferences.tabs.automation', icon: Zap },
    { id: 'templates', labelKey: 'preferences.tabs.templates', icon: FileText },
];

export function EDTPreferencesPage() {
    const { t } = useTranslation('emplois');
    const { data: preferences, isLoading, error, refetch } = usePreferencesEDT();
    const updatePreferences = useUpdatePreferencesEDT();
    const [activeTab, setActiveTab] = useState<ConfigTab>('calendrier');
    const [anneeGeneration, setAnneeGeneration] = useState<number>(new Date().getFullYear());
    const { data: joursFeriesData } = useJoursFeries(anneeGeneration);
    const chargerModele = useChargerModelePays();
    const supprimerJF = useDeleteJourFerie();
    const { data: modelesPays } = useModelesPays();
    const genererVariables = useGenererVariablesAnnee();
    const joursFeries = joursFeriesData ?? [];
    const paysCodes = modelesPays?.map(m => m.pays) ?? [...PAYS_FALLBACK];
    const { ask, ConfirmationModal: ConfirmJFModal } = useConfirmation();

    const [formData, setFormData] = useState({
        joursOuvrables: [] as string[],
        heureDebutCours: '07:30',
        heureFinCours: '17:30',
        dureeCreneauStandard: 55,
        dureeRecreation: 15,
        maxCreneauxParJour: 8,
        maxCreneauxMatiereParJour: 2,
        maxCreneauxConsecutifs: 2,
        repartitionEquilibree: true,
        materialisationAuto: DEFAULT_MATERIALISATION_AUTO,
        exclureJoursFeries: true,
    });

    const [paysSelectionne, setPaysSelectionne] = useState<string>('CM');
    const [rechercheJF, setRechercheJF] = useState('');
    const [filtreTypeJF, setFiltreTypeJF] = useState<'tous' | 'recurrent' | 'ponctuel'>('tous');
    const [pageJF, setPageJF] = useState(1);
    const JF_PAR_PAGE = 15;
    const [modalJFOpen, setModalJFOpen] = useState(false);
    const [modalJFEdit, setModalJFEdit] = useState<JourFerie | null>(null);

    useEffect(() => {
        if (preferences) {
            setFormData({
                joursOuvrables: preferences.joursOuvrables || [],
                heureDebutCours: preferences.heureDebutCours || '07:30',
                heureFinCours: preferences.heureFinCours || '17:30',
                dureeCreneauStandard: preferences.dureeCreneauStandard || 55,
                dureeRecreation: preferences.dureeRecreation || 15,
                maxCreneauxParJour: preferences.maxCreneauxParJour || 8,
                maxCreneauxMatiereParJour: preferences.maxCreneauxMatiereParJour || 2,
                maxCreneauxConsecutifs: preferences.maxCreneauxConsecutifs || 2,
                repartitionEquilibree: preferences.repartitionEquilibree ?? true,
                materialisationAuto: preferences.materialisationAuto ?? DEFAULT_MATERIALISATION_AUTO,
                exclureJoursFeries: preferences.exclureJoursFeries ?? true,
            });
        }
    }, [preferences]);

    /** Détection de modifications non enregistrées */
    const isDirty = useMemo(() => {
        if (!preferences) return false;
        return (
            JSON.stringify(formData.joursOuvrables.sort()) !== JSON.stringify((preferences.joursOuvrables || []).sort()) ||
            formData.heureDebutCours !== (preferences.heureDebutCours || '07:30') ||
            formData.heureFinCours !== (preferences.heureFinCours || '17:30') ||
            formData.dureeCreneauStandard !== (preferences.dureeCreneauStandard || 55) ||
            formData.dureeRecreation !== (preferences.dureeRecreation || 15) ||
            formData.maxCreneauxParJour !== (preferences.maxCreneauxParJour || 8) ||
            formData.maxCreneauxMatiereParJour !== (preferences.maxCreneauxMatiereParJour || 2) ||
            formData.maxCreneauxConsecutifs !== (preferences.maxCreneauxConsecutifs || 2) ||
            formData.repartitionEquilibree !== (preferences.repartitionEquilibree ?? true) ||
            JSON.stringify(formData.materialisationAuto) !== JSON.stringify(preferences.materialisationAuto ?? DEFAULT_MATERIALISATION_AUTO) ||
            formData.exclureJoursFeries !== (preferences.exclureJoursFeries ?? true)
        );
    }, [formData, preferences]);

    const handleToggleJour = (jour: string) => {
        setFormData(prev => ({
            ...prev,
            joursOuvrables: prev.joursOuvrables.includes(jour)
                ? prev.joursOuvrables.filter(j => j !== jour)
                : [...prev.joursOuvrables, jour],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.joursOuvrables.length === 0) {
            toast.error(t('preferences.erreurJoursOuvrables'));
            setActiveTab('calendrier');
            return;
        }
        await updatePreferences.mutateAsync({
            joursOuvrables: formData.joursOuvrables,
            heureDebutCours: formData.heureDebutCours,
            heureFinCours: formData.heureFinCours,
            dureeCreneauStandard: formData.dureeCreneauStandard,
            dureeRecreation: formData.dureeRecreation,
            maxCreneauxParJour: formData.maxCreneauxParJour,
            maxCreneauxMatiereParJour: formData.maxCreneauxMatiereParJour,
            maxCreneauxConsecutifs: formData.maxCreneauxConsecutifs,
            repartitionEquilibree: formData.repartitionEquilibree,
            materialisationAuto: formData.materialisationAuto,
            exclureJoursFeries: formData.exclureJoursFeries,
        });
    };

    const majHoraire = (index: number, champ: 'jour' | 'heure', valeur: string) => {
        setFormData(prev => ({
            ...prev,
            materialisationAuto: {
                ...prev.materialisationAuto,
                horaires: prev.materialisationAuto.horaires.map((h, i) =>
                    i === index ? { ...h, [champ]: valeur } : h,
                ),
            },
        }));
    };

    const ajouterHoraire = () => {
        setFormData(prev => ({
            ...prev,
            materialisationAuto: {
                ...prev.materialisationAuto,
                horaires: [...prev.materialisationAuto.horaires, { jour: 'SAMEDI', heure: '21:00' }],
            },
        }));
    };

    const supprimerHoraire = (index: number) => {
        setFormData(prev => ({
            ...prev,
            materialisationAuto: {
                ...prev.materialisationAuto,
                horaires: prev.materialisationAuto.horaires.filter((_, i) => i !== index),
            },
        }));
    };

    const reinitialiser = () => {
        if (preferences) {
            setFormData({
                joursOuvrables: preferences.joursOuvrables || [],
                heureDebutCours: preferences.heureDebutCours || '07:30',
                heureFinCours: preferences.heureFinCours || '17:30',
                dureeCreneauStandard: preferences.dureeCreneauStandard || 55,
                dureeRecreation: preferences.dureeRecreation || 15,
                maxCreneauxParJour: preferences.maxCreneauxParJour || 8,
                maxCreneauxMatiereParJour: preferences.maxCreneauxMatiereParJour || 2,
                maxCreneauxConsecutifs: preferences.maxCreneauxConsecutifs || 2,
                repartitionEquilibree: preferences.repartitionEquilibree ?? true,
                materialisationAuto: preferences.materialisationAuto ?? DEFAULT_MATERIALISATION_AUTO,
                exclureJoursFeries: preferences.exclureJoursFeries ?? true,
            });
        }
    };

    if (error) return <ErrorMessage message={t('chargement')} onRetry={() => refetch()} />;
    if (isLoading) return <PageSkeleton showHeader={false} showStats={false} showTable={false} />;

    const inputClass = "w-full px-4 py-2 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-dominante)] focus:border-transparent transition-colors";

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--gap-md)]">
                {/* ─── Tabs de navigation ─────────────────────────── */}
                <div className="flex items-center gap-[var(--gap-xs)] overflow-x-auto pb-[var(--space-xxs)] -mx-[var(--space-xxs)] px-[var(--space-xxs)]">
                    {CONFIG_TABS.map(({ id, labelKey, icon: Icon }) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-[var(--space-xs)] px-[var(--space-md)] py-[var(--space-sm)] rounded-[var(--radius-lg)] text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab === id
                                    ? 'bg-[var(--color-dominant-600)] text-white shadow-sm'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-bordure)]'
                            }`}
                            aria-pressed={activeTab === id}
                        >
                            <Icon className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                            <span className="hidden sm:inline">{t(labelKey)}</span>
                        </button>
                    ))}
                </div>

                {/* ─── Contenu des onglets ─────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col gap-[var(--gap-md)]"
                    >
                        {activeTab === 'calendrier' && (
                            <>
                                {/* Jours travaillés */}
                                <div className="p-[var(--space-lg)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                                    <div className="flex items-center gap-3 mb-[var(--space-md)]">
                                        <Calendar className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('preferences.joursTravaille')}</h2>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {JOURS_SEMAINE.map(jour => {
                                            const isSelected = formData.joursOuvrables.includes(jour.value);
                                            return (
                                                <button
                                                    key={jour.value}
                                                    type="button"
                                                    onClick={() => handleToggleJour(jour.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all ${
                                                        isSelected
                                                            ? 'border-[var(--color-dominant-600)] bg-[var(--color-dominant-50)]'
                                                            : 'border-[var(--color-bordure)] hover:border-[var(--color-dominant-300)]'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`font-medium ${isSelected ? 'text-[var(--color-dominant-700)]' : 'text-[var(--color-text-primary)]'}`}>
                                                            {t(jour.labelKey)}
                                                        </span>
                                                        {isSelected && <Check className="h-4 w-4 text-[var(--color-dominant-600)]" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Horaires de cours */}
                                <div className="p-[var(--space-lg)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                                    <div className="flex items-center gap-3 mb-[var(--space-md)]">
                                        <Clock className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('preferences.horairesCours')}</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-md)]">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.heureDebut')}</label>
                                            <input type="time" value={formData.heureDebutCours}
                                                onChange={(e) => setFormData(prev => ({ ...prev, heureDebutCours: e.target.value }))}
                                                className={inputClass} required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.heureFin')}</label>
                                            <input type="time" value={formData.heureFinCours}
                                                onChange={(e) => setFormData(prev => ({ ...prev, heureFinCours: e.target.value }))}
                                                className={inputClass} required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.dureeCreneau')}</label>
                                            <input type="number" value={formData.dureeCreneauStandard}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dureeCreneauStandard: parseInt(e.target.value) }))}
                                                className={inputClass} min="30" max="120" required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-md)] mt-[var(--space-md)]">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.dureeRecreation')}</label>
                                            <input type="number" value={formData.dureeRecreation}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dureeRecreation: parseInt(e.target.value) }))}
                                                className={inputClass} min="5" max="30" required
                                            />
                                        </div>
                                        <div className="flex items-end pb-2">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={formData.repartitionEquilibree}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, repartitionEquilibree: e.target.checked }))}
                                                    className="w-5 h-5 rounded border-[var(--color-bordure)] text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                                                />
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('preferences.repartitionEquilibree')}</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Contraintes */}
                                <div className="p-[var(--space-lg)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                                    <div className="flex items-center gap-3 mb-[var(--space-md)]">
                                        <BarChart3 className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('preferences.contraintes')}</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-md)]">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.maxCreneauxJour')}</label>
                                            <input type="number" value={formData.maxCreneauxParJour}
                                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxParJour: parseInt(e.target.value) }))}
                                                className={inputClass} min="4" max="12" required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.maxMemeMatiereJour')}</label>
                                            <input type="number" value={formData.maxCreneauxMatiereParJour}
                                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxMatiereParJour: parseInt(e.target.value) }))}
                                                className={inputClass} min="1" max="4" required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('preferences.maxConsecutifsMatiere')}</label>
                                            <input type="number" value={formData.maxCreneauxConsecutifs}
                                                onChange={(e) => setFormData(prev => ({ ...prev, maxCreneauxConsecutifs: parseInt(e.target.value) }))}
                                                className={inputClass} min="1" max="3" required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'joursFeries' && (
                            <>
                                {/* Exclusion JF */}
                                <div className="p-[var(--space-lg)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                                    <div className="flex items-center gap-3 mb-[var(--space-md)]">
                                        <Shield className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('joursFeries.exclureTitre')}</h2>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)] mb-[var(--space-md)]">
                                        {t('joursFeries.exclureAide')}
                                    </p>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox"
                                            checked={formData.exclureJoursFeries}
                                            onChange={(e) => setFormData(prev => ({ ...prev, exclureJoursFeries: e.target.checked }))}
                                            className="w-5 h-5 rounded border-[var(--color-bordure)] text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                                        />
                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('joursFeries.exclureLabel')}</span>
                                    </label>
                                </div>

                                {/* Gestion JF */}
                                <div className="p-[var(--space-lg)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                                    <div className="flex items-center justify-between mb-[var(--space-md)]">
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('joursFeries.titreSection')}</h2>
                                        </div>
                                        <ElisaButton
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => { setModalJFEdit(null); setModalJFOpen(true); }}
                                            icon={<Plus className="h-4 w-4" />}
                                        >
                                            {t('joursFeries.ajouter', 'Ajouter')}
                                        </ElisaButton>
                                    </div>

                                    {/* Charger modèle */}
                                    <div className="flex flex-wrap items-end gap-3 mb-[var(--space-md)]">
                                        <div className="flex-1" style={{ minWidth: 'clamp(150px, 30vw, 250px)' }}>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('joursFeries.selectPays')}</label>
                                            <ElisaSelect
                                                value={paysSelectionne}
                                                onValueChange={setPaysSelectionne}
                                                options={paysCodes.map(code => ({ value: code, label: t(`joursFeries.pays_${code}`) }))}
                                                searchable
                                            />
                                        </div>
                                        <ElisaButton
                                            type="button" variant="outline" size="md"
                                            onClick={() => chargerModele.mutate({ pays: paysSelectionne })}
                                            disabled={chargerModele.isPending}
                                            icon={chargerModele.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                        >
                                            {t('joursFeries.chargerModele')}
                                        </ElisaButton>
                                    </div>

                                    {/* Générer variables */}
                                    <div className="flex flex-wrap items-end gap-3 mb-[var(--space-xs)]">
                                        <div className="flex-1" style={{ minWidth: 'clamp(100px, 20vw, 150px)' }}>
                                            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">{t('joursFeries.anneeGeneration', 'Année')}</label>
                                            <input type="number" value={anneeGeneration}
                                                onChange={(e) => setAnneeGeneration(parseInt(e.target.value) || new Date().getFullYear())}
                                                className={inputClass} min={2000} max={2100}
                                            />
                                        </div>
                                        <ElisaButton
                                            type="button" variant="secondary" size="md"
                                            onClick={() => genererVariables.mutate({ annee: anneeGeneration, pays: paysSelectionne })}
                                            disabled={genererVariables.isPending}
                                            icon={genererVariables.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                        >
                                            {t('joursFeries.genererVariables')}
                                        </ElisaButton>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-secondary)] mb-[var(--space-md)]">
                                        {t('joursFeries.genererVariablesAide')}
                                    </p>

                                    {/* Recherche + filtre */}
                                    {joursFeries.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-[var(--gap-sm)] mb-3">
                                            <div className="relative flex-1" style={{ minWidth: 'clamp(120px, 30vw, 250px)' }}>
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-secondary)]" />
                                                <input type="text" value={rechercheJF}
                                                    onChange={(e) => { setRechercheJF(e.target.value); setPageJF(1); }}
                                                    placeholder={t('joursFeries.rechercher', 'Rechercher...')}
                                                    className={`${inputClass} pl-9`}
                                                />
                                            </div>
                                            <div className="flex rounded-lg border border-[var(--color-bordure)] overflow-hidden">
                                                {(['tous', 'recurrent', 'ponctuel'] as const).map(type => (
                                                    <button key={type} type="button"
                                                        onClick={() => { setFiltreTypeJF(type); setPageJF(1); }}
                                                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                                            filtreTypeJF === type
                                                                ? 'bg-[var(--color-dominant-600)] text-white'
                                                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]'
                                                        }`}
                                                    >
                                                        {type === 'tous' ? t('joursFeries.tous', 'Tous') : type === 'recurrent' ? t('joursFeries.reecurrent') : t('joursFeries.ponctuel')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Table JF */}
                                    {(() => {
                                        const jfFiltres = joursFeries.filter(jf => {
                                            if (rechercheJF && !jf.nom.toLowerCase().includes(rechercheJF.toLowerCase())) return false;
                                            if (filtreTypeJF === 'recurrent' && !jf.estRecurrent) return false;
                                            if (filtreTypeJF === 'ponctuel' && jf.estRecurrent) return false;
                                            return true;
                                        });
                                        const totalPages = Math.max(1, Math.ceil(jfFiltres.length / JF_PAR_PAGE));
                                        const jfPage = jfFiltres.slice((pageJF - 1) * JF_PAR_PAGE, pageJF * JF_PAR_PAGE);

                                        return jfFiltres.length === 0 ? (
                                            <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
                                                {joursFeries.length === 0 ? t('joursFeries.aucunJF') : t('joursFeries.aucunResultat', 'Aucun résultat')}
                                            </p>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="border-b border-[var(--color-bordure)]">
                                                                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-secondary)]">{t('preferences.nom', 'Nom')}</th>
                                                                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-secondary)]">{t('joursFeries.colonneDate', 'Date')}</th>
                                                                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-secondary)]">{t('joursFeries.type', 'Type')}</th>
                                                                <th className="text-left py-2 px-3 font-medium text-[var(--color-text-secondary)]">{t('joursFeries.origine', 'Origine')}</th>
                                                                <th className="text-right py-2 px-3 font-medium text-[var(--color-text-secondary)]">{t('joursFeries.actions', 'Actions')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {jfPage.map(jf => (
                                                                <tr key={jf.id} className="border-b border-[var(--color-bordure)]/50 hover:bg-[var(--color-surface-hover)]/50">
                                                                    <td className="py-2 px-3">
                                                                        <div className="flex items-center gap-2">
                                                                            {jf.couleur && <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: jf.couleur }} />}
                                                                            <span className="text-[var(--color-text-primary)]">{jf.nom}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-[var(--color-text-secondary)]">
                                                                        {jf.estRecurrent && jf.mois && jf.jourMois
                                                                            ? `${jf.jourMois.toString().padStart(2, '0')}/${jf.mois.toString().padStart(2, '0')}`
                                                                            : jf.date ? new Date(jf.date + 'T00:00:00').toLocaleDateString('fr-FR') : '—'}
                                                                    </td>
                                                                    <td className="py-2 px-3">
                                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                            jf.estRecurrent ? 'bg-[var(--color-accent-100)] text-[var(--color-accent-700)]' : 'bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]'
                                                                        }`}>
                                                                            {jf.estRecurrent ? t('joursFeries.reecurrent') : t('joursFeries.ponctuel')}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3">
                                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                            jf.estSysteme ? 'bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)]' : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                                                                        }`}>
                                                                            {jf.estSysteme ? t('joursFeries.systeme') : (jf.pays ? t(`joursFeries.pays_${jf.pays}`) : t('joursFeries.custom'))}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right">
                                                                        <div className="flex items-center justify-end gap-1">
                                                                            {!(jf.estSysteme && !jf.etablissementId) && (
                                                                                <button type="button" onClick={() => { setModalJFEdit(jf); setModalJFOpen(true); }}
                                                                                    className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-50)] transition-colors"
                                                                                    title={t('joursFeries.modifierTitre', 'Modifier')}>
                                                                                    <Edit className="h-4 w-4" />
                                                                                </button>
                                                                            )}
                                                                            {!(jf.estSysteme && !jf.etablissementId) && (
                                                                                <button type="button"
                                                                                    onClick={() => ask({
                                                                                        title: t('joursFeries.confirmerSuppressionTitre', 'Supprimer'),
                                                                                        message: t('joursFeries.confirmerSuppressionMessage', 'Supprimer « {{nom}} » ?', { nom: jf.nom }),
                                                                                        variant: 'danger',
                                                                                        onConfirm: () => supprimerJF.mutateAsync(jf.id),
                                                                                    })}
                                                                                    className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors">
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {totalPages > 1 && (
                                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-bordure)]">
                                                        <span className="text-xs text-[var(--color-text-secondary)]">
                                                            {jfFiltres.length} {t('joursFeries.resultats', 'résultat(s)')}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            <button type="button" disabled={pageJF <= 1} onClick={() => setPageJF(p => p - 1)}
                                                                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 transition-colors">
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </button>
                                                            <span className="text-xs text-[var(--color-text-secondary)] px-2">{pageJF} / {totalPages}</span>
                                                            <button type="button" disabled={pageJF >= totalPages} onClick={() => setPageJF(p => p + 1)}
                                                                className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] disabled:opacity-40 transition-colors">
                                                                <ChevronRight className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </>
                        )}

                        {activeTab === 'automation' && (
                            <div className="p-[var(--space-lg)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] shadow-sm">
                                <div className="flex items-center gap-3 mb-[var(--space-md)]">
                                    <RefreshCw className="h-5 w-5 text-[var(--color-dominant-600)]" />
                                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{t('preferences.materialisationAuto')}</h2>
                                </div>
                                <p className="text-sm text-[var(--color-text-secondary)] mb-[var(--space-md)]">
                                    {t('preferences.materialisationAutoAide')}
                                </p>

                                <div className="flex items-center gap-3 mb-[var(--space-md)]">
                                    <input type="checkbox" checked={formData.materialisationAuto.actif}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            materialisationAuto: { ...prev.materialisationAuto, actif: e.target.checked },
                                        }))}
                                        className="w-5 h-5 rounded border-[var(--color-bordure)] text-[var(--color-dominante)] focus:ring-[var(--color-dominante)]"
                                    />
                                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{t('preferences.materialisationActive')}</span>
                                </div>

                                <div className="space-y-3">
                                    {formData.materialisationAuto.horaires.map((horaire, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <ElisaSelect
                                                value={horaire.jour}
                                                onValueChange={(v) => majHoraire(index, 'jour', v)}
                                                options={JOURS_SEMAINE.map(j => ({ value: j.value, label: t(j.labelKey) }))}
                                                disabled={!formData.materialisationAuto.actif}
                                                compact
                                            />
                                            <input type="time" value={horaire.heure}
                                                onChange={(e) => majHoraire(index, 'heure', e.target.value)}
                                                className={`${inputClass} flex-1`} required
                                                disabled={!formData.materialisationAuto.actif}
                                            />
                                            <button type="button" onClick={() => supprimerHoraire(index)}
                                                disabled={!formData.materialisationAuto.actif || formData.materialisationAuto.horaires.length <= 1}
                                                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 transition-colors disabled:opacity-40"
                                                aria-label={t('preferences.supprimerHoraire')}>
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <ElisaButton type="button" variant="outline" size="sm" onClick={ajouterHoraire}
                                    icon={<Plus className="h-4 w-4" />}
                                    disabled={!formData.materialisationAuto.actif || formData.materialisationAuto.horaires.length >= 14}
                                    className="mt-[var(--space-md)]"
                                >
                                    {t('preferences.ajouterHoraire')}
                                </ElisaButton>
                            </div>
                        )}

                        {activeTab === 'templates' && (
                            <EDTTemplatesPage />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ─── Footer actions (sticky) ──────────────────────── */}
                <div className="sticky bottom-0 z-10 -mx-[var(--space-sm)] px-[var(--space-md)] py-[var(--space-sm)] bg-[var(--color-background)]/95 backdrop-blur-md border-t border-[var(--color-bordure)]">
                    <div className="flex items-center justify-between gap-[var(--gap-sm)] max-w-full">
                        {/* Indicateur modifications non enregistrées */}
                        <div className="flex items-center gap-[var(--gap-xs)] min-w-0">
                            {isDirty && !updatePreferences.isPending && (
                                <>
                                    <span className="h-2 w-2 rounded-full bg-[var(--color-accent-500)] shrink-0 animate-pulse" />
                                    <span className="text-xs text-[var(--color-text-secondary)] truncate hidden sm:inline">
                                        {t('preferences.modificationsNonEnregistrees')}
                                    </span>
                                </>
                            )}
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-[var(--gap-sm)] shrink-0">
                            <ElisaButton type="button" variant="outline" size="md" onClick={reinitialiser}
                                icon={<RefreshCw className="h-4 w-4" />}
                                disabled={!isDirty || updatePreferences.isPending}
                            >
                                <span className="hidden sm:inline">{t('preferences.reinitialiser')}</span>
                            </ElisaButton>
                            <ElisaButton type="submit" variant="primary" size="md"
                                icon={updatePreferences.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                disabled={!isDirty || updatePreferences.isPending}
                            >
                                {updatePreferences.isPending ? t('preferences.enregistrement') : t('preferences.enregistrer')}
                            </ElisaButton>
                        </div>
                    </div>
                </div>
            </form>
            {ConfirmJFModal}
            <JourFerieFormModal
                open={modalJFOpen}
                onOpenChange={setModalJFOpen}
                jourFerie={modalJFEdit}
                paysDefaut={paysSelectionne}
            />
        </>
    );
}
