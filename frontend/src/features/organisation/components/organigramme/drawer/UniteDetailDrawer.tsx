/**
 * ==================================
 * eLISAschool - Drawer détail unité organisationnelle
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Drawer latéral 380px : infos, postes, membres, enfants, actions CRUD.
 * Ferme sur Échap ou clic overlay.
 */

import { useEffect, useCallback } from 'react';
import { X, Building2, Briefcase, GitBranch, Edit, Trash2, Plus, MapPin, Layers, User, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ElisaButton } from '@/components/ui/ElisaButton';
import type { OrganigrammeNode } from '../../../types/organisation.types';

interface UniteDetailDrawerProps {
    unite: OrganigrammeNode | null;
    open: boolean;
    onClose: () => void;
    onEdit?: (unite: OrganigrammeNode) => void;
    onDelete?: (unite: OrganigrammeNode) => void;
    onAddChild?: (unite: OrganigrammeNode) => void;
    onPosteDragStart?: (posteId: string) => void;
}

export function UniteDetailDrawer({ unite, open, onClose, onEdit, onDelete, onAddChild, onPosteDragStart }: UniteDetailDrawerProps) {
    const { t } = useTranslation('organisation');

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, handleKeyDown]);

    if (!open || !unite) return null;

    const sectionClass = "border-t";
    const sectionStyle = { borderColor: 'var(--color-bordure)', padding: 'var(--space-md) 0' };
    const labelClass = "text-xs font-medium uppercase tracking-wide mb-2";

    return (
        <AnimatePresence>
            {/* Overlay */}
            <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
                key="drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                role="dialog"
                aria-modal="true"
                aria-label={unite ? `Détails — ${unite.nom}` : 'Détails unité'}
                className="fixed top-0 right-0 z-50 h-full w-[380px] max-w-[90vw] overflow-y-auto shadow-xl"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderLeft: '1px solid var(--color-bordure)',
                }}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-bordure)', padding: 'var(--space-md) var(--space-lg)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-dominant-50)' }}>
                            <Building2 className="w-5 h-5" style={{ color: 'var(--color-dominant-600)' }} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{unite.nom}</h2>
                                {unite.echelonStructurelLabel && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-dominant-50)', color: 'var(--color-dominant-600)' }}>
                                        {unite.echelonStructurelLabel}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{unite.code}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{
                                    backgroundColor: unite.statut === 'ACTIF' ? 'var(--color-dominant-50)' : unite.statut === 'ARCHIVE' ? 'var(--color-secondary-50)' : 'var(--color-dominant-50)',
                                    color: unite.statut === 'ACTIF' ? 'var(--color-dominant-600)' : unite.statut === 'ARCHIVE' ? 'var(--color-secondary-600)' : 'var(--color-dominant-600)',
                                }}>
                                    {unite.statut}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-dominant-50)] transition-colors" aria-label={t('organigramme.drawer.fermer', 'Fermer')}>
                        <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                </div>

                <div style={{ padding: '0 var(--space-lg) var(--space-lg)' }}>
                    {/* Description */}
                    {unite.description && (
                        <div className="py-4">
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{unite.description}</p>
                        </div>
                    )}

                    {/* Informations */}
                    <div className="py-4 flex flex-col" style={{ gap: 'var(--gap-sm)' }}>
                        <div className="flex items-center gap-2 text-sm">
                            <Layers className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('organigramme.drawer.echelon', 'Échelon')} :</span>
                            <span style={{ color: 'var(--color-text)' }}>{unite.echelonStructurelLabel || '—'}</span>
                        </div>
                        {unite.responsableNom && (
                            <div className="flex items-center gap-2 text-sm">
                                <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                                <span style={{ color: 'var(--color-text-muted)' }}>{t('organigramme.drawer.responsable', 'Responsable')} :</span>
                                <span style={{ color: 'var(--color-text)' }}>{unite.responsableNom}</span>
                            </div>
                        )}
                        {unite.localisation && (
                            <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                                <span style={{ color: 'var(--color-text-muted)' }}>{t('organigramme.drawer.localisation', 'Localisation')} :</span>
                                <span style={{ color: 'var(--color-text)' }}>{unite.localisation}</span>
                            </div>
                        )}
                    </div>

                    {/* Stats rapides */}
                    <div className="grid grid-cols-3" style={{ gap: 'var(--gap-sm)', padding: 'var(--space-md) 0' }}>
                        {[
                            { label: t('organigramme.drawer.profondeur', 'Profondeur'), value: unite.depth },
                            { label: t('organigramme.drawer.membres', 'Membres'), value: unite.totalMembres },
                            { label: t('organigramme.drawer.vacants', 'Vacants'), value: unite.postesVacants },
                        ].map(s => (
                            <div key={s.label} className="text-center rounded-lg" style={{ backgroundColor: 'var(--color-dominant-50)', padding: 'var(--space-sm)' }}>
                                <div className="font-bold" style={{ color: 'var(--color-dominant-600)', fontSize: 'clamp(1rem, 0.9rem + 0.4vw, 1.25rem)' }}>{s.value}</div>
                                <div className="uppercase tracking-wide" style={{ color: 'var(--color-text-muted)', fontSize: 'clamp(0.625rem, 0.6rem + 0.1vw, 0.6875rem)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Postes */}
                    <div className={sectionClass} style={sectionStyle}>
                        <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4" style={{ color: 'var(--color-dominant-600)' }} />
                            <span className={labelClass} style={{ color: 'var(--color-text)' }}>
                                {t('organigramme.drawer.postes', 'Postes')} ({unite.postes?.length || 0})
                            </span>
                        </div>
                        {unite.postes?.length ? (
                            <ul className="flex flex-col" style={{ gap: 'var(--gap-xs)' }}>
                                {unite.postes.map(p => (
                                    <li
                                        key={p.id}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('application/poste-id', p.id);
                                            e.dataTransfer.effectAllowed = 'move';
                                            onPosteDragStart?.(p.id);
                                        }}
                                        className="flex items-center justify-between text-sm px-2 py-1.5 rounded-lg hover:bg-[var(--color-dominant-50)] cursor-grab active:cursor-grabbing"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <GripVertical className="w-3 h-3 text-[var(--color-text-muted)]" />
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1.5">
                                                    <span style={{ color: 'var(--color-text)' }}>{p.intitule}</span>
                                                    {p.typePersonnelLabel && (
                                                        <span className="text-[9px] px-1 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-dominant-50)', color: 'var(--color-dominant-600)' }}>
                                                            {p.typePersonnelLabel}
                                                        </span>
                                                    )}
                                                </span>
                                                {(p.fonctionLabel || p.niveauResponsabiliteLabel) && (
                                                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                                                        {[p.fonctionLabel, p.niveauResponsabiliteLabel].filter(Boolean).join(' · ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                            backgroundColor: p.statut === 'VACANT' ? 'var(--color-secondary-50)' : 'var(--color-dominant-50)',
                                            color: p.statut === 'VACANT' ? 'var(--color-secondary-600)' : 'var(--color-dominant-600)',
                                        }}>
                                            {p.statut === 'VACANT' ? t('organigramme.drawer.vacant', 'Vacant') : t('organigramme.drawer.occupe', 'Occupé')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>{t('organigramme.drawer.aucunPoste', 'Aucun poste')}</p>
                        )}
                    </div>

                    {/* Enfants */}
                    <div className={sectionClass} style={sectionStyle}>
                        <div className="flex items-center gap-2 mb-2">
                            <GitBranch className="w-4 h-4" style={{ color: 'var(--color-dominant-600)' }} />
                            <span className={labelClass} style={{ color: 'var(--color-text)' }}>
                                {t('organigramme.drawer.enfants', 'Unités enfants')} ({unite.enfants?.length || 0})
                            </span>
                        </div>
                        {unite.enfants?.length ? (
                            <ul className="flex flex-col" style={{ gap: 'var(--gap-xs)' }}>
                                {unite.enfants.map(e => (
                                    <li key={e.id} className="text-sm px-2 py-1.5 rounded-lg hover:bg-[var(--color-dominant-50)]" style={{ color: 'var(--color-text)' }}>
                                        {e.nom} <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>({e.code})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs italic" style={{ color: 'var(--color-text-muted)' }}>{t('organigramme.drawer.aucunEnfant', 'Aucune unité enfant')}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={sectionClass} style={sectionStyle}>
                        <div className="flex flex-wrap gap-2">
                            {onEdit && (
                                <ElisaButton variant="primary" size="sm" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => onEdit(unite)} className="flex-1">
                                    {t('organigramme.drawer.modifier', 'Modifier')}
                                </ElisaButton>
                            )}
                            {onAddChild && (
                                <ElisaButton variant="outline" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => onAddChild(unite)}>
                                    {t('organigramme.drawer.ajouterEnfant', 'Enfant')}
                                </ElisaButton>
                            )}
                            {onDelete && (
                                <ElisaButton variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onDelete(unite)} />
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
