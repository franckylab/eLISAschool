/**
 * ==================================
 * eLISAschool - Modal formulaire Unité Organisationnelle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal create/edit pour unité organisationnelle.
 * Mode create : champs vides, parent pré-rempli si création enfant.
 * Mode edit : champs pré-remplis depuis les données de l'unité.
 */

import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomModal } from '@/components/modals/CustomModal';
import { useCreerUnite, useModifierUnite } from '../../../hooks/use-unites';
import { useUsagesUnite } from '../../../hooks/use-usages-unite';
import { useNiveauxOrganisation } from '../../../hooks/use-niveaux-organisation';
import { useAuthStore } from '@/stores/auth.store';

// Cible minimale acceptée : compatible OrganigrammeNode ET UniteOrganisationnelle.
interface UniteFormTarget {
    id: string;
    nom: string;
    code?: string;
    description?: string;
    responsableNom?: string;
}

// Schéma de validation
const uniteFormSchema = z.object({
    nom: z.string().min(2, 'Minimum 2 caractères').max(150),
    code: z.string().min(1, 'Requis').max(20),
    description: z.string().max(500).optional().or(z.literal('')),
    usageUniteId: z.string().uuid().optional().or(z.literal('')),
    niveauOrganisationId: z.string().uuid().optional().or(z.literal('')),
    parentId: z.string().uuid().optional().or(z.literal('')),
    responsableNom: z.string().max(100).optional().or(z.literal('')),
    localisation: z.string().max(200).optional().or(z.literal('')),
    telephone: z.string().max(20).optional().or(z.literal('')),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
});

type UniteFormData = z.infer<typeof uniteFormSchema>;

type ModalMode = 'create' | 'edit';

interface UniteFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Optionnel : déduit de la présence de `unite` si absent. */
    mode?: ModalMode;
    unite?: UniteFormTarget | null;
    parentUnite?: { id: string; nom: string } | null;
    /** Alternative à `parentUnite` quand seul l'id du parent est connu. */
    parentId?: string;
    onSuccess?: () => void;
}

const FORM_INIT: UniteFormData = {
    nom: '',
    code: '',
    description: '',
    usageUniteId: '',
    niveauOrganisationId: '',
    parentId: '',
    responsableNom: '',
    localisation: '',
    telephone: '',
    email: '',
};

export function UniteFormModal({ open, onOpenChange, mode, unite, parentUnite, parentId, onSuccess }: UniteFormModalProps) {
    const { t } = useTranslation('organisation');
    const etablissementId = useAuthStore(s => s.etablissementId);
    const { data: usages } = useUsagesUnite();
    const { data: niveaux } = useNiveauxOrganisation();
    const { mutateAsync: creerUnite, isPending: isCreating } = useCreerUnite();
    const { mutateAsync: modifierUnite, isPending: isUpdating } = useModifierUnite();

    // Mode déduit de la présence de `unite` si non fourni explicitement.
    const effectiveMode: ModalMode = mode ?? (unite ? 'edit' : 'create');
    const effectiveParentId = parentUnite?.id ?? parentId;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<UniteFormData>({
        resolver: zodResolver(uniteFormSchema),
        defaultValues: FORM_INIT,
    });

    const isPending = isCreating || isUpdating;

    // Pré-remplir le formulaire selon le mode
    useEffect(() => {
        if (!open) {
            reset(FORM_INIT);
            return;
        }
        if (effectiveMode === 'edit' && unite) {
            reset({
                nom: unite.nom || '',
                code: unite.code || '',
                description: unite.description || '',
                usageUniteId: '',
                niveauOrganisationId: '',
                parentId: '',
                responsableNom: unite.responsableNom || '',
                localisation: '',
                telephone: '',
                email: '',
            });
        } else if (effectiveMode === 'create') {
            reset({
                ...FORM_INIT,
                parentId: effectiveParentId || '',
            });
        }
    }, [open, effectiveMode, unite, effectiveParentId, reset]);

    const onSubmit = useCallback(async (data: UniteFormData) => {
        if (!etablissementId) return;

        const dto = {
            ...data,
            etablissementId,
            usageUniteId: data.usageUniteId || undefined,
            niveauOrganisationId: data.niveauOrganisationId || undefined,
            parentId: data.parentId || undefined,
            description: data.description || undefined,
            responsableNom: data.responsableNom || undefined,
            localisation: data.localisation || undefined,
            telephone: data.telephone || undefined,
            email: data.email || undefined,
        };

        if (effectiveMode === 'edit' && unite) {
            await modifierUnite({ id: unite.id, ...dto });
        } else {
            await creerUnite(dto);
        }

        onOpenChange(false);
        onSuccess?.();
    }, [effectiveMode, unite, etablissementId, creerUnite, modifierUnite, onOpenChange, onSuccess]);

    const title = effectiveMode === 'edit'
        ? t('organigramme.modal.modifierUnite', 'Modifier l\'unité')
        : t('organigramme.modal.creerUnite', 'Nouvelle unité');

    const subtitle = effectiveMode === 'create' && parentUnite
        ? t('organigramme.modal.parent', 'Parent : {{nom}}', { nom: parentUnite.nom })
        : undefined;

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => { if (!v) onOpenChange(false); }}
            title={title}
            description={subtitle}
            size="lg"
            footer={<>
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-text-secondary)' }}
                >
                    {t('common:boutons.annuler', 'Annuler')}
                </button>
                <button
                    type="submit"
                    form="unite-form"
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-dominant-600)' }}
                >
                    {isPending
                        ? t('common:boutons.enregistrement', 'Enregistrement...')
                        : mode === 'edit'
                            ? t('common:boutons.enregistrer', 'Enregistrer')
                            : t('common:boutons.creer', 'Créer')
                    }
                </button>
            </>}
        >
            <form id="unite-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Nom + Code */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.nom', 'Nom')} *
                        </label>
                        <input
                            {...register('nom')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder="ex: Direction Générale"
                        />
                        {errors.nom && <p className="text-xs mt-1 text-red-500">{errors.nom.message}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.code', 'Code')} *
                        </label>
                        <input
                            {...register('code')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder="ex: DG"
                        />
                        {errors.code && <p className="text-xs mt-1 text-red-500">{errors.code.message}</p>}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {t('organigramme.form.description', 'Description')}
                    </label>
                    <textarea
                        {...register('description')}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)] resize-none"
                        style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        placeholder="Description de l'unité..."
                    />
                </div>

                {/* Usage + Niveau */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.usage', 'Usage')}
                        </label>
                        <select
                            {...register('usageUniteId')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        >
                            <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                            {usages?.map(u => (
                                <option key={u.id} value={u.id}>{u.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.niveau', 'Niveau')}
                        </label>
                        <select
                            {...register('niveauOrganisationId')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                        >
                            <option value="">{t('organigramme.form.selectionner', 'Sélectionner...')}</option>
                            {niveaux?.map(n => (
                                <option key={n.id} value={n.id}>{n.label} (N{n.niveau})</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Responsable + Localisation */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.responsable', 'Responsable')}
                        </label>
                        <input
                            {...register('responsableNom')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder="Nom du responsable"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.localisation', 'Localisation')}
                        </label>
                        <input
                            {...register('localisation')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder="Bâtiment, étage..."
                        />
                    </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.telephone', 'Téléphone')}
                        </label>
                        <input
                            {...register('telephone')}
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder="+237..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {t('organigramme.form.email', 'Email')}
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-[var(--color-dominant-400)]"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
                            placeholder="email@etablissement.cm"
                        />
                        {errors.email && <p className="text-xs mt-1 text-red-500">{errors.email.message}</p>}
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
