/**
 * ==================================
 * eLISAschool - Modal de Suppression d'Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Modal de suppression avec vérification des impacts,
 * affichage en accordéon, et deux modes (soft/cascade).
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp, Trash2, Shield, UserX } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { useVerifierSuppressionUtilisateur, useSupprimerUtilisateur } from '../hooks/use-utilisateurs';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

interface SuppressionUtilisateurModalProps {
    ouvert: boolean;
    utilisateurId: string;
    utilisateurNom: string;
    etablissementId?: string;
    onSuccess: () => void;
    onClose: () => void;
}

const MOTIFS_SUGGESTIONS = [
    { label: 'Fin de contrat', icon: '📅' },
    { label: 'Démission', icon: '📝' },
    { label: 'Retraite', icon: '🏖️' },
    { label: 'Mutation', icon: '🔄' },
    { label: 'Licenciement', icon: '⚠️' },
    { label: 'Autre', icon: '📌' },
];

export function SuppressionUtilisateurModal({
    ouvert,
    utilisateurId,
    utilisateurNom,
    etablissementId,
    onSuccess,
    onClose,
}: SuppressionUtilisateurModalProps) {
    // Log pour vérifier que le composant est monté
    console.log('[SuppressionModal] Composant monté, ouvert:', ouvert, 'utilisateurId:', utilisateurId);
    
    // Hooks
    const verifier = useVerifierSuppressionUtilisateur();
    const supprimer = useSupprimerUtilisateur();
    const { utilisateur } = useAuthStore();
    const permissions = utilisateur?.permissions || [];

    // États locaux
    const [mode, setMode] = useState<'soft' | 'cascade'>('soft');
    const [motif, setMotif] = useState('');
    const [sectionsOuvertes, setSectionsOuvertes] = useState<Record<string, boolean>>({});

    // Utiliser directement verifier.data au lieu d'un état local
    const verification = verifier.data;

    // Log des états du mutation
    console.log('[SuppressionModal] States - isPending:', verifier.isPending, 'isError:', verifier.isError, 'hasData:', !!verifier.data);

    // Réinitialiser et lancer la vérification quand le modal s'ouvre
    useEffect(() => {
        if (ouvert && utilisateurId) {
            console.log('[SuppressionModal] Ouverture, lancement vérification...');
            setMotif('');
            setSectionsOuvertes({});
            
            const peutCascade = permissions.includes('super_admin:all');
            setMode(peutCascade ? 'soft' : 'soft');
            
            // Lancer la vérification
            verifier.mutate({ utilisateurId, etablissementId });
        }
    }, [ouvert, utilisateurId, etablissementId]);

    // Vérifier les permissions après chargement
    useEffect(() => {
        if (verification && !verification.permissions.peutSoftDelete) {
            toast.error('Vous n\'avez pas la permission de supprimer cet utilisateur');
            onClose();
        }
    }, [verification]);

    // Toggle section accordéon
    const toggleSection = (section: string) => {
        setSectionsOuvertes(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Soumettre la suppression
    const handleSupprimer = async () => {
        if (!motif.trim() || motif.length < 10) {
            toast.warning('Le motif doit contenir au moins 10 caractères');
            return;
        }

        if (!verification?.peutSupprimer) {
            toast.error('Suppression impossible : éléments critiques détectés');
            return;
        }

        try {
            await supprimer.mutateAsync({
                utilisateurId,
                mode,
                motif: motif.trim(),
                etablissementId,
            });
            
            onSuccess();
            onClose();
        } catch {
            // Erreur déjà gérée par le hook
        }
    };

    // Charger pendant la vérification
    if (verifier.isPending || !verification) {
        return (
            <CustomModal
                open={ouvert}
                onOpenChange={(open) => { if (!open) onClose(); }}
                title="Vérification des impacts"
                description="Analyse des données liées à cet utilisateur..."
                size="2xl"
            >
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Vérification des impacts en cours...
                        </p>
                    </div>
                </div>
            </CustomModal>
        );
    }

    // Si erreur de vérification (uniquement après que le chargement soit terminé)
    if (verifier.isError) {
        console.error('[SuppressionModal] Erreur:', (verifier as any).error);
        return (
            <CustomModal
                open={ouvert}
                onOpenChange={(open) => { if (!open) onClose(); }}
                title="Erreur de vérification"
                description="Impossible de vérifier les impacts"
                size="2xl"
                footer={
                    <div className="flex items-center justify-end">
                        <ElisaButton variant="outline" onClick={onClose}>
                            Fermer
                        </ElisaButton>
                    </div>
                }
            >
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200">
                        Une erreur est survenue lors de la vérification des impacts. Veuillez réessayer.
                    </p>
                </div>
            </CustomModal>
        );
    }

    // Si blocage total
    if (verification.blocageTotal) {
        return (
            <CustomModal
                open={ouvert}
                onOpenChange={(open) => { if (!open) onClose(); }}
                title="Suppression impossible"
                description="Des éléments critiques empêchent la suppression"
                size="2xl"
                footer={
                    <div className="flex items-center justify-end">
                        <ElisaButton variant="outline" onClick={onClose}>
                            Fermer
                        </ElisaButton>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Information utilisateur */}
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                                    {utilisateurNom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {utilisateurNom}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {verification.utilisateur.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Message de blocage */}
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-200 text-sm">
                                    Suppression bloquée
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                    {verification.raisonBlocage || 'Des éléments critiques empêchent la suppression de cet utilisateur.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Éléments critiques */}
                    {verification.elementsCritiques && Object.keys(verification.elementsCritiques).length > 0 && (
                        <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                Éléments critiques détectés
                            </h5>
                            {Object.entries(verification.elementsCritiques).map(([cle, valeur]: [string, any]) => {
                                if (valeur > 0) {
                                    return (
                                        <div key={cle} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                            <p className="text-sm text-red-800 dark:text-red-200">
                                                <span className="font-medium">{cle}:</span> {valeur} élément(s)
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    )}
                </div>
            </CustomModal>
        );
    }

    // Modal normal de suppression
    const peutCascade = verification.permissions.peutCascadeDelete;
    const peutSoft = verification.permissions.peutSoftDelete;

    return (
        <CustomModal
            open={ouvert}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title="Supprimer l'utilisateur"
            description="Vérification des impacts avant suppression"
            size="2xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    {/* Sélecteur de mode */}
                    {peutSoft && peutCascade && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMode('soft')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    mode === 'soft'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <UserX className="h-3 w-3 inline mr-1" />
                                Désactiver
                            </button>
                            <button
                                onClick={() => setMode('cascade')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    mode === 'cascade'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <Trash2 className="h-3 w-3 inline mr-1" />
                                Supprimer définitivement
                            </button>
                        </div>
                    )}
                    
                    {/* Boutons d'action */}
                    <div className="flex items-center gap-3">
                        <ElisaButton
                            variant="outline"
                            onClick={onClose}
                            disabled={supprimer.isPending}
                        >
                            Annuler
                        </ElisaButton>
                        <ElisaButton
                            variant="danger"
                            onClick={handleSupprimer}
                            icon={<Trash2 className="h-4 w-4" />}
                            isLoading={supprimer.isPending}
                            disabled={
                                !verification.peutSupprimer ||
                                !motif.trim() ||
                                motif.length < 10
                            }
                        >
                            {mode === 'soft' ? 'Désactiver' : 'Supprimer définitivement'}
                        </ElisaButton>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Information utilisateur */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                                {utilisateurNom.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {utilisateurNom}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {verification.utilisateur.email} • {verification.utilisateur.roles.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Résumé des impacts */}
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
                        <span>
                            <span className="font-semibold">{verification.resume.totalGeneral}</span> élément(s) lié(s)
                        </span>
                        <span>
                            dans <span className="font-semibold">{verification.resume.categoriesAvecElements}</span> catégorie(s)
                        </span>
                    </div>
                </div>

                {/* Accordéon des impacts par catégorie */}
                <div className="space-y-2">
                    {Object.entries(verification.impacts).map(([categorie, donnees]: [string, any]) => {
                        const nombre = typeof donnees === 'number' ? donnees : (donnees?.nombre || 0);
                        if (nombre === 0) return null;

                        const estOuvert = sectionsOuvertes[categorie] || false;

                        return (
                            <div key={categorie} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <button
                                    onClick={() => toggleSection(categorie)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {categorie}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                            {nombre}
                                        </span>
                                    </div>
                                    {estOuvert ? (
                                        <ChevronUp className="h-4 w-4 text-gray-500" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                    )}
                                </button>
                                
                                <AnimatePresence>
                                    {estOuvert && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-3 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
                                                {typeof donnees === 'object' && donnees.details ? (
                                                    <ul className="space-y-1">
                                                        {donnees.details.map((detail: string, idx: number) => (
                                                            <li key={idx}>• {detail}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>{nombre} élément(s) dans cette catégorie</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>

                {/* Champ motif */}
                <div className="space-y-2">
                    <ElisaInput
                        label={`Motif de ${mode === 'soft' ? 'désactivation' : 'suppression'} *`}
                        type="text"
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        placeholder={`Saisissez le motif (minimum 10 caractères)...`}
                    />
                    
                    {/* Suggestions rapides */}
                    <div className="flex flex-wrap gap-2">
                        {MOTIFS_SUGGESTIONS.map((suggestion) => (
                            <button
                                key={suggestion.label}
                                type="button"
                                onClick={() => setMotif(suggestion.label)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                <span>{suggestion.icon}</span>
                                <span>{suggestion.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Note informative */}
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                    <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <p>
                        {mode === 'soft' 
                            ? 'La désactivation préserve l\'historique et les données liées. L\'utilisateur sera marqué comme INACTIF.'
                            : '⚠️ La suppression définitive est irréversible. Toutes les données liées seront supprimées.'
                        }
                    </p>
                </div>
            </div>
        </CustomModal>
    );
}
