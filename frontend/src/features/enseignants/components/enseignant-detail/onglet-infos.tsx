import { Mail, Phone, MapPin, Briefcase, UserCheck, Award, Calendar, MessageSquare } from 'lucide-react';
import type { Enseignant } from '../../types/enseignant.types';

function formatDate(d: string | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const SECTION_CLASSES = 'rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800';

export function OngletInfos({ enseignant }: { enseignant: Enseignant }) {
    const email = enseignant.utilisateur?.email;
    const telephone = enseignant.utilisateur?.profil?.telephone;

    return (
        <div className="space-y-5">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
                {email && (
                    <a href={`mailto:${email}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                    >
                        <Mail className="h-4 w-4" />
                        Envoyer un email
                    </a>
                )}
                {telephone && (
                    <a href={`tel:${telephone}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                    >
                        <Phone className="h-4 w-4" />
                        Appeler
                    </a>
                )}
                <button
                    className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                    onClick={() => {
                        const tabEvent = new CustomEvent('enseignant-tab-change', { detail: { tab: 'edt' } });
                        window.dispatchEvent(tabEvent);
                    }}
                >
                    <Calendar className="h-4 w-4" />
                    Voir l'EDT
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Personal info card */}
                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        Informations personnelles
                    </h3>
                    <dl className="space-y-4 text-sm">
                        <InfoRow dt="Date de naissance" dd={formatDate(enseignant.utilisateur?.profil?.dateNaissance)} />
                        <InfoRow dt="Genre"
                            dd={enseignant.utilisateur?.profil?.genre === 'M' ? 'Masculin' : enseignant.utilisateur?.profil?.genre === 'F' ? 'Féminin' : '—'} />
                        {enseignant.specialitePrincipale && <InfoRow dt="Spécialité" dd={enseignant.specialitePrincipale} />}
                        {enseignant.diplomes && <InfoRow dt="Qualification" dd={enseignant.diplomes} />}
                    </dl>
                </div>

                {/* Contact card */}
                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                        <Mail className="h-5 w-5 text-green-600" />
                        Coordonnées
                    </h3>
                    <dl className="space-y-4 text-sm">
                        {email && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-gray-400 shrink-0 dark:text-gray-500" />
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</dt>
                                    <dd className="text-gray-900 dark:text-gray-100">{email}</dd>
                                </div>
                            </div>
                        )}
                        {telephone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-gray-400 shrink-0 dark:text-gray-500" />
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Téléphone</dt>
                                    <dd className="text-gray-900 dark:text-gray-100">{telephone}</dd>
                                </div>
                            </div>
                        )}
                        {enseignant.utilisateur?.profil?.adresse && (
                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-5 w-5 text-gray-400 shrink-0 dark:text-gray-500" />
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Adresse</dt>
                                    <dd className="text-gray-900 dark:text-gray-100">{enseignant.utilisateur?.profil?.adresse}</dd>
                                </div>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Professional info card */}
                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
                        <Briefcase className="h-5 w-5 text-purple-600" />
                        Informations professionnelles
                    </h3>
                    <dl className="space-y-4 text-sm">
                        <InfoRow dt="Poste" dd={enseignant.posteExact ?? 'Enseignant'} />
                        {enseignant.departement && <InfoRow dt="Département" dd={enseignant.departement} />}
                        <InfoRow dt="Date d'entrée" dd={formatDate(enseignant.dateEmbauche)} />
                    </dl>
                </div>

                {/* Metadata card */}
                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
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
        </div>
    );
}

function InfoRow({ dt, dd }: { dt: string; dd: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{dt}</dt>
            <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{dd}</dd>
        </div>
    );
}
