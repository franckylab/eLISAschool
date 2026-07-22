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
import { X, Building2, Briefcase, GitBranch, Edit, Trash2, Plus, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

    const sectionClass = "border-t py-4" ;
    const sectionStyle = { borderColor: 'var(--color-bordure)' };
    const labelClass = "text-xs font-medium uppercase tracking-wide mb-2";

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={unite ? `Détails — ${unite.nom}` : 'Détails unité'}
                className="fixed top-0 right-0 z-50 h-full w-[380px] max-w-[90vw] overflow-y-auto shadow-xl transition-transform"
                style={{
                    backgroundColor: 'var(--color-surface)',
                    borderLeft: '1px solid var(--color-bordure)',
                }}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-bordure)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-dominant-50)' }}>
                            <Building2 className="w-5 h-5" style={{ color: 'var(--color-dominant-600)' }} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{unite.nom}</h2>
                            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{unite.code} · {unite.type}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-dominant-50)] transition-colors" aria-label={t('organigramme.drawer.fermer', 'Fermer')}>
                        <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                </div>

                <div className="px-5 pb-6">
                    {/* Description */}
                    {unite.description && (
                        <div className="py-4">
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{unite.description}</p>
                        </div>
                    )}

                    {/* Stats rapides */}
                    <div className="grid grid-cols-3 gap-3 py-4">
                        {[
                            { label: t('organigramme.drawer.profondeur', 'Profondeur'), value: unite.depth },
                            { label: t('organigramme.drawer.membres', 'Membres'), value: unite.totalMembres },
                            { label: t('organigramme.drawer.vacants', 'Vacants'), value: unite.postesVacants },
                        ].map(s => (
                            <div key={s.label} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-dominant-50)' }}>
                                <div className="text-lg font-bold" style={{ color: 'var(--color-dominant-600)' }}>{s.value}</div>
                                <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Postes */}
                    <div className={sectionClass} style={sectionStyle}>
                        <div className="flex items-center gap-2 mb-3">
                            <Briefcase className="w-4 h-4" style={{ color: 'var(--color-dominant-600)' }} />
                            <span className={labelClass} style={{ color: 'var(--color-text)' }}>
                                {t('organigramme.drawer.postes', 'Postes')} ({unite.postes?.length || 0})
                            </span>
                        </div>
                        {unite.postes?.length ? (
                            <ul className="space-y-1.5">
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
                                            <span style={{ color: 'var(--color-text)' }}>{p.intitule}</span>
                                        </div>
                                        <span className="text-xs px-1.5 py-0.5 rounded" style={{
                                            backgroundColor: p.statut === 'VACANT' ? 'var(--color-attention-50, #fffbeb)' : 'var(--color-success-50, #f0fdf4)',
                                            color: p.statut === 'VACANT' ? 'var(--color-attention-600, #d97706)' : 'var(--color-success-600, #16a34a)',
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
                        <div className="flex items-center gap-2 mb-3">
                            <GitBranch className="w-4 h-4" style={{ color: 'var(--color-dominant-600)' }} />
                            <span className={labelClass} style={{ color: 'var(--color-text)' }}>
                                {t('organigramme.drawer.enfants', 'Unités enfants')} ({unite.enfants?.length || 0})
                            </span>
                        </div>
                        {unite.enfants?.length ? (
                            <ul className="space-y-1">
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
                        <div className="flex gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(unite)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{ backgroundColor: 'var(--color-dominant-600)', color: '#fff' }}
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                    {t('organigramme.drawer.modifier', 'Modifier')}
                                </button>
                            )}
                            {onAddChild && (
                                <button
                                    onClick={() => onAddChild(unite)}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-[var(--color-dominant-50)]"
                                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-text)' }}
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {t('organigramme.drawer.ajouterEnfant', 'Enfant')}
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(unite)}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-red-50"
                                    style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-attention-600, #d97706)' }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
