/**
 * ==================================
 * eLISAschool - ErrorBoundary
 * ==================================
 * Composant React class pour capturer les erreurs de rendu
 * avec affichage d'un écran d'erreur et bouton retry
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] Erreur capturée:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                        <AlertTriangle className="h-8 w-8 text-[var(--color-error)]" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-[var(--color-texte)]">
                            Une erreur est survenue
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-[var(--color-texte-secondaire)]">
                            {this.state.error?.message || "L'application a rencontré un problème inattendu."}
                        </p>
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-dominante)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Réessayer
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
