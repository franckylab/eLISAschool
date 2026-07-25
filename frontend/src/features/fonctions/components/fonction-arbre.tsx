import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Edit, Trash2, Workflow, Loader2 } from 'lucide-react';
import type { Fonction } from '../types/fonction.types';
interface FonctionArbreProps {
    fonctions: Fonction[];
    isLoading?: boolean;
    onEdit: (fonction: Fonction) => void;
    onDelete: (fonction: Fonction) => void;
    onView: (fonction: Fonction) => void;
    compact?: boolean;
}

function FonctionTreeNode({
    fonction,
    onEdit,
    onDelete,
    onView,
    depth = 0,
    compact,
}: {
    fonction: Fonction & { enfants?: Fonction[] };
    onEdit: (fonction: Fonction) => void;
    onDelete: (fonction: Fonction) => void;
    onView: (fonction: Fonction) => void;
    depth: number;
    compact?: boolean;
}) {
    const { t } = useTranslation('organisation');
    const [expanded, setExpanded] = useState(true);
    const hasChildren = fonction.enfants && fonction.enfants.length > 0;

    return (
        <div>
            <div
                className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors hover:bg-muted/50 group ${
                    depth > 0 ? 'ml-6' : ''
                }`}
            >
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors ${
                        hasChildren ? 'visible' : 'invisible'
                    }`}
                >
                    {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>

                <Workflow className={`h-4 w-4 ${fonction.actif ? 'text-primary' : 'text-muted-foreground'}`} />

                <button
                    onClick={() => onView(fonction)}
                    className="flex-1 text-left"
                >
                    <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                        {fonction.nom}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">
                        ({fonction.code})
                    </span>
                </button>

                {fonction.majorationDefaut != null && !compact && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        +{fonction.majorationDefaut}%
                    </span>
                )}

                <span className={`text-xs px-2 py-0.5 rounded-full ${
                    fonction.actif
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                }`}>
                    {fonction.actif ? t('actif') : t('inactif')}
                </span>

                {!compact && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onEdit(fonction)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={t('modifier')}
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => onDelete(fonction)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title={t('supprimer')}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {hasChildren && expanded && (
                <div className="border-l-2 border-border ml-4">
                    {fonction.enfants!.map((enfant) => (
                        <FonctionTreeNode
                            key={enfant.id}
                            fonction={enfant}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onView={onView}
                            depth={depth + 1}
                            compact={compact}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FonctionArbre({ fonctions, isLoading, onEdit, onDelete, onView, compact }: FonctionArbreProps) {
    const { t } = useTranslation('organisation');
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!fonctions || fonctions.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Workflow className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t('aucuneFonctionIndication')}</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl shadow-sm border border-border p-4"
        >
            {fonctions.map((fonction) => (
                <FonctionTreeNode
                    key={fonction.id}
                    fonction={fonction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                    depth={0}
                    compact={compact}
                />
            ))}
        </motion.div>
    );
}
