import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, Eye, GitBranch, CheckCircle, XCircle } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { useModulePermissions } from '@/hooks';
import { useArbreFonctions, useToutesFonctions } from '@/features/fonctions/hooks/use-fonctions';

export function TabFonctions() {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const { canAccess } = useModulePermissions('fonctions');
    const { data: arbre } = useArbreFonctions();
    const { data: toutes } = useToutesFonctions();

    if (!canAccess) return null;

    const total = toutes?.length || 0;
    const actives = toutes?.filter(f => f.actif).length || 0;
    const racines = toutes?.filter(f => !f.parentId).length || 0;
    const maxDepth = (() => {
        let depth = 0;
        const calc = (items: any[], d: number) => {
            for (const item of items) {
                depth = Math.max(depth, d);
                if (item.enfants?.length) calc(item.enfants, d + 1);
            }
        };
        if (arbre) calc(arbre, 1);
        return depth;
    })();

    const previewFonctions = (toutes || []).slice(0, 5);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <CardGrid columns={{ default: 1, sm: 2, lg: 4 }}>
                <StatCard icon={Briefcase} label={t('totalFonctions')} value={total} color="purple" />
                <StatCard icon={CheckCircle} label={t('fonctionsActives')} value={actives} color="green" />
                <StatCard icon={XCircle} label={t('fonctionsInactives')} value={total - actives} color="red" />
                <StatCard icon={GitBranch} label={t('profondeurMax')} value={maxDepth} color="purple" />
            </CardGrid>

            {previewFonctions.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">{t('fonctionsRecentes')}</h4>
                    <div className="space-y-2">
                        {previewFonctions.map((f) => {
                            const parent = toutes?.find(p => p.id === f.parentId);
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => navigate({ to: '/organisation/fonctions/$id', params: { id: f.id } })}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                                        <span className="text-sm font-medium truncate">{f.nom}</span>
                                        <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{f.code}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-xs text-muted-foreground hidden sm:inline">
                                            {parent?.nom || <span className="italic">Racine</span>}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            f.actif
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {f.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {racines > 0 && arbre && arbre.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">{t('arbreFonctions')}</h4>
                    <div className="space-y-1">
                        {arbre.slice(0, 4).map((f) => (
                            <div key={f.id}>
                                <button
                                    onClick={() => navigate({ to: '/organisation/fonctions/$id', params: { id: f.id } })}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors w-full text-left text-sm"
                                >
                                    <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="font-medium">{f.nom}</span>
                                    {f.enfants && f.enfants.length > 0 && (
                                        <span className="text-xs text-muted-foreground">({f.enfants.length} sous-fonctions)</span>
                                    )}
                                </button>
                                {f.enfants && f.enfants.length > 0 && (
                                    <div className="ml-5 pl-3 border-l border-border space-y-1 mt-1">
                                        {f.enfants.slice(0, 3).map((enfant: any) => (
                                            <button
                                                key={enfant.id}
                                                onClick={() => navigate({ to: '/organisation/fonctions/$id', params: { id: enfant.id } })}
                                                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 transition-colors w-full text-left text-xs"
                                            >
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground shrink-0" />
                                                <span>{enfant.nom}</span>
                                            </button>
                                        ))}
                                        {f.enfants.length > 3 && (
                                            <p className="text-xs text-muted-foreground ml-4">
                                                +{f.enfants.length - 3} autres
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <ElisaButton
                    variant="primary"
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => navigate({ to: '/organisation/fonctions' })}
                >
                    {t('voirToutesFonctions')}
                </ElisaButton>
            </div>
        </motion.div>
    );
}
