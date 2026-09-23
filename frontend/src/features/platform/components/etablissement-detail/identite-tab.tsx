/**
 * ==================================
 * eLISAschool - IdentiteTab — Detail etablissement
 * ==================================
 * Version: 2.0.0 — Pur identité (sans redondances)
 * Auteur: franck arlos chendjou
 *
 * Spécialisation : identité administrative et coordonnées UNIQUEMENT.
 * - Le résumé (logo, nom, statut, plan) vit dans le header du shell.
 * - Les comptes utilisateurs vivent dans l'onglet Utilisateurs.
 * - Les connexions 30j vivent dans l'onglet Utilisateurs.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from '@tanstack/react-router';
import {
    Building2, MapPin, Phone, Mail, Globe, Clock, Calendar,
    Users, Hash, FileText, Banknote, ArrowRight,
    Facebook, Twitter,
} from 'lucide-react';
import { SectionCard, InfoGrid, InfoField } from './shared';
import type { Etablissement } from '@/features/etablissements/types/etablissement.types';

export function IdentiteTab({ etablissement }: {
    etablissement: Etablissement;
}) {
    const { t } = useTranslation('admin');
    const navigate = useNavigate();

    return (
        <div className="space-y-[var(--gap-lg)]">
            {/* ===== Sections détails en grille ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--gap-lg)]">
            <SectionCard title={t('etablissements.detail.identite.titre', 'Informations générales')} icon={Building2}>
                <InfoGrid>
                    <InfoField icon={Hash} label={t('etablissements.detail.identite.code', 'Code')} value={etablissement.codeEtablissement} />
                    <InfoField icon={FileText} label={t('etablissements.detail.identite.arrete', 'N° Arrêté')} value={etablissement.numeroArrete} />
                    <InfoField icon={Banknote} label={t('etablissements.detail.identite.contribuable', 'N° Contribuable')} value={etablissement.numeroContribuable} />
                    <InfoField icon={Banknote} label={t('etablissements.detail.identite.compteBancaire', 'Compte bancaire')} value={etablissement.numeroCompteBancaire} />
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
            </div>

            {/* Renvoi vers l'onglet canonique des comptes */}
            <button
                onClick={() => navigate({ to: '/platform/etablissements/$id', params: { id: etablissement.id }, search: { tab: 'utilisateurs' } as never })}
                className="flex w-full items-center justify-between gap-[var(--gap-sm)] rounded-xl border px-[clamp(1rem,0.8rem+0.5vw,1.5rem)] py-[clamp(0.75rem,0.6rem+0.4vw,1rem)] text-left transition-colors hover:bg-[var(--color-surface-alt)]"
                style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)' }}
            >
                <span className="flex items-center gap-[var(--gap-sm)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-dominant-100)' }}>
                        <Users className="h-[var(--icon-sm)] w-[var(--icon-sm)]" style={{ color: 'var(--color-dominant-700)' }} />
                    </span>
                    <span>
                        <span className="block text-sm font-semibold" style={{ color: 'var(--color-texte)' }}>
                            {t('etablissements.detail.identite.voirUtilisateurs', 'Voir les comptes utilisateurs')}
                        </span>
                        <span className="block text-xs" style={{ color: 'var(--color-texte-muted)' }}>
                            {t('etablissements.detail.identite.voirUtilisateursHint', 'Comptes, rôles, connexions et activité')}
                        </span>
                    </span>
                </span>
                <ArrowRight className="h-[var(--icon-sm)] w-[var(--icon-sm)] shrink-0" style={{ color: 'var(--color-texte-muted)' }} />
            </button>
        </div>
    );
}
