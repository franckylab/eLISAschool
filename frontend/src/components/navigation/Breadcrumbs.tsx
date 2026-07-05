import { Link, useMatches } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';

const LABEL_MAP: Record<string, string> = {
    classes: 'Classes',
    salles: 'Salles',
    niveaux: 'Niveaux',
    cycles: 'Cycles',
    filieres: 'Filières',
    matieres: 'Matières',
    'annees-scolaires': 'Années scolaires',
    parametres: 'Paramètres',
    configuration: 'Configuration',
    utilisateurs: 'Utilisateurs',
    eleves: 'Élèves',
};

interface BreadcrumbsProps {
    currentLabel?: string;
}

export function Breadcrumbs({ currentLabel }: BreadcrumbsProps) {
    const matches = useMatches();

    const crumbs = matches
        .filter((m) => m.pathname && m.pathname !== '/' && !m.pathname.includes('_auth'))
        .map((m, idx, arr) => {
            const segment = m.pathname.split('/').filter(Boolean).pop() || '';
            const isLast = idx === arr.length - 1;
            return {
                path: m.pathname,
                label: isLast && currentLabel
                    ? currentLabel
                    : LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
            };
        });

    if (crumbs.length === 0) return null;

    return (
        <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="flex items-center gap-1 text-sm text-[var(--color-texte-secondaire)]">
                <li>
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-1 transition-colors hover:text-[var(--color-dominante)]"
                    >
                        <Home className="h-4 w-4" />
                    </Link>
                </li>
                {crumbs.map((crumb, index) => (
                    <li key={crumb.path} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        {index === crumbs.length - 1 ? (
                            <span className="font-medium text-[var(--color-texte)]">
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                to={crumb.path as any}
                                className="transition-colors hover:text-[var(--color-dominante)]"
                            >
                                {crumb.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}
