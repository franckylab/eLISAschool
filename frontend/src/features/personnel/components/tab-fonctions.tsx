import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Briefcase, Loader2 } from 'lucide-react';
import { useMembreFonctions } from '../hooks/use-membre-fonctions';
import { useToutesFonctions } from '@/features/fonctions/hooks/use-fonctions';

interface TabFonctionsProps {
    membreId: string;
    membreNom?: string;
}

export function TabFonctions({ membreId }: TabFonctionsProps) {
    const { data: fonctionsMembre, isLoading } = useMembreFonctions(membreId);
    const { data: allFonctions } = useToutesFonctions();

    const getFonctionName = (fonctionId: string) => {
        return allFonctions?.find(f => f.id === fonctionId)?.nom || fonctionId;
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Fonctions assignées</h3>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : !fonctionsMembre || fonctionsMembre.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>Aucune fonction assignée</p>
                    <p className="text-sm mt-1">Les fonctions sont gérées depuis le contrat du membre</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {fonctionsMembre.map((mf) => (
                        <motion.div
                            key={mf.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center justify-between p-4 rounded-xl border ${
                                mf.estPrincipale
                                    ? 'bg-primary/5 border-primary/20'
                                    : 'bg-card border-border'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                    mf.estPrincipale ? 'bg-primary/10' : 'bg-muted'
                                }`}>
                                    <Briefcase className={`h-5 w-5 ${
                                        mf.estPrincipale ? 'text-primary' : 'text-muted-foreground'
                                    }`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">
                                            {getFonctionName(mf.fonctionId)}
                                        </span>
                                        {mf.estPrincipale && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                Principale
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(mf.dateDebut).toLocaleDateString('fr-FR')}
                                        </span>
                                        {mf.dateFin && (
                                            <>
                                                <span>→</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(mf.dateFin).toLocaleDateString('fr-FR')}
                                                </span>
                                            </>
                                        )}
                                        {!mf.dateFin && (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-3 w-3" />
                                                En cours
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
