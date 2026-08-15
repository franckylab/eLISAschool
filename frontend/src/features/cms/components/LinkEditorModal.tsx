/**
 * ==================================
 * eLISAschool - Link Editor Modal
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Modal d'édition de liens URL avec validation, presets,
 * cible (_blank/_self), et actions rapides.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link2, X, ExternalLink, Globe, Mail, Phone, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

/** Props du Link Editor Modal */
interface LinkEditorModalProps {
    open: boolean;
    onClose: () => void;
    /** URL actuelle du lien */
    value: string;
    /** Callback quand l'URL est confirmée */
    onChange: (url: string) => void;
    /** Cible du lien (_self, _blank) */
    target?: string;
    /** Callback quand la cible change */
    onTargetChange?: (target: string) => void;
    /** Texte du lien (optionnel) */
    linkText?: string;
    /** Callback quand le texte du lien change */
    onTextChange?: (text: string) => void;
}

/** Protocoles/presets URL */
const URL_PRESETS = [
    { label: 'https://', value: 'https://', icon: <Globe className="cms-link-editor__btn-icon" /> },
    { label: 'http://', value: 'http://', icon: <Globe className="cms-link-editor__btn-icon" /> },
    { label: 'mailto:', value: 'mailto:', icon: <Mail className="cms-link-editor__btn-icon" /> },
    { label: 'tel:', value: 'tel:', icon: <Phone className="cms-link-editor__btn-icon" /> },
    { label: '/', value: '/', icon: <ExternalLink className="cms-link-editor__btn-icon" /> },
];

/** Cibles de lien */
const LINK_TARGETS = [
    { value: '_self', label: 'Même fenêtre', desc: 'Ouvre dans l\'onglet actuel' },
    { value: '_blank', label: 'Nouvelle fenêtre', desc: 'Ouvre dans un nouvel onglet' },
];

/** Validation d'URL */
function isValidUrl(str: string): boolean {
    if (!str || str.length < 3) return false;
    try {
        if (str.startsWith('/') || str.startsWith('mailto:') || str.startsWith('tel:')) return true;
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

/** Extraire le domaine d'une URL */
function getUrlDomain(url: string): string {
    try {
        if (url.startsWith('mailto:')) return `Email: ${url.replace('mailto:', '')}`;
        if (url.startsWith('tel:')) return `Tél: ${url.replace('tel:', '')}`;
        if (url.startsWith('/')) return url;
        const u = new URL(url);
        return u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch {
        return url;
    }
}

export function LinkEditorModal({
    open,
    onClose,
    value,
    onChange,
    target = '_self',
    onTargetChange,
    linkText = '',
    onTextChange,
}: LinkEditorModalProps) {
    const [url, setUrl] = useState(value);
    const [selectedTarget, setSelectedTarget] = useState(target);
    const [text, setText] = useState(linkText);
    const [showValidation, setShowValidation] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync avec les props
    useEffect(() => {
        if (open) {
            setUrl(value);
            setSelectedTarget(target);
            setText(linkText);
            setShowValidation(false);
            // Focus auto après animation
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [open, value, target, linkText]);

    // Validation en temps réel
    const isUrlValid = url.length === 0 || isValidUrl(url);
    const urlDomain = url ? getUrlDomain(url) : '';

    // Raccourcis clavier
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'Enter' && isUrlValid) {
            handleApply();
        }
    }, [onClose, isUrlValid, url, selectedTarget, text]);

    // Appliquer le lien
    const handleApply = useCallback(() => {
        if (url && !isValidUrl(url)) {
            setShowValidation(true);
            return;
        }
        onChange(url);
        if (onTargetChange) onTargetChange(selectedTarget);
        if (onTextChange) onTextChange(text);
        if (url) {
            toast.success(`Lien appliqué : ${urlDomain || url}`);
        }
        onClose();
    }, [url, selectedTarget, text, onChange, onTargetChange, onTextChange, onClose, urlDomain]);

    // Supprimer le lien
    const handleRemove = useCallback(() => {
        onChange('');
        toast.success('Lien supprimé');
        onClose();
    }, [onChange, onClose]);

    // Appliquer un preset de protocole
    const applyPreset = useCallback((prefix: string) => {
        setUrl(prev => {
            if (!prev || prev === 'https://') return prefix;
            // Remplacer le protocole existant
            const cleaned = prev.replace(/^(https?:\/\/|mailto:|tel:|\/)+/, '');
            return prefix + cleaned;
        });
    }, []);

    if (!open) return null;

    return (
        <div className="cms-link-editor-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
            <div className="cms-link-editor-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="cms-link-editor__header">
                    <div className="cms-link-editor__title">
                        <Link2 className="cms-link-editor__title-icon" />
                        Éditer le lien
                    </div>
                    <button onClick={onClose} className="cms-link-editor__close" title="Fermer (Échap)">
                        <X className="cms-icon--sm" />
                    </button>
                </div>

                {/* Body */}
                <div className="cms-link-editor__body">
                    {/* URL Input */}
                    <div className="cms-link-editor__field">
                        <label className="cms-link-editor__label">Adresse du lien</label>
                        <div className="cms-link-editor__input-wrap">
                            <Link2 className="cms-link-editor__input-icon" />
                            <input
                                ref={inputRef}
                                type="url"
                                value={url}
                                onChange={e => { setUrl(e.target.value); setShowValidation(false); }}
                                placeholder="https://exemple.com/page"
                                className={`cms-link-editor__input ${showValidation && !isUrlValid ? 'cms-link-editor__input--invalid' : ''}`}
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </div>
                        {showValidation && !isUrlValid && (
                            <span className="cms-link-editor__error">URL invalide. Utilisez https://, http://, mailto:, tel: ou /</span>
                        )}
                        {url && isUrlValid && urlDomain && (
                            <span className="cms-link-editor__label" style={{ color: '#059669', marginTop: 2 }}>
                                {urlDomain}
                            </span>
                        )}
                    </div>

                    {/* Protocole presets */}
                    <div className="cms-link-editor__field">
                        <label className="cms-link-editor__label">Protocole</label>
                        <div className="cms-link-editor__presets">
                            {URL_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => applyPreset(preset.value)}
                                    className="cms-link-editor__preset"
                                    title={preset.label}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Texte du lien (optionnel) */}
                    {onTextChange && (
                        <div className="cms-link-editor__field">
                            <label className="cms-link-editor__label">Texte affiché (optionnel)</label>
                            <div className="cms-link-editor__input-wrap">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder="Cliquez ici..."
                                    className="cms-link-editor__input"
                                    style={{ paddingLeft: '0.625rem' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Cible du lien */}
                    {onTargetChange && (
                        <div className="cms-link-editor__field">
                            <label className="cms-link-editor__label">Comportement</label>
                            <div className="cms-link-editor__options">
                                {LINK_TARGETS.map(t => (
                                    <label key={t.value} className="cms-link-editor__checkbox-label">
                                        <input
                                            type="radio"
                                            name="link-target"
                                            value={t.value}
                                            checked={selectedTarget === t.value}
                                            onChange={() => setSelectedTarget(t.value)}
                                            className="cms-link-editor__checkbox"
                                        />
                                        <span>{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="cms-link-editor__actions">
                    {value && (
                        <button
                            onClick={handleRemove}
                            className="cms-link-editor__btn cms-link-editor__btn--danger"
                            title="Supprimer le lien"
                        >
                            <Trash2 className="cms-link-editor__btn-icon" />
                            Supprimer
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button
                        onClick={onClose}
                        className="cms-link-editor__btn cms-link-editor__btn--secondary"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!isUrlValid}
                        className="cms-link-editor__btn cms-link-editor__btn--primary"
                    >
                        <Check className="cms-link-editor__btn-icon" />
                        Appliquer
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LinkEditorModal;
