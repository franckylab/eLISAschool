import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Settings, Percent, Gift, Ban, Plus, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { TabsBar, TabsContent } from '@/components/ui/Tabs';
import { usePaiePermissions } from '../hooks/use-paie-permissions';
import { useCotisations, useTypesPrimes, useTypesRetenues, useCreerCotisation, useModifierCotisation, useSupprimerCotisation, useCreerTypePrime, useModifierTypePrime, useSupprimerTypePrime, useCreerTypeRetenue, useModifierTypeRetenue, useSupprimerTypeRetenue } from '../hooks/use-paie';
import { CotisationModal } from './cotisation-modal';
import { PrimeModal } from './prime-modal';
import { RetenueModal } from './retenue-modal';
import type { Cotisation, TypePrime, TypeRetenue } from '../types/paie.types';
import type { Column } from '@/components/ui/DataTable';


type OngletId = 'cotisations' | 'primes' | 'retenues';

const ONGLETS = [
    { id: 'cotisations', label: 'Cotisations', icon: Percent },
    { id: 'primes', label: 'Types de primes', icon: Gift },
    { id: 'retenues', label: 'Types de retenues', icon: Ban },
];

function CotisationsSection() {
    const { t } = useTranslation('paie');
    const perms = usePaiePermissions();
    const { data: cotisations, isLoading, isError, error, refetch } = useCotisations();
    const creer = useCreerCotisation();
    const modifier = useModifierCotisation();
    const supprimer = useSupprimerCotisation();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Cotisation | null>(null);
    const [deleting, setDeleting] = useState<Cotisation | null>(null);

    const list = cotisations ?? [];

    const colonnes: Column<Cotisation>[] = [
        { key: 'code', header: t('code'), render: (c) => <span className="font-mono text-sm">{c.code}</span> },
        { key: 'nom', header: t('nom'), render: (c) => <span className="text-sm font-medium">{c.nom}</span> },
        {
            key: 'type', header: t('type'), render: (c) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.type === 'PATRONALE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    c.type === 'SALARIALE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>{c.type}</span>
            ),
        },
        { key: 'tauxPatronal', header: 'Taux patr.', className: 'text-right', render: (c) => <span>{c.tauxPatronal}%</span> },
        { key: 'tauxSalarial', header: 'Taux sal.', className: 'text-right', render: (c) => <span>{c.tauxSalarial}%</span> },
        {
            key: 'actif', header: t('statut'), className: 'text-center', render: (c) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.actif ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>{c.actif ? t('actif') : t('inactif')}</span>
            ),
        },
        {
            key: 'actions', header: t('actions'), className: 'text-right',
            renderActions: (c) => [
                { key: 'edit', icon: Edit, label: t('actions.modifier'), onClick: () => { setEditing(c); setShowModal(true); }, permission: 'paie:edit' },
                { key: 'delete', icon: Trash2, label: t('actions.supprimer'), onClick: () => setDeleting(c), permission: 'paie:delete', variant: 'danger' as const },
            ],
        },
    ];

    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {perms.canCreate && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setShowModal(true); }}>
                        {t('nouvelleCotisation')}
                    </ElisaButton>
                )}
            </div>
            <DataTable tableId="paie-cotisations" columns={colonnes} data={list} isLoading={isLoading} />
            <CotisationModal
                open={showModal}
                onOpenChange={(v) => { if (!v) { setShowModal(false); setEditing(null); } }}
                cotisation={editing}
                onSave={async (data) => {
                    if (editing) {
                        await modifier.mutateAsync({ id: editing.id, ...data });
                    } else {
                        await creer.mutateAsync(data);
                    }
                    setShowModal(false);
                    setEditing(null);
                }}
                isLoading={creer.isPending || modifier.isPending}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => { if (!o) setDeleting(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { refer: deleting?.nom || '' })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={async () => { if (deleting) { await supprimer.mutateAsync(deleting.id); setDeleting(null); } }}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}

function PrimesSection() {
    const { t } = useTranslation('paie');
    const perms = usePaiePermissions();
    const { data: primes, isLoading, isError, error, refetch } = useTypesPrimes();
    const creer = useCreerTypePrime();
    const modifier = useModifierTypePrime();
    const supprimer = useSupprimerTypePrime();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TypePrime | null>(null);
    const [deleting, setDeleting] = useState<TypePrime | null>(null);

    const list = primes ?? [];

    const colonnes: Column<TypePrime>[] = [
        { key: 'code', header: t('code'), render: (p) => <span className="font-mono text-sm">{p.code}</span> },
        { key: 'nom', header: t('nom'), render: (p) => <span className="text-sm font-medium">{p.nom}</span> },
        {
            key: 'typeCalcul', header: t('typeCalcul'), render: (p) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {p.typeCalcul}
                </span>
            ),
        },
        { key: 'valeur', header: t('valeur'), className: 'text-right', render: (p) => <span>{p.valeur.toLocaleString('fr-FR')}</span> },
        {
            key: 'actif', header: t('statut'), className: 'text-center', render: (p) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.actif ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>{p.actif ? t('actif') : t('inactif')}</span>
            ),
        },
        {
            key: 'actions', header: t('actions'), className: 'text-right',
            renderActions: (p) => [
                { key: 'edit', icon: Edit, label: t('actions.modifier'), onClick: () => { setEditing(p); setShowModal(true); }, permission: 'paie:edit' },
                { key: 'delete', icon: Trash2, label: t('actions.supprimer'), onClick: () => setDeleting(p), permission: 'paie:delete', variant: 'danger' as const },
            ],
        },
    ];

    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {perms.canCreate && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setShowModal(true); }}>
                        {t('nouveauTypePrime')}
                    </ElisaButton>
                )}
            </div>
            <DataTable tableId="paie-primes" columns={colonnes} data={list} isLoading={isLoading} />
            <PrimeModal
                open={showModal}
                onOpenChange={(v) => { if (!v) { setShowModal(false); setEditing(null); } }}
                prime={editing}
                onSave={async (data) => {
                    if (editing) {
                        await modifier.mutateAsync({ id: editing.id, ...data });
                    } else {
                        await creer.mutateAsync(data);
                    }
                    setShowModal(false);
                    setEditing(null);
                }}
                isLoading={creer.isPending || modifier.isPending}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => { if (!o) setDeleting(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { refer: deleting?.nom || '' })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={async () => { if (deleting) { await supprimer.mutateAsync(deleting.id); setDeleting(null); } }}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}

function RetenuesSection() {
    const { t } = useTranslation('paie');
    const perms = usePaiePermissions();
    const { data: retenues, isLoading, isError, error, refetch } = useTypesRetenues();
    const creer = useCreerTypeRetenue();
    const modifier = useModifierTypeRetenue();
    const supprimer = useSupprimerTypeRetenue();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TypeRetenue | null>(null);
    const [deleting, setDeleting] = useState<TypeRetenue | null>(null);

    const list = retenues ?? [];

    const colonnes: Column<TypeRetenue>[] = [
        { key: 'code', header: t('code'), render: (r) => <span className="font-mono text-sm">{r.code}</span> },
        { key: 'nom', header: t('nom'), render: (r) => <span className="text-sm font-medium">{r.nom}</span> },
        {
            key: 'frequence', header: t('frequence'), render: (r) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    {r.frequence}
                </span>
            ),
        },
        { key: 'montantMax', header: t('montantMax'), className: 'text-right', render: (r) => <span>{r.montantMax ? `${r.montantMax.toLocaleString('fr-FR')} F` : '-'}</span> },
        {
            key: 'actions', header: t('actions'), className: 'text-right',
            renderActions: (r) => [
                { key: 'edit', icon: Edit, label: t('actions.modifier'), onClick: () => { setEditing(r); setShowModal(true); }, permission: 'paie:edit' },
                { key: 'delete', icon: Trash2, label: t('actions.supprimer'), onClick: () => setDeleting(r), permission: 'paie:delete', variant: 'danger' as const },
            ],
        },
    ];

    if (isError) return <ErrorMessage message={error?.message} onRetry={() => refetch()} />;

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {perms.canCreate && (
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setShowModal(true); }}>
                        {t('nouveauTypeRetenue')}
                    </ElisaButton>
                )}
            </div>
            <DataTable tableId="paie-retenues" columns={colonnes} data={list} isLoading={isLoading} />
            <RetenueModal
                open={showModal}
                onOpenChange={(v) => { if (!v) { setShowModal(false); setEditing(null); } }}
                retenue={editing}
                onSave={async (data) => {
                    if (editing) {
                        await modifier.mutateAsync({ id: editing.id, ...data });
                    } else {
                        await creer.mutateAsync(data);
                    }
                    setShowModal(false);
                    setEditing(null);
                }}
                isLoading={creer.isPending || modifier.isPending}
            />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => { if (!o) setDeleting(null); }}
                title={t('confirmerSupprimerTitre')}
                description={t('confirmerSupprimerMessage', { refer: deleting?.nom || '' })}
                confirmText={t('actions.supprimer')}
                variant="danger"
                onConfirm={async () => { if (deleting) { await supprimer.mutateAsync(deleting.id); setDeleting(null); } }}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}

export function PaieConfigPage() {
    const navigate = useNavigate();
    const { t } = useTranslation('paie');
    const [ongletActif, setOngletActif] = useState<OngletId>('cotisations');

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                title={t('configurationPaie')}
                description={t('configurationPaieDescription')}
                icon={Settings}
                onBack={() => navigate({ to: '/paie' })}
            />

            <TabsBar
                tabs={ONGLETS}
                activeTab={ongletActif}
                onTabChange={(v) => setOngletActif(v as OngletId)}
            />

            <TabsContent activeTab={ongletActif}>
                <CotisationsSection />
            </TabsContent>
            <TabsContent activeTab={ongletActif}>
                <PrimesSection />
            </TabsContent>
            <TabsContent activeTab={ongletActif}>
                <RetenuesSection />
            </TabsContent>
        </div>
    );
}
