/**
 * ==================================
 * eLISAschool - Bascule de vue Table / Arbre
 * ==================================
 * Composant réutilisable pour les sections hiérarchiques (unités, fonctions).
 */

import { Table2, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type OrgView = 'table' | 'arbre';

export function OrgViewToggle({ value, onChange }: { value: OrgView; onChange: (v: OrgView) => void }) {
    const { t } = useTranslation('organisation');
    const opts: { id: OrgView; label: string; icon: typeof Table2 }[] = [
        { id: 'table', label: t('vueTable'), icon: Table2 },
        { id: 'arbre', label: t('vueArbre'), icon: GitBranch },
    ];
    return (
        <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
            {opts.map((o) => {
                const Icon = o.icon;
                const active = value === o.id;
                return (
                    <button
                        key={o.id}
                        type="button"
                        onClick={() => onChange(o.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{o.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
