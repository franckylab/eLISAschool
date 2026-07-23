import { Link, useMatches } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
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
    personnel: 'Personnel',
    postes: 'Postes',
    fonctions: 'Fonctions',
    nomenclatures: 'Nomenclatures',
    organisation: 'Organisation',
    programmes: 'Programmes',
    bulletins: 'Bulletins',
    absences: 'Absences',
    examens: 'Examens',
    evenements: 'Événements',
    documents: 'Documents',
    bibliotheque: 'Bibliothèque',
    parking: 'Parking',
    stage: 'Stage',
    courriers: 'Courriers',
    atelier: 'Atelier',
    laboratoire: 'Laboratoire',
    discipline: 'Discipline',
    conges: 'Congés',
    inventaire: 'Inventaire',
    archives: 'Archives',
    finances: 'Finances',
    securite: 'Sécurité',
    maintenance: 'Maintenance',
    pointages: 'Pointages',
    evaluations: 'Évaluations',
    sante: 'Santé',
    rapports: 'Rapports',
    statistiques: 'Statistiques',
    sondages: 'Sondages',
    'emploi-du-temps': 'Emploi du temps',
    edt: 'Emploi du temps',
    competences: 'Compétences',
    specialites: 'Spécialités',
    'examens-nationaux': 'Examens nationaux',
    'diplomes-eleves': 'Diplômes élèves',
    'responsables-eleves': 'Responsables élèves',
    messagerie: 'Messagerie',
    annonces: 'Annonces',
    dashboard: 'Dashboard',
};

interface BreadcrumbsProps {
    currentLabel?: string;
    labelsMap?: Record<string, string>;
    inverted?: boolean;
}

export function Breadcrumbs({ currentLabel, labelsMap, inverted }: BreadcrumbsProps) {
    const { t } = useTranslation('common');
    const matches = useMatches();

    const mergedLabels = { ...LABEL_MAP, ...labelsMap };

    const crumbs = matches
        .filter((m) => m.pathname && m.pathname !== '/' && !m.pathname.includes('_auth'))
        .map((m, idx, arr) => {
            const segment = m.pathname.split('/').filter(Boolean).pop() || '';
            const isLast = idx === arr.length - 1;
            return {
                path: m.pathname,
                label: isLast && currentLabel
                    ? currentLabel
                    : mergedLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
            };
        });

    if (crumbs.length === 0) return null;

    const textMuted = inverted ? 'text-white/60' : 'text-[var(--color-texte-secondaire)]';
    const textActive = inverted ? 'text-white' : 'text-[var(--color-texte)]';
    const hoverClass = inverted ? 'hover:text-white' : 'hover:text-[var(--color-dominante)]';

    return (
        <nav aria-label={t('a11y.filAriane')} className="mb-4">
            <ol className={`flex items-center gap-1 text-sm ${textMuted}`}>
                <li>
                    <Link
                        to="/dashboard"
                        className={`flex items-center gap-1 transition-colors ${hoverClass}`}
                    >
                        <Home className="h-4 w-4" />
                    </Link>
                </li>
                {crumbs.map((crumb, index) => (
                    <li key={crumb.path} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 shrink-0" />
                        {index === crumbs.length - 1 ? (
                            <span className={`font-medium ${textActive}`}>
                                {crumb.label}
                            </span>
                        ) : (
                            <Link
                                to={crumb.path as any}
                                className={`transition-colors ${hoverClass}`}
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
