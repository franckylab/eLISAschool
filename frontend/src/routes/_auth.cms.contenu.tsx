/**
 * ==================================
 * eLISAschool - Gestion Contenu Dynamique CMS
 * ==================================
 * Route: /_auth/cms/contenu
 * Gestion des actualités, témoignages, événements, partenaires et newsletter.
 * CMS V2 — Phase 5A
 */

import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import {
    Newspaper, MessageSquareQuote, Calendar, Handshake, Mail,
    Plus, Edit3, Trash2, Eye, EyeOff, Star, ExternalLink,
    Search, Filter, TrendingUp, Users, Globe, Clock,
} from 'lucide-react';
import {
    useCmsActualites, useCmsTemoignages, useCmsEvenements,
    useCmsPartenaires, useCmsNewsletter, useCmsActualitesStats,
    useCreerActualite, useSupprimerActualite,
    useCreerTemoignage, useSupprimerTemoignage,
    useCreerEvenement, useSupprimerEvenement,
    useCreerPartenaire, useSupprimerPartenaire,
    useDesabonnerNewsletter,
} from '@/features/cms/hooks/use-cms-admin';
import {
    StatutActualite, CategorieTemoignage, TypeEvenement,
} from '@/features/cms/types/cms.types';
import type {
    CmsActualite, CmsTemoignage, CmsEvenement, CmsPartenaire,
} from '@/features/cms/types/cms.types';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export const Route = createFileRoute('/_auth/cms/contenu')({
    component: CmsContenuPage,
});

type TabKey = 'actualites' | 'temoignages' | 'evenements' | 'partenaires' | 'newsletter';

function CmsContenuPage() {
    const [activeTab, setActiveTab] = useState<TabKey>('actualites');

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
        { key: 'actualites', label: 'Actualités', icon: <Newspaper className="h-4 w-4" /> },
        { key: 'temoignages', label: 'Témoignages', icon: <MessageSquareQuote className="h-4 w-4" /> },
        { key: 'evenements', label: 'Événements', icon: <Calendar className="h-4 w-4" /> },
        { key: 'partenaires', label: 'Partenaires', icon: <Handshake className="h-4 w-4" /> },
        { key: 'newsletter', label: 'Newsletter', icon: <Mail className="h-4 w-4" /> },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            {/* En-tête */}
            <div>
                <h1 className="text-2xl font-bold">Contenu Dynamique</h1>
                <p className="text-sm text-muted-foreground">
                    Gérez les actualités, témoignages, événements et partenaires affichés sur votre site public.
                </p>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenu de l'onglet */}
            {activeTab === 'actualites' && <ActualitesTab />}
            {activeTab === 'temoignages' && <TemoignagesTab />}
            {activeTab === 'evenements' && <EvenementsTab />}
            {activeTab === 'partenaires' && <PartenairesTab />}
            {activeTab === 'newsletter' && <NewsletterTab />}
        </div>
    );
}

// ==================================
// TAB : Actualités
// ==================================
function ActualitesTab() {
    const { data: actualites, isLoading } = useCmsActualites();
    const { data: stats } = useCmsActualitesStats();
    const creerActualite = useCreerActualite();
    const supprimerActualite = useSupprimerActualite();
    const [showCreer, setShowCreer] = useState(false);
    const [aSupprimer, setASupprimer] = useState<string | null>(null);

    const handleCreer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = {
            titre: (form.elements.namedItem('titre') as HTMLInputElement).value,
            slug: (form.elements.namedItem('slug') as HTMLInputElement).value,
            resume: (form.elements.namedItem('resume') as HTMLTextAreaElement).value,
            categorie: (form.elements.namedItem('categorie') as HTMLSelectElement).value,
        };
        try {
            await creerActualite.mutateAsync(data);
            toast.success('Actualité créée');
            setShowCreer(false);
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    const handleSupprimer = async () => {
        if (!aSupprimer) return;
        try {
            await supprimerActualite.mutateAsync(aSupprimer);
            toast.success('Actualité supprimée');
        } catch {
            toast.error('Erreur lors de la suppression');
        } finally {
            setASupprimer(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ContentStatCard icon={<Newspaper className="h-5 w-5" />} label="Total" value={stats?.total ?? actualites?.length ?? 0} />
                <ContentStatCard icon={<Globe className="h-5 w-5" />} label="Publiées" value={stats?.publiees ?? 0} tone="success" />
                <ContentStatCard icon={<Eye className="h-5 w-5" />} label="Vues totales" value={stats?.vues ?? 0} tone="info" />
                <ContentStatCard icon={<Star className="h-5 w-5" />} label="À la une" value={stats?.enUne ?? 0} tone="warning" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="rounded-lg border py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-accent">
                        <Filter className="h-4 w-4" />
                        Filtrer
                    </button>
                </div>
                <button
                    onClick={() => setShowCreer(true)}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Nouvelle actualité
                </button>
            </div>

            {/* Liste */}
            <div className="rounded-xl border bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                ) : !actualites?.length ? (
                    <EmptyState
                        icon={<Newspaper className="h-12 w-12" />}
                        title="Aucune actualité"
                        description="Créez votre première actualité pour informer vos visiteurs."
                        actionLabel="Créer une actualité"
                        onAction={() => setShowCreer(true)}
                    />
                ) : (
                    <div className="divide-y">
                        {actualites.map((actu) => (
                            <div key={actu.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{actu.titre}</h3>
                                            <StatusBadge statut={actu.statut} />
                                            {actu.estEnUne && (
                                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    À la une
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>{actu.categorie || 'Non catégorisé'}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{actu.vues} vues</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(actu.createdAt).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent" title="Voir">
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                    <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Modifier">
                                        <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setASupprimer(actu.id)}
                                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal création */}
            {showCreer && (
                <Modal title="Nouvelle actualité" onClose={() => setShowCreer(false)}>
                    <form onSubmit={handleCreer} className="space-y-4">
                        <FormField name="titre" label="Titre" required placeholder="Titre de l'actualité" />
                        <FormField name="slug" label="Slug" required placeholder="titre-actualite" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
                        <div>
                            <label className="mb-1 block text-sm font-medium">Résumé</label>
                            <textarea
                                name="resume"
                                rows={3}
                                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Bref résumé de l'actualité..."
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Catégorie</label>
                            <select name="categorie" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                                <option value="">Non catégorisé</option>
                                <option value="general">Général</option>
                                <option value="pedagogie">Pédagogie</option>
                                <option value="sport">Sport</option>
                                <option value="culture">Culture</option>
                                <option value="technologie">Technologie</option>
                                <option value="vie-scolaire">Vie scolaire</option>
                            </select>
                        </div>
                        <ModalFooter>
                            <button type="button" onClick={() => setShowCreer(false)} className="btn-cancel">Annuler</button>
                            <button type="submit" disabled={creerActualite.isPending} className="btn-primary">
                                {creerActualite.isPending ? 'Création...' : 'Créer'}
                            </button>
                        </ModalFooter>
                    </form>
                </Modal>
            )}

            <ConfirmationModal
                isOpen={!!aSupprimer}
                title="Supprimer cette actualité ?"
                message="Cette action est irréversible."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
                onConfirm={handleSupprimer}
                onCancel={() => setASupprimer(null)}
            />
        </div>
    );
}

// ==================================
// TAB : Témoignages
// ==================================
function TemoignagesTab() {
    const { data: temoignages, isLoading } = useCmsTemoignages();
    const creerTemoignage = useCreerTemoignage();
    const supprimerTemoignage = useSupprimerTemoignage();
    const [showCreer, setShowCreer] = useState(false);
    const [aSupprimer, setASupprimer] = useState<string | null>(null);

    const handleCreer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = {
            nom: (form.elements.namedItem('nom') as HTMLInputElement).value,
            role: (form.elements.namedItem('role') as HTMLInputElement).value,
            categorie: (form.elements.namedItem('categorie') as HTMLSelectElement).value as CategorieTemoignage,
            texte: (form.elements.namedItem('texte') as HTMLTextAreaElement).value,
        };
        try {
            await creerTemoignage.mutateAsync(data);
            toast.success('Témoignage créé');
            setShowCreer(false);
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    const handleSupprimer = async () => {
        if (!aSupprimer) return;
        try {
            await supprimerTemoignage.mutateAsync(aSupprimer);
            toast.success('Témoignage supprimé');
        } catch {
            toast.error('Erreur');
        } finally {
            setASupprimer(null);
        }
    };

    const categorieLabel: Record<CategorieTemoignage, string> = {
        [CategorieTemoignage.ELEVE]: 'Élève',
        [CategorieTemoignage.PARENT]: 'Parent',
        [CategorieTemoignage.ENSEIGNANT]: 'Enseignant',
        [CategorieTemoignage.ANCIEN]: 'Ancien élève',
        [CategorieTemoignage.AUTRE]: 'Autre',
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <ContentStatCard icon={<Users className="h-5 w-5" />} label="Total" value={temoignages?.length ?? 0} />
                <ContentStatCard icon={<Eye className="h-5 w-5" />} label="Visibles" value={temoignages?.filter(t => t.estVisible).length ?? 0} tone="success" />
                <ContentStatCard icon={<Star className="h-5 w-5" />} label="À la une" value={temoignages?.filter(t => t.estEnUne).length ?? 0} tone="warning" />
            </div>

            <div className="flex items-center justify-between">
                <div />
                <button onClick={() => setShowCreer(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Nouveau témoignage
                </button>
            </div>

            <div className="rounded-xl border bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                ) : !temoignages?.length ? (
                    <EmptyState
                        icon={<MessageSquareQuote className="h-12 w-12" />}
                        title="Aucun témoignage"
                        description="Ajoutez des témoignages d'élèves, parents ou enseignants."
                        actionLabel="Créer un témoignage"
                        onAction={() => setShowCreer(true)}
                    />
                ) : (
                    <div className="divide-y">
                        {temoignages.map((t) => (
                            <div key={t.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                                        <span className="text-sm font-bold text-violet-700 dark:text-violet-300">{t.nom.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{t.nom}</h3>
                                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                                {categorieLabel[t.categorie]}
                                            </span>
                                            {!t.estVisible && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground"><EyeOff className="h-3 w-3" />Masqué</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{t.role || '—'} • Note : {t.note}/5</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setASupprimer(t.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreer && (
                <Modal title="Nouveau témoignage" onClose={() => setShowCreer(false)}>
                    <form onSubmit={handleCreer} className="space-y-4">
                        <FormField name="nom" label="Nom complet" required placeholder="Jean Dupont" />
                        <FormField name="role" label="Rôle / Fonction" placeholder="Ex: Élève en Terminale S" />
                        <div>
                            <label className="mb-1 block text-sm font-medium">Catégorie</label>
                            <select name="categorie" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                                <option value={CategorieTemoignage.ELEVE}>Élève</option>
                                <option value={CategorieTemoignage.PARENT}>Parent</option>
                                <option value={CategorieTemoignage.ENSEIGNANT}>Enseignant</option>
                                <option value={CategorieTemoignage.ANCIEN}>Ancien élève</option>
                                <option value={CategorieTemoignage.AUTRE}>Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Témoignage</label>
                            <textarea name="texte" rows={4} required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Le témoignage..." />
                        </div>
                        <ModalFooter>
                            <button type="button" onClick={() => setShowCreer(false)} className="btn-cancel">Annuler</button>
                            <button type="submit" disabled={creerTemoignage.isPending} className="btn-primary">{creerTemoignage.isPending ? 'Création...' : 'Créer'}</button>
                        </ModalFooter>
                    </form>
                </Modal>
            )}

            <ConfirmationModal
                isOpen={!!aSupprimer}
                title="Supprimer ce témoignage ?"
                message="Cette action est irréversible."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
                onConfirm={handleSupprimer}
                onCancel={() => setASupprimer(null)}
            />
        </div>
    );
}

// ==================================
// TAB : Événements
// ==================================
function EvenementsTab() {
    const { data: evenements, isLoading } = useCmsEvenements();
    const creerEvenement = useCreerEvenement();
    const supprimerEvenement = useSupprimerEvenement();
    const [showCreer, setShowCreer] = useState(false);
    const [aSupprimer, setASupprimer] = useState<string | null>(null);

    const handleCreer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = {
            titre: (form.elements.namedItem('titre') as HTMLInputElement).value,
            description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
            dateDebut: (form.elements.namedItem('dateDebut') as HTMLInputElement).value,
            dateFin: (form.elements.namedItem('dateFin') as HTMLInputElement).value || undefined,
            type: (form.elements.namedItem('type') as HTMLSelectElement).value as TypeEvenement,
            lieu: (form.elements.namedItem('lieu') as HTMLInputElement).value,
        };
        try {
            await creerEvenement.mutateAsync(data);
            toast.success('Événement créé');
            setShowCreer(false);
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    const handleSupprimer = async () => {
        if (!aSupprimer) return;
        try {
            await supprimerEvenement.mutateAsync(aSupprimer);
            toast.success('Événement supprimé');
        } catch {
            toast.error('Erreur');
        } finally {
            setASupprimer(null);
        }
    };

    const typeLabel: Record<TypeEvenement, string> = {
        [TypeEvenement.CULTUREL]: 'Culturel',
        [TypeEvenement.SPORTIF]: 'Sportif',
        [TypeEvenement.ACADEMIQUE]: 'Académique',
        [TypeEvenement.REUNION]: 'Réunion',
        [TypeEvenement.AUTRE]: 'Autre',
    };

    const typeColor: Record<TypeEvenement, string> = {
        [TypeEvenement.CULTUREL]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        [TypeEvenement.SPORTIF]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        [TypeEvenement.ACADEMIQUE]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        [TypeEvenement.REUNION]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        [TypeEvenement.AUTRE]: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <ContentStatCard icon={<Calendar className="h-5 w-5" />} label="Total" value={evenements?.length ?? 0} />
                <ContentStatCard icon={<Globe className="h-5 w-5" />} label="Publics" value={evenements?.filter(e => e.estPublic).length ?? 0} tone="success" />
                <ContentStatCard icon={<TrendingUp className="h-5 w-5" />} label="À venir" value={evenements?.filter(e => new Date(e.dateDebut) > new Date()).length ?? 0} tone="info" />
            </div>

            <div className="flex items-center justify-between">
                <div />
                <button onClick={() => setShowCreer(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Nouvel événement
                </button>
            </div>

            <div className="rounded-xl border bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                ) : !evenements?.length ? (
                    <EmptyState
                        icon={<Calendar className="h-12 w-12" />}
                        title="Aucun événement"
                        description="Planifiez des événements visibles sur votre site public."
                        actionLabel="Créer un événement"
                        onAction={() => setShowCreer(true)}
                    />
                ) : (
                    <div className="divide-y">
                        {evenements.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                            {new Date(ev.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{ev.titre}</h3>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[ev.type]}`}>
                                                {typeLabel[ev.type]}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {ev.lieu || 'Lieu non défini'} • {ev.estPublic ? 'Public' : 'Privé'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setASupprimer(ev.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreer && (
                <Modal title="Nouvel événement" onClose={() => setShowCreer(false)}>
                    <form onSubmit={handleCreer} className="space-y-4">
                        <FormField name="titre" label="Titre" required placeholder="Titre de l'événement" />
                        <div>
                            <label className="mb-1 block text-sm font-medium">Description</label>
                            <textarea name="description" rows={3} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Description de l'événement..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Date début</label>
                                <input type="datetime-local" name="dateDebut" required className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Date fin</label>
                                <input type="datetime-local" name="dateFin" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Type</label>
                                <select name="type" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                                    <option value={TypeEvenement.ACADEMIQUE}>Académique</option>
                                    <option value={TypeEvenement.SPORTIF}>Sportif</option>
                                    <option value={TypeEvenement.CULTUREL}>Culturel</option>
                                    <option value={TypeEvenement.REUNION}>Réunion</option>
                                    <option value={TypeEvenement.AUTRE}>Autre</option>
                                </select>
                            </div>
                            <FormField name="lieu" label="Lieu" placeholder="Salle, adresse..." />
                        </div>
                        <ModalFooter>
                            <button type="button" onClick={() => setShowCreer(false)} className="btn-cancel">Annuler</button>
                            <button type="submit" disabled={creerEvenement.isPending} className="btn-primary">{creerEvenement.isPending ? 'Création...' : 'Créer'}</button>
                        </ModalFooter>
                    </form>
                </Modal>
            )}

            <ConfirmationModal
                isOpen={!!aSupprimer}
                title="Supprimer cet événement ?"
                message="Cette action est irréversible."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
                onConfirm={handleSupprimer}
                onCancel={() => setASupprimer(null)}
            />
        </div>
    );
}

// ==================================
// TAB : Partenaires
// ==================================
function PartenairesTab() {
    const { data: partenaires, isLoading } = useCmsPartenaires();
    const creerPartenaire = useCreerPartenaire();
    const supprimerPartenaire = useSupprimerPartenaire();
    const [showCreer, setShowCreer] = useState(false);
    const [aSupprimer, setASupprimer] = useState<string | null>(null);

    const handleCreer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = {
            nom: (form.elements.namedItem('nom') as HTMLInputElement).value,
            siteWeb: (form.elements.namedItem('siteWeb') as HTMLInputElement).value || undefined,
            categorie: (form.elements.namedItem('categorie') as HTMLSelectElement).value,
            description: (form.elements.namedItem('description') as HTMLTextAreaElement).value,
        };
        try {
            await creerPartenaire.mutateAsync(data);
            toast.success('Partenaire créé');
            setShowCreer(false);
        } catch {
            toast.error('Erreur lors de la création');
        }
    };

    const handleSupprimer = async () => {
        if (!aSupprimer) return;
        try {
            await supprimerPartenaire.mutateAsync(aSupprimer);
            toast.success('Partenaire supprimé');
        } catch {
            toast.error('Erreur');
        } finally {
            setASupprimer(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <ContentStatCard icon={<Handshake className="h-5 w-5" />} label="Total" value={partenaires?.length ?? 0} />
                <ContentStatCard icon={<Eye className="h-5 w-5" />} label="Visibles" value={partenaires?.filter(p => p.estVisible).length ?? 0} tone="success" />
                <ContentStatCard icon={<Star className="h-5 w-5" />} label="À la une" value={partenaires?.filter(p => p.estEnUne).length ?? 0} tone="warning" />
            </div>

            <div className="flex items-center justify-between">
                <div />
                <button onClick={() => setShowCreer(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    Nouveau partenaire
                </button>
            </div>

            <div className="rounded-xl border bg-card">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                ) : !partenaires?.length ? (
                    <EmptyState
                        icon={<Handshake className="h-12 w-12" />}
                        title="Aucun partenaire"
                        description="Ajoutez les partenaires de votre établissement."
                        actionLabel="Ajouter un partenaire"
                        onAction={() => setShowCreer(true)}
                    />
                ) : (
                    <div className="divide-y">
                        {partenaires.map((p) => (
                            <div key={p.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                                        {p.logo ? (
                                            <img src={p.logo} alt={p.nom} className="h-8 w-8 rounded object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-teal-700 dark:text-teal-300">{p.nom.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{p.nom}</h3>
                                            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                                                {p.categorie}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {p.siteWeb ? <a href={p.siteWeb} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{p.siteWeb}</a> : '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setASupprimer(p.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Supprimer">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreer && (
                <Modal title="Nouveau partenaire" onClose={() => setShowCreer(false)}>
                    <form onSubmit={handleCreer} className="space-y-4">
                        <FormField name="nom" label="Nom du partenaire" required placeholder="Nom de l'entreprise / organisation" />
                        <FormField name="siteWeb" label="Site web" placeholder="https://..." />
                        <div>
                            <label className="mb-1 block text-sm font-medium">Catégorie</label>
                            <select name="categorie" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                                <option value="institutionnel">Institutionnel</option>
                                <option value="entreprise">Entreprise</option>
                                <option value="association">Association</option>
                                <option value="education">Éducation</option>
                                <option value="technologie">Technologie</option>
                                <option value="autre">Autre</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Description</label>
                            <textarea name="description" rows={3} className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Description du partenariat..." />
                        </div>
                        <ModalFooter>
                            <button type="button" onClick={() => setShowCreer(false)} className="btn-cancel">Annuler</button>
                            <button type="submit" disabled={creerPartenaire.isPending} className="btn-primary">{creerPartenaire.isPending ? 'Création...' : 'Créer'}</button>
                        </ModalFooter>
                    </form>
                </Modal>
            )}

            <ConfirmationModal
                isOpen={!!aSupprimer}
                title="Supprimer ce partenaire ?"
                message="Cette action est irréversible."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
                onConfirm={handleSupprimer}
                onCancel={() => setASupprimer(null)}
            />
        </div>
    );
}

// ==================================
// TAB : Newsletter
// ==================================
function NewsletterTab() {
    const { data: abonnements, isLoading } = useCmsNewsletter();
    const desabonner = useDesabonnerNewsletter();
    const [aDesabonner, setADesabonner] = useState<string | null>(null);

    const handleDesabonner = async () => {
        if (!aDesabonner) return;
        try {
            await desabonner.mutateAsync(aDesabonner);
            toast.success('Abonné désinscrit');
        } catch {
            toast.error('Erreur');
        } finally {
            setADesabonner(null);
        }
    };

    const actifs = abonnements?.filter(a => a.estActif) ?? [];
    const totalVues = abonnements?.length ?? 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                <ContentStatCard icon={<Mail className="h-5 w-5" />} label="Total abonnés" value={totalVues} />
                <ContentStatCard icon={<Users className="h-5 w-5" />} label="Actifs" value={actifs.length} tone="success" />
                <ContentStatCard icon={<TrendingUp className="h-5 w-5" />} label="Taux activité" value={`${totalVues > 0 ? Math.round((actifs.length / totalVues) * 100) : 0}%`} tone="info" />
            </div>

            <div className="rounded-xl border bg-card">
                <div className="border-b px-6 py-4">
                    <h2 className="font-semibold">Liste des abonnés</h2>
                </div>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                ) : !abonnements?.length ? (
                    <EmptyState
                        icon={<Mail className="h-12 w-12" />}
                        title="Aucun abonné"
                        description="Les visiteurs qui s'inscrivent à votre newsletter apparaîtront ici."
                    />
                ) : (
                    <div className="divide-y">
                        {abonnements.map((a) => (
                            <div key={a.id} className="flex items-center justify-between px-6 py-3">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${a.estActif ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <Mail className={`h-4 w-4 ${a.estActif ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{a.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {a.nom || 'Anonyme'} • Inscrit le {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                                            {a.source && ` • via ${a.source}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {a.estActif ? (
                                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Actif</span>
                                    ) : (
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">Désinscrit</span>
                                    )}
                                    {a.estActif && (
                                        <button
                                            onClick={() => setADesabonner(a.id)}
                                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Désinscrire"
                                        >
                                            <EyeOff className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!aDesabonner}
                title="Désinscrire cet abonné ?"
                message="L'abonné ne recevra plus la newsletter."
                confirmLabel="Désinscrire"
                cancelLabel="Annuler"
                variant="warning"
                onConfirm={handleDesabonner}
                onCancel={() => setADesabonner(null)}
            />
        </div>
    );
}

// ==================================
// Composants partagés
// ==================================

function ContentStatCard({ icon, label, value, tone }: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    tone?: 'success' | 'info' | 'warning' | 'danger';
}) {
    const toneClasses = {
        success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
        <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone ? toneClasses[tone] : 'bg-primary/10 text-primary'}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ statut }: { statut: StatutActualite }) {
    const config = {
        [StatutActualite.PUBLIE]: { label: 'Publié', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
        [StatutActualite.BROUILLON]: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
        [StatutActualite.ARCHIVE]: { label: 'Archivé', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    const c = config[statut] || config[StatutActualite.BROUILLON];
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}>{c.label}</span>;
}

function EmptyState({ icon, title, description, actionLabel, onAction }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <div className="py-12 text-center">
            <div className="mx-auto text-gray-300 dark:text-gray-600">{icon}</div>
            <p className="mt-4 font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            {actionLabel && onAction && (
                <button onClick={onAction} className="mt-4 text-sm text-primary hover:underline">
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-bold">{title}</h2>
                {children}
            </div>
        </div>
    );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
    return <div className="flex justify-end gap-3 pt-2">{children}</div>;
}

function FormField({ name, label, required, placeholder, pattern, type = 'text' }: {
    name: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    pattern?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            <input
                type={type}
                name={name}
                required={required}
                pattern={pattern}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder={placeholder}
            />
        </div>
    );
}
