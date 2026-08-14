/**
 * ==================================
 * DataBindingPanel — Panneau variables CMS
 * ==================================
 * Variables draggables pour insérer {{etablissement.nom}}, etc.
 * dans les champs texte de l'éditeur Puck.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { BindingContexte, BindingSource, PreviewBindingResponse } from '../types/data-binding.types';

interface DataBindingPanelProps {
    pageId: string;
    onInsertVariable?: (variableKey: string) => void;
}

// Catégories de variables pour l'affichage groupé
const VARIABLE_CATEGORIES: Record<string, { label: string; icon: string }> = {
    etablissement: { label: 'Établissement', icon: '🏫' },
    eleves: { label: 'Élèves', icon: '🎓' },
    matieres: { label: 'Matières', icon: '📚' },
    date: { label: 'Date', icon: '📅' },
};

// Labels lisibles pour chaque variable
const VARIABLE_LABELS: Record<string, string> = {
    'etablissement.nom': 'Nom',
    'etablissement.slogan': 'Slogan',
    'etablissement.ville': 'Ville',
    'etablissement.pays': 'Pays',
    'etablissement.adresse': 'Adresse',
    'etablissement.telephone': 'Téléphone',
    'etablissement.email': 'Email',
    'etablissement.siteWeb': 'Site web',
    'etablissement.facebook': 'Facebook',
    'etablissement.twitter': 'Twitter',
    'etablissement.description': 'Description',
    'etablissement.directeur': 'Directeur',
    'etablissement.devise': 'Devise',
    'etablissement.code': 'Code',
    'etablissement.type': 'Type',
    'etablissement.heuresOuverture': 'Heures ouverture',
    'etablissement.heuresFermeture': 'Heures fermeture',
    'eleves.total': 'Total élèves',
    'matieres.total': 'Total matières',
    'date.jour': "Date du jour",
    'date.annee': 'Année',
    'date.mois': 'Mois',
};

export function DataBindingPanel({ pageId, onInsertVariable }: DataBindingPanelProps) {
    const [sources, setSources] = useState<BindingSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);

    const loadVariables = useCallback(async () => {
        if (!pageId) return;
        setLoading(true);
        try {
            const res = await apiClient.get<PreviewBindingResponse>(
                `/api/cms/pages/${pageId}/preview-binding`,
            );
            const { variables } = res.data || (res as any);
            const contexte: BindingContexte = variables || res.data;

            // Grouper par catégorie
            const grouped: Record<string, BindingSource> = {};
            for (const [key, value] of Object.entries(contexte)) {
                const [category] = key.split('.');
                if (!grouped[category]) {
                    grouped[category] = {
                        name: category,
                        variables: [],
                    };
                }
                grouped[category].variables.push({
                    key,
                    label: VARIABLE_LABELS[key] || key,
                    value,
                    category,
                });
            }
            setSources(Object.values(grouped));
        } catch {
            // Non bloquant — panel vide
        } finally {
            setLoading(false);
        }
    }, [pageId]);

    useEffect(() => {
        loadVariables();
    }, [loadVariables]);

    const handleCopy = async (key: string) => {
        const tag = `{{${key}}}`;
        try {
            await navigator.clipboard.writeText(tag);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch {
            // Fallback — ignorer
        }
    };

    const handleDragStart = (e: React.DragEvent, key: string) => {
        e.dataTransfer.setData('text/plain', `{{${key}}}`);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleClick = (key: string) => {
        if (onInsertVariable) {
            onInsertVariable(key);
        } else {
            handleCopy(key);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6c757d', fontSize: 13 }}>
                Chargement des variables…
            </div>
        );
    }

    if (sources.length === 0) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', color: '#6c757d', fontSize: 13 }}>
                Aucune variable disponible
            </div>
        );
    }

    return (
        <div style={{ padding: '8px 0' }}>
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#1a1a2e',
                }}
            >
                <span>📊 Données dynamiques</span>
                <span style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▾</span>
            </button>

            {expanded && (
                <div style={{ padding: '0 8px' }}>
                    <p style={{ fontSize: 11, color: '#6c757d', margin: '4px 0 8px', lineHeight: 1.4 }}>
                        Cliquez ou glissez une variable dans un champ texte pour l'insérer.
                    </p>

                    {sources.map((source) => {
                        const cat = VARIABLE_CATEGORIES[source.name] || { label: source.name, icon: '📌' };
                        return (
                            <div key={source.name} style={{ marginBottom: 12 }}>
                                <div style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#495057',
                                    marginBottom: 4,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    {cat.icon} {cat.label}
                                </div>
                                {source.variables.map((variable) => (
                                    <div
                                        key={variable.key}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, variable.key)}
                                        onClick={() => handleClick(variable.key)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 8px',
                                            marginBottom: 2,
                                            borderRadius: 4,
                                            cursor: 'grab',
                                            fontSize: 12,
                                            background: copiedKey === variable.key ? '#d4edda' : '#f8f9fa',
                                            border: '1px solid',
                                            borderColor: copiedKey === variable.key ? '#c3e6cb' : '#e9ecef',
                                            transition: 'all 0.15s ease',
                                        }}
                                        title={`{{${variable.key}}} = ${variable.value ?? '—'}`}
                                    >
                                        <span style={{ color: '#495057', fontWeight: 500 }}>
                                            {variable.label}
                                        </span>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontSize: 10,
                                            color: '#6c757d',
                                            maxWidth: '50%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {copiedKey === variable.key ? '✓ Copié' : `{{${variable.key}}}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}

                    <button
                        onClick={loadVariables}
                        style={{
                            width: '100%',
                            padding: '6px',
                            marginTop: 4,
                            background: 'none',
                            border: '1px dashed #dee2e6',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 11,
                            color: '#6c757d',
                        }}
                    >
                        ↻ Rafraîchir
                    </button>
                </div>
            )}
        </div>
    );
}
