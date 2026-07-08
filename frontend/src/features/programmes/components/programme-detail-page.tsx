import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Trash2, BookOpen, Clock, Layers,
    Target, FileText, BarChart3, Plus, X, Check,
    AlertTriangle, ChevronDown, ChevronRight, ListChecks,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import { useTousCycles } from '@/features/cycles/hooks/use-tous-cycles';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { useTousMatieresNiveaux } from '@/features/matieres/hooks/use-matieres';
import {
    useProgrammeDetail,
    useModifierProgramme,
    useSupprimerProgramme,
    useAjouterMatiereProgramme,
    useRetirerMatiereProgramme,
    useChapitresProgramme,
    useCreerChapitre,
    useModifierChapitre,
    useSupprimerChapitre,
} from '../hooks/use-programmes';
import { ProgrammeFormModal } from './programme-form-modal';
import { ChapitreFormModal } from './chapitre-form-modal';
import type { AddMatiereDto, ProgrammeChapitre } from '../types/programme.types';

export function ProgrammeDetailPage() {
    const { id: programmeId } = useParams({ from: '/_auth/programmes/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tabActif, setTabActif] = useState('informations');
    const [showAddMatiere, setShowAddMatiere] = useState(false);
    const [newMatiereNiveauId, setNewMatiereNiveauId] = useState('');
    const [newCoefficient, setNewCoefficient] = useState<number>(1);
    const [newVolumeHoraire, setNewVolumeHoraire] = useState<number>(0);

    const [showChapitreModal, setShowChapitreModal] = useState(false);
    const [chapitreEdit, setChapitreEdit] = useState<ProgrammeChapitre | null>(null);
    const [chapitreDeleteId, setChapitreDeleteId] = useState<string | null>(null);
    const [chapitreProgrammeMatiereId, setChapitreProgrammeMatiereId] = useState<string>('');

    const { data: programme, isLoading } = useProgrammeDetail(programmeId);
    const { data: cycles } = useTousCycles();
    const { data: niveaux } = useTousNiveaux();
    const { data: tousMatieresNiveaux } = useTousMatieresNiveaux();
    const modifier = useModifierProgramme();
    const supprimer = useSupprimerProgramme();
    const ajouterMatiere = useAjouterMatiereProgramme();
    const retirerMatiere = useRetirerMatiereProgramme();
    const { data: chapitres, refetch: refetchChapitres } = useChapitresProgramme(programmeId);
    const creerChapitre = useCreerChapitre();
    const modifierChapitre = useModifierChapitre();
    const supprimerChapitre = useSupprimerChapitre();

    const handleDelete = async () => {
        try {
            await supprimer.mutateAsync(programmeId);
            navigate({ to: '/programmes' });
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const handleAddMatiere = async () => {
        if (!newMatiereNiveauId) return;
        try {
            await ajouterMatiere.mutateAsync({
                programmeId,
                dto: {
                    matiereNiveauId: newMatiereNiveauId,
                    coefficient: newCoefficient || undefined,
                    volumeHoraire: newVolumeHoraire || undefined,
                } as AddMatiereDto,
            });
            setShowAddMatiere(false);
            setNewMatiereNiveauId('');
            setNewCoefficient(1);
            setNewVolumeHoraire(0);
        } catch (error) {
            console.error('Erreur ajout matière:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-dominante)]" />
            </div>
        );
    }

    if (!programme) {
        return (
            <div className="text-center py-16">
                <AlertTriangle className="h-12 w-12 mx-auto text-orange-400 mb-4" />
                <h2 className="text-xl font-semibold">Programme non trouvé</h2>
                <ElisaButton variant="outline" className="mt-4" onClick={() => navigate({ to: '/programmes' })}>
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    const chapitresCount = chapitres?.length || 0;

    const tabs = [
        { id: 'informations', label: 'Informations', icon: FileText },
        { id: 'matieres', label: 'Matières', icon: BookOpen, count: programme.matieres?.length || 0 },
        { id: 'chapitres', label: 'Chapitres', icon: ListChecks, count: chapitresCount },
        { id: 'objectifs', label: 'Objectifs', icon: Target },
        { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    ];

    const cycleNom = programme.cycle?.nom || cycles?.find((c: any) => c.id === programme.cycleId)?.nom || '-';
    const niveauNom = programme.niveau?.nom || niveaux?.find((n: any) => n.id === programme.niveauId)?.nom || '-';

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate({ to: '/programmes' })} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-[var(--color-texte)]">{programme.nom}</h1>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    programme.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {programme.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--color-texte-secondaire)] mt-1">
                                Code: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{programme.code}</code>
                                {cycleNom !== '-' && <span className="ml-3">Cycle: {cycleNom}</span>}
                                {niveauNom !== '-' && <span className="ml-3">Niveau: {niveauNom}</span>}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('programmes:config:write') && (
                            <>
                                <ElisaButton variant="outline" size="sm" onClick={() => setShowEditModal(true)} leftIcon={<Edit className="h-4 w-4" />}>
                                    Modifier
                                </ElisaButton>
                                <ElisaButton variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)} leftIcon={<Trash2 className="h-4 w-4" />}>
                                    Supprimer
                                </ElisaButton>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Matières', value: programme.matieres?.length || 0, icon: BookOpen, color: 'var(--color-dominante)' },
                    { label: 'Volume horaire', value: `${programme.nbHeuresCalculees || programme.nbHeuresHebdo}h`, icon: Clock, color: 'blue' },
                    { label: 'Type', value: programme.type === 'CYCLE' ? 'Par cycle' : programme.type === 'NIVEAU' ? 'Par niveau' : 'Personnalisé', icon: Layers, color: 'purple' },
                    { label: 'Coefficient moyen', value: programme.matieres?.length ? (programme.matieres.reduce((s, m) => s + (m.coefficient || 1), 0) / programme.matieres.length).toFixed(1) : '-', icon: BarChart3, color: 'orange' },
                ].map((stat, idx) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 * idx }}
                        className="bg-white rounded-lg p-4 border border-gray-200"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                            </div>
                            <stat.icon className="h-8 w-8 opacity-20" style={{ color: stat.color }} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="border-b border-gray-200">
                <nav className="flex gap-6">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setTabActif(tab.id)}
                            className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                tabActif === tab.id ? 'border-[var(--color-dominante)] text-[var(--color-dominante)]' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gray-100">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {tabActif === 'informations' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                        <h3 className="font-semibold text-lg">Détails du programme</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ['Nom', programme.nom],
                                ['Code', programme.code],
                                ['Type', programme.type === 'CYCLE' ? 'Cycle' : programme.type === 'NIVEAU' ? 'Niveau' : 'Personnalisé'],
                                ['Cycle', cycleNom],
                                ['Niveau', niveauNom],
                                ['Volume horaire', `${programme.nbHeuresHebdo}h/sem`],
                                ['Actif', programme.actif ? 'Oui' : 'Non'],
                                ['Créé le', new Date(programme.createdAt).toLocaleDateString('fr-FR')],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className="text-sm font-medium mt-0.5">{value || '-'}</p>
                                </div>
                            ))}
                        </div>
                        {programme.description && (
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Description</p>
                                <p className="text-sm text-gray-700">{programme.description}</p>
                            </div>
                        )}
                    </div>
                    {programme.objectifsGeneraux && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                            <h3 className="font-semibold text-lg">Objectifs généraux</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{programme.objectifsGeneraux}</p>
                            {programme.competencesVisees && programme.competencesVisees.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Compétences visées</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {programme.competencesVisees.map((c, i) => (
                                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {tabActif === 'matieres' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg">Matières du programme</h3>
                        {hasPermission('programmes:config:write') && (
                            <ElisaButton variant="primary" size="sm" onClick={() => setShowAddMatiere(!showAddMatiere)} leftIcon={<Plus className="h-4 w-4" />}>
                                Ajouter une matière
                            </ElisaButton>
                        )}
                    </div>

                    {showAddMatiere && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
                            {(() => {
                                const filtered = programme.niveauId
                                    ? (tousMatieresNiveaux ?? []).filter(mn => mn.niveauId === programme.niveauId)
                                    : (tousMatieresNiveaux ?? []);
                                return (
                                <>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {programme.niveauId && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                            Filtré par niveau : {niveauNom}
                                        </span>
                                    )}
                                    <span>{filtered.length} matière{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}</span>
                                </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Matière - Niveau</label>
                                    <select value={newMatiereNiveauId} onChange={(e) => setNewMatiereNiveauId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    >
                                        <option value="">Sélectionner...</option>
                                        {filtered.map((mn) => (
                                            <option key={mn.id} value={mn.id}>
                                                {mn.matiere?.nom} — {mn.niveau?.nom}{mn.groupe ? ` (${mn.groupe.nom})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Coefficient</label>
                                    <input type="number" min={0} step={0.5} value={newCoefficient} onChange={(e) => setNewCoefficient(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Vol. horaire</label>
                                    <input type="number" min={0} value={newVolumeHoraire} onChange={(e) => setNewVolumeHoraire(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <ElisaButton variant="outline" size="sm" onClick={() => setShowAddMatiere(false)}>
                                    <X className="h-4 w-4 mr-1" /> Annuler
                                </ElisaButton>
                                <ElisaButton variant="primary" size="sm" onClick={handleAddMatiere} isLoading={ajouterMatiere.isPending} leftIcon={<Plus className="h-4 w-4" />}>
                                    Ajouter
                                </ElisaButton>
                            </div>
                            </>
                            );
                            })()}
                        </div>
                    )}

                    {(!programme.matieres || programme.matieres.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Aucune matière associée à ce programme</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Matière</th>
                                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Niveau</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Coeff</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vol. horaire</th>
                                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Oblig.</th>
                                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {programme.matieres.map((pm) => (
                                        <tr key={pm.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pm.matiereNiveau?.matiere?.couleur || '#6B7280' }} />
                                                    <span className="font-medium text-sm">{pm.matiereNiveau?.matiere?.nom || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{pm.matiereNiveau?.niveau?.nom || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-center font-mono">{pm.coefficient || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-center font-mono">{pm.volumeHoraire || '-'}h</td>
                                            <td className="px-4 py-3 text-center">
                                                {pm.obligatoire ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {hasPermission('programmes:config:write') && (
                                                    <button onClick={() => retirerMatiere.mutateAsync({ programmeId, pmId: pm.id })}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                        title="Retirer du programme"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {tabActif === 'chapitres' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    {(!chapitres || chapitres.length === 0) ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <ListChecks className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">Aucun chapitre pour ce programme</p>
                            <p className="text-sm text-gray-400 mt-1">Ajoutez des matières puis créez des chapitres dans chaque matière.</p>
                        </div>
                    ) : (
                        (() => {
                            const grouped: Record<string, { programmeMatiereId: string; chapitres: typeof chapitres }> = {};
                            for (const ch of chapitres) {
                                const matiereNom = ch.programmeMatiere?.matiereNiveau?.matiere?.nom || ch.programmeMatiereId;
                                if (!grouped[matiereNom]) grouped[matiereNom] = { programmeMatiereId: ch.programmeMatiereId, chapitres: [] };
                                grouped[matiereNom].chapitres.push(ch);
                            }
                            return Object.entries(grouped).map(([matiereNom, g]) => (
                                <div key={matiereNom} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                        <h3 className="font-semibold text-sm flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.chapitres[0]?.programmeMatiere?.matiereNiveau?.matiere?.couleur || '#6B7280' }} />
                                            {matiereNom}
                                            <span className="text-xs text-gray-400 font-normal">— {g.chapitres.length} chapitre{g.chapitres.length > 1 ? 's' : ''}</span>
                                        </h3>
                                        {hasPermission('programmes:config:write') && (
                                            <button onClick={() => { setChapitreProgrammeMatiereId(g.programmeMatiereId); setChapitreEdit(null); setShowChapitreModal(true); }}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <Plus className="h-3 w-3" /> Ajouter
                                            </button>
                                        )}
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Ordre</th>
                                                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Titre</th>
                                                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Durée</th>
                                                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Progression</th>
                                                <th className="text-center px-4 py-2 text-xs font-medium text-gray-500">Statut</th>
                                                {hasPermission('programmes:config:write') && (
                                                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Actions</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {g.chapitres.sort((a, b) => a.ordre - b.ordre).map((ch) => (
                                                <tr key={ch.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{ch.ordre}</td>
                                                    <td className="px-4 py-2.5">
                                                        <p className="font-medium text-gray-800">{ch.titre}</p>
                                                        {ch.description && (
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ch.description}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center text-gray-600">
                                                        {ch.dureePrevueHeures ? `${ch.dureePrevueHeures}h` : '-'}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                                                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${ch.progressionPourcentage}%` }} />
                                                            </div>
                                                            <span className="text-xs text-gray-500">{ch.progressionPourcentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            ch.statut === 'ACTIF' ? 'bg-green-100 text-green-700' :
                                                            ch.statut === 'EN_ATTENTE_VALIDATION' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {ch.statut === 'ACTIF' ? 'Actif' : ch.statut === 'EN_ATTENTE_VALIDATION' ? 'En attente' : 'Inactif'}
                                                        </span>
                                                    </td>
                                                    {hasPermission('programmes:config:write') && (
                                                        <td className="px-4 py-2.5 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button onClick={() => { setChapitreEdit(ch); setShowChapitreModal(true); }}
                                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Modifier"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button onClick={() => setChapitreDeleteId(ch.id)}
                                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ));
                        })()
                    )}
                </motion.div>
            )}

            {tabActif === 'objectifs' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="font-semibold text-lg mb-4">Objectifs pédagogiques</h3>
                        {programme.objectifsGeneraux ? (
                            <p className="text-gray-700 whitespace-pre-wrap">{programme.objectifsGeneraux}</p>
                        ) : (
                            <p className="text-gray-400 italic">Aucun objectif défini</p>
                        )}
                    </div>
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <h3 className="font-semibold text-lg mb-4">Compétences visées</h3>
                        {programme.competencesVisees && programme.competencesVisees.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {programme.competencesVisees.map((c, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">{c}</span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic">Aucune compétence définie</p>
                        )}
                    </div>
                    {programme.description && (
                        <div className="bg-white rounded-lg p-6 border border-gray-200">
                            <h3 className="font-semibold text-lg mb-4">Description</h3>
                            <p className="text-gray-700">{programme.description}</p>
                        </div>
                    )}
                </motion.div>
            )}

            {tabActif === 'stats' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-[var(--color-dominante)]">{programme.matieres?.length || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">Matières</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-blue-600">{programme.nbHeuresCalculees || programme.nbHeuresHebdo}h</p>
                            <p className="text-sm text-gray-500 mt-1">Volume horaire total</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                            <p className="text-3xl font-bold text-orange-600">
                                {programme.matieres?.length
                                    ? (programme.matieres.reduce((s, m) => s + (m.coefficient || 1), 0) / programme.matieres.length).toFixed(1)
                                    : '-'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Coefficient moyen</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <ProgrammeFormModal
                open={showEditModal}
                programme={programme}
                onClose={() => setShowEditModal(false)}
                onSubmit={async (dto) => {
                    await modifier.mutateAsync({ id: programmeId, ...dto });
                    setShowEditModal(false);
                }}
            />

            <ChapitreFormModal
                open={showChapitreModal}
                chapitre={chapitreEdit}
                onClose={() => { setShowChapitreModal(false); setChapitreEdit(null); }}
                isLoading={creerChapitre.isPending || modifierChapitre.isPending}
                onSubmit={async (dto) => {
                    if (chapitreEdit) {
                        await modifierChapitre.mutateAsync({ id: chapitreEdit.id, ...dto });
                    } else {
                        await creerChapitre.mutateAsync({ programmeMatiereId: chapitreProgrammeMatiereId, ...dto });
                    }
                    setShowChapitreModal(false);
                    setChapitreEdit(null);
                    refetchChapitres();
                }}
            />

            <ConfirmDialog
                open={!!chapitreDeleteId}
                onOpenChange={(v) => { if (!v) setChapitreDeleteId(null); }}
                onConfirm={async () => {
                    if (chapitreDeleteId) {
                        await supprimerChapitre.mutateAsync(chapitreDeleteId);
                        setChapitreDeleteId(null);
                        refetchChapitres();
                    }
                }}
                title="Supprimer le chapitre"
                description="Êtes-vous sûr de vouloir supprimer ce chapitre ? Cette action est irréversible."
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimerChapitre.isPending}
            />

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={(v) => { if (!v) setShowDeleteConfirm(false); }}
                onConfirm={handleDelete}
                title="Supprimer le programme"
                description={`Êtes-vous sûr de vouloir supprimer "${programme.nom}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
