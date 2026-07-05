import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase,
    Edit, Trash2, FileText, Award, Clock, Building2,
    UserCheck, AlertCircle, GraduationCap, BookOpen, Users,
    Star, Hourglass, Ban, CheckCircle, XCircle,
} from 'lucide-react';
import { useEnseignant, useEnseignantAffectations, useEnseignantEvaluations, useEnseignantMoyenneEvaluations, useEnseignantHeures, useEnseignantAbsences } from '../hooks/use-enseignants';
import { useSupprimerPersonnel } from '@/features/personnel/hooks/use-personnel';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { LoadingState } from '@/components/feedback';
import type { AffectationEnseignant, EvaluationEnseignant, HeureCours, AbsenceEnseignant } from '../types/enseignant.types';

type OngletActif = 'informations' | 'matieres-classes' | 'evaluations' | 'volume-horaire' | 'absences';

const LABELS_TYPE_CONTRAT: Record<string, string> = {
    cdi: 'CDI', cdd: 'CDD', vacataire: 'Vacataire', stage: 'Stage',
};

const LABELS_STATUT: Record<string, string> = {
    ACTIF: 'Actif', INACTIF: 'Inactif', CONGE: 'En congé',
    actif: 'Actif', inactif: 'Inactif', en_conge: 'En congé', demission: 'Démission',
};

const COULEURS_STATUT: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-800 border-green-200',
    INACTIF: 'bg-gray-100 text-gray-800 border-gray-200',
    CONGE: 'bg-blue-100 text-blue-800 border-blue-200',
    actif: 'bg-green-100 text-green-800 border-green-200',
    inactif: 'bg-gray-100 text-gray-800 border-gray-200',
    en_conge: 'bg-blue-100 text-blue-800 border-blue-200',
    demission: 'bg-red-100 text-red-800 border-red-200',
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateCourt(d: string) {
    return new Date(d).toLocaleDateString('fr-FR');
}

export function EnseignantDetailPage() {
    const { id } = useParams({ from: '/_auth/enseignants/$id' });
    const navigate = useNavigate();
    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');

    const { data: enseignantData, isLoading } = useEnseignant(id);
    const enseignant = enseignantData?.data;
    const supprimer = useSupprimerPersonnel();

    const affectationsQuery = useEnseignantAffectations(id);
    const evaluationsQuery = useEnseignantEvaluations(id);
    const moyenneQuery = useEnseignantMoyenneEvaluations(id);
    const heuresQuery = useEnseignantHeures(id);
    const absencesQuery = useEnseignantAbsences(id);

    const anciennete = enseignant ? Math.floor(
        (Date.now() - new Date(enseignant.dateEmbauche ?? enseignant.dateEntree ?? '').getTime()) / (1000 * 60 * 60 * 24 * 365)
    ) : 0;

    const onglets = [
        { id: 'informations' as const, label: 'Informations', icon: FileText },
        { id: 'matieres-classes' as const, label: 'Matières & Classes', icon: BookOpen, count: affectationsQuery.data?.length },
        { id: 'evaluations' as const, label: 'Évaluations', icon: Star, count: evaluationsQuery.data?.length },
        { id: 'volume-horaire' as const, label: 'Volume horaire', icon: Hourglass },
        { id: 'absences' as const, label: 'Absences', icon: Ban, count: absencesQuery.data?.length },
    ];

    if (isLoading) {
        return (
            <div className="p-6">
                <LoadingState message="Chargement de l'enseignant..." />
            </div>
        );
    }

    if (!enseignant) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg text-gray-600">Enseignant non trouvé</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/enseignants' })} className="mt-4">
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <Breadcrumbs currentLabel={`${enseignant.utilisateur?.profil?.prenom ?? enseignant.prenom ?? ''} ${enseignant.utilisateur?.profil?.nom ?? enseignant.nom ?? ''}`} />

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 p-6"
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                            {(enseignant.utilisateur?.profil?.prenom ?? enseignant.prenom ?? '')?.charAt(0)}{(enseignant.utilisateur?.profil?.nom ?? enseignant.nom ?? '')?.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{enseignant.utilisateur?.profil?.prenom ?? enseignant.prenom ?? ''} {enseignant.utilisateur?.profil?.nom ?? enseignant.nom ?? ''}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${COULEURS_STATUT[enseignant.statut]}`}>
                                    {LABELS_STATUT[enseignant.statut]}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                                    <GraduationCap className="h-3 w-3" /> Enseignant
                                </span>
                            </div>
                            <p className="text-lg text-gray-600 mb-3">{enseignant.specialites?.[0] ?? enseignant.specialite ?? enseignant.posteExact ?? enseignant.poste ?? 'Enseignant'}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    <span>{LABELS_TYPE_CONTRAT[enseignant.typeContrat ?? 'cdi']}</span>
                                </div>
                                {(enseignant.service ?? enseignant.departement ?? '') && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        <span>{enseignant.service ?? enseignant.departement ?? ''}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Ancienneté: {anciennete} an{anciennete > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                        <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => navigate({ to: '/enseignants' })}>
                            Modifier
                        </ElisaButton>
                        <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} isLoading={supprimer.isPending}
                            onClick={() => {
                                if (confirm(`Supprimer ${enseignant.utilisateur?.profil?.prenom ?? enseignant.prenom ?? ''} ${enseignant.utilisateur?.profil?.nom ?? enseignant.nom ?? ''} ?`)) {
                                    supprimer.mutateAsync(id).then(() => navigate({ to: '/enseignants' }));
                                }
                            }}
                        >
                            Supprimer
                        </ElisaButton>
                        <ElisaButton variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate({ to: '/enseignants' })}>
                            Retour
                        </ElisaButton>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} label="Matières" value={affectationsQuery.data?.length ?? '-'} color="blue" delay={0.1} />
                <StatCard icon={Star} label="Moyenne éval." value={moyenneQuery.data?.moyenne != null ? `${moyenneQuery.data.moyenne.toFixed(1)}/5` : '-'} color="purple" delay={0.2} />
                <StatCard icon={Hourglass} label="Heures" value={heuresQuery.data?.length ?? '-'} color="green" delay={0.3} />
                <StatCard icon={Ban} label="Absences" value={absencesQuery.data?.length ?? '0'} color="orange" delay={0.4} />
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    {onglets.map((o) => {
                        const Icon = o.icon;
                        return (
                            <button key={o.id} onClick={() => setOngletActif(o.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    ongletActif === o.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {o.label}
                                {o.count !== undefined && (
                                    <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                        {o.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <motion.div key={ongletActif} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                {ongletActif === 'informations' && <InformationsTab enseignant={enseignant} />}
                {ongletActif === 'matieres-classes' && (
                    <AffectationsTab data={affectationsQuery.data} isLoading={affectationsQuery.isLoading} />
                )}
                {ongletActif === 'evaluations' && (
                    <EvaluationsTab data={evaluationsQuery.data} moyenne={moyenneQuery.data} isLoading={evaluationsQuery.isLoading} />
                )}
                {ongletActif === 'volume-horaire' && (
                    <HeuresTab data={heuresQuery.data} isLoading={heuresQuery.isLoading} />
                )}
                {ongletActif === 'absences' && (
                    <AbsencesTab data={absencesQuery.data} isLoading={absencesQuery.isLoading} />
                )}
            </motion.div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, delay }: { icon: any; label: string; value: string | number; color: string; delay: number }) {
    const colors: Record<string, { bg: string; text: string; value: string }> = {
        blue: { bg: 'from-blue-50 to-blue-100 border-blue-200', text: 'text-blue-700', value: 'text-blue-800' },
        green: { bg: 'from-green-50 to-green-100 border-green-200', text: 'text-green-700', value: 'text-green-800' },
        purple: { bg: 'from-purple-50 to-purple-100 border-purple-200', text: 'text-purple-700', value: 'text-purple-800' },
        orange: { bg: 'from-orange-50 to-orange-100 border-orange-200', text: 'text-orange-700', value: 'text-orange-800' },
        gray: { bg: 'from-gray-50 to-gray-100 border-gray-200', text: 'text-gray-700', value: 'text-gray-800' },
    };
    const c = colors[color] || colors.blue;
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className={`bg-gradient-to-br ${c.bg} rounded-lg p-4 border`}
        >
            <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-5 h-5 ${c.text}`} />
                <span className={`text-sm font-medium ${c.text}`}>{label}</span>
            </div>
            <p className={`text-3xl font-bold ${c.value}`}>{value}</p>
        </motion.div>
    );
}

function InformationsTab({ enseignant }: { enseignant: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    Informations personnelles
                </h3>
                <dl className="space-y-4">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Date de naissance</dt>
                        <dd className="mt-1 text-gray-900">{formatDate(enseignant.utilisateur?.profil?.dateNaissance ?? enseignant.dateNaissance ?? '')}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Sexe</dt>
                        <dd className="mt-1 text-gray-900">{enseignant.sexe === 'M' ? 'Masculin' : 'Féminin'}</dd>
                    </div>
                    {(enseignant.specialites?.[0] ?? enseignant.specialite ?? '') && (
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Spécialité</dt>
                            <dd className="mt-1 text-gray-900">{enseignant.specialites?.[0] ?? enseignant.specialite ?? ''}</dd>
                        </div>
                    )}
                    {(enseignant.diplomes ?? enseignant.qualification ?? '') && (
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Qualification</dt>
                            <dd className="mt-1 text-gray-900">{enseignant.diplomes ?? enseignant.qualification ?? ''}</dd>
                        </div>
                    )}
                </dl>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-600" />
                    Coordonnées
                </h3>
                <dl className="space-y-4">
                    {(enseignant.utilisateur?.email ?? enseignant.email ?? '') && (
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Email</dt>
                                <dd className="text-gray-900">{enseignant.utilisateur?.email ?? enseignant.email ?? ''}</dd>
                            </div>
                        </div>
                    )}
                    {(enseignant.utilisateur?.profil?.telephone ?? enseignant.telephone ?? '') && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
                                <dd className="text-gray-900">{enseignant.utilisateur?.profil?.telephone ?? enseignant.telephone ?? ''}</dd>
                            </div>
                        </div>
                    )}
                    {(enseignant.utilisateur?.profil?.adresse ?? enseignant.adresse ?? '') && (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                                <dd className="text-gray-900">{enseignant.utilisateur?.profil?.adresse ?? enseignant.adresse ?? ''}</dd>
                            </div>
                        </div>
                    )}
                </dl>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    Informations professionnelles
                </h3>
                <dl className="space-y-4">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Poste</dt>
                        <dd className="mt-1 text-gray-900">{enseignant.posteExact ?? enseignant.poste ?? 'Enseignant'}</dd>
                    </div>
                    {(enseignant.service ?? enseignant.departement ?? '') && (
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Département</dt>
                            <dd className="mt-1 text-gray-900">{enseignant.service ?? enseignant.departement ?? ''}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Contrat</dt>
                        <dd className="mt-1">
                            <span className="px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {LABELS_TYPE_CONTRAT[enseignant.typeContrat ?? 'cdi']}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Date d'entrée</dt>
                        <dd className="mt-1 text-gray-900">{formatDate(enseignant.dateEmbauche ?? enseignant.dateEntree ?? '')}</dd>
                    </div>
                    {enseignant.dateSortie && (
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Date de sortie</dt>
                            <dd className="mt-1 text-red-600 font-medium">{formatDate(enseignant.dateSortie)}</dd>
                        </div>
                    )}
                </dl>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Métadonnées
                </h3>
                <dl className="space-y-4">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Matricule</dt>
                        <dd className="mt-1 font-mono text-gray-900">{enseignant.matricule || '-'}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                        <dd className="mt-1 text-gray-900">{formatDate(enseignant.createdAt)}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Dernière modification</dt>
                        <dd className="mt-1 text-gray-900">{formatDate(enseignant.updatedAt)}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

function AffectationsTab({ data, isLoading }: { data: AffectationEnseignant[] | undefined; isLoading: boolean }) {
    if (isLoading) return <div className="py-12 text-center text-gray-500"><LoadingState message="Chargement des affectations..." /></div>;
    if (!data || data.length === 0) return (
        <EmptyState icon={BookOpen} message="Aucune matière assignée" sub="Cet enseignant n'est actuellement assigné à aucune matière ou classe." />
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Matière</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Classe</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Année scolaire</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-600">Coeff.</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-600">Période</th>
                            <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">{a.matiere?.nom || a.matiereId}</span>
                                        {a.matiere?.code && (
                                            <span className="text-xs text-gray-400 font-mono">({a.matiere.code})</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3">{a.classeAnnee?.classe?.nom || '-'}</td>
                                <td className="px-4 py-3 text-gray-600">{a.classeAnnee?.anneeScolaire?.libelle || '-'}</td>
                                <td className="px-4 py-3 text-center font-semibold">{a.coefficient ?? '—'}</td>
                                <td className="px-4 py-3 text-center text-xs text-gray-500">
                                    {a.dateDebut ? formatDateCourt(a.dateDebut) : '-'}
                                    {a.dateFin ? ` → ${formatDateCourt(a.dateFin)}` : ''}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {a.actif ? (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                                            <CheckCircle className="h-3 w-3" /> Actif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                                            <XCircle className="h-3 w-3" /> Inactif
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EvaluationsTab({ data, moyenne, isLoading }: { data: EvaluationEnseignant[] | undefined; moyenne: { moyenne: number; total: number } | undefined; isLoading: boolean }) {
    if (isLoading) return <div className="py-12 text-center text-gray-500"><LoadingState message="Chargement des évaluations..." /></div>;

    return (
        <div className="space-y-6">
            {moyenne && moyenne.total > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                    <div className="flex items-center gap-4">
                        <Star className="h-10 w-10 text-purple-600" />
                        <div>
                            <p className="text-sm font-medium text-purple-700">Moyenne des évaluations</p>
                            <p className="text-3xl font-bold text-purple-800">{moyenne.moyenne.toFixed(1)} <span className="text-lg font-normal">/ 5</span></p>
                            <p className="text-xs text-purple-600">{moyenne.total} évaluation(s)</p>
                        </div>
                    </div>
                </div>
            )}

            {!data || data.length === 0 ? (
                <EmptyState icon={Star} message="Aucune évaluation" sub="Les évaluations pédagogiques apparaîtront ici une fois soumises." />
            ) : (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Catégorie</th>
                                    <th className="text-center px-4 py-3 font-medium text-gray-600">Note</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Évaluateur</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Commentaire</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((e) => (
                                    <tr key={e.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">{formatDateCourt(e.dateEvaluation)}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">{e.categorie}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-semibold text-lg ${e.note >= 4 ? 'text-green-600' : e.note >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {e.note.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{e.evaluateur ? `${e.evaluateur.prenom} ${e.evaluateur.nom}` : '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">{e.commentaire || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function HeuresTab({ data, isLoading }: { data: HeureCours[] | undefined; isLoading: boolean }) {
    if (isLoading) return <div className="py-12 text-center text-gray-500"><LoadingState message="Chargement des heures..." /></div>;
    if (!data || data.length === 0) return (
        <EmptyState icon={Hourglass} message="Aucune heure de cours enregistrée" sub="Le volume horaire apparaîtra ici une fois les cours planifiés." />
    );

    const totalHeures = data.reduce((sum, h) => sum + h.volume, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-green-700">Total heures</p>
                    <p className="text-3xl font-bold text-green-800">{totalHeures}h</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-medium text-blue-700">Matières enseignées</p>
                    <p className="text-3xl font-bold text-blue-800">{new Set(data.map((h) => h.matiereId)).size}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm font-medium text-purple-700">Séances</p>
                    <p className="text-3xl font-bold text-purple-800">{data.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Matière</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Classe</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Volume</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((h) => (
                                <tr key={h.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600">{formatDateCourt(h.date)}</td>
                                    <td className="px-4 py-3 font-medium">{h.matiere?.nom || h.matiereId}</td>
                                    <td className="px-4 py-3">{h.classeAnnee?.classe?.nom || '-'}</td>
                                    <td className="px-4 py-3 text-center font-semibold">{h.volume}h</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">{h.type}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function AbsencesTab({ data, isLoading }: { data: AbsenceEnseignant[] | undefined; isLoading: boolean }) {
    if (isLoading) return <div className="py-12 text-center text-gray-500"><LoadingState message="Chargement des absences..." /></div>;
    if (!data || data.length === 0) return (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-12 text-center border border-green-200">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-medium text-green-800 mb-1">Aucune absence enregistrée</p>
            <p className="text-sm text-green-600">Cet enseignant a un excellent taux de présence.</p>
        </div>
    );

    const absencesJustifiees = data.filter((a) => a.justifiee).length;
    const absencesNonJustifiees = data.filter((a) => !a.justifiee).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <p className="text-sm font-medium text-red-700">Absences totales</p>
                    <p className="text-3xl font-bold text-red-800">{data.length}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-700">Non justifiées</p>
                    <p className="text-3xl font-bold text-yellow-800">{absencesNonJustifiees}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <p className="text-sm font-medium text-green-700">Justifiées</p>
                    <p className="text-3xl font-bold text-green-800">{absencesJustifiees}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Début</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Fin</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Motif</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Justifiée</th>
                                <th className="text-center px-4 py-3 font-medium text-gray-600">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600">{formatDateCourt(a.dateDebut)}</td>
                                    <td className="px-4 py-3 text-gray-600">{formatDateCourt(a.dateFin)}</td>
                                    <td className="px-4 py-3">{a.motif}</td>
                                    <td className="px-4 py-3 text-center">
                                        {a.justifiee ? (
                                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                            a.statut === 'justifie' ? 'bg-green-100 text-green-700' :
                                            a.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {a.statut === 'justifie' ? 'Justifié' : a.statut === 'en_attente' ? 'En attente' : 'Non justifié'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Icon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">{message}</p>
            <p className="text-sm text-gray-500">{sub}</p>
        </div>
    );
}
