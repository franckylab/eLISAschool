/**
 * ==================================
 * eLISAschool - Empty State Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant réutilisable pour afficher un état vide avec actions
 */

import { FolderOpen, Plus, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
    /** Titre principal */
    title: string;
    /** Description secondaire */
    description: string;
    /** Icône à afficher (défaut: FolderOpen) */
    icon?: LucideIcon;
    /** Label du bouton d'action principal */
    actionLabel?: string;
    /** Callback du bouton d'action */
    onAction?: () => void;
    /** Callback du bouton d'actualisation */
    onRefresh?: () => void;
    /** Classe CSS supplémentaire */
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon = FolderOpen,
    actionLabel,
    onAction,
    onRefresh,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex min-h-[400px] items-center justify-center p-8",
            className
        )}>
            <div className="text-center space-y-6 max-w-md">
                {/* Icône avec effet de glow */}
                <div className="relative">
                    <Icon className="h-20 w-20 text-muted-foreground/50 mx-auto" />
                    <div className="absolute inset-0 h-20 w-20 mx-auto bg-muted/20 rounded-full blur-xl" />
                </div>
                
                {/* Texte */}
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <p className="text-muted-foreground">{description}</p>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    {onAction && actionLabel && (
                        <button
                            onClick={onAction}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            {actionLabel}
                        </button>
                    )}
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Actualiser
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EmptyState;
