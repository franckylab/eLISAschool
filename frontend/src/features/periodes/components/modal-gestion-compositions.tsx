/**
 * ==================================
 * eLISAschool - Modal Gestion des Compositions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal dédié à la gestion des enfants d'une période :
 * - TransfertList deux colonnes (pool ↔ sélection)
 * - Sauvegarde batch atomique (PUT /:id/compositions)
 * - Poids caché par défaut (toggle avancé)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, Layers, Settings2 } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { TransfertList, type TransfertItem } from '@/components/ui/TransfertList';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
    useEnfantsDisponibles,
    useCompositions,
    useRemplacerCompositions,
} from '../hooks/use-periodes';
import type { Periode, PeriodeComposition } from '../types/periode.types';

/** Référence stable pour éviter les re-renders quand la query est désactivée */
const EMPTY_ARRAY: PeriodeComposition[] = [];
/** Référence stable pour les disponibles */
const EMPTY_DISPONIBLES: Periode[] = [];

interface ModalGestionCompositionsProps {
    /** Période parent dont on gère les enfants */
    periode: Periode | null;
    /** Contrôle l'ouverture du modal */
    isOpen: boolean;
    /** Callback de fermeture */
    onClose: () => void;
    /** Callback après sauvegarde réussie */
    onSuccess?: () => void;
}

/**
 * Item étendu avec données de composition
 */
interface EnfantTransfert extends TransfertItem {
    periodeId: string;
    niveauLabel: string;
    dateDebut: string;
    dateFin: string;
    compositionExistante?: PeriodeComposition;
}

export function ModalGestionCompositions({
    periode,
    isOpen,
    onClose,
    onSuccess,
}: ModalGestionCompositionsProps) {
    const estMobile = useMediaQuery('(max-width: 639px)');
    const [showPoids, setShowPoids] = useState(false);
    const [selectionLocales, setSelectionLocales] = useState<EnfantTransfert[]>([]);
    const [dirty, setDirty] = useState(false);

    // Hooks data — utiliser une référence stable quand la query est désactivée
    const { data: compositions = EMPTY_ARRAY, isLoading: isLoadingComp } = useCompositions(periode?.id || '');
    const { data: disponibles = EMPTY_DISPONIBLES, isLoading: isLoadingDisp } = useEnfantsDisponibles(periode?.id || '');
    const remplacer = useRemplacerCompositions();

    // Charger les compositions existantes au mount
    // IMPORTANT: garder uniquement quand le modal est ouvert et periode valide
    useEffect(() => {
        if (!periode || !isOpen) return;
        // Les enfants actuels = compositions chargées
        const enfantsActuels: EnfantTransfert[] = compositions
            .filter(c => c.periodeEnfant)
            .map(c => ({
                id: c.periodeEnfant!.id,
                periodeId: c.periodeEnfant!.id,
                label: c.periodeEnfant!.nom,
                sublabel: `${c.periodeEnfant!.niveau?.label || 'N/A'} — ${new Date(c.periodeEnfant!.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → ${new Date(c.periodeEnfant!.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`,
                niveauLabel: c.periodeEnfant!.niveau?.label || 'N/A',
                dateDebut: c.periodeEnfant!.dateDebut,
                dateFin: c.periodeEnfant!.dateFin,
                badge: `${c.ordre}`,
                compositionExistante: c,
            }));
        setSelectionLocales(enfantsActuels);
        setDirty(false);
        setShowPoids(false);
    }, [compositions, periode, isOpen]);

    // Pool disponible (enfants non encore sélectionnés)
    // Ne recalculer que si le modal est ouvert
    const poolItems: EnfantTransfert[] = useMemo(() => {
        if (!isOpen || !periode) return [];
        const idsSelectionnes = new Set(selectionLocales.map(s => s.id));
        return disponibles
            .filter(d => !idsSelectionnes.has(d.id))
            .map(d => ({
                id: d.id,
                periodeId: d.id,
                label: d.nom,
                sublabel: `${d.niveau?.label || 'N/A'} — ${new Date(d.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → ${new Date(d.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`,
                niveauLabel: d.niveau?.label || 'N/A',
                dateDebut: d.dateDebut,
                dateFin: d.dateFin,
            }));
    }, [disponibles, selectionLocales, isOpen, periode]);

    // Callback quand la sélection change
    const handleSelectionChange = useCallback((items: EnfantTransfert[]) => {
        setSelectionLocales(items);
        setDirty(true);
    }, []);

    // Sauvegarder
    const handleSauvegarder = async () => {
        if (!periode) return;
        try {
            await remplacer.mutateAsync({
                periodeId: periode.id,
                dto: {
                    enfants: selectionLocales.map((item, index) => ({
                        periodeEnfantId: item.periodeId,
                        ordre: index + 1,
                        poids: item.compositionExistante?.poids ?? 1,
                    })),
                },
            });
            setDirty(false);
            onSuccess?.();
            onClose();
        } catch {
            // Erreur gérée par le hook
        }
    };

    // Rendu personnalisé d'un item
    const renderItem = useCallback((item: EnfantTransfert, _context: 'pool' | 'selection') => (
        <div className="min-w-0">
            <p className="truncate font-medium text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}>
                {item.label}
            </p>
            <div className="flex items-center gap-[var(--gap-xxs)] flex-wrap">
                <span className="rounded-full border border-[var(--color-bordure)] px-1.5 py-0 text-[10px] font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                    {item.niveauLabel}
                </span>
                <span className="text-[var(--color-text-tertiary)]" style={{ fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}>
                    {item.sublabel}
                </span>
            </div>
        </div>
    ), []);

    if (!periode) return null;

    const isSaving = remplacer.isPending;

    return (
        <CustomModal
            open={isOpen}
            onOpenChange={(v) => { if (!v && !isSaving) onClose(); }}
            title="Gérer les enfants"
            description={`Composition de « ${periode.nom} » (${periode.niveau?.label || 'N/A'})`}
            size="3xl"
            footer={
                <div className="flex items-center justify-between w-full gap-[var(--gap-sm)]">
                    <div className="flex items-center gap-[var(--gap-xs)]">
                        {dirty && (
                            <span className="text-xs text-amber-600 font-medium">Modifications non enregistrées</span>
                        )}
                    </div>
                    <div className="flex items-center gap-[var(--gap-sm)]">
                        <ElisaButton variant="outline" onClick={onClose} disabled={isSaving}>
                            Annuler
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            isLoading={isSaving}
                            icon={<Save className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            onClick={handleSauvegarder}
                            disabled={!dirty}
                        >
                            {estMobile ? 'Enregistrer' : 'Enregistrer les compositions'}
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-[var(--space-md)]">
                {/* Toggle poids avancé */}
                <div className="flex items-center justify-end">
                    <button
                        onClick={() => setShowPoids(!showPoids)}
                        className="flex items-center gap-[var(--gap-xxs)] text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                        {showPoids ? 'Masquer les poids' : 'Répartition personnalisée'}
                    </button>
                </div>

                {/* TransfertList */}
                <TransfertList<EnfantTransfert>
                    disponibles={poolItems}
                    selectionnes={selectionLocales}
                    onSelectionChange={handleSelectionChange}
                    renderItem={renderItem}
                    labelPool="Périodes disponibles"
                    labelSelection="Enfants de la période"
                    isLoading={isLoadingComp || isLoadingDisp}
                    emptyText="Aucune période disponible"
                />

                {/* Info contextuelle */}
                <div className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt)]" style={{ padding: 'var(--space-sm)' }}>
                    <div className="flex items-start gap-[var(--gap-xs)]">
                        <Layers className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0 mt-0.5" />
                        <p className="text-[var(--color-text-secondary)]" style={{ fontSize: 'clamp(0.6875rem, 0.65rem + 0.15vw, 0.75rem)' }}>
                            Seules les périodes de type inférieur, dans la même année scolaire et dont les dates sont incluses dans la période parent sont affichées.
                            Glissez-déposez les éléments pour réordonner les enfants.
                        </p>
                    </div>
                </div>
            </div>
        </CustomModal>
    );
}
