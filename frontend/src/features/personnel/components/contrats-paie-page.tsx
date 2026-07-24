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
import { useModesRemuneration } from '@/features/organisation/hooks/use-modes-remuneration';
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
    const { t } = useTranslation('contrat');
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
        MENSUEL: t('contrat.modeMensuelCourt'), HORAIRE: t('contrat.modeHoraireCourt'), MIXTE: t('contrat.modeMixteCourt'), HEBDOMADAIRE: t('contrat.modeHebdoCourt'),
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
                    <h3 className="text-lg font-semibold">{t('contrat.tousLesContrats')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('contrat.syncInfo')}</p>
                </div>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                    {t('contrat.nouveauContrat')}
                </ElisaButton>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : contrats && contrats.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.membre')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.labelType')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.poste')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.fonction')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.labelMode')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.periode')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.remuneration')}</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.statut')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.labelActions')}</th>
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
                                                <span className="truncate max-w-[140px]">{c.poste?.intitule || c.posteId?.slice(0, 8)}</span>
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
                                        <Badge variant="default">{modeDisplay[c.modeRemuneration?.code || ''] || c.modeRemuneration?.code || '—'}</Badge>
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
                                        {c.modeRemuneration?.code === 'HORAIRE' && c.tarifHoraire && (
                                            <div className="text-right text-xs text-gray-400 dark:text-gray-500">{c.tarifHoraire?.toLocaleString('fr-FR')} F/h</div>
                                        )}
                                        {c.modeRemuneration?.code === 'MIXTE' && (
                                            <div className="text-right text-xs text-gray-400 dark:text-gray-500">
                                                Base {c.salaireBase?.toLocaleString('fr-FR')} F
                                                {c.tarifHoraire ? ` + ${c.tarifHoraire.toLocaleString('fr-FR')} F/h` : ''}
                                            </div>
                                        )}
                                        {c.modeRemuneration?.code === 'HEBDOMADAIRE' && c.tarifHebdomadaire && (
                                            <div className="text-right text-xs text-gray-400 dark:text-gray-500">{c.tarifHebdomadaire.toLocaleString('fr-FR')} F/sem</div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <Badge variant={statutVariant[c.statut] || 'secondary'}>{c.statut}</Badge>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={t('contrat.modifier')}>
                                                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                            <button onClick={() => { if (confirm(t('contrat.confirmDelete'))) supprimer.mutate(c.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title={t('contrat.supprimer')}>
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
                    <p className="text-gray-600 dark:text-gray-300">{t('contrat.aucunContrat')}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('contrat.aucunContratHint')}</p>
                </div>
            )}

            <ContratWizardModal open={showModal} onOpenChange={setShowModal} editing={editing} />
        </div>
    );
}

function TypesContratTab() {
    const { t } = useTranslation('contrat');
    const { data: types, isLoading } = useTypesContrat();
    const creer = useCreerTypeContrat();
    const modifier = useModifierTypeContrat();
    const supprimer = useSupprimerTypeContrat();
    const toggle = useToggleTypeContrat();
    const { data: modesRemuneration } = useModesRemuneration();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<TypeContratPersonnalise | null>(null);
    const [form, setForm] = useState({
        code: '', nom: '', description: '', categorie: 'EMPLOI_PERMANENT',
        modeRemunerationId: '', ordre: 0, renouvellementAutoDefaut: false,
        dureeMaxMois: 0,
    });

    const openCreate = () => {
        setEditing(null);
        setForm({ code: '', nom: '', description: '', categorie: 'EMPLOI_PERMANENT', modeRemunerationId: '', ordre: 0, renouvellementAutoDefaut: false, dureeMaxMois: 0 });
        setShowModal(true);
    };

    const openEdit = (tc: TypeContratPersonnalise) => {
        setEditing(tc);
        setForm({
            code: tc.code, nom: tc.nom, description: tc.description || '',
            categorie: tc.categorie, modeRemunerationId: tc.modeRemunerationId || '',
            ordre: tc.ordre, renouvellementAutoDefaut: tc.renouvellementAutoDefaut,
            dureeMaxMois: tc.dureeMaxMois || 0,
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
        MENSUEL: t('contrat.modeMensuel'), HORAIRE: t('contrat.modeHoraire'), MIXTE: t('contrat.modeMixte'), HEBDOMADAIRE: t('contrat.modeHebdomadaire'),
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">{t('contrat.typesContrat.titre')}</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                    {t('contrat.typesContrat.nouveauType')}
                </ElisaButton>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : types && types.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.code')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.nom')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.categorie')}</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.mode')}</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.actifCol')}</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.systeme')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.ordre')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.typesContrat.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {types.map((tc: TypeContratPersonnalise) => (
                                <tr key={tc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-mono font-medium">{tc.code}</td>
                                    <td className="py-3 px-4">{tc.nom}</td>
                                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{tc.categorie}</td>
                                    <td className="py-3 px-4 text-center"><Badge variant="default">{modeLabel[tc.modeRemuneration?.code || ''] || tc.modeRemuneration?.code || '—'}</Badge></td>
                                    <td className="py-3 px-4 text-center">{tc.actif ? <Badge variant="success">{t('contrat.typesContrat.oui')}</Badge> : <Badge variant="secondary">{t('contrat.typesContrat.non')}</Badge>}</td>
                                    <td className="py-3 px-4 text-center">{tc.estSysteme ? <Badge variant="warning">{t('contrat.typesContrat.systeme')}</Badge> : '—'}</td>
                                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-300">{tc.ordre}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => toggle.mutate(tc.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={tc.actif ? t('contrat.typesContrat.desactiver') : t('contrat.typesContrat.activer')}>
                                                {tc.actif ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                                            </button>
                                            <button onClick={() => openEdit(tc)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title={t('contrat.typesContrat.modifier')}>
                                                <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                            </button>
                                            {!tc.estSysteme && (
                                                <button onClick={() => { if (confirm(t('contrat.typesContrat.confirmDelete'))) supprimer.mutate(tc.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title={t('contrat.typesContrat.supprimer')}><Trash2 className="h-4 w-4 text-red-400" /></button>
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
                    <p className="text-gray-600 dark:text-gray-300">{t('contrat.typesContrat.aucun')}</p>
                </div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? t('contrat.typesContrat.modifierType') : t('contrat.typesContrat.nouveauTypeModal')}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>{t('contrat.typesContrat.annuler')}</ElisaButton>
                        <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending}
                            disabled={!form.code || !form.nom}>
                            {editing ? t('contrat.typesContrat.enregistrer') : t('contrat.typesContrat.creer')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label={t('contrat.typesContrat.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('contrat.typesContrat.codePlaceholder')} required disabled={!!editing?.estSysteme} hint={editing?.estSysteme ? t('contrat.typesContrat.codeSystemeHint') : undefined} />
                        <ElisaInput label={t('contrat.typesContrat.nom')} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder={t('contrat.typesContrat.nomPlaceholder')} required />
                    </div>
                    <ElisaInput label={t('contrat.typesContrat.descriptionOptionnelle')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect label={t('contrat.typesContrat.categorie')} options={[
                            { value: 'EMPLOI_PERMANENT', label: t('contrat.typesContrat.catEmploiPermanent') },
                            { value: 'EMPLOI_TEMPORAIRE', label: t('contrat.typesContrat.catEmploiTemporaire') },
                            { value: 'STAGE_FORMATION', label: t('contrat.typesContrat.catStageFormation') },
                            { value: 'FREELANCE', label: t('contrat.typesContrat.catFreelance') },
                            { value: 'TEMPS_PARTIEL', label: t('contrat.typesContrat.catTempsPartiel') },
                            { value: 'APPRENTISSAGE', label: t('contrat.typesContrat.catApprentissage') },
                            { value: 'AUTRE', label: t('contrat.typesContrat.catAutre') },
                        ]} value={form.categorie} onValueChange={(v) => setForm({ ...form, categorie: v })} />
                        <ElisaSelect label={t('contrat.typesContrat.modeRemunerationDefaut')} options={[
                            { value: '', label: '—' },
                            ...(modesRemuneration || []).map((m: any) => ({ value: m.id, label: m.label })),
                        ]} value={form.modeRemunerationId} onValueChange={(v) => setForm({ ...form, modeRemunerationId: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label={t('contrat.typesContrat.ordreAffichage')} type="number" value={String(form.ordre)} onChange={(e) => setForm({ ...form, ordre: Number(e.target.value) })} />
                        <ElisaInput label={t('contrat.typesContrat.dureeMax')} type="number" value={String(form.dureeMaxMois)} onChange={(e) => setForm({ ...form, dureeMaxMois: Number(e.target.value) })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.renouvellementAutoDefaut} onChange={(e) => setForm({ ...form, renouvellementAutoDefaut: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
                        {t('contrat.typesContrat.renouvellementAutoDefaut')}
                    </label>
                </div>
            </CustomModal>
        </div>
    );
}

function BulletinsTab() {
    const { t } = useTranslation('contrat');
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
    membreGenOptions.unshift({ value: '', label: t('contrat.bulletins.selectionnerMembre') });

    const getMembreBulletinLabel = (b: any): string => {
        const p = b.membrePersonnel?.utilisateur?.profil;
        if (p?.prenom && p?.nom) return `${p.prenom} ${p.nom}`;
        const m = b.membrePersonnel?.matricule;
        if (m) return m;
        return b.membrePersonnelId?.slice(0, 8) + '…';
    };

    const moisOptions = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('fr', { month: 'long' }) }));
    const statutOptions = [
        { value: '', label: t('contrat.bulletins.tousStatuts') },
        { value: 'GENERE', label: t('contrat.bulletins.genere') },
        { value: 'EN_ATTENTE_VALIDATION', label: t('contrat.bulletins.enAttenteValidation') },
        { value: 'VALIDE', label: t('contrat.bulletins.valide') },
        { value: 'PAYE', label: t('contrat.bulletins.paye') },
        { value: 'ANNULE', label: t('contrat.bulletins.annule') },
    ];

    const openCreate = () => { setEditing(null); setForm({ membrePersonnelId: '', contratId: '', mois: new Date().getMonth() + 1, annee: new Date().getFullYear(), salaireBase: 0, primes: 0, deductions: 0 }); setShowModal(true); };
    const openEdit = (b: BulletinPaie) => { setEditing(b); setForm({ membrePersonnelId: b.membrePersonnelId, contratId: b.contratId, mois: b.mois, annee: b.annee, salaireBase: b.salaireBase, primes: b.primes, deductions: b.deductions }); setShowModal(true); };

    const categorieLabels: Record<string, string> = {
        SALAIRE_BASE: t('contrat.bulletins.salaireBaseCat'),
        HEURE_COURS: t('contrat.bulletins.heureCours'),
        HEURE_SUP: t('contrat.bulletins.heureSupCat'),
        PRIME: t('contrat.bulletins.primeCat'),
        COTISATION: t('contrat.bulletins.cotisationCat'),
        INDEMNITE: t('contrat.bulletins.indemniteCat'),
        RETENUE: t('contrat.bulletins.retenueCat'),
        AUTRE: t('contrat.bulletins.autreCat'),
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
                <h3 className="text-lg font-semibold">{t('contrat.bulletins.titre')}</h3>
                {rapport && rapport.nombreBulletins > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full max-w-3xl">
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-3">
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t('contrat.bulletins.statBulletins')}</p>
                            <p className="text-xl font-bold text-blue-800 dark:text-blue-300 mt-1">{rapport.nombreBulletins}</p>
                        </div>
                        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 p-3">
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">{t('contrat.bulletins.masseSalariale')}</p>
                            <p className="text-xl font-bold text-green-800 dark:text-green-300 mt-1">{rapport.totalSalairesNets.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 p-3">
                            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{t('contrat.bulletins.salaireMoyen')}</p>
                            <p className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mt-1">{rapport.nombreBulletins > 0 ? Math.round(rapport.totalSalairesNets / rapport.nombreBulletins).toLocaleString('fr-FR') : 0} F</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 p-3">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t('contrat.bulletins.statPrimes')}</p>
                            <p className="text-xl font-bold text-amber-800 dark:text-amber-300 mt-1">+{rapport.totalPrimes.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-3">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">{t('contrat.bulletins.deductions')}</p>
                            <p className="text-xl font-bold text-red-800 dark:text-red-300 mt-1">−{rapport.totalDeductions.toLocaleString('fr-FR')} F</p>
                        </div>
                    </div>
                )}
                <div className="flex gap-2">
                    <ElisaButton variant="outline" size="sm" icon={<Calendar className="h-4 w-4" />} onClick={() => { setGenForm({ membreId: '', mois: new Date().getMonth() + 1, annee: new Date().getFullYear() }); setShowGenerer(true); }}>
                        {t('contrat.bulletins.generation')}
                    </ElisaButton>
                    <ElisaButton variant="outline" size="sm" icon={<Building className="h-4 w-4" />}
                        onClick={() => {
                            const actifs = membres.filter((m: MembrePersonnel) => m.statut === 'ACTIF');
                            if (actifs.length === 0) { toast.error(t('contrat.bulletins.aucunMembreActifToast')); return; }
                            if (confirm(t('contrat.bulletins.confirmGenererMasse', { count: actifs.length })))
                                genererMasse.mutate({ membres: actifs, mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });
                        }}
                        loading={genererMasse.isPending}>
                        {t('contrat.bulletins.confirmGenererMasseLabel')}
                    </ElisaButton>
                    <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                        {t('contrat.bulletins.nouveauBulletinBtn')}
                    </ElisaButton>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <ElisaSelect options={[{ value: '', label: t('contrat.bulletins.tousLesMois') }, ...moisOptions]} value={filters.mois} onValueChange={(v) => setFilters({ ...filters, mois: v })} className="w-36" />
                <ElisaInput type="number" value={filters.annee} onChange={(e) => setFilters({ ...filters, annee: e.target.value })} className="w-24" placeholder={t('contrat.bulletins.anneePlaceholder')} />
                <ElisaSelect options={statutOptions} value={filters.statut} onValueChange={(v) => setFilters({ ...filters, statut: v })} className="w-44" />
                {(filters.mois || filters.annee !== String(new Date().getFullYear()) || filters.statut) && (
                    <button onClick={() => setFilters({ mois: '', annee: String(new Date().getFullYear()), statut: '' })} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t('contrat.bulletins.reinitialiserFiltres')}</button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : bulletins && bulletins.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thPeriode')}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thMembre')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thBase')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thHeuresSup')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thPrimes')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thRetenues')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thNet')}</th>
                                <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thStatut')}</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('contrat.bulletins.thActions')}</th>
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
                                            <button onClick={() => { setDetailBulletin(b); setShowDetail(true); }} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title={t('contrat.bulletins.titleVoirDetail')}><Eye className="h-4 w-4 text-blue-500" /></button>
                                            <button onClick={() => window.open(`/api/personnel/bulletins/${b.id}/pdf`, '_blank')} className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg" title={t('contrat.bulletins.titlePdf')}><FileDown className="h-4 w-4 text-green-600 dark:text-green-400" /></button>
                                            <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                                            <button onClick={() => regenerer.mutate({ id: b.id, membreId: b.membrePersonnelId, mois: b.mois, annee: b.annee })} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg" title={t('contrat.bulletins.titleRegenerer')}><CreditCard className="h-4 w-4 text-amber-500" /></button>
                                            <button onClick={() => { if (confirm(t('contrat.bulletins.confirmSupprimerBulletin'))) supprimer.mutate(b.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
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
                    <p className="text-gray-600 dark:text-gray-300">{t('contrat.bulletins.aucunBulletin')}</p>
                </div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? t('contrat.bulletins.modifierBulletinModal') : t('contrat.bulletins.nouveauBulletinModal')}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>{t('contrat.bulletins.annulerBtn')}</ElisaButton>
                        <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending}
                            disabled={!form.membrePersonnelId || !form.contratId || !form.mois || !form.annee}>
                            {editing ? t('contrat.bulletins.enregistrerBtn') : t('contrat.bulletins.creerBtn')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <ElisaInput label={t('contrat.bulletins.labelIdMembre')} value={form.membrePersonnelId} onChange={(e) => setForm({ ...form, membrePersonnelId: e.target.value })} required />
                    <ElisaInput label={t('contrat.bulletins.labelIdContrat')} value={form.contratId} onChange={(e) => setForm({ ...form, contratId: e.target.value })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect label={t('contrat.bulletins.labelMois')} options={moisOptions} value={String(form.mois)} onValueChange={(v) => setForm({ ...form, mois: Number(v) })} required />
                        <ElisaInput label={t('contrat.bulletins.labelAnnee')} type="number" value={String(form.annee)} onChange={(e) => setForm({ ...form, annee: Number(e.target.value) })} required />
                    </div>
                    <ElisaInput label={t('contrat.bulletins.labelSalaireBaseForm')} type="number" value={String(form.salaireBase)} onChange={(e) => setForm({ ...form, salaireBase: Number(e.target.value) })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label={t('contrat.bulletins.labelPrimesForm')} type="number" value={String(form.primes)} onChange={(e) => setForm({ ...form, primes: Number(e.target.value) })} />
                        <ElisaInput label={t('contrat.bulletins.labelRetenuesForm')} type="number" value={String(form.deductions)} onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })} />
                    </div>
                </div>
            </CustomModal>

            <CustomModal open={showGenerer} onOpenChange={setShowGenerer}
                title={t('contrat.bulletins.generationAutoTitle')}
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
                            {t('contrat.bulletins.simulerBtn')}
                        </ElisaButton>
                        <ElisaButton variant="secondary" onClick={() => setShowGenerer(false)}>{t('contrat.bulletins.annulerBtn')}</ElisaButton>
                        <ElisaButton variant="primary" onClick={() => { generer.mutate(genForm); setShowGenerer(false); }}
                            loading={generer.isPending} disabled={!genForm.membreId || !genForm.mois || !genForm.annee}>
                            {t('contrat.bulletins.genererBtn')}
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    <ElisaSelect label={t('contrat.bulletins.labelMembre')} options={membreGenOptions} value={genForm.membreId} onValueChange={(v) => setGenForm({ ...genForm, membreId: v })} required />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaSelect label={t('contrat.bulletins.labelMois')} options={moisOptions} value={String(genForm.mois)} onValueChange={(v) => setGenForm({ ...genForm, mois: Number(v) })} required />
                        <ElisaInput label={t('contrat.bulletins.labelAnnee')} type="number" value={String(genForm.annee)} onChange={(e) => setGenForm({ ...genForm, annee: Number(e.target.value) })} required />
                    </div>
                </div>
            </CustomModal>

            <CustomModal open={showSimulation} onOpenChange={setShowSimulation}
                title={t('contrat.bulletins.simulation')} size="md"
                footer={<ElisaButton variant="secondary" onClick={() => setShowSimulation(false)}>{t('contrat.bulletins.fermerBtn')}</ElisaButton>}
            >
                {simulationData && (
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg"><span className="text-blue-600 dark:text-blue-400 text-xs">{t('contrat.bulletins.simSalaireBase')}</span><p className="font-semibold">{Number(simulationData.salaireBase).toLocaleString('fr-FR')} F</p></div>
                            <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-lg"><span className="text-amber-600 dark:text-amber-400 text-xs">{t('contrat.bulletins.simHeuresSup')}</span><p className="font-semibold">{simulationData.heuresSup > 0 ? `${Number(simulationData.montantHeuresSup).toLocaleString('fr-FR')} F (${simulationData.heuresSup}h)` : '—'}</p></div>
                            <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg"><span className="text-green-600 dark:text-green-400 text-xs">{t('contrat.bulletins.simPrimes')}</span><p className="font-semibold">{Number(simulationData.primes).toLocaleString('fr-FR')} F</p></div>
                            <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg"><span className="text-red-600 dark:text-red-400 text-xs">{t('contrat.bulletins.simRetenues')}</span><p className="font-semibold">−{Number(simulationData.totalRetenues).toLocaleString('fr-FR')} F</p></div>
                        </div>
                        {simulationData.detailParMatiere?.length > 0 && (
                            <>
                                <h4 className="font-medium text-gray-700 dark:text-gray-300">{t('contrat.bulletins.simDetailParMatiere')}</h4>
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
                            <span>{t('contrat.bulletins.simNetAPayer')}</span>
                            <span>{Number(simulationData.salaireNet).toLocaleString('fr-FR')} F</span>
                        </div>
                    </div>
                )}
            </CustomModal>

            <CustomModal open={showDetail} onOpenChange={setShowDetail}
                title={t('contrat.bulletins.detailBulletinTitle')} size="lg"
                footer={<ElisaButton variant="secondary" onClick={() => setShowDetail(false)}>{t('contrat.bulletins.fermerBtn')}</ElisaButton>}
            >
                {detailBulletin && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-gray-500 dark:text-gray-400">{t('contrat.bulletins.detailPeriode')}</span><p className="font-medium">{detailBulletin.mois}/{detailBulletin.annee}</p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">{t('contrat.bulletins.detailStatut')}</span><p className="font-medium"><Badge variant={statutVariant[detailBulletin.statut] || 'secondary'}>{detailBulletin.statut}</Badge></p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">{t('contrat.bulletins.detailMembre')}</span><p className="font-medium">{getMembreBulletinLabel(detailBulletin)}</p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">{t('contrat.bulletins.detailIdContrat')}</span><p className="font-mono text-xs truncate max-w-[180px]" title={detailBulletin.contratId}>{detailBulletin.contratId}</p></div>
                            {detailBulletin.datePaiement && <div><span className="text-gray-500 dark:text-gray-400">{t('contrat.bulletins.detailDatePaiement')}</span><p className="font-medium">{new Date(detailBulletin.datePaiement).toLocaleDateString('fr-FR')}</p></div>}
                        </div>

                        <hr className="border-gray-200 dark:border-gray-700" />

                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            {t('contrat.bulletins.detailElementsPaie')} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({elements.length} {t('contrat.bulletins.detailLignes')})</span>
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
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">{t('contrat.bulletins.detailAucunElement')}</p>
                        )}

                        <hr className="border-gray-200 dark:border-gray-700" />

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-500 dark:text-gray-400">{t('contrat.bulletins.detailTotalHeures')}</span><p className="font-medium">{detailBulletin.heuresEffectuees || 0}h</p></div>
                            <div><span className="text-gray-500 dark:text-gray-400">{t('contrat.bulletins.detailDontHeuresSup')}</span><p className="font-medium text-amber-600 dark:text-amber-400">{detailBulletin.montantHeuresSup > 0 ? `${Number(detailBulletin.montantHeuresSup).toLocaleString('fr-FR')} F` : '—'}</p></div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{t('contrat.bulletins.detailNetAPayer')}</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{Number(detailBulletin.salaireNet).toLocaleString('fr-FR')} F</span>
                        </div>

                        {detailBulletin.statut !== 'PAYE' && (
                            <>
                                <hr className="border-gray-200 dark:border-gray-700" />
                                <div className="flex items-center gap-3">
                                    <ElisaInput type="date" value={paiementDate} onChange={(e) => setPaiementDate(e.target.value)} className="flex-1" placeholder={t('contrat.bulletins.detailDatePaiementPlaceholder')} />
                                    <ElisaButton variant="primary" size="sm"
                                        onClick={() => {
                                            modifier.mutate({ id: detailBulletin.id, statut: 'PAYE', datePaiement: paiementDate || new Date().toISOString().split('T')[0] });
                                            setShowDetail(false);
                                        }}
                                        loading={modifier.isPending}
                                        disabled={!paiementDate}>
                                        {t('contrat.bulletins.detailMarquerPaye')}
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
    const { t } = useTranslation('contrat');
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
                <h3 className="text-lg font-semibold">{t('cotisations.titre')}</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{t('cotisations.ajouter')}</ElisaButton>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : cotisations && cotisations.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cotisations.code')}</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cotisations.nom')}</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cotisations.type')}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cotisations.tauxPatronal')}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cotisations.tauxSalarial')}</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cotisations.actif')}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('cotisations.actions')}</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {cotisations.map((c: Cotisation) => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-mono font-medium">{c.code}</td>
                                    <td className="py-3 px-4">{c.nom}</td>
                                    <td className="py-3 px-4 text-center"><Badge variant="default">{c.type}</Badge></td>
                                    <td className="py-3 px-4 text-right">{c.tauxPatronal}%</td>
                                    <td className="py-3 px-4 text-right">{c.tauxSalarial}%</td>
                                    <td className="py-3 px-4 text-center">{c.actif ? <Badge variant="success">{t('cotisations.actif')}</Badge> : <Badge variant="secondary">{t('cotisations.inactif')}</Badge>}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                                            <button onClick={() => { if (confirm(t('cotisations.confirmDelete'))) supprimer.mutate(c.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"><Percent className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" /><p className="text-gray-600 dark:text-gray-300">{t('cotisations.aucune')}</p></div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? t('cotisations.modifier') : t('cotisations.nouveau')} size="sm"
                footer={<div className="flex justify-end gap-3">
                    <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>{t('cotisations.annuler')}</ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending} disabled={!form.code || !form.nom}>{editing ? t('cotisations.enregistrer') : t('cotisations.creer')}</ElisaButton>
                </div>}
            >
                <div className="space-y-4">
                    <ElisaInput label={t('cotisations.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('cotisations.codePlaceholder')} required />
                    <ElisaInput label={t('cotisations.nom')} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                    <ElisaSelect label={t('cotisations.type')} options={[{ value: 'PATRONALE', label: t('cotisations.typePatronale') }, { value: 'SALARIALE', label: t('cotisations.typeSalariale') }, { value: 'MIXTE', label: t('cotisations.typeMixte') }]} value={form.type} onValueChange={(v) => setForm({ ...form, type: v })} />
                    <div className="grid grid-cols-2 gap-4">
                        <ElisaInput label={t('cotisations.tauxPatronalLabel')} type="number" value={String(form.tauxPatronal)} onChange={(e) => setForm({ ...form, tauxPatronal: Number(e.target.value) })} />
                        <ElisaInput label={t('cotisations.tauxSalarialLabel')} type="number" value={String(form.tauxSalarial)} onChange={(e) => setForm({ ...form, tauxSalarial: Number(e.target.value) })} />
                    </div>
                </div>
            </CustomModal>
        </div>
    );
}

function PrimesTab() {
    const { t } = useTranslation('contrat');
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
                <h3 className="text-lg font-semibold">{t('primes.titre')}</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{t('primes.ajouter')}</ElisaButton>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : primes && primes.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('primes.code')}</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('primes.nom')}</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('primes.calcul')}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('primes.valeur')}</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('primes.actif')}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('primes.actions')}</th>
                        </tr></thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {primes.map((p: TypePrime) => (
                                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="py-3 px-4 font-mono font-medium">{p.code}</td>
                                    <td className="py-3 px-4">{p.nom}</td>
                                    <td className="py-3 px-4 text-center"><Badge variant="default">{p.typeCalcul}</Badge></td>
                                    <td className="py-3 px-4 text-right font-medium">{p.valeur?.toLocaleString('fr-FR')}{p.typeCalcul === 'POURCENTAGE' ? '%' : ' F'}</td>
                                    <td className="py-3 px-4 text-center">{p.actif ? <Badge variant="success">{t('primes.oui')}</Badge> : <Badge variant="secondary">{t('primes.non')}</Badge>}</td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                                            <button onClick={() => { if (confirm(t('primes.confirmDelete'))) supprimer.mutate(p.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"><Gift className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" /><p className="text-gray-600 dark:text-gray-300">{t('primes.aucun')}</p></div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? t('primes.modifier') : t('primes.nouveau')} size="sm"
                footer={<div className="flex justify-end gap-3">
                    <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>{t('primes.annuler')}</ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending} disabled={!form.code || !form.nom}>{editing ? t('primes.enregistrer') : t('primes.creer')}</ElisaButton>
                </div>}
            >
                <div className="space-y-4">
                    <ElisaInput label={t('primes.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('primes.codePlaceholder')} required />
                    <ElisaInput label={t('primes.nom')} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                    <ElisaSelect label={t('primes.typeCalcul')} options={[{ value: 'FIXE', label: t('primes.typeFixe') }, { value: 'POURCENTAGE', label: t('primes.typePourcentage') }, { value: 'VARIABLE', label: t('primes.typeVariable') }]} value={form.typeCalcul} onValueChange={(v) => setForm({ ...form, typeCalcul: v })} />
                    <ElisaInput label={t('primes.valeur')} type="number" value={String(form.valeur)} onChange={(e) => setForm({ ...form, valeur: Number(e.target.value) })} />
                </div>
            </CustomModal>
        </div>
    );
}

function RetenuesTab() {
    const { t } = useTranslation('contrat');
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
                <h3 className="text-lg font-semibold">{t('retenues.titre')}</h3>
                <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>{t('retenues.ajouter')}</ElisaButton>
            </div>
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : retenues && retenues.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('retenues.code')}</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('retenues.nom')}</th>
                            <th className="text-center py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('retenues.frequence')}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('retenues.montantMax')}</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{t('retenues.actions')}</th>
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
                                            <button onClick={() => { if (confirm(t('retenues.confirmDelete'))) supprimer.mutate(r.id); }} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="h-4 w-4 text-red-400" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"><Ban className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" /><p className="text-gray-600 dark:text-gray-300">{t('retenues.aucun')}</p></div>
            )}

            <CustomModal open={showModal} onOpenChange={setShowModal}
                title={editing ? t('retenues.modifier') : t('retenues.nouveau')} size="sm"
                footer={<div className="flex justify-end gap-3">
                    <ElisaButton variant="secondary" onClick={() => setShowModal(false)}>{t('retenues.annuler')}</ElisaButton>
                    <ElisaButton variant="primary" onClick={handleSubmit} loading={creer.isPending || modifier.isPending} disabled={!form.code || !form.nom}>{editing ? t('retenues.enregistrer') : t('retenues.creer')}</ElisaButton>
                </div>}
            >
                <div className="space-y-4">
                    <ElisaInput label={t('retenues.code')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t('retenues.codePlaceholder')} required />
                    <ElisaInput label={t('retenues.nom')} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
                    <ElisaSelect label={t('retenues.frequence')} options={[{ value: 'PONCTUELLE', label: t('retenues.frequencePonctuelle') }, { value: 'RECURRENTE', label: t('retenues.frequenceRecurrente') }]} value={form.frequence} onValueChange={(v) => setForm({ ...form, frequence: v })} />
                    <ElisaInput label={t('retenues.montantMaxLabel')} type="number" value={String(form.montantMax)} onChange={(e) => setForm({ ...form, montantMax: Number(e.target.value) })} />
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
