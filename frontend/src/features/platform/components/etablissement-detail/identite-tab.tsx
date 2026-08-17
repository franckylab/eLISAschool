/**
 * ==================================
 * eLISAschool - IdentiteTab — Detail etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import {
    Building2, MapPin, Phone, Mail, Globe, Clock, Calendar,
    Users, Hash, FileText, Banknote, CreditCard,
    Facebook, Twitter, UserCircle, LogIn, BarChart3,
} from 'lucide-react';
import { SectionCard, InfoGrid, InfoField, formatRelativeTime } from './shared';
import type { Etablissement, UtilisateursResumeResult, HistoriqueConnexionsResult } from '@/features/etablissements/types/etablissement.types';
import {
    TYPE_LABELS,
    STATUT_CONFIG,
    STATUT_STYLES,
    PLAN_LABELS,
} from '@/features/etablissements/types/etablissement.types';

export function IdentiteTab({ etablissement, utilisateurs, connexions }: {
    etablissement: Etablissement;
    utilisateurs?: UtilisateursResumeResult;
    connexions?: HistoriqueConnexionsResult;
}) {
    const { t } = useTranslation('admin');

    // Statut et plan pour le résumé
    const statut = etablissement.statut || 'INACTIF';
    const plan = etablissement.configuration?.planAbonnement;
    const planLabel = plan ? (PLAN_LABELS[plan] || plan) : '—';
    const statutLabel = STATUT_CONFIG[statut]?.label || statut;

    // Max du graphique connexions pour normaliser les barres
    const maxConnexions = connexions?.serie?.reduce((max, d) => Math.max(max, d.connexions), 0) || 1;

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* ===== Carte résumé en en-tête ===== */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}>
                {/* Bandeau couleur selon statut */}
                <div className="h-1.5" style={{
                    backgroundColor: statut === 'ACTIF' ? 'var(--color-success-500)' : statut === 'EN_ATTENTE_VALIDATION' ? 'var(--color-warning-500)' : 'var(--color-danger-500)',
                }} />
                <div className="p-[clamp(1rem,0.8rem+0.6vw,1.5rem)]">
                    <div className="flex flex-col sm:flex-row items-start gap-[var(--gap-md)]">
                        {/* Logo ou avatar */}
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-bold text-xl overflow-hidden"
                            style={{
                                backgroundColor: 'var(--color-dominant-100)',
                                color: 'var(--color-dominant-700)',
                            }}>
                            {etablissement.logoBase64 ? (
                                <img
                                    src={`data:${etablissement.logoType || 'image/png'};base64,${etablissement.logoBase64}`}
                                    alt={etablissement.nom}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                etablissement.nom?.[0]?.toUpperCase() || '?'
                            )}
                        </div>
                        {/* Infos principales */}
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold truncate" style={{ fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)', color: 'var(--color-texte)' }}>
                                {etablissement.nom}
                            </h2>
                            {etablissement.slogan && (
                                <p className="text-sm mt-0.5" style={{ color: 'var(--color-texte-muted)' }}>{etablissement.slogan}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-[var(--gap-xs)] mt-[var(--space-xs)]">
                                {/* Code */}
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                                    style={{ backgroundColor: 'var(--color-surface-alt)', color: 'var(--color-texte-muted)' }}>
                                    <Hash className="h-3 w-3" />
                                    {etablissement.codeEtablissement || '—'}
                                </span>
                                {/* Statut */}
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_STYLES[statut] || 'bg-gray-100 text-gray-800'}`}>
                                    {statutLabel}
                                </span>
                                {/* Plan */}
                                {plan && (
                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                                        style={{ backgroundColor: 'var(--color-accent-100)', color: 'var(--color-accent-700)' }}>
                                        {planLabel}
                                    </span>
                                )}
                                {/* Type */}
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                    {TYPE_LABELS[etablissement.type || ''] || etablissement.type}
                                </span>
                                {/* Ville */}
                                {etablissement.ville && (
                                    <span className="inline-flex items-center gap-0.5 text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                        <MapPin className="h-3 w-3" />
                                        {etablissement.ville}
                                    </span>
                                )}
                            </div>
                        </div>
                        {/* KPIs rapides */}
                        <div className="flex items-center gap-[var(--gap-md)] shrink-0">
                            {utilisateurs && (
                                <div className="text-center">
                                    <span className="block text-lg font-bold" style={{ color: 'var(--color-texte)' }}>{utilisateurs.total}</span>
                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.utilisateurs', 'utilisateurs')}</span>
                                </div>
                            )}
                            {connexions && (
                                <div className="text-center">
                                    <span className="block text-lg font-bold" style={{ color: 'var(--color-dominant-600)' }}>{connexions.utilisateursActifs30j}</span>
                                    <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.actifs30j', 'actifs 30j')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Historique connexions (mini graphique) ===== */}
            {connexions && connexions.serie.length > 0 && (
                <SectionCard title={t('etablissements.detail.identite.connexionsTitre', 'Activité connexions (30 jours)')} icon={BarChart3}>
                    {/* KPIs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--gap-sm)] mb-[var(--space-md)]">
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.totalConnexions', 'Total 30j')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-texte)' }}>{connexions.total30j}</span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.moyenneJour', 'Moy./jour')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-texte)' }}>{connexions.moyenneJour}</span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.picJour', 'Pic')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-dominant-600)' }}>{connexions.picJour}</span>
                        </div>
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <span className="text-xs block" style={{ color: 'var(--color-texte-muted)' }}>{t('etablissements.detail.identite.utilisateursActifs', 'Util. actifs')}</span>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-success-600)' }}>{connexions.utilisateursActifs30j}</span>
                        </div>
                    </div>
                    {/* Graphique barres CSS avec axe Y */}
                    <div className="flex gap-[var(--gap-xs)]">
                        {/* Axe Y — graduations */}
                        <div className="hidden sm:flex flex-col justify-between h-20 text-right shrink-0 w-6">
                            {[maxConnexions, Math.round(maxConnexions * 0.75), Math.round(maxConnexions * 0.5), Math.round(maxConnexions * 0.25), 0].map((v, i) => (
                                <span key={i} className="text-[0.55rem] leading-none" style={{ color: 'var(--color-texte-muted)' }}>{v}</span>
                            ))}
                        </div>
                        {/* Barres */}
                        <div className="flex-1 space-y-[var(--space-xxs)]">
                            <div className="flex items-end gap-[1px] h-20" role="img" aria-label="Graphique connexions 30 jours">
                                {connexions.serie.map((day) => {
                                    const rawPct = maxConnexions > 0 ? ((day.connexions ?? 0) / maxConnexions) * 100 : 0;
                                    const heightPct = Number.isFinite(rawPct) ? rawPct : 0;
                                    return (
                                        <div
                                            key={day.date}
                                            className="flex-1 rounded-t transition-all hover:opacity-80 relative group"
                                            style={{
                                                height: `${Math.max(heightPct, 2)}%`,
                                                backgroundColor: day.connexions > 0 ? 'var(--color-dominant-500)' : 'var(--color-bordure)',
                                                minWidth: '3px',
                                            }}
                                            title={`${day.date}: ${day.connexions} connexions, ${day.utilisateursUniques} utilisateur(s)`}
                                        >
                                            {/* Tooltip au survol */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                                                <div className="rounded-md border px-2 py-1 text-[0.6rem] whitespace-nowrap shadow-sm"
                                                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}>
                                                    <p className="font-semibold">{day.date}</p>
                                                    <p>{day.connexions} connexions</p>
                                                    <p>{day.utilisateursUniques} utilisateur(s)</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Axe X — dates extrêmes */}
                            <div className="flex justify-between">
                                <span className="text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                    {connexions.serie[0]?.date}
                                </span>
                                <span className="text-[0.6rem]" style={{ color: 'var(--color-texte-muted)' }}>
                                    {connexions.serie[connexions.serie.length - 1]?.date}
                                </span>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* ===== Sections détails en grille ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
            <SectionCard title={t('etablissements.detail.identite.titre', 'Informations générales')} icon={Building2}>
                <InfoGrid>
                    <InfoField icon={Hash} label={t('etablissements.detail.identite.code', 'Code')} value={etablissement.codeEtablissement} />
                    <InfoField icon={FileText} label={t('etablissements.detail.identite.arrete', 'N° Arrêté')} value={etablissement.numeroArrete} />
                    <InfoField icon={Banknote} label={t('etablissements.detail.identite.contribuable', 'N° Contribuable')} value={etablissement.numeroContribuable} />
                    <InfoField icon={CreditCard} label={t('etablissements.detail.identite.compteBancaire', 'Compte bancaire')} value={etablissement.numeroCompteBancaire} />
                </InfoGrid>
            </SectionCard>

            {/* Contact */}
            <SectionCard title={t('etablissements.detail.identite.contact', 'Contact & Localisation')} icon={MapPin}>
                <InfoGrid>
                    <InfoField icon={Mail} label="Email" value={etablissement.contactEmail} href={etablissement.contactEmail ? `mailto:${etablissement.contactEmail}` : undefined} />
                    <InfoField icon={Phone} label={t('etablissements.detail.identite.telephone', 'Téléphone')} value={etablissement.contactTelephone} href={etablissement.contactTelephone ? `tel:${etablissement.contactTelephone}` : undefined} />
                    <InfoField icon={MapPin} label={t('etablissements.detail.identite.adresse', 'Adresse')} value={etablissement.adresse} />
                    <InfoField icon={MapPin} label={t('etablissements.detail.identite.ville', 'Ville')} value={etablissement.ville} />
                    <InfoField icon={Globe} label={t('etablissements.detail.identite.siteWeb', 'Site web')} value={etablissement.siteWeb} href={etablissement.siteWeb} />
                </InfoGrid>
                {/* Réseaux sociaux */}
                {(etablissement.facebook || etablissement.twitter) && (
                    <div className="mt-[var(--space-md)] pt-[var(--space-md)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                        <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.identite.reseaux', 'Réseaux sociaux')}
                        </p>
                        <div className="flex items-center gap-[var(--gap-sm)]">
                            {etablissement.facebook && (
                                <a href={etablissement.facebook} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-[var(--gap-xxs)] text-sm hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--color-accent-600)' }}>
                                    <Facebook className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                    Facebook
                                </a>
                            )}
                            {etablissement.twitter && (
                                <a href={etablissement.twitter} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-[var(--gap-xxs)] text-sm hover:opacity-80 transition-opacity"
                                    style={{ color: 'var(--color-accent-600)' }}>
                                    <Twitter className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                                    Twitter
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Direction */}
            <SectionCard title={t('etablissements.detail.identite.direction', 'Direction')} icon={Users}>
                <InfoGrid>
                    <InfoField icon={Users} label={t('etablissements.detail.identite.directeur', 'Directeur')} value={etablissement.directeurNom} />
                    <InfoField icon={Users} label={t('etablissements.detail.identite.directeurAdjoint', 'Dir. adjoint')} value={etablissement.directeurAdjointNom} />
                    <InfoField icon={Users} label={t('etablissements.detail.identite.censeur', 'Censeur')} value={etablissement.censeurNom} />
                    <InfoField icon={Users} label={t('etablissements.detail.identite.surveillant', 'Surveillant général')} value={etablissement.surveillantGeneralNom} />
                </InfoGrid>
            </SectionCard>

            {/* Paramètres régionaux */}
            <SectionCard title={t('etablissements.detail.identite.parametres', 'Paramètres régionaux')} icon={Globe}>
                <InfoGrid>
                    <InfoField icon={Globe} label={t('etablissements.detail.identite.langue', 'Langue')} value={etablissement.langueDefaut?.toUpperCase()} />
                    <InfoField icon={Banknote} label={t('etablissements.detail.identite.devise', 'Devise')} value={etablissement.devise} />
                    <InfoField icon={Clock} label={t('etablissements.detail.identite.fuseau', 'Fuseau horaire')} value={etablissement.fuseauHoraire} />
                    <InfoField icon={Clock} label={t('etablissements.detail.identite.horaires', 'Horaires')}
                        value={etablissement.heuresOuverture && etablissement.heuresFermeture
                            ? `${etablissement.heuresOuverture} — ${etablissement.heuresFermeture}`
                            : undefined} />
                </InfoGrid>
                {/* Couleurs */}
                {(etablissement.couleurPrimaire || etablissement.couleurSecondaire) && (
                    <div className="mt-[var(--space-md)] pt-[var(--space-md)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                        <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.identite.couleurs', 'Couleurs')}
                        </p>
                        <div className="flex items-center gap-[var(--gap-md)]">
                            {etablissement.couleurPrimaire && (
                                <div className="flex items-center gap-[var(--gap-xxs)]">
                                    <div className="w-5 h-5 rounded border" style={{ backgroundColor: etablissement.couleurPrimaire, borderColor: 'var(--color-bordure)' }} />
                                    <span className="text-xs font-mono" style={{ color: 'var(--color-texte-muted)' }}>{etablissement.couleurPrimaire}</span>
                                </div>
                            )}
                            {etablissement.couleurSecondaire && (
                                <div className="flex items-center gap-[var(--gap-xxs)]">
                                    <div className="w-5 h-5 rounded border" style={{ backgroundColor: etablissement.couleurSecondaire, borderColor: 'var(--color-bordure)' }} />
                                    <span className="text-xs font-mono" style={{ color: 'var(--color-texte-muted)' }}>{etablissement.couleurSecondaire}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* Dates */}
            <SectionCard title={t('etablissements.detail.identite.dates', 'Dates')} icon={Calendar} fullWidth>
                <InfoGrid>
                    <InfoField icon={Calendar} label={t('etablissements.detail.identite.creeLe', 'Créé le')}
                        value={etablissement.createdAt ? new Date(etablissement.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                    <InfoField icon={Calendar} label={t('etablissements.detail.identite.modifieLe', 'Modifié le')}
                        value={etablissement.updatedAt ? new Date(etablissement.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                </InfoGrid>
            </SectionCard>

            {/* Comptes liés */}
            {utilisateurs && (
                <SectionCard title={t('etablissements.detail.utilisateurs.titre', 'Comptes liés')} icon={UserCircle} fullWidth>
                    {/* Résumé */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[var(--gap-sm)]">
                        {/* Total */}
                        <div className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                <Users className="h-[var(--icon-xs)] w-[var(--icon-xs)]" style={{ color: 'var(--color-dominant-600)' }} />
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>Total</span>
                            </div>
                            <span className="text-xl font-bold" style={{ color: 'var(--color-texte)' }}>{utilisateurs.total}</span>
                            <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                                {utilisateurs.actifs} {t('etablissements.detail.utilisateurs.actifs', 'actifs')}
                            </span>
                        </div>
                        {/* Rôles */}
                        {utilisateurs.parRole.slice(0, 4).map((r) => (
                            <div key={r.code} className="rounded-lg border p-[var(--space-sm)]" style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface-alt)' }}>
                                <span className="text-xs" style={{ color: 'var(--color-texte-muted)' }}>{r.role}</span>
                                <span className="block text-xl font-bold" style={{ color: 'var(--color-texte)' }}>{r.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Derniers utilisateurs */}
                    {utilisateurs.derniers.length > 0 && (
                        <div className="pt-[var(--space-sm)]" style={{ borderTop: '1px solid var(--color-bordure)' }}>
                            <p className="text-xs font-medium mb-[var(--space-xs)]" style={{ color: 'var(--color-texte-muted)' }}>
                                {t('etablissements.detail.utilisateurs.nbUtilisateurs', '{{count}} comptes utilisateurs', { count: utilisateurs.total })}
                            </p>
                            <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                {utilisateurs.derniers.slice(0, 10).map((u) => (
                                    <div key={u.id} className="flex items-center gap-[var(--gap-xs)] rounded-lg p-[var(--space-xs)]"
                                        style={{ backgroundColor: 'var(--color-surface-alt)' }}>
                                        {/* Avatar */}
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={u.actif ? { backgroundColor: 'color-mix(in srgb, var(--color-success-500) 10%, transparent)', color: 'var(--color-success-600)' } : { backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-texte-muted)' }}>
                                            {u.prenom?.[0] || u.email[0].toUpperCase()}
                                        </div>
                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-[var(--gap-xxs)]">
                                                <span className="text-xs font-medium truncate" style={{ color: 'var(--color-texte)' }}>
                                                    {u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email}
                                                </span>
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.actif ? 'bg-[var(--color-success-400)]' : 'bg-[var(--color-text-muted)]'}`} />
                                            </div>
                                            <p className="text-xs truncate" style={{ color: 'var(--color-texte-muted)' }}>
                                                {u.email}
                                            </p>
                                        </div>
                                        {/* Rôle + dernière connexion */}
                                        <div className="text-right shrink-0">
                                            <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                                backgroundColor: 'var(--color-dominant-100)',
                                                color: 'var(--color-dominant-700)',
                                            }}>
                                                {u.role}
                                            </span>
                                            {u.derniereConnexion && (
                                                <p className="text-xs flex items-center gap-0.5 justify-end mt-0.5" style={{ color: 'var(--color-texte-muted)' }}>
                                                    <LogIn className="h-2.5 w-2.5" />
                                                    {formatRelativeTime(u.derniereConnexion)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {utilisateurs.total === 0 && (
                        <p className="text-sm text-center py-[var(--space-md)]" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.utilisateurs.aucun', 'Aucun compte lié')}
                        </p>
                    )}
                </SectionCard>
            )}
            </div>
        </div>
    );
}
