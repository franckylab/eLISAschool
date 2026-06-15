/**
 * ==================================
 * eLISAschool - Error State Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant réutilisable pour afficher un état d'erreur avec action de retry
 */

import { AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
    /** Titre de l'erreur */
    title?: string;
    /** Message d'erreur détaillé */
    message: string;
    /** Icône à afficher (défaut: AlertTriangle) */
    icon?: LucideIcon;
    /** Callback du bouton retry */
    onRetry?: () => void;
    /** Label du bouton retry (défaut: "Réessayer") */
    retryLabel?: string;
    /** Classe CSS supplémentaire */
    className?: string;
}

export function ErrorState({
    title = "Une erreur est survenue",
    message,
    icon: Icon = AlertTriangle,
    onRetry,
    retryLabel = "Réessayer",
    className,
}: ErrorStateProps) {
    return (
        <div className={cn(
            "flex min-h-[400px] items-center justify-center p-8",
            className
        )}>
            <div className="text-center space-y-6 max-w-md">
                {/* Icône avec effet de glow */}
                <div className="relative">
                    <Icon className="h-20 w-20 text-destructive/50 mx-auto" />
                    <div className="absolute inset-0 h-20 w-20 mx-auto bg-destructive/10 rounded-full blur-xl" />
                </div>
                
                {/* Texte */}
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                    <p className="text-muted-foreground">{message}</p>
                </div>

                {/* Bouton retry */}
                {onRetry && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {retryLabel}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ErrorState;
