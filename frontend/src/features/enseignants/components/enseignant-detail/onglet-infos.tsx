import { Mail, Phone, MapPin, Briefcase, UserCheck, Award } from 'lucide-react';
import type { Enseignant } from '../../types/enseignant.types';

function formatDate(d: string | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const LABELS_CONTRAT: Record<string, string> = {
    cdi: 'CDI', cdd: 'CDD', vacataire: 'Vacataire', stage: 'Stage',
};

const SECTION_CLASSES = 'rounded-xl border border-gray-200 bg-white p-5';

export function OngletInfos({ enseignant }: { enseignant: Enseignant }) {
    return (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className={SECTION_CLASSES}>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                    Informations personnelles
                </h3>
                <dl className="space-y-4 text-sm">
                    <InfoRow dt="Date de naissance" dd={formatDate(enseignant.dateNaissance)} />
                    <InfoRow dt="Sexe"
                        dd={enseignant.sexe === 'M' ? 'Masculin' : enseignant.sexe === 'F' ? 'Féminin' : '—'} />
                    {enseignant.specialite && <InfoRow dt="Spécialité" dd={enseignant.specialite} />}
                    {enseignant.qualification && <InfoRow dt="Qualification" dd={enseignant.qualification} />}
                </dl>
            </div>

            <div className={SECTION_CLASSES}>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Mail className="h-5 w-5 text-green-600" />
                    Coordonnées
                </h3>
                <dl className="space-y-4 text-sm">
                    {(enseignant.utilisateur?.email || enseignant.email) && (
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-400 shrink-0" />
                            <div>
                                <dt className="text-xs font-medium text-gray-500">Email</dt>
                                <dd className="text-gray-900">{enseignant.utilisateur?.email ?? enseignant.email}</dd>
                            </div>
                        </div>
                    )}
                    {(enseignant.telephone) && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                            <div>
                                <dt className="text-xs font-medium text-gray-500">Téléphone</dt>
                                <dd className="text-gray-900">{enseignant.telephone}</dd>
                            </div>
                        </div>
                    )}
                    {(enseignant.adresse) && (
                        <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 h-5 w-5 text-gray-400 shrink-0" />
                            <div>
                                <dt className="text-xs font-medium text-gray-500">Adresse</dt>
                                <dd className="text-gray-900">{enseignant.adresse}</dd>
                            </div>
                        </div>
                    )}
                </dl>
            </div>

            <div className={SECTION_CLASSES}>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    Informations professionnelles
                </h3>
                <dl className="space-y-4 text-sm">
                    <InfoRow dt="Poste" dd={enseignant.poste ?? 'Enseignant'} />
                    {enseignant.departement && <InfoRow dt="Département" dd={enseignant.departement} />}
                    <InfoRow dt="Contrat"
                        dd={<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {LABELS_CONTRAT[enseignant.typeContrat ?? ''] ?? enseignant.typeContrat ?? '—'}
                        </span>} />
                    <InfoRow dt="Date d'entrée" dd={formatDate(enseignant.dateEmbauche ?? enseignant.dateEntree)} />
                    {enseignant.dateSortie && <InfoRow dt="Date de sortie" dd={formatDate(enseignant.dateSortie)} />}
                </dl>
            </div>

            <div className={SECTION_CLASSES}>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                    <Award className="h-5 w-5 text-orange-600" />
                    Métadonnées
                </h3>
                <dl className="space-y-4 text-sm">
                    <InfoRow dt="Matricule" dd={enseignant.matricule || '—'} />
                    <InfoRow dt="Créé le" dd={formatDate(enseignant.createdAt)} />
                    <InfoRow dt="Dernière modification" dd={formatDate(enseignant.updatedAt)} />
                </dl>
            </div>
        </div>
    );
}

function InfoRow({ dt, dd }: { dt: string; dd: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium text-gray-500">{dt}</dt>
            <dd className="mt-0.5 text-gray-900">{dd}</dd>
        </div>
    );
}
