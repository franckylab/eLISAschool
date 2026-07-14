import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { User, Shield, Mail, Phone, Calendar, MapPin, Briefcase, ArrowUpRight, Link2, Unlink, Plus, Globe, FileText, Star, Bookmark, MessageSquareText, BadgeCheck, Clock, Eye, QrCode, Key, Building2 } from 'lucide-react';
import type { Utilisateur } from '../types/utilisateur.types';
import { apiClient } from '@/lib/api-client';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ImagePreview } from '@/components/ui/ImagePreview';
import { usePersonnelDisponibles, useLinkPersonnelUtilisateur, useUnlinkPersonnelUtilisateur } from '@/features/personnel/hooks/use-personnel';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { InlineEditField, InlineEditActions } from '@/features/personnel/components/InlineEditField';
import { useQRCode } from '../hooks/use-utilisateurs';

function InfoField({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            {icon && <div className="mt-0.5 text-gray-400 dark:text-gray-500 shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-0.5 truncate">{value ?? '—'}</p>
            </div>
        </div>
    );
}

const STATUS_LABELS: Record<string, string> = {
    ACTIF: 'Actif',
    INACTIF: 'Inactif',
    SUSPENDU: 'Suspendu',
    EN_ATTENTE_VALIDATION: 'En attente',
};

const CARD_CLASS = 'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm';
const CARD_TITLE_CLASS = 'text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2';
const GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4';

export function TabInformations({ utilisateur }: { utilisateur: Utilisateur }) {
    const { t, i18n } = useTranslation('utilisateurs');
    const navigate = useNavigate();
    const mp = utilisateur.membrePersonnel;
    const confirm = useConfirmation();

    const [selectedMembreId, setSelectedMembreId] = useState('');
    const [imagePreview, setImagePreview] = useState<{ url: string; title: string; filename?: string } | null>(null);
    const [editingMaxEtab, setEditingMaxEtab] = useState(false);
    const [maxEtabValue, setMaxEtabValue] = useState(String(utilisateur.maxEtablissementsPersonnel ?? 1));
    const { data: personnelDisponibles, isLoading: chargementDispos } = usePersonnelDisponibles();
    const linkMutation = useLinkPersonnelUtilisateur();
    const unlinkMutation = useUnlinkPersonnelUtilisateur();
    const { data: qrCodeUrl } = useQRCode(utilisateur.id);
    const queryClient = useQueryClient();

    const handleLink = () => {
        if (!selectedMembreId || !utilisateur.id) return;
        linkMutation.mutate(
            { membreId: selectedMembreId, utilisateurId: utilisateur.id },
            { onSuccess: () => setSelectedMembreId('') }
        );
    };

    const handleUnlink = () => {
        if (!mp) return;
        confirm.ask({
            title: t('delierDossierPersonnel'),
            message: t('confirmerDelier'),
            details: t('confirmerDelierDetails'),
            variant: 'warning',
            onConfirm: () => unlinkMutation.mutate(mp.id),
        });
    };

    const locale = i18n.language === 'en' ? 'en-US' : 'fr-FR';
    const p = utilisateur.profil;

    const handleSaveMaxEtab = async () => {
        try {
            const val = parseInt(maxEtabValue, 10);
            if (isNaN(val) || val < 0 || val > 100) return;
            await apiClient.patch(`/api/utilisateurs/${utilisateur.id}`, { maxEtablissementsPersonnel: val });
            queryClient.invalidateQueries({ queryKey: ['utilisateurs', 'detail', utilisateur.id] });
            setEditingMaxEtab(false);
        } catch {
            // error handled by toast in interceptor
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Carte 1 — Identité */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={CARD_CLASS}
            >
                <h3 className={CARD_TITLE_CLASS}>
                    <User className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    {t('identite')}
                </h3>
                <div className={GRID_CLASS}>
                    <InfoField label={t('nom')} value={p?.nom} icon={<Bookmark className="h-3.5 w-3.5" />} />
                    <InfoField label={t('prenom')} value={p?.prenom} icon={<Bookmark className="h-3.5 w-3.5" />} />
                    <InfoField
                        label={t('genre')}
                        value={p?.genre ? (p.genre === 'M' ? t('masculin') : p.genre === 'F' ? t('feminin') : t('autreGenre')) : '—'}
                        icon={<Star className="h-3.5 w-3.5" />}
                    />
                    <InfoField
                        label={t('dateNaissance')}
                        value={p?.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString(locale) : '—'}
                        icon={<Calendar className="h-3.5 w-3.5" />}
                    />
                    <InfoField label={t('lieuNaissance')} value={p?.lieuNaissance} icon={<MapPin className="h-3.5 w-3.5" />} />
                    <InfoField label={t('nationalite')} value={p?.nationalite} icon={<Globe className="h-3.5 w-3.5" />} />
                </div>

            </motion.div>

            {/* Carte 2 — Contact */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className={CARD_CLASS}
            >
                <h3 className={CARD_TITLE_CLASS}>
                    <Mail className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    {t('contact')}
                </h3>
                <div className={GRID_CLASS}>
                    <InfoField label={t('email')} value={utilisateur.email} icon={<Mail className="h-3.5 w-3.5" />} />
                    <InfoField label="Téléphone" value={utilisateur.telephone || p?.telephone || '—'} icon={<Phone className="h-3.5 w-3.5" />} />
                    <InfoField label={t('telephoneSecondaire')} value={p?.telephoneSecondaire} icon={<Phone className="h-3.5 w-3.5" />} />
                </div>
                <div className="mt-4 space-y-4">
                    <InfoField label={t('adresse')} value={p?.adresse} icon={<MapPin className="h-3.5 w-3.5" />} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <InfoField label={t('ville')} value={p?.ville} icon={<MapPin className="h-3.5 w-3.5" />} />
                        <InfoField label={t('quartier')} value={p?.quartier} icon={<MapPin className="h-3.5 w-3.5" />} />
                    </div>
                </div>
            </motion.div>

            {/* Carte 3 — Authentification */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={CARD_CLASS}
            >
                <h3 className={CARD_TITLE_CLASS}>
                    <Key className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    {t('authentification')}
                </h3>
                <div className="space-y-4">
                    <div className={GRID_CLASS}>
                        <InfoField label={t('matricule')} value={utilisateur.matricule} icon={<Key className="h-3.5 w-3.5" />} />
                        <InfoField label={t('pseudonyme')} value={utilisateur.pseudonyme || '—'} icon={<User className="h-3.5 w-3.5" />} />
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <QrCode className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{t('qrCode')}</span>
                        <div className="flex items-center gap-2 ml-auto">
                            {utilisateur.qrCodeId ? (
                                <>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                        <BadgeCheck className="h-3 w-3" />
                                        {t('qrCodeActif')}
                                    </span>
                                    {qrCodeUrl && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setImagePreview({ url: qrCodeUrl, title: t('qrCode') + ' — ' + utilisateur.pseudonyme || utilisateur.email, filename: 'qr-' + utilisateur.id })}
                                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <Eye className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                            </button>
                                            <a
                                                href={qrCodeUrl}
                                                download={`qr-${utilisateur.id}.png`}
                                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <ArrowUpRight className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                            </a>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className="text-xs text-gray-400">{t('qrCodeInactif')}</span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Carte 4 — Système */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={CARD_CLASS}
            >
                <h3 className={CARD_TITLE_CLASS}>
                    <Shield className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    {t('informationsSysteme')}
                </h3>
                <div className={GRID_CLASS}>
                    <InfoField label={t('role')} value={utilisateur.role} icon={<Shield className="h-3.5 w-3.5" />} />
                    <InfoField label={t('statutCompte')} value={STATUS_LABELS[utilisateur.statut ?? ''] ?? utilisateur.statut} icon={<BadgeCheck className="h-3.5 w-3.5" />} />
                    <InfoField
                        label={t('emailVerifie')}
                        value={utilisateur.emailVerifie ? t('oui') : t('non')}
                        icon={<Mail className="h-3.5 w-3.5" />}
                    />
                    <InfoField
                        label={t('derniereConnexion')}
                        value={utilisateur.derniereConnexion ? new Date(utilisateur.derniereConnexion).toLocaleString(locale) : t('jamaisConnecte')}
                        icon={<Clock className="h-3.5 w-3.5" />}
                    />
                    <InfoField
                        label={t('compteCree')}
                        value={utilisateur.createdAt ? new Date(utilisateur.createdAt).toLocaleDateString(locale) : '—'}
                        icon={<Calendar className="h-3.5 w-3.5" />}
                    />
                    <InfoField
                        label={t('derniereModification')}
                        value={utilisateur.updatedAt ? new Date(utilisateur.updatedAt).toLocaleDateString(locale) : '—'}
                        icon={<Calendar className="h-3.5 w-3.5" />}
                    />
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <InlineEditField
                        label={t('maxEtablissements')}
                        value={utilisateur.maxEtablissementsPersonnel === 0
                            ? t('illimite')
                            : String(utilisateur.maxEtablissementsPersonnel ?? '1')}
                        icon={Building2}
                        color="#6366f1"
                        editable={true}
                        editing={editingMaxEtab}
                        onStartEdit={() => {
                            setMaxEtabValue(String(utilisateur.maxEtablissementsPersonnel ?? 1));
                            setEditingMaxEtab(true);
                        }}
                    >
                        <div className="space-y-2">
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={maxEtabValue}
                                onChange={(e) => setMaxEtabValue(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-gray-200 focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)]"
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('maxEtablissementsDesc')}</p>
                            <InlineEditActions
                                onSave={handleSaveMaxEtab}
                                onCancel={() => setEditingMaxEtab(false)}
                                disabled={!maxEtabValue || isNaN(parseInt(maxEtabValue, 10)) || parseInt(maxEtabValue, 10) < 0 || parseInt(maxEtabValue, 10) > 100}
                            />
                        </div>
                    </InlineEditField>
                </div>
            </motion.div>

            {/* Carte 5 — Pièces & Notes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={CARD_CLASS}
            >
                <h3 className={CARD_TITLE_CLASS}>
                    <FileText className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    {t('piecesNotes')}
                </h3>
                <div className={GRID_CLASS}>
                    <InfoField label={t('typePiece')} value={p?.typePieceIdentite} icon={<FileText className="h-3.5 w-3.5" />} />
                    <InfoField label={t('numeroPiece')} value={p?.numeroPieceIdentite} icon={<FileText className="h-3.5 w-3.5" />} />
                </div>
                {(p?.pieceRectoUrl || p?.pieceVersoUrl) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                        {p?.pieceRectoUrl && (
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Recto</p>
                                <button
                                    onClick={() => setImagePreview({ url: p.pieceRectoUrl!, title: 'Recto — ' + (p.typePieceIdentite || t('typePiece')), filename: 'recto-' + (p.typePieceIdentite || 'piece') })}
                                    className="text-sm text-[var(--color-dominant-600)] hover:text-[var(--color-dominant-700)] flex items-center gap-2 group"
                                >
                                    <span className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                        <Eye className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="group-hover:underline">Voir le recto</span>
                                </button>
                            </div>
                        )}
                        {p?.pieceVersoUrl && (
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Verso</p>
                                <button
                                    onClick={() => setImagePreview({ url: p.pieceVersoUrl!, title: 'Verso — ' + (p.typePieceIdentite || t('typePiece')), filename: 'verso-' + (p.typePieceIdentite || 'piece') })}
                                    className="text-sm text-[var(--color-dominant-600)] hover:text-[var(--color-dominant-700)] flex items-center gap-2 group"
                                >
                                    <span className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                                        <Eye className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="group-hover:underline">Voir le verso</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {p?.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <InfoField label={t('notes')} value={p.notes} icon={<MessageSquareText className="h-3.5 w-3.5" />} />
                    </div>
                )}
            </motion.div>

            {/* Carte 6 — Dossier Personnel (pleine largeur) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={`${CARD_CLASS} lg:col-span-2`}
            >
                <div className="flex items-start justify-between mb-4">
                    <h3 className={CARD_TITLE_CLASS + ' mb-0'}>
                        <Briefcase className="h-4 w-4 text-[var(--color-dominant-600)]" />
                        {t('dossierPersonnel')}
                    </h3>
                </div>

                {mp ? (
                    <div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <InfoField label="Matricule" value={mp.matricule} icon={<Briefcase className="h-3.5 w-3.5" />} />
                            <InfoField
                                label="Type"
                                value={mp.typePersonnel?.nom || mp.typePersonnelId || 'Non défini'}
                                icon={<User className="h-3.5 w-3.5" />}
                            />
                            <InfoField
                                label="Date d'embauche"
                                value={new Date(mp.dateEmbauche).toLocaleDateString(locale)}
                                icon={<Calendar className="h-3.5 w-3.5" />}
                            />
                            <InfoField label="Statut" value={STATUS_LABELS[mp.statut] ?? mp.statut} icon={<BadgeCheck className="h-3.5 w-3.5" />} />
                            {mp.specialitePrincipale && (
                                <InfoField label="Spécialité" value={mp.specialitePrincipale} icon={<Star className="h-3.5 w-3.5" />} />
                            )}
                            {mp.departement && (
                                <InfoField label="Département" value={mp.departement} icon={<MapPin className="h-3.5 w-3.5" />} />
                            )}
                        </div>
                        <div className="flex gap-2">
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<ArrowUpRight className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/personnel/$id' as any, params: { id: mp.id } } as any)}
                            >
                                {t('voirDossierComplet')}
                            </ElisaButton>
                            <ElisaButton
                                variant="danger"
                                size="sm"
                                icon={<Unlink className="h-4 w-4" />}
                                onClick={handleUnlink}
                                isLoading={unlinkMutation.isPending}
                            >
                                {t('delier')}
                            </ElisaButton>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('aucunDossierLie')}</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={selectedMembreId}
                                onChange={(e) => setSelectedMembreId(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-[var(--color-dominant-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dominant-500)] dark:border-gray-600 dark:text-gray-200 min-w-[250px]"
                            >
                                <option value="">{t('selectionnerPersonnel')}</option>
                                {personnelDisponibles?.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.matricule} — {p.specialitePrincipale || p.typePersonnel?.nom || '—'}
                                    </option>
                                ))}
                            </select>
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                icon={<Link2 className="h-4 w-4" />}
                                onClick={handleLink}
                                disabled={!selectedMembreId || linkMutation.isPending}
                                isLoading={linkMutation.isPending}
                            >
                                {t('lier')}
                            </ElisaButton>
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                icon={<Plus className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/personnel' as any } as any)}
                            >
                                {t('nouvelUtilisateur')}
                            </ElisaButton>
                        </div>
                        {personnelDisponibles?.length === 0 && !chargementDispos && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                {t('compteurSansCompte', { count: 0 })}
                            </p>
                        )}
                    </div>
                )}

                {confirm.ConfirmationModal}
            </motion.div>

            <ImagePreview
                open={!!imagePreview}
                onClose={() => setImagePreview(null)}
                imageUrl={imagePreview?.url ?? ''}
                title={imagePreview?.title}
                filename={imagePreview?.filename}
            />
        </div>
    );
}