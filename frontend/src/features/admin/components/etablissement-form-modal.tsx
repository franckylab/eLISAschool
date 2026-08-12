/**
 * ==================================
 * eLISAschool - Modal Établissement Adaptatif
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal unique adaptatif :
 * - Mode CREATE : 4 étapes (Infos → Plan → Options → Résumé)
 * - Mode EDIT : 3 onglets horizontaux (Identité / Contact / Configuration)
 *
 * Phase — Nettoyage Rôles SuperAdmin v8
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CustomModal } from '@/components/modals/CustomModal';
import { ColorPicker } from '@/components/ui/ColorPicker';
import {
    Building2,
    Package,
    Puzzle,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertCircle,
    User,
    Phone,
    Settings,
    Globe,
    Facebook,
    Twitter,
    Palette,
    Clock,
    GraduationCap,
    Mail,
} from 'lucide-react';
import type { Etablissement, TypeEtablissement, SousSysteme } from '@/features/etablissements/types/etablissement.types';

// =============================================
// Types
// =============================================

interface EtablissementFormData {
    // Identité
    nom: string;
    codeEtablissement: string;
    type: TypeEtablissement;
    sousSysteme: SousSysteme;
    slogan: string;
    ville: string;
    adresse: string;
    // Contact
    contactEmail: string;
    contactTelephone: string;
    siteWeb: string;
    facebook: string;
    twitter: string;
    // Configuration
    directeurNom: string;
    directeurAdjointNom: string;
    censeurNom: string;
    surveillantGeneralNom: string;
    langueDefaut: string;
    devise: string;
    fuseauHoraire: string;
    couleurPrimaire: string;
    couleurSecondaire: string;
    heuresOuverture: string;
    heuresFermeture: string;
    // Plan (create uniquement)
    planId: string;
    cycleFacturation: string;
}

interface EtablissementFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    etablissement?: Etablissement;
    mode: 'create' | 'edit';
}

interface PlanOption {
    id: string;
    nom: string;
    prixBase: number;
    devise: string;
    maxEleves: number;
}

// =============================================
// Constants
// =============================================

const TYPES_ETABLISSEMENT: { value: TypeEtablissement; label: string }[] = [
    { value: 'LAIC', label: 'Laïc' },
    { value: 'CONFESSIONNEL_CATHOLIQUE', label: 'Confessionnel Catholique' },
    { value: 'CONFESSIONNEL_PROTESTANT', label: 'Confessionnel Protestant' },
    { value: 'CONFESSIONNEL_ISLAMIQUE', label: 'Confessionnel Islamique' },
    { value: 'AUTRE', label: 'Autre' },
];

const SOUS_SYSTEMES: { value: SousSysteme; label: string }[] = [
    { value: 'FRANCOPHONE', label: 'Francophone' },
    { value: 'ANGLOPHONE', label: 'Anglophone' },
    { value: 'BICULTUREL', label: 'Biculturel' },
];

const CYCLES_FACTURATION = [
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'TRIMESTRIEL', label: 'Trimestriel' },
    { value: 'SEMESTRIEL', label: 'Semestriel' },
    { value: 'ANNUEL', label: 'Annuel' },
];

const LANGUES = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
];

const DEVISES = [
    { value: 'XAF', label: 'FCFA (XAF)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'Dollar (USD)' },
];

const STEPS = [
    { key: 'infos', label: 'Infos', icon: Building2 },
    { key: 'plan', label: 'Plan', icon: Package },
    { key: 'options', label: 'Options', icon: Puzzle },
    { key: 'resume', label: 'Résumé', icon: CheckCircle2 },
];

const EDIT_TABS = [
    { key: 'identite', label: 'Identité', icon: Building2 },
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'config', label: 'Configuration', icon: Settings },
];

const DEFAULT_FORM: EtablissementFormData = {
    nom: '',
    codeEtablissement: '',
    type: 'LAIC',
    sousSysteme: 'FRANCOPHONE',
    slogan: '',
    ville: '',
    adresse: '',
    contactEmail: '',
    contactTelephone: '',
    siteWeb: '',
    facebook: '',
    twitter: '',
    directeurNom: '',
    directeurAdjointNom: '',
    censeurNom: '',
    surveillantGeneralNom: '',
    langueDefaut: 'fr',
    devise: 'XAF',
    fuseauHoraire: 'Africa/Douala',
    couleurPrimaire: '#28a745',
    couleurSecondaire: '#ffc107',
    heuresOuverture: '07:00',
    heuresFermeture: '18:00',
    planId: '',
    cycleFacturation: 'MENSUEL',
};

// =============================================
// Helpers
// =============================================

function mapEtablissementToForm(etab: Etablissement): Partial<EtablissementFormData> {
    return {
        nom: etab.nom || '',
        codeEtablissement: etab.codeEtablissement || '',
        type: etab.type || 'LAIC',
        sousSysteme: etab.sousSysteme || 'FRANCOPHONE',
        slogan: etab.slogan || '',
        ville: etab.ville || '',
        adresse: etab.adresse || '',
        contactEmail: etab.contactEmail || '',
        contactTelephone: etab.contactTelephone || '',
        siteWeb: etab.siteWeb || '',
        facebook: etab.facebook || '',
        twitter: etab.twitter || '',
        directeurNom: etab.directeurNom || '',
        directeurAdjointNom: etab.directeurAdjointNom || '',
        censeurNom: etab.censeurNom || '',
        surveillantGeneralNom: etab.surveillantGeneralNom || '',
        langueDefaut: etab.langueDefaut || 'fr',
        devise: etab.devise || 'XAF',
        fuseauHoraire: etab.fuseauHoraire || 'Africa/Douala',
        couleurPrimaire: etab.couleurPrimaire || '#28a745',
        couleurSecondaire: etab.couleurSecondaire || '#ffc107',
        heuresOuverture: etab.heuresOuverture || '07:00',
        heuresFermeture: etab.heuresFermeture || '18:00',
    };
}

// =============================================
// Composant principal
// =============================================

export function EtablissementFormModal({ open, onOpenChange, etablissement, mode }: EtablissementFormModalProps) {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const isEdit = mode === 'edit';

    // State
    const [step, setStep] = useState(0);
    const [editTab, setEditTab] = useState(0);
    const [form, setForm] = useState<EtablissementFormData>({ ...DEFAULT_FORM });
    const [error, setError] = useState<string | null>(null);

    // Initialisation du formulaire quand l'établissement change
    useEffect(() => {
        if (etablissement && isEdit) {
            setForm(prev => ({ ...prev, ...mapEtablissementToForm(etablissement) }));
        } else if (!isEdit) {
            setForm({ ...DEFAULT_FORM });
        }
        setStep(0);
        setEditTab(0);
        setError(null);
    }, [etablissement, isEdit, open]);

    // Fetch plans (create uniquement)
    const { data: plans } = useQuery<PlanOption[] | undefined>({
        queryKey: ['platform-plans-options'],
        queryFn: async () => {
            const res = await apiClient.get<PlanOption[]>('/api/platform/facturation/plans');
            return res.data;
        },
        enabled: !isEdit,
    });

    // Mutation CREATE
    const createMutation = useMutation({
        mutationFn: async (data: EtablissementFormData) => {
            const apiPayload = {
                nom: data.nom,
                codeEtablissement: data.codeEtablissement || undefined,
                slogan: data.slogan || undefined,
                adresse: data.adresse || undefined,
                ville: data.ville || undefined,
                contactTelephone: data.contactTelephone || undefined,
                contactEmail: data.contactEmail || undefined,
                type: data.type,
                sousSysteme: data.sousSysteme,
            };
            const res = await apiClient.post<any>('/api/platform/etablissements', apiPayload);
            if (data.planId && res.data?.id) {
                await apiClient.post('/api/platform/facturation/abonnements', {
                    etablissementId: res.data.id,
                    planId: data.planId,
                    cycleFacturation: data.cycleFacturation,
                });
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-abonnements'] });
            onOpenChange(false);
        },
        onError: (err: any) => setError(err?.response?.data?.message || t('etablissementForm.erreurCreation')),
    });

    // Mutation UPDATE
    const updateMutation = useMutation({
        mutationFn: async (data: EtablissementFormData) => {
            const apiPayload = {
                nom: data.nom,
                codeEtablissement: data.codeEtablissement || undefined,
                slogan: data.slogan || undefined,
                ville: data.ville || undefined,
                adresse: data.adresse || undefined,
                contactEmail: data.contactEmail || undefined,
                contactTelephone: data.contactTelephone || undefined,
                siteWeb: data.siteWeb || undefined,
                facebook: data.facebook || undefined,
                twitter: data.twitter || undefined,
                directeurNom: data.directeurNom || undefined,
                directeurAdjointNom: data.directeurAdjointNom || undefined,
                censeurNom: data.censeurNom || undefined,
                surveillantGeneralNom: data.surveillantGeneralNom || undefined,
                langueDefaut: data.langueDefaut || undefined,
                devise: data.devise || undefined,
                fuseauHoraire: data.fuseauHoraire || undefined,
                couleurPrimaire: data.couleurPrimaire || undefined,
                couleurSecondaire: data.couleurSecondaire || undefined,
                heuresOuverture: data.heuresOuverture || undefined,
                heuresFermeture: data.heuresFermeture || undefined,
                type: data.type,
                sousSysteme: data.sousSysteme,
            };
            const res = await apiClient.patch<Etablissement>(
                `/api/platform/etablissements/${etablissement!.id}`,
                apiPayload
            );
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-liste'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissement-detail'] });
            queryClient.invalidateQueries({ queryKey: ['platform-etablissements-stats'] });
            onOpenChange(false);
        },
        onError: (err: any) => setError(err?.response?.data?.message || 'Erreur lors de la mise à jour'),
    });

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    const updateField = useCallback(<K extends keyof EtablissementFormData>(key: K, value: EtablissementFormData[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    // Navigation create
    const canNext = step === 0 ? form.nom.trim().length > 0 : true;
    const handleNext = () => { if (canNext && step < STEPS.length - 1) setStep(s => s + 1); };
    const handlePrev = () => { if (step > 0) setStep(s => s - 1); };

    // Submit
    const handleSubmit = () => {
        setError(null);
        if (isEdit) {
            updateMutation.mutate(form);
        } else {
            createMutation.mutate(form);
        }
    };

    const selectedPlan = plans?.find(p => p.id === form.planId);

    // =============================================
    // Mode EDIT — Onglets horizontaux
    // =============================================

    const renderEditTabIdentite = () => (
        <div className="space-y-[var(--gap-md)]">
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                    {t('etablissementForm.infos.nom')} *
                </label>
                <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    placeholder={t('etablissementForm.infos.nomPlaceholder')}
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.infos.code')}
                    </label>
                    <input
                        type="text"
                        value={form.codeEtablissement}
                        onChange={(e) => updateField('codeEtablissement', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)] font-mono"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="EX: ETAB-001"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.infos.type')}
                    </label>
                    <select
                        value={form.type}
                        onChange={(e) => updateField('type', e.target.value as TypeEtablissement)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    >
                        {TYPES_ETABLISSEMENT.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                    {t('etablissementForm.infos.sousSysteme', 'Système éducatif')}
                </label>
                <select
                    value={form.sousSysteme}
                    onChange={(e) => updateField('sousSysteme', e.target.value as SousSysteme)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                >
                    {SOUS_SYSTEMES.map(ss => (
                        <option key={ss.value} value={ss.value}>{ss.label}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                    {t('etablissementForm.infos.slogan', 'Slogan')}
                </label>
                <input
                    type="text"
                    value={form.slogan}
                    onChange={(e) => updateField('slogan', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    placeholder="Excellence, Discipline, Réussite"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.infos.ville', 'Ville')}
                    </label>
                    <input
                        type="text"
                        value={form.ville}
                        onChange={(e) => updateField('ville', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="Douala"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.infos.adresse')}
                    </label>
                    <input
                        type="text"
                        value={form.adresse}
                        onChange={(e) => updateField('adresse', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder={t('etablissementForm.infos.adressePlaceholder')}
                    />
                </div>
            </div>
        </div>
    );

    const renderEditTabContact = () => (
        <div className="space-y-[var(--gap-md)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        <Mail className="inline h-3.5 w-3.5 mr-1" />
                        {t('etablissementForm.infos.email')}
                    </label>
                    <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => updateField('contactEmail', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="contact@etablissement.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        <Phone className="inline h-3.5 w-3.5 mr-1" />
                        {t('etablissementForm.infos.telephone')}
                    </label>
                    <input
                        type="tel"
                        value={form.contactTelephone}
                        onChange={(e) => updateField('contactTelephone', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="+237 6XX XXX XXX"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                    <Globe className="inline h-3.5 w-3.5 mr-1" />
                    {t('etablissementForm.infos.siteWeb', 'Site web')}
                </label>
                <input
                    type="url"
                    value={form.siteWeb}
                    onChange={(e) => updateField('siteWeb', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    placeholder="https://www.etablissement.com"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        <Facebook className="inline h-3.5 w-3.5 mr-1" />
                        Facebook
                    </label>
                    <input
                        type="url"
                        value={form.facebook}
                        onChange={(e) => updateField('facebook', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="https://facebook.com/..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        <Twitter className="inline h-3.5 w-3.5 mr-1" />
                        Twitter / X
                    </label>
                    <input
                        type="url"
                        value={form.twitter}
                        onChange={(e) => updateField('twitter', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="https://x.com/..."
                    />
                </div>
            </div>
        </div>
    );

    const renderEditTabConfig = () => (
        <div className="space-y-[var(--gap-md)]">
            {/* Direction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        <GraduationCap className="inline h-3.5 w-3.5 mr-1" />
                        {t('etablissementForm.config.directeur', 'Directeur')}
                    </label>
                    <input
                        type="text"
                        value={form.directeurNom}
                        onChange={(e) => updateField('directeurNom', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.config.directeurAdjoint', 'Directeur adjoint')}
                    </label>
                    <input
                        type="text"
                        value={form.directeurAdjointNom}
                        onChange={(e) => updateField('directeurAdjointNom', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.config.censeur', 'Censeur')}
                    </label>
                    <input
                        type="text"
                        value={form.censeurNom}
                        onChange={(e) => updateField('censeurNom', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.config.surveillantGeneral', 'Surveillant général')}
                    </label>
                    <input
                        type="text"
                        value={form.surveillantGeneralNom}
                        onChange={(e) => updateField('surveillantGeneralNom', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    />
                </div>
            </div>

            {/* Locale */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.config.langue', 'Langue')}
                    </label>
                    <select
                        value={form.langueDefaut}
                        onChange={(e) => updateField('langueDefaut', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    >
                        {LANGUES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.config.devise', 'Devise')}
                    </label>
                    <select
                        value={form.devise}
                        onChange={(e) => updateField('devise', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    >
                        {DEVISES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        {t('etablissementForm.config.fuseau', 'Fuseau horaire')}
                    </label>
                    <input
                        type="text"
                        value={form.fuseauHoraire}
                        onChange={(e) => updateField('fuseauHoraire', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    />
                </div>
            </div>

            {/* Couleurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <ColorPicker
                    label={t('etablissementForm.config.couleurPrimaire', 'Couleur primaire')}
                    value={form.couleurPrimaire}
                    onChange={(v) => updateField('couleurPrimaire', v)}
                />
                <ColorPicker
                    label={t('etablissementForm.config.couleurSecondaire', 'Couleur secondaire')}
                    value={form.couleurSecondaire}
                    onChange={(v) => updateField('couleurSecondaire', v)}
                />
            </div>

            {/* Horaires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--gap-md)]">
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        <Clock className="inline h-3.5 w-3.5 mr-1" />
                        {t('etablissementForm.config.heuresOuverture', 'Heure ouverture')}
                    </label>
                    <input
                        type="time"
                        value={form.heuresOuverture}
                        onChange={(e) => updateField('heuresOuverture', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-texte)' }}>
                        <Clock className="inline h-3.5 w-3.5 mr-1" />
                        {t('etablissementForm.config.heuresFermeture', 'Heure fermeture')}
                    </label>
                    <input
                        type="time"
                        value={form.heuresFermeture}
                        onChange={(e) => updateField('heuresFermeture', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    />
                </div>
            </div>
        </div>
    );

    const editTabRenderers = [renderEditTabIdentite, renderEditTabContact, renderEditTabConfig];

    // =============================================
    // Mode CREATE — Étapes
    // =============================================

    const renderStepInfos = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.nom')}</label>
                <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => updateField('nom', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    placeholder={t('etablissementForm.infos.nomPlaceholder')}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.code')}</label>
                    <input
                        type="text"
                        value={form.codeEtablissement}
                        onChange={(e) => updateField('codeEtablissement', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)] font-mono"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="ETAB-001"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.type')}</label>
                    <select
                        value={form.type}
                        onChange={(e) => updateField('type', e.target.value as TypeEtablissement)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    >
                        {TYPES_ETABLISSEMENT.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.sousSysteme', 'Système éducatif')}</label>
                <select
                    value={form.sousSysteme}
                    onChange={(e) => updateField('sousSysteme', e.target.value as SousSysteme)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                >
                    {SOUS_SYSTEMES.map(ss => <option key={ss.value} value={ss.value}>{ss.label}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.adresse')}</label>
                <input
                    type="text"
                    value={form.adresse}
                    onChange={(e) => updateField('adresse', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    placeholder={t('etablissementForm.infos.adressePlaceholder')}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.telephone')}</label>
                    <input
                        type="tel"
                        value={form.contactTelephone}
                        onChange={(e) => updateField('contactTelephone', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="+237 6XX XXX XXX"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.infos.email')}</label>
                    <input
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => updateField('contactEmail', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                        placeholder="contact@etablissement.com"
                    />
                </div>
            </div>
        </div>
    );

    const renderStepPlan = () => (
        <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissementForm.plan.desc')}</p>
            <div className="grid gap-3">
                {plans?.map(plan => (
                    <button
                        key={plan.id}
                        type="button"
                        onClick={() => updateField('planId', plan.id)}
                        className={`flex items-center justify-between p-4 rounded-lg border text-left transition-colors ${
                            form.planId === plan.id
                                ? 'border-[var(--color-dominant-600)] ring-1 ring-[var(--color-dominant-600)]'
                                : 'border-[var(--color-bordure)] hover:border-[var(--color-dominant-300)]'
                        }`}
                        style={form.planId === plan.id ? { backgroundColor: 'color-mix(in srgb, var(--color-dominant-600) 5%, transparent)' } : undefined}
                    >
                        <div>
                            <div className="font-medium">{plan.nom}</div>
                            <div className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissementForm.plan.maxEleves', { max: plan.maxEleves })}
                            </div>
                        </div>
                        <div className="text-lg font-bold">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: plan.devise, minimumFractionDigits: 0 }).format(plan.prixBase)}
                            <span className="text-xs font-normal" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissementForm.plan.mois')}</span>
                        </div>
                    </button>
                ))}
                {(!plans || plans.length === 0) && (
                    <div className="text-center py-8 text-sm border border-dashed rounded-lg" style={{ color: 'var(--color-texte-muted)', borderColor: 'var(--color-bordure)' }}>
                        {t('etablissementForm.plan.aucun')}
                    </div>
                )}
            </div>
            {form.planId && (
                <div>
                    <label className="block text-sm font-medium mb-1">{t('etablissementForm.plan.cycle')}</label>
                    <select
                        value={form.cycleFacturation}
                        onChange={(e) => updateField('cycleFacturation', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-[var(--color-surface)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    >
                        {CYCLES_FACTURATION.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
            )}
        </div>
    );

    const renderStepOptions = () => (
        <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissementForm.options.desc')}</p>
            <div className="border border-dashed rounded-lg p-6 text-center text-sm" style={{ color: 'var(--color-texte-muted)', borderColor: 'var(--color-bordure)' }}>
                {t('etablissementForm.options.info')}
            </div>
        </div>
    );

    const renderStepResume = () => (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2" style={{ borderColor: 'var(--color-bordure)' }}>
                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-texte)' }}>
                    <Building2 className="w-5 h-5" />
                    {form.nom || t('etablissementForm.resume.nouvelEtab')}
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span style={{ color: 'var(--color-texte-muted)' }}>Code:</span> <span className="font-mono">{form.codeEtablissement || '-'}</span></div>
                    <div><span style={{ color: 'var(--color-texte-muted)' }}>Type:</span> {TYPES_ETABLISSEMENT.find(t => t.value === form.type)?.label}</div>
                    <div><span style={{ color: 'var(--color-texte-muted)' }}>Système:</span> {SOUS_SYSTEMES.find(s => s.value === form.sousSysteme)?.label}</div>
                    <div><span style={{ color: 'var(--color-texte-muted)' }}>Adresse:</span> {form.adresse || '-'}</div>
                    <div><span style={{ color: 'var(--color-texte-muted)' }}>Téléphone:</span> {form.contactTelephone || '-'}</div>
                    <div><span style={{ color: 'var(--color-texte-muted)' }}>Email:</span> {form.contactEmail || '-'}</div>
                </div>
            </div>
            {selectedPlan && (
                <div className="border rounded-lg p-4 space-y-2" style={{ borderColor: 'var(--color-bordure)' }}>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {t('etablissementForm.resume.abonnement')}
                    </h4>
                    <div className="text-sm">
                        <div><span style={{ color: 'var(--color-texte-muted)' }}>{t('etablissementForm.resume.plan')}</span> <span className="font-medium">{selectedPlan.nom}</span></div>
                        <div><span style={{ color: 'var(--color-texte-muted)' }}>{t('etablissementForm.resume.cycle')}</span> {CYCLES_FACTURATION.find(c => c.value === form.cycleFacturation)?.label}</div>
                        <div className="text-lg font-bold mt-1">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: selectedPlan.devise, minimumFractionDigits: 0 }).format(selectedPlan.prixBase)}
                            <span className="text-xs font-normal" style={{ color: 'var(--color-texte-muted)' }}>/{form.cycleFacturation === 'MENSUEL' ? t('etablissementForm.resume.mois') : t('etablissementForm.resume.periode')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const stepRenderers = [renderStepInfos, renderStepPlan, renderStepOptions, renderStepResume];

    // =============================================
    // Footer adaptatif
    // =============================================

    const footer = isEdit ? (
        <div className="flex items-center justify-end gap-[var(--gap-sm)] w-full">
            <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm rounded-lg border transition-colors"
                style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte-muted)' }}
                disabled={isSubmitting}
            >
                {t('common:annuler', 'Annuler')}
            </button>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !form.nom.trim()}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
            >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t('common:enregistrer', 'Enregistrer')}
            </button>
        </div>
    ) : (
        <div className="flex items-center justify-between w-full">
            <button
                type="button"
                onClick={handlePrev}
                disabled={step === 0 || isSubmitting}
                className="flex items-center gap-1 px-4 py-2 text-sm disabled:opacity-50"
                style={{ color: 'var(--color-texte-muted)' }}
            >
                <ArrowLeft className="w-4 h-4" />
                {t('etablissementForm.precedent')}
            </button>
            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                {t('etablissementForm.etape', { current: step + 1, total: STEPS.length })}
            </span>
            {step < STEPS.length - 1 ? (
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canNext}
                    className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                >
                    {t('etablissementForm.suivant')}
                    <ArrowRight className="w-4 h-4" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {t('etablissementForm.creer')}
                </button>
            )}
        </div>
    );

    // =============================================
    // Rendu principal
    // =============================================

    const modalTitle = isEdit
        ? t('etablissementForm.modifier', { nom: etablissement?.nom || '' })
        : t('etablissementForm.nouveau');

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={modalTitle}
            description={isEdit ? EDIT_TABS[editTab]?.label : STEPS[step]?.label}
            size="xl"
            footer={footer}
            closeOnOverlayClick={!isSubmitting}
        >
            <div className="space-y-4">
                {/* Erreur */}
                {error && (
                    <div className="flex items-center gap-2 p-3 rounded-[var(--radius-lg)]" style={{ backgroundColor: 'var(--color-danger-50)', color: 'var(--color-danger-700)' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.875rem)' }}>{error}</span>
                    </div>
                )}

                {/* Mode EDIT : Onglets horizontaux */}
                {isEdit ? (
                    <>
                        <div className="flex items-center gap-1 border-b pb-2" style={{ borderColor: 'var(--color-bordure)' }}>
                            {EDIT_TABS.map((tab, i) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setEditTab(i)}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md text-sm transition-colors ${
                                            i === editTab ? 'font-medium border-b-2' : 'hover:bg-[var(--color-surface-alt)]'
                                        }`}
                                        style={i === editTab ? {
                                            color: 'var(--color-dominant-600)',
                                            borderBottomColor: 'var(--color-dominant-600)',
                                        } : { color: 'var(--color-texte-muted)' }}
                                        disabled={isSubmitting}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                        {editTabRenderers[editTab]?.()}
                    </>
                ) : (
                    /* Mode CREATE : Stepper + étapes */
                    <>
                        <div className="flex items-center gap-1">
                            {STEPS.map((s, i) => {
                                const Icon = s.icon;
                                return (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() => !isSubmitting && setStep(i)}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                            i === step
                                                ? 'font-medium'
                                                : i < step
                                                    ? ''
                                                    : 'hover:bg-[var(--color-surface-alt)]'
                                        }`}
                                        style={i === step ? { backgroundColor: 'var(--color-dominant-600)', color: '#fff' } : i < step ? { backgroundColor: 'color-mix(in srgb, var(--color-dominant-600) 10%, transparent)', color: 'var(--color-dominant-600)' } : { color: 'var(--color-texte-muted)' }}
                                        disabled={isSubmitting}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                        {stepRenderers[step]?.()}
                    </>
                )}
            </div>
        </CustomModal>
    );
}

export default EtablissementFormModal;
