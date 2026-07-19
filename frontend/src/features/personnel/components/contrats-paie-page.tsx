import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileText, CreditCard, Percent, Gift, Ban, Plus, Edit, Trash2, Eye,
    Loader2, Calendar, Building, CheckCircle2, XCircle, FileDown, Briefcase, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { Badge } from '@/components/ui/Badge';
import { CustomModal } from '@/components/modals/CustomModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { ContratWizardModal } from './contrat-wizard-modal';
import { useContrats, useSupprimerContrat, useBulletins, useCreerBulletin, useGenererBulletin, useModifierBulletin, useSupprimerBulletin, useElementsBulletin, useCotisations, useCreerCotisation, useModifierCotisation, useSupprimerCotisation, useTypesPrimes, useCreerTypePrime, useModifierTypePrime, useSupprimerTypePrime, useTypesRetenues, useCreerTypeRetenue, useModifierTypeRetenue, useSupprimerTypeRetenue, useTypesContrat, useCreerTypeContrat, useModifierTypeContrat, useSupprimerTypeContrat, useToggleTypeContrat, useSimulerPaie, useRegenererBulletin, useGenererBulletinsMasse, useRapportPaie } from '../hooks/use-paie';
import { usePersonnel } from '../hooks/use-personnel';
import type { ContratPersonnel, BulletinPaie, Cotisation, TypePrime, TypeRetenue, TypeContratPersonnalise, MembrePersonnel, ElementSalaire, SimulationResult } from '../types/personnel.types';

type OngletId = 'contrats' | 'bulletins' | 'cotisations' | 'primes' | 'retenues' | 'types-contrat';

const ONGLETS = [
    { id: 'contrats' as const, label: 'Contrats', icon: FileText },
    { id: 'types-contrat' as const, label: 'Types de contrat', icon: Building },
    { id: 'bulletins' as const, label: 'Bulletins de paie', icon: CreditCard },
    { id: 'cotisations' as const, label: 'Cotisations', icon: Percent },
    { id: 'primes' as const, label: 'Types de primes', icon: Gift },
    { id: 'retenues' as const, label: 'Types de retenues', icon: Ban },
];

function ContratsTab() {
    const { data: contrats, isLoading } = useContrats();
    const supprimer = useSupprimerContrat();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<ContratPersonnel | null>(null);

    const getMembreLabel = (c: ContratPersonnel): string => {
        const p = c.membrePersonnel?.utilisateur?.profil;
        if (p?.prenom && p?.nom) return `${p.prenom} ${p.nom}`;
        const m = c.membrePersonnel?.matricule;
        if (m) return m;
        return c.membrePersonnelId?.slice(0, 8) + '…';
    };

    const modeDisplay: Record<string, string> = {
        MENSUEL: 'Mensuel', HORAIRE: 'Horaire', MIXTE: 'Mixte', HEBDOMADAIRE: 'Hebdo',
    };

    const statutVariant: Record<string, 'success' | 'warning' | 'secondary' | 'danger'> = {
        ACTIF: 'success', EXPIRE: 'danger', RENEGOCIE: 'warning', ROMPU: 'danger',
    };

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (c: ContratPersonnel) => { setEditing(c); setShowModal(true); };

    const hasPoste = (c: ContratPersonnel) => c.posteId || c.poste;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold">Tous les contrats</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Les affectations poste et fonctions sont synchronisées automatiquement</p>
                </div>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                    Nouveau contrat
                </ElisaButton>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : contrats && contrats.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Membre</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Poste</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fonction</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Mode</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Période</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Rémunération</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {contrats.map((c: ContratPersonnel) => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4">
                                        <a href={`/personnel/${c.membrePersonnelId}`} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                                            <User className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
                                            <span className="truncate max-w-[160px]">{getMembreLabel(c)}</span>
                                        </a>
                                    </td>
                                    <td className="py-3 px-4 font-medium">{c.typeContrat}</td>
                                    <td className="py-3 px-4">
                                        {hasPoste(c) ? (
                                            <a href={`/organisation/postes/${c.posteId}`} className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:text-blue-600">
                                                <Briefcase className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                                                <span className="truncate max-w-[140px]">{c.poste?.intitulé || c.posteId?.slice(0, 8)}</span>
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        {c.fonctionId ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/5 text-primary text-xs font-medium">
                                                {c.fonction?.nom || c.fonctionId?.slice(0, 8)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500 italic">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Badge variant="default">{modeDisplay[c.modeRemuneration as string] || c.modeRemuneration || '—'}</Badge>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs">{new Date(c.dateDebut).toLocaleDateString('fr-FR')}</span>
                                            {c.dateFin && (
                                                <>
                                                    <span className="text-gray-300 dark:text-gray-600">→</span>
                                                    <span className="text-xs">{new Date(c.dateFin).toLocaleDateString('fr-FR')}</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-right font-medium">{c.salaireBase?.toLocaleString('fr-FR')} F</div>
                                        {c.modeRemuneration === 'HORAIRE' && c.tarifHoraire && (
                                            <div className="text-right text-xs text-gray-400 dark:text-gray-500">{c.tarifHoraire?.toLocaleString('fr-FR')} F/h</div>
                                        )}
                                        {c.modeRemuneration === 'MIXTE' && (
                                            <div className="text-right text-xs text-gray-400 dark:text-gray-500">
                                                Base {c.salaireBase?.toLocaleString('fr-FR')} F
                                                {c.tarifHoraire ? ` + ${c.tarifHoraire.toLocaleString('fr-FR')} F/h` : ''}
                                            </div>
                                        )}
                                        {c.modeRemuneration === 'HEBDOMADAIRE' && c.tarifHebdomadaire && (
                                            <div className="text-right text-xs text-gray-400 dark:text-gray-500">{c.tarifHebdomadaire.toLocaleString('fr-FR')} F/sem</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant={statutVariant[c.statut] || 'secondary'}>{c.statut}</Badge>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Modifier">
                                                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                            <button onClick={() => { if (confirm('Supprimer ce contrat ?')) supprimer.mutate(c.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Supprimer">
                                                <Trash2 className="h-4 w-4 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">Aucun contrat enregistré</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Créez un contrat pour lier un membre à un poste et gérer sa rémunération</p>
                </div>
            )}

            <ContratWizardModal open={showModal} onOpenChange={setShowModal} editing={editing} />
        </div>
    );
}

function TypesContratTab() {
    const { data: types, isLoading } = useTypesContrat();
    const creer = useCreerTypeContrat();
    const modifier = useModifierTypeContrat();
    const supprimer = useSupprimerTypeContrat();
    const toggle = useToggleTypeContrat();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TypeContratPersonnalise | null>(null);
    const [form, setForm] = useState({
        code: '', nom: '', description: '', categorie: 'EMPLOI_PERMANENT',
        modeRemuneration: 'MENSUEL', ordre: 0, renouvellementAutoDefaut: false,
        dureeMaxMois: 0,
    });

    const openCreate = () => {
        setEditing(null);
        setForm({ code: '', nom: '', description: '', categorie: 'EMPLOI_PERMANENT', modeRemuneration: 'MENSUEL', ordre: 0, renouvellementAutoDefaut: false, dureeMaxMois: 0 });
        setShowModal(true);
    };

    const openEdit = (t: TypeContratPersonnalise) => {
        setEditing(t);
        setForm({
            code: t.code, nom: t.nom, description: t.description || '',
            categorie: t.categorie, modeRemuneration: t.modeRemuneration,
            ordre: t.ordre, renouvellementAutoDefaut: t.renouvellementAutoDefaut,
            dureeMaxMois: t.dureeMaxMois || 0,
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        const payload = {
            ...form,
            dureeMaxMois: form.dureeMaxMois > 0 ? form.dureeMaxMois : undefined,
            description: form.description || undefined,
        };
        if (editing) {
            await modifier.mutateAsync({ id: editing.id, ...payload });
        } else {
            await creer.mutateAsync(payload);
        }
        setShowModal(false);
    };

    const modeLabel: Record<string, string> = {
        MENSUEL: 'Mensuel fixe', HORAIRE: 'Horaire', MIXTE: 'Mixte + HS', HEBDOMADAIRE: 'Hebdo lissé',
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Types de contrat personnalisés</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                    Nouveau type
                </ElisaButton>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : types && types.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Code</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nom</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Catégorie</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Mode</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actif</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Système</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Ordre</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {types.map((t: TypeContratPersonnalise) => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-mono font-medium">{t.code}</td>
                                    <td className="py-3 px-4">{t.nom}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{t.categorie}</td>
                                    <td className="py-3 px-4 text-center"><Badge variant="default">{modeLabel[t.modeRemuneration] || t.modeRemuneration}</Badge></td>
                                    <td className="py-3 px-4 text-center">{t.actif ? <Badge variant="success">Oui</Badge> : <Badge variant="secondary">Non</Badge>}</td>
                                    <td className="py-3 px-4 text-center">{t.estSysteme ? <Badge variant="warning">Système</Badge> : '—'}</td>
                                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{t.ordre}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => toggle.mutate(t.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={t.actif ? 'Désactiver' : 'Activer'}>
                                                {t.actif ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                                            </button>
                                            <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Modifier">
                                                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                            {!t.estSysteme && (
                                                <button onClick={() => { if (confirm('Supprimer ce type de contrat ?')) supprimer.mutate(t.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Supprimer"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Building className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">Aucun type de contrat personnalisé</p>
                </div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? 'Modifier le type de contrat' : 'Nouveau type de contrat'}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>Annuler</ElisaButton>
                        <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending}
                            disabled={!form.code || !form.nom}>
                            {editing ? 'Enregistrer' : 'Créer'}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CDD, INTERIMAIRE" required disabled={!!editing?.estSysteme} hint={editing?.estSysteme ? 'Code système non modifiable' : undefined} />
                        <ElisaInput label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Contrat à durée déterminée" required />
                    </div>
                    <ElisaInput label="Description (optionnelle)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect label="Catégorie" options={[
                            { value: 'EMPLOI_PERMANENT', label: 'Emploi permanent' },
                            { value: 'EMPLOI_TEMPORAIRE', label: 'Emploi temporaire' },
                            { value: 'STAGE_FORMATION', label: 'Stage / Formation' },
                            { value: 'FREELANCE', label: 'Freelance' },
                            { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
                            { value: 'APPRENTISSAGE', label: 'Apprentissage' },
                            { value: 'AUTRE', label: 'Autre' },
                        ]} value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })} />
                        <ElisaSelect label="Mode de rémunération par défaut" options={[
                            { value: 'MENSUEL', label: 'Mensuel (fixe)' },
                            { value: 'HORAIRE', label: 'Horaire (taux × heures)' },
                            { value: 'MIXTE', label: 'Mixte (fixe + heures sup)' },
                            { value: 'HEBDOMADAIRE', label: 'Hebdomadaire (taux × 52/12)' },
                        ]} value={form.modeRemuneration} onValueChange={(v) => setForm({ ...form, modeRemuneration: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Ordre d'affichage" type="number" value={String(form.ordre)} onChange={(e) => setForm({ ...form, ordre: Number(e.target.value) })} />
                        <ElisaInput label="Durée max (mois, 0 = illimité)" type="number" value={String(form.dureeMaxMois)} onChange={(e) => setForm({ ...form, dureeMaxMois: Number(e.target.value) })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.renouvellementAutoDefaut} onChange={(e) => setForm({ ...form, renouvellementAutoDefaut: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
                        Renouvellement automatique par défaut
                    </label>
                </div>
            </CustomModal>
        </div>
    );
}

function BulletinsTab() {
    const [filters, setFilters] = useState({ mois: '', annee: String(new Date().getFullYear()), statut: '' });
    const { data: bulletins, isLoading } = useBulletins({
        mois: filters.mois ? Number(filters.mois) : undefined,
        annee: filters.annee ? Number(filters.annee) : undefined,
        statut: filters.statut || undefined,
    });
    const { data: membresData } = usePersonnel({ limit: 100 });
    const creer = useCreerBulletin();
    const modifier = useModifierBulletin();
    const supprimer = useSupprimerBulletin();
    const generer = useGenererBulletin();
    const simuler = useSimulerPaie();
    const regenerer = useRegenererBulletin();
    const genererMasse = useGenererBulletinsMasse();
    const { data: rapport } = useRapportPaie(Number(filters.mois) || new Date().getMonth() + 1, Number(filters.annee) || new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [showGenerer, setShowGenerer] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);
    const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
    const [detailBulletin, setDetailBulletin] = useState<any | null>(null);
    const { data: elementsData } = useElementsBulletin(showDetail ? detailBulletin?.id : null);
    const elements: ElementSalaire[] = Array.isArray(elementsData) ? elementsData : (elementsData as any)?.data || [];
    const [editing, setEditing] = useState<BulletinPaie | null>(null);
    const [form, setForm] = useState({ membrePersonnelId: '', contratId: '', mois: new Date().getMonth() + 1, annee: new Date().getFullYear(), salaireBase: 0, primes: 0, deductions: 0 });
    const [genForm, setGenForm] = useState({ membreId: '', mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });
    const [paiementDate, setPaiementDate] = useState('');

    const membres = membresData?.items || [];
    const membreGenOptions = membres.map((m: MembrePersonnel) => {
        const p = m.utilisateur?.profil;
        const nom = p?.prenom && p?.nom ? `${p.prenom} ${p.nom}` : m.matricule || m.id.slice(0, 8);
        return { value: m.id, label: `${nom} (${m.matricule || '—'})` };
    });
    membreGenOptions.unshift({ value: '', label: '— Sélectionner un membre —' });

    const getMembreBulletinLabel = (b: any): string => {
        const p = b.membrePersonnel?.utilisateur?.profil;
        if (p?.prenom && p?.nom) return `${p.prenom} ${p.nom}`;
        const m = b.membrePersonnel?.matricule;
        if (m) return m;
        return b.membrePersonnelId?.slice(0, 8) + '…';
    };

    const moisOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('fr', { month: 'long' }) }));
    const statutOptions = [
        { value: '', label: 'Tous les statuts' },
        { value: 'GENERE', label: 'Généré' },
        { value: 'EN_ATTENTE_VALIDATION', label: 'En attente validation' },
        { value: 'VALIDE', label: 'Validé' },
        { value: 'PAYE', label: 'Payé' },
        { value: 'ANNULE', label: 'Annulé' },
    ];

    const openCreate = () => { setEditing(null); setForm({ membrePersonnelId: '', contratId: '', mois: new Date().getMonth() + 1, annee: new Date().getFullYear(), salaireBase: 0, primes: 0, deductions: 0 }); setShowModal(true); };
    const openEdit = (b: BulletinPaie) => { setEditing(b); setForm({ membrePersonnelId: b.membrePersonnelId, contratId: b.contratId, mois: b.mois, annee: b.annee, salaireBase: b.salaireBase, primes: b.primes, deductions: b.deductions }); setShowModal(true); };

    const categorieLabels: Record<string, string> = {
        SALAIRE_BASE: 'Salaire de base',
        HEURE_COURS: 'Heures de cours',
        HEURE_SUP: 'Heures supplémentaires',
        PRIME: 'Primes',
        COTISATION: 'Cotisations',
        INDEMNITE: 'Indemnités',
        RETENUE: 'Retenues',
        AUTRE: 'Autres',
    };
    const groupedElements = elements.reduce((acc: Record<string, ElementSalaire[]>, e: ElementSalaire) => {
        const cat = e.categorie || 'AUTRE';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(e);
        return acc;
    }, {});

    const handleSubmit = async () => {
        if (editing) {
            await modifier.mutateAsync({ id: editing.id, ...form, salaireBase: Number(form.salaireBase), primes: Number(form.primes), deductions: Number(form.deductions) });
        } else {
            await creer.mutateAsync({ ...form, salaireBase: Number(form.salaireBase), primes: Number(form.primes), deductions: Number(form.deductions) });
        }
        setShowModal(false);
    };

    const statutVariant: Record<string, 'success' | 'warning' | 'secondary' | 'danger'> = {
        PAYE: 'success', VALIDE: 'success', GENERE: 'warning', EN_ATTENTE_VALIDATION: 'warning', ANNULE: 'danger',
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Bulletins de paie</h3>
                {rapport && rapport.nombreBulletins > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full max-w-3xl">
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-3">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Bulletins</p>
                            <p className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-1">{rapport.nombreBulletins}</p>
                        </div>
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-3">
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Masse salariale</p>
                            <p className="text-xl font-bold text-green-800 dark:text-green-300 mt-1">{rapport.totalSalairesNets.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 p-3">
                            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Salaire moyen</p>
                            <p className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mt-1">{rapport.nombreBulletins > 0 ? Math.round(rapport.totalSalairesNets / rapport.nombreBulletins).toLocaleString('fr-FR') : 0} F</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-3">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Primes</p>
                            <p className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">+{rapport.totalPrimes.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-3">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Déductions</p>
                            <p className="text-xl font-bold text-red-800 dark:text-red-300 mt-1">−{rapport.totalDeductions.toLocaleString('fr-FR')} F</p>
                        </div>
                    </div>
                )}
                <div className="flex gap-2">
                    <ElisaButton variant="outline" size="sm" icon={<Calendar className="h-4 w-4" />} onClick={() => { setGenForm({ membreId: '', mois: new Date().getMonth() + 1, annee: new Date().getFullYear() }); setShowGenerer(true); }}>
                        Génération
                    </ElisaButton>
                    <ElisaButton variant="outline" size="sm" icon={<Building className="h-4 w-4" />}
                        onClick={() => {
                            const actifs = membres.filter((m: MembrePersonnel) => m.statut === 'ACTIF');
                            if (actifs.length === 0) { toast.error('Aucun membre actif'); return; }
                            if (confirm(`Générer les bulletins pour ${actifs.length} membre(s) actif(s) ?`))
                                genererMasse.mutate({ membres: actifs, mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });
                        }}
                        loading={genererMasse.isPending}>
                        Tout le personnel
                    </ElisaButton>
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                        Nouveau bulletin
                    </ElisaButton>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <ElisaSelect options={[{ value: '', label: 'Tous les mois' }, ...moisOptions]} value={filters.mois} onValueChange={(v) => setFilters({ ...filters, mois: v })} className="w-36" />
                <ElisaInput type="number" value={filters.annee} onChange={(e) => setFilters({ ...filters, annee: e.target.value })} className="w-24" placeholder="Année" />
                <ElisaSelect options={statutOptions} value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })} className="w-44" />
                {(filters.mois || filters.annee !== String(new Date().getFullYear()) || filters.statut) && (
                    <button onClick={() => setFilters({ mois: '', annee: String(new Date().getFullYear()), statut: '' })} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Réinitialiser</button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : bulletins && bulletins.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Période</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Membre</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Base</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Heures sup</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Primes</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Retenues</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Net</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {bulletins.map((b: any) => (
                                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-medium">{b.mois}/{b.annee}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{getMembreBulletinLabel(b)}</td>
                                    <td className="py-3 px-4 text-right">{Number(b.salaireBase).toLocaleString('fr-FR')}</td>
                                    <td className="py-3 px-4 text-right">{Number(b.montantHeuresSup || 0).toLocaleString('fr-FR')}</td>
                                    <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">+{Number(b.primes || 0).toLocaleString('fr-FR')}</td>
                                    <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">−{Number(b.deductions || 0).toLocaleString('fr-FR')}</td>
                                    <td className="py-3 px-4 text-right font-semibold">{Number(b.salaireNet).toLocaleString('fr-FR')} F</td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant={statutVariant[b.statut] || 'secondary'}>{b.statut}</Badge>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => { setDetailBulletin(b); setShowDetail(true); }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Voir détail"><Eye className="h-4 w-4 text-blue-500" /></button>
                                            <button onClick={() => window.open(`/api/personnel/bulletins/${b.id}/pdf`, '_blank')} className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg" title="PDF"><FileDown className="h-4 w-4 text-green-600 dark:text-green-400" /></button>
                                            <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                                            <button onClick={() => regenerer.mutate({ id: b.id, membreId: b.membrePersonnelId, mois: b.mois, annee: b.annee })} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg" title="Régénérer"><CreditCard className="h-4 w-4 text-amber-500" /></button>
                                            <button onClick={() => { if (confirm('Supprimer ce bulletin ?')) supprimer.mutate(b.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">Aucun bulletin de paie</p>
                </div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? 'Modifier le bulletin' : 'Nouveau bulletin'}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>Annuler</ElisaButton>
                        <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending}
                            disabled={!form.membrePersonnelId || !form.contratId || !form.mois || !form.annee}>
                            {editing ? 'Enregistrer' : 'Créer'}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <ElisaInput label="ID Membre" value={form.membrePersonnelId} onChange={(e) => setForm({ ...form, membrePersonnelId: e.target.value })} required />
                    <ElisaInput label="ID Contrat" value={form.contratId} onChange={(e) => setForm({ ...form, contratId: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect label="Mois" options={moisOptions} value={String(form.mois)} onValueChange={(v) => setForm({ ...form, mois: Number(v) })} required />
                        <ElisaInput label="Année" type="number" value={String(form.annee)} onChange={(e) => setForm({ ...form, annee: Number(e.target.value) })} required />
                    </div>
                    <ElisaInput label="Salaire de base (F CFA)" type="number" value={String(form.salaireBase)} onChange={(e) => setForm({ ...form, salaireBase: Number(e.target.value) })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Primes" type="number" value={String(form.primes)} onChange={(e) => setForm({ ...form, primes: Number(e.target.value) })} />
                        <ElisaInput label="Retenues" type="number" value={String(form.deductions)} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} />
                    </div>
                </div>
            </CustomModal>

            <CustomModal open={showGenerer} onOpenChange={setShowGenerer}
                title="Génération automatique de bulletin"
                size="md"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <ElisaButton variant="outline" size="sm"
                            onClick={async () => {
                                const result = await simuler.mutateAsync(genForm);
                                setSimulationData(result);
                                setShowSimulation(true);
                            }}
                            loading={simuler.isPending}
                            disabled={!genForm.membreId || !genForm.mois || !genForm.annee}>
                            Simuler
                        </ElisaButton>
                        <ElisaButton variant="secondary" onClick={() => setShowGenerer(false)}>Annuler</ElisaButton>
                        <ElisaButton variant="primary" onClick={() => { generer.mutate(genForm); setShowGenerer(false); }}
                            loading={generer.isPending} disabled={!genForm.membreId || !genForm.mois || !genForm.annee}>
                            Générer
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <ElisaSelect label="Membre" options={membreGenOptions} value={genForm.membreId} onValueChange={(v) => setGenForm({ ...genForm, membreId: v })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect label="Mois" options={moisOptions} value={String(genForm.mois)} onValueChange={(v) => setGenForm({ ...genForm, mois: Number(v) })} required />
                        <ElisaInput label="Année" type="number" value={String(genForm.annee)} onChange={(e) => setGenForm({ ...genForm, annee: Number(e.target.value) })} required />
                    </div>
                </div>
            </CustomModal>

            <CustomModal open={showSimulation} onOpenChange={setShowSimulation}
                title="Simulation du bulletin" size="md"
                footer={<ElisaButton variant="secondary" onClick={() => setShowSimulation(false)}>Fermer</ElisaButton>}
            >
                {simulationData && (
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg"><span className="text-blue-600 dark:text-blue-400 text-xs">Salaire base</span><p className="font-semibold">{Number(simulationData.salaireBase).toLocaleString('fr-FR')} F</p></div>
                            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg"><span className="text-amber-600 dark:text-amber-400 text-xs">Heures sup</span><p className="font-semibold">{simulationData.heuresSup > 0 ? `${Number(simulationData.montantHeuresSup).toLocaleString('fr-FR')} F (${simulationData.heuresSup}h)` : '—'}</p></div>
                            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg"><span className="text-green-600 dark:text-green-400 text-xs">Primes</span><p className="font-semibold">{Number(simulationData.primes).toLocaleString('fr-FR')} F</p></div>
                            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg"><span className="text-red-600 dark:text-red-400 text-xs">Retenues</span><p className="font-semibold">−{Number(simulationData.totalRetenues).toLocaleString('fr-FR')} F</p></div>
                        </div>
                        {simulationData.detailParMatiere?.length > 0 && (
                            <>
                                <h4 className="font-medium text-gray-700 dark:text-gray-300">Détail par matière</h4>
                                <div className="space-y-1">
                                    {simulationData.detailParMatiere.map((d: any, i: number) => (
                                        <div key={i} className="flex justify-between py-1.5 px-3 rounded bg-gray-50 dark:bg-gray-800">
                                            <span>{d.matiereNom} — {d.heures}h × {Number(d.tarifHoraire).toLocaleString('fr-FR')} F/h</span>
                                            <span className="font-medium">{Number(d.montant).toLocaleString('fr-FR')} F</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        <div className="border-t pt-3 flex justify-between font-semibold text-base">
                            <span>Net à payer</span>
                            <span>{Number(simulationData.salaireNet).toLocaleString('fr-FR')} F</span>
                        </div>
                    </div>
                )}
            </CustomModal>

            <CustomModal open={showDetail} onOpenChange={setShowDetail}
                title="Détail du bulletin de paie" size="lg"
                footer={<ElisaButton variant="secondary" onClick={() => setShowDetail(false)}>Fermer</ElisaButton>}
            >
                {detailBulletin && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-gray-500 dark:text-gray-400">Période</span><p className="font-medium">{detailBulletin.mois}/{detailBulletin.annee}</p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">Statut</span><p className="font-medium"><Badge variant={statutVariant[detailBulletin.statut] || 'secondary'}>{detailBulletin.statut}</Badge></p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">Membre</span><p className="font-medium">{getMembreBulletinLabel(detailBulletin)}</p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">ID Contrat</span><p className="font-mono text-xs truncate max-w-[180px]" title={detailBulletin.contratId}>{detailBulletin.contratId}</p></div>
                            {detailBulletin.datePaiement && <div><span className="text-gray-500 dark:text-gray-400">Date paiement</span><p className="font-medium">{new Date(detailBulletin.datePaiement).toLocaleDateString('fr-FR')}</p></div>}
                        </div>

                        <hr className="border-gray-200 dark:border-gray-700" />

                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            Éléments de paie <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({elements.length} ligne{elements.length > 1 ? 's' : ''})</span>
                        </h4>

                        {elements.length > 0 ? (
                            <div className="space-y-3">
                                {Object.entries(groupedElements).map(([categorie, items]) => {
                                    const sousTotal = items.reduce((s: number, i: ElementSalaire) => s + Number(i.montant), 0);
                                    return (
                                        <div key={categorie}>
                                            <div className="flex items-center justify-between py-1.5 px-2 bg-gray-100 dark:bg-gray-700 rounded-t-md text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                                <span>{categorieLabels[categorie] || categorie}</span>
                                                <span>{Number(sousTotal).toLocaleString('fr-FR')} F</span>
                                            </div>
                                            {items.map((e: ElementSalaire) => (
                                                <div key={e.id} className="flex items-center justify-between py-1.5 px-3 text-sm even:bg-gray-50 dark:even:bg-gray-800 dark:bg-gray-800">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className={`w-2 h-2 rounded-full shrink-0 ${e.type === 'GAIN' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        <span className="truncate">{e.libelle}</span>
                                                        {e.baseCalcul != null && e.taux != null && (
                                                            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">({e.taux} × {Number(e.baseCalcul).toLocaleString('fr-FR')} F)</span>
                                                        )}
                                                    </div>
                                                    <span className={`font-medium shrink-0 ml-4 ${e.type === 'GAIN' ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
                                                        {e.type === 'GAIN' ? '+' : '−'}{Number(e.montant).toLocaleString('fr-FR')} F
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Aucun élément détaillé enregistré pour ce bulletin.</p>
                        )}

                        <hr className="border-gray-200 dark:border-gray-700" />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500 dark:text-gray-400">Total heures effectuées</span><p className="font-medium">{detailBulletin.heuresEffectuees || 0}h</p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">Dont heures sup</span><p className="font-medium text-amber-600 dark:text-amber-400">{detailBulletin.montantHeuresSup > 0 ? `${Number(detailBulletin.montantHeuresSup).toLocaleString('fr-FR')} F` : '—'}</p></div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Net à payer</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{Number(detailBulletin.salaireNet).toLocaleString('fr-FR')} F</span>
                        </div>

                        {detailBulletin.statut !== 'PAYE' && (
                            <>
                                <hr className="border-gray-200 dark:border-gray-700" />
                                <div className="flex items-center gap-3">
                                    <ElisaInput type="date" value={paiementDate} onChange={(e) => setPaiementDate(e.target.value)} className="flex-1" placeholder="Date de paiement" />
                                    <ElisaButton variant="primary" size="sm"
                                        onClick={() => {
                                            modifier.mutate({ id: detailBulletin.id, statut: 'PAYE', datePaiement: paiementDate || new Date().toISOString().split('T')[0] });
                                            setShowDetail(false);
                                        }}
                                        loading={modifier.isPending}
                                        disabled={!paiementDate}>
                                        Marquer comme payé
                                    </ElisaButton>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CustomModal>
        </div>
    );
}

function CotisationsTab() {
    const { data: cotisations, isLoading } = useCotisations();
    const creer = useCreerCotisation();
    const modifier = useModifierCotisation();
    const supprimer = useSupprimerCotisation();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Cotisation | null>(null);
    const [form, setForm] = useState({ code: '', nom: '', type: 'SALARIALE' as string, tauxPatronal: 0, tauxSalarial: 0 });

    const openCreate = () => { setEditing(null); setForm({ code: '', nom: '', type: 'SALARIALE', tauxPatronal: 0, tauxSalarial: 0 }); setShowModal(true); };
    const openEdit = (c: Cotisation) => { setEditing(c); setForm({ code: c.code, nom: c.nom, type: c.type, tauxPatronal: c.tauxPatronal, tauxSalarial: c.tauxSalarial }); setShowModal(true); };
    const handleSubmit = () => {
        if (editing) modifier.mutateAsync({ id: editing.id, ...form }).then(() => setShowModal(false));
        else creer.mutateAsync(form).then(() => setShowModal(false));
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Cotisations sociales</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Ajouter</ElisaButton>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : cotisations && cotisations.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Code</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nom</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Taux patronal</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Taux salarial</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actif</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {cotisations.map((c: Cotisation) => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-mono font-medium">{c.code}</td>
                                    <td className="py-3 px-4">{c.nom}</td>
                                    <td className="py-3 px-4 text-center"><Badge variant="default">{c.type}</Badge></td>
                                    <td className="py-3 px-4 text-right">{c.tauxPatronal}%</td>
                                    <td className="py-3 px-4 text-right">{c.tauxSalarial}%</td>
                                    <td className="py-3 px-4 text-center">{c.actif ? <Badge variant="success">Actif</Badge> : <Badge variant="secondary">Inactif</Badge>}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                                            <button onClick={() => { if (confirm('Supprimer cette cotisation ?')) supprimer.mutate(c.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"><Percent className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" /><p className="text-gray-600 dark:text-gray-300">Aucune cotisation</p></div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? 'Modifier la cotisation' : 'Nouvelle cotisation'} size="sm"
                footer={<div className="flex justify-end gap-3">
                    <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>Annuler</ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending} disabled={!form.code || !form.nom}>{editing ? 'Enregistrer' : 'Créer'}</ElisaButton>
                </div>}
            >
                <div className="space-y-4">
                    <ElisaInput label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CNPS, AMO, IRPP" required />
                    <ElisaInput label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                    <ElisaSelect label="Type" options={[{ value: 'PATRONALE', label: 'Patronale' }, { value: 'SALARIALE', label: 'Salariale' }, { value: 'MIXTE', label: 'Mixte' }]} value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label="Taux patronal (%)" type="number" value={String(form.tauxPatronal)} onChange={(e) => setForm({ ...form, tauxPatronal: Number(e.target.value) })} />
                        <ElisaInput label="Taux salarial (%)" type="number" value={String(form.tauxSalarial)} onChange={(e) => setForm({ ...form, tauxSalarial: Number(e.target.value) })} />
                    </div>
                </div>
            </CustomModal>
        </div>
    );
}

function PrimesTab() {
    const { data: primes, isLoading } = useTypesPrimes();
    const creer = useCreerTypePrime();
    const modifier = useModifierTypePrime();
    const supprimer = useSupprimerTypePrime();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TypePrime | null>(null);
    const [form, setForm] = useState({ code: '', nom: '', typeCalcul: 'FIXE', valeur: 0 });

    const openCreate = () => { setEditing(null); setForm({ code: '', nom: '', typeCalcul: 'FIXE', valeur: 0 }); setShowModal(true); };
    const openEdit = (p: TypePrime) => { setEditing(p); setForm({ code: p.code, nom: p.nom, typeCalcul: p.typeCalcul, valeur: p.valeur }); setShowModal(true); };
    const handleSubmit = () => {
        if (editing) modifier.mutateAsync({ id: editing.id, ...form }).then(() => setShowModal(false));
        else creer.mutateAsync(form).then(() => setShowModal(false));
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Types de primes</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Ajouter</ElisaButton>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : primes && primes.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Code</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nom</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Calcul</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Valeur</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actif</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {primes.map((p: TypePrime) => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-mono font-medium">{p.code}</td>
                                    <td className="py-3 px-4">{p.nom}</td>
                                    <td className="py-3 px-4 text-center"><Badge variant="default">{p.typeCalcul}</Badge></td>
                                    <td className="py-3 px-4 text-right font-medium">{p.valeur?.toLocaleString('fr-FR')}{p.typeCalcul === 'POURCENTAGE' ? '%' : ' F'}</td>
                                    <td className="py-3 px-4 text-center">{p.actif ? <Badge variant="success">Oui</Badge> : <Badge variant="secondary">Non</Badge>}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                                            <button onClick={() => { if (confirm('Supprimer ce type de prime ?')) supprimer.mutate(p.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"><Gift className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" /><p className="text-gray-600 dark:text-gray-300">Aucun type de prime</p></div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? 'Modifier le type de prime' : 'Nouveau type de prime'} size="sm"
                footer={<div className="flex justify-end gap-3">
                    <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>Annuler</ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending} disabled={!form.code || !form.nom}>{editing ? 'Enregistrer' : 'Créer'}</ElisaButton>
                </div>}
            >
                <div className="space-y-4">
                    <ElisaInput label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ANCIENNETE, TRANSPORT" required />
                    <ElisaInput label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                    <ElisaSelect label="Type de calcul" options={[{ value: 'FIXE', label: 'Fixe' }, { value: 'POURCENTAGE', label: 'Pourcentage' }, { value: 'VARIABLE', label: 'Variable' }]} value={form.typeCalcul} onValueChange={(v) => setForm({ ...form, typeCalcul: v })} />
                    <ElisaInput label="Valeur" type="number" value={String(form.valeur)} onChange={(e) => setForm({ ...form, valeur: Number(e.target.value) })} />
                </div>
            </CustomModal>
        </div>
    );
}

function RetenuesTab() {
    const { data: retenues, isLoading } = useTypesRetenues();
    const creer = useCreerTypeRetenue();
    const modifier = useModifierTypeRetenue();
    const supprimer = useSupprimerTypeRetenue();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TypeRetenue | null>(null);
    const [form, setForm] = useState({ code: '', nom: '', frequence: 'PONCTUELLE', montantMax: 0 });

    const openCreate = () => { setEditing(null); setForm({ code: '', nom: '', frequence: 'PONCTUELLE', montantMax: 0 }); setShowModal(true); };
    const openEdit = (r: TypeRetenue) => { setEditing(r); setForm({ code: r.code, nom: r.nom, frequence: r.frequence, montantMax: r.montantMax || 0 }); setShowModal(true); };
    const handleSubmit = () => {
        const payload = { ...form, montantMax: form.montantMax > 0 ? form.montantMax : undefined };
        if (editing) modifier.mutateAsync({ id: editing.id, ...payload }).then(() => setShowModal(false));
        else creer.mutateAsync(payload).then(() => setShowModal(false));
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Types de retenues</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>Ajouter</ElisaButton>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : retenues && retenues.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Code</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Nom</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Fréquence</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Montant max</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {retenues.map((r: TypeRetenue) => (
                                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-mono font-medium">{r.code}</td>
                                    <td className="py-3 px-4">{r.nom}</td>
                                    <td className="py-3 px-4 text-center"><Badge variant="default">{r.frequence}</Badge></td>
                                    <td className="py-3 px-4 text-right">{r.montantMax ? `${r.montantMax.toLocaleString('fr-FR')} F` : '—'}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                                            <button onClick={() => { if (confirm('Supprimer ce type de retenue ?')) supprimer.mutate(r.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"><Ban className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" /><p className="text-gray-600 dark:text-gray-300">Aucun type de retenue</p></div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? 'Modifier le type de retenue' : 'Nouveau type de retenue'} size="sm"
                footer={<div className="flex justify-end gap-3">
                    <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>Annuler</ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending} disabled={!form.code || !form.nom}>{editing ? 'Enregistrer' : 'Créer'}</ElisaButton>
                </div>}
            >
                <div className="space-y-4">
                    <ElisaInput label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="AVANCE, PRET, SANCTION" required />
                    <ElisaInput label="Nom" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                    <ElisaSelect label="Fréquence" options={[{ value: 'PONCTUELLE', label: 'Ponctuelle' }, { value: 'RECURRENTE', label: 'Récurrente' }]} value={form.frequence} onValueChange={(v) => setForm({ ...form, frequence: v })} />
                    <ElisaInput label="Montant max (optionnel)" type="number" value={String(form.montantMax)} onChange={(e) => setForm({ ...form, montantMax: Number(e.target.value) })} />
                </div>
            </CustomModal>
        </div>
    );
}

export function ContratsPaiePage() {
    const { t } = useTranslation('contrat');
    const [ongletActif, setOngletActif] = useState<OngletId>('contrats');

    const onglets: Tab[] = ONGLETS.map((o) => ({
        id: o.id,
        label: t(`onglets.${o.id}`, o.label),
        icon: o.icon,
    }));

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('titre', 'Gestion des contrats & paie')}
                description={t('description', 'Gérez les contrats, bulletins de paie, cotisations, primes et retenues du personnel')}
                icon={Briefcase}
                variant="gradient"
            />

            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as OngletId)}
                variant="underline"
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'contrats' && <ContratsTab />}
                {ongletActif === 'types-contrat' && <TypesContratTab />}
                {ongletActif === 'bulletins' && <BulletinsTab />}
                {ongletActif === 'cotisations' && <CotisationsTab />}
                {ongletActif === 'primes' && <PrimesTab />}
                {ongletActif === 'retenues' && <RetenuesTab />}
            </TabsContent>
        </div>
    );
}
