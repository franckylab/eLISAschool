import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Briefcase, UserCheck, Award, Calendar } from 'lucide-react';
import type { Enseignant } from '../../types/enseignant.types';

function formatDate(d: string | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
}

const SECTION_CLASSES = 'rounded-xl border border-border bg-card p-5';

export function OngletInfos({ enseignant }: { enseignant: Enseignant }) {
    const { t } = useTranslation('personnel');
    const email = enseignant.utilisateur?.email;
    const telephone = enseignant.utilisateur?.profil?.telephone;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3">
                {email && (
                    <a href={`mailto:${email}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                        <Mail className="h-4 w-4" />
                        {t('detail.envoyerEmail')}
                    </a>
                )}
                {telephone && (
                    <a href={`tel:${telephone}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-2.5 text-sm font-medium text-success transition-colors hover:bg-success/10"
                    >
                        <Phone className="h-4 w-4" />
                        {t('detail.appeler')}
                    </a>
                )}
                <button
                    className="inline-flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                    onClick={() => {
                        const tabEvent = new CustomEvent('enseignant-tab-change', { detail: { tab: 'edt' } });
                        window.dispatchEvent(tabEvent);
                    }}
                >
                    <Calendar className="h-4 w-4" />
                    {t('detail.voirEdt')}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                        <UserCheck className="h-5 w-5 text-primary" />
                        {t('detail.infosPersonnelles')}
                    </h3>
                    <dl className="space-y-4 text-sm">
                        <InfoRow dt={t('detail.dateNaissance')} dd={formatDate(enseignant.utilisateur?.profil?.dateNaissance)} />
                        <InfoRow dt={t('detail.genre')}
                            dd={enseignant.utilisateur?.profil?.genre === 'M' ? t('detail.masculin') : enseignant.utilisateur?.profil?.genre === 'F' ? t('detail.feminin') : '—'} />
                        {enseignant.specialitePrincipale && <InfoRow dt={t('detail.specialite')} dd={enseignant.specialitePrincipale} />}
                        {enseignant.diplomes && <InfoRow dt={t('detail.qualification')} dd={enseignant.diplomes} />}
                    </dl>
                </div>

                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                        <Mail className="h-5 w-5 text-success" />
                        {t('detail.coordonnees')}
                    </h3>
                    <dl className="space-y-4 text-sm">
                        {email && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground">{t('detail.email')}</dt>
                                    <dd className="text-foreground">{email}</dd>
                                </div>
                            </div>
                        )}
                        {telephone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground">{t('detail.telephone')}</dt>
                                    <dd className="text-foreground">{telephone}</dd>
                                </div>
                            </div>
                        )}
                        {enseignant.utilisateur?.profil?.adresse && (
                            <div className="flex items-start gap-3">
                                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
                                <div>
                                    <dt className="text-xs font-medium text-muted-foreground">{t('detail.adresse')}</dt>
                                    <dd className="text-foreground">{enseignant.utilisateur?.profil?.adresse}</dd>
                                </div>
                            </div>
                        )}
                    </dl>
                </div>

                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                        <Briefcase className="h-5 w-5 text-accent" />
                        {t('detail.infosProfessionnelles')}
                    </h3>
                    <dl className="space-y-4 text-sm">
                        <InfoRow dt={t('detail.posteLabel')} dd={enseignant.posteExact ?? t('detail.enseignantDefault')} />
                        {enseignant.departement && <InfoRow dt={t('detail.departement')} dd={enseignant.departement} />}
                        <InfoRow dt={t('detail.dateEntree')} dd={formatDate(enseignant.dateEmbauche)} />
                    </dl>
                </div>

                <div className={SECTION_CLASSES}>
                    <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                        <Award className="h-5 w-5 text-warning" />
                        {t('detail.metadonnees')}
                    </h3>
                    <dl className="space-y-4 text-sm">
                        <InfoRow dt={t('detail.matricule')} dd={enseignant.matricule || '—'} />
                        <InfoRow dt={t('detail.creeLe')} dd={formatDate(enseignant.createdAt)} />
                        <InfoRow dt={t('detail.derniereModification')} dd={formatDate(enseignant.updatedAt)} />
                    </dl>
                </div>
            </div>
        </div>
    );
}

function InfoRow({ dt, dd }: { dt: string; dd: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-medium text-muted-foreground">{dt}</dt>
            <dd className="mt-0.5 text-foreground">{dd}</dd>
        </div>
    );
}
