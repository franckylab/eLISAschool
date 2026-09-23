/**
 * ==================================
 * eLISAschool — Platform Groupes · Onglet Membres
 * ==================================
 * Ajout/retrait d'établissements. Source : /api/platform/etablissements
 * (endpoint réel — l'ancien /facturation/etablissements n'existe pas).
 * Règle single-groupe appliquée côté backend (409 explicite).
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Plus, X } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SchoolLoading } from '@/components/feedback/SchoolLoading';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import {
    useAddMembreGroupe,
    useEtablissementsOptions,
    useRemoveMembreGroupe,
} from '../use-groupes-saas';
import type { GroupeSaaS } from '../types';
import { initiales } from '../types';

interface MembresTabProps {
    groupe: GroupeSaaS;
}

export function MembresTab({ groupe }: MembresTabProps) {
    const { t } = useTranslation('admin');
    const [selection, setSelection] = useState('');
    const [recherche, setRecherche] = useState('');
    const [membreARetirer, setMembreARetirer] = useState<string | null>(null);

    const { data: options = [], isLoading, isError, refetch } = useEtablissementsOptions();
    const addMembre = useAddMembreGroupe();
    const removeMembre = useRemoveMembreGroupe();

    const membresIds = useMemo(
        () => new Set(groupe.etablissements?.map((l) => l.etablissementId) ?? []),
        [groupe.etablissements],
    );

    const disponibles = useMemo(
        () => options.filter((e) => !membresIds.has(e.id)),
        [options, membresIds],
    );

    const membresFiltres = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        const membres = groupe.etablissements ?? [];
        if (!q) return membres;
        return membres.filter((lien) => {
            const nom = lien.etablissement?.nom ?? '';
            return nom.toLowerCase().includes(q) || lien.etablissementId.toLowerCase().includes(q);
        });
    }, [groupe.etablissements, recherche]);

    const handleAdd = () => {
        if (!selection) return;
        addMembre.mutate(
            { groupeId: groupe.id, etablissementId: selection },
            { onSuccess: () => setSelection('') },
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <SchoolLoading variant="compact" />
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorMessage
                title={t('groupes.membres.erreurChargement')}
                message={t('groupes.membres.erreurChargementDetail')}
                onRetry={() => refetch()}
                retryLabel={t('groupes.reessayer')}
            />
        );
    }

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Ajout */}
            <div className="flex flex-col gap-[var(--gap-sm)] sm:flex-row">
                <div className="flex-1">
                    <ElisaSelect
                        options={disponibles.map((e) => ({
                            value: e.id,
                            label: e.ville ? `${e.nom} (${e.ville})` : e.nom,
                        }))}
                        value={selection}
                        onValueChange={setSelection}
                        placeholder={t('groupes.membres.selectionner')}
                        searchable
                        aria-label={t('groupes.membres.selectionner')}
                    />
                </div>
                <ElisaButton
                    variant="primary"
                    size="md"
                    onClick={handleAdd}
                    disabled={!selection}
                    isLoading={addMembre.isPending}
                    icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                >
                    {t('groupes.ajouter')}
                </ElisaButton>
            </div>
            <p className="text-xs text-[var(--color-texte-muted)]">
                {t('groupes.membres.regleSingleGroupe')}
            </p>

            {/* Recherche locale */}
            {(groupe.etablissements?.length ?? 0) > 3 && (
                <SearchInput
                    value={recherche}
                    onChange={setRecherche}
                    placeholder={t('groupes.membres.rechercher')}
                    debounceMs={200}
                    ariaLabel={t('groupes.membres.rechercher')}
                />
            )}

            {/* Liste */}
            {!membresFiltres.length ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--color-bordure)] py-8 text-center">
                    <Building2
                        className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-texte-muted)]"
                        aria-hidden
                    />
                    <p className="text-sm text-[var(--color-texte-secondaire)]">
                        {recherche ? t('groupes.membres.aucunResultat') : t('groupes.aucunMembre')}
                    </p>
                </div>
            ) : (
                <ul className="flex flex-col gap-[var(--space-xs)]" aria-label={t('groupes.tabs.membres')}>
                    {membresFiltres.map((lien) => {
                        const nom = lien.etablissement?.nom ?? lien.etablissementId;
                        const ville = lien.etablissement?.ville;
                        return (
                            <li
                                key={lien.id}
                                className="flex items-center justify-between gap-[var(--gap-sm)] rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-sm)]"
                            >
                                <span className="flex min-w-0 items-center gap-[var(--gap-sm)]">
                                    <span
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-dominante)]/10 text-xs font-bold text-[var(--color-dominante)]"
                                        aria-hidden
                                    >
                                        {initiales(nom)}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium text-[var(--color-texte)]">
                                            {nom}
                                        </span>
                                        {ville && (
                                            <span className="block truncate text-xs text-[var(--color-texte-muted)]">
                                                {ville}
                                            </span>
                                        )}
                                    </span>
                                </span>
                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setMembreARetirer(lien.etablissementId)}
                                    icon={<X className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    aria-label={t('groupes.membres.retirer', { nom })}
                                />
                            </li>
                        );
                    })}
                </ul>
            )}

            <p className="text-xs text-[var(--color-texte-muted)]">
                {t('groupes.membres.compteur', { count: groupe.etablissements?.length ?? 0 })}
            </p>

            <ConfirmationModal
                isOpen={!!membreARetirer}
                title={t('groupes.membres.confirmerRetraitTitre')}
                message={t('groupes.membres.confirmerRetraitMessage')}
                confirmLabel={t('groupes.membres.confirmerRetrait')}
                variant="danger"
                isLoading={removeMembre.isPending}
                onCancel={() => setMembreARetirer(null)}
                onConfirm={() => {
                    if (!membreARetirer) return;
                    removeMembre.mutate(
                        { groupeId: groupe.id, etablissementId: membreARetirer },
                        { onSettled: () => setMembreARetirer(null) },
                    );
                }}
            />
        </div>
    );
}
