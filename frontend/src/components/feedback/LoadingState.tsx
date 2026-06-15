/**
 * ==================================
 * eLISAschool - Loading State Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant réutilisable pour afficher un état de chargement
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface LoadingStateProps {
    /** Message de chargement */
    message?: string;
    /** Taille du spinner (défaut: 8) */
    size?: number;
    /** Classe CSS supplémentaire */
    className?: string;
}

export function LoadingState({
    message = "Chargement en cours...",
    size = 8,
    className,
}: LoadingStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center min-h-[300px] gap-4",
            className
        )}>
            <Loader2 
                className="h-8 w-8 animate-spin text-primary" 
                style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
            />
            {message && (
                <p className="text-sm text-muted-foreground animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
}

export default LoadingState;
