/**
 * ==================================
 * eLISAschool - Modal Détail Créneau (Lecture Seule)
 * ==================================
 * Affichage structuré des informations d'un créneau en lecture seule
 * Sections : Identification | Planification | Statut & contexte
 * Footer : Modifier + Fermer
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useTranslation } from 'react-i18next';
import {
    BookOpen, Calendar, Clock, MapPin, User, CheckCircle2,
    AlertCircle, Pencil, Info, Hash, Palette, GraduationCap,
} from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import type { CreneauHoraire } from '../types/edt.types';

interface EDTCreneauDetailModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    creneau: CreneauHoraire | null;
    onModifier?: (creneau: CreneauHoraire) => void;
}

/** Composant ligne de détail : label + valeur */
function DetailRow({
    icon,
    label,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-[var(--gap-sm)] py-[var(--space-xs)]">
            <span className="mt-0.5 shrink-0 text-[var(--color-text-muted)]">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <dt
                    className="text-[var(--color-text-secondary)]"
                    style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.25vw, 0.8125rem)' }}
                >
                    {label}
                </dt>
                <dd
                    className="font-medium text-[var(--color-text-primary)]"
                    style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.25vw, 0.9375rem)' }}
                >
                    {children}
                </dd>
            </div>
        </div>
    );
}

/** Avatar avec initiales de l'enseignant */
function AvatarEnseignant({ prenom, nom }: { prenom?: string; nom?: string }) {
    const p = prenom ?? '';
    const n = nom ?? '';
    const initiales = `${p.charAt(0)}${n.charAt(0)}`.toUpperCase() || '?';
    return (
        <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-semibold text-white"
            style={{
                fontSize: 'clamp(0.5625rem, 0.5rem + 0.2vw, 0.6875rem)',
                backgroundColor: 'var(--color-dominant-500)',
            }}
            title={`${p} ${n}`.trim()}
        >
            {initiales}
        </span>
    );
}

export function EDTCreneauDetailModal({
    open,
    onOpenChange,
    creneau,
    onModifier,
}: EDTCreneauDetailModalProps) {
    const { t } = useTranslation('emplois');

    if (!creneau) return null;

    const matiere = creneau.affectationMatiere?.matiere;
    const enseignant = creneau.affectationMatiere?.enseignant;
    const ensPrenom = enseignant?.utilisateur?.profil?.prenom ?? '';
    const ensNom = enseignant?.utilisateur?.profil?.nom ?? '';
    const classe = creneau.affectationMatiere?.classeAnnee?.classe;
    const salle = creneau.salle;
    const couleur = matiere?.couleur || creneau.couleur;
    const estValide = creneau.statut === 'VALIDE';

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('detail.titre')}
            description={`${matiere?.nom ?? '—'} — ${t(`jours.${creneau.jour.toLowerCase()}`)} ${creneau.heureDebut}–${creneau.heureFin}`}
            size="lg"
            draggable
            resizable
            footer={
                <div className="flex items-center justify-end gap-[var(--gap-sm)]">
                    <ElisaButton
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('fermer')}
                    </ElisaButton>
                    {onModifier && (
                        <ElisaButton
                            variant="primary"
                            onClick={() => {
                                onOpenChange(false);
                                onModifier(creneau);
                            }}
                            icon={<Pencil className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        >
                            {t('modifier')}
                        </ElisaButton>
                    )}
                </div>
            }
        >
            <div className="space-y-[var(--space-md)]">
                {/* ─── Section 1 : Identification ─────────────── */}
                <SectionSeparator
                    title={t('detail.sectionIdentification')}
                    icon={<BookOpen className="h-4 w-4" />}
                />
                <dl className="space-y-0">
                    <DetailRow
                        icon={<BookOpen className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        label={t('matiere')}
                    >
                        <div className="flex items-center gap-[var(--gap-xs)]">
                            {couleur && (
                                <span
                                    className="inline-block h-3 w-3 rounded-full shrink-0"
                                    style={{ backgroundColor: couleur }}
                                />
                            )}
                            <span>{matiere?.nom ?? '—'}</span>
                            {matiere?.code && (
                                <span className="rounded bg-[var(--color-surface-alt)] px-1 text-[var(--color-text-muted)]"
                                    style={{ fontSize: 'clamp(0.5625rem, 0.5rem + 0.15vw, 0.6875rem)' }}>
                                    {matiere.code}
                                </span>
                            )}
                        </div>
                    </DetailRow>

                    <DetailRow
                        icon={<User className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        label={t('enseignant')}
                    >
                        {enseignant && (ensPrenom || ensNom) ? (
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                <AvatarEnseignant
                                    prenom={ensPrenom}
                                    nom={ensNom}
                                />
                                <span>{`${ensPrenom} ${ensNom}`.trim()}</span>
                            </div>
                        ) : (
                            <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                    </DetailRow>

                    <DetailRow
                        icon={<GraduationCap className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        label={t('classe')}
                    >
                        {classe ? (
                            <span>
                                {classe.nom}
                                {classe.niveau && (
                                    <span className="ml-1 text-[var(--color-text-muted)]">
                                        ({classe.niveau})
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className="text-[var(--color-text-muted)]">—</span>
                        )}
                    </DetailRow>

                    <DetailRow
                        icon={<MapPin className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        label={t('salle')}
                    >
                        {salle ? (
                            <span>
                                {salle.nom}
                                {salle.code && (
                                    <span className="ml-1 text-[var(--color-text-muted)]">
                                        ({salle.code})
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span className="text-[var(--color-text-muted)]">
                                {t('creneau.modal.aucuneSalle')}
                            </span>
                        )}
                    </DetailRow>

                    <DetailRow
                        icon={<Hash className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        label={t('detail.typeCreneau')}
                    >
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]">
                            {t(`creneau.types.${creneau.typeCreneau.toLowerCase()}`)}
                        </span>
                    </DetailRow>

                    {couleur && (
                        <DetailRow
                            icon={<Palette className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            label={t('creneau.modal.couleur')}
                        >
                            <div className="flex items-center gap-[var(--gap-xs)]">
                                <span
                                    className="inline-block h-4 w-4 rounded border border-[var(--color-border)]"
                                    style={{ backgroundColor: couleur }}
                                />
                                <span className="font-mono text-[var(--color-text-secondary)]"
                                    style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}>
                                    {couleur}
                                </span>
                            </div>
                        </DetailRow>
                    )}
                </dl>

                {/* ─── Section 2 : Planification ──────────────── */}
                <SectionSeparator
                    title={t('detail.sectionPlanification')}
                    icon={<Calendar className="h-4 w-4" />}
                />
                <dl className="space-y-0">
                    <DetailRow
                        icon={<Calendar className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        label={t('creneau.modal.jour')}
                    >
                        {t(`jours.${creneau.jour.toLowerCase()}`)}
                    </DetailRow>

                    <DetailRow
                        icon={<Clock className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        label={t('creneau.modal.horaire')}
                    >
                        <span className="font-mono">
                            {creneau.heureDebut} — {creneau.heureFin}
                        </span>
                        {creneau.dureeMinutes && (
                            <span className="ml-2 text-[var(--color-text-muted)]"
                                style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.2vw, 0.8125rem)' }}>
                                ({creneau.dureeMinutes} min)
                            </span>
                        )}
                    </DetailRow>

                </dl>

                {/* ─── Section 3 : Statut & contexte ──────────── */}
                <SectionSeparator
                    title={t('detail.sectionStatut')}
                    icon={<Info className="h-4 w-4" />}
                />
                <dl className="space-y-0">
                    <DetailRow
                        icon={estValide
                            ? <CheckCircle2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                            : <AlertCircle className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                        }
                        label={t('statut')}
                    >
                        <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                                estValide
                                    ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                                    : 'bg-[var(--color-info)]/10 text-[var(--color-info)]'
                            }`}
                        >
                            {estValide
                                ? t('heureCours.modal.statuts.effectue')
                                : t('heureCours.modal.statuts.planifie')}
                        </span>
                    </DetailRow>

                    {creneau.notes && (
                        <DetailRow
                            icon={<Info className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            label={t('creneau.modal.notes')}
                        >
                            <span className="italic text-[var(--color-text-secondary)]">
                                {creneau.notes}
                            </span>
                        </DetailRow>
                    )}
                </dl>
            </div>
        </CustomModal>
    );
}
