/**
 * ==================================
 * eLISAschool - Page Accès Non Autorisé
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Page affichée lorsqu'un utilisateur tente d'accéder à une ressource sans permission
 */

import { useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ShieldX, ArrowLeft, Home, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

interface UnauthorizedSearch {
    from?: string;
    reason?: string;
}

export function UnauthorizedPage() {
    const navigate = useNavigate();
    const search = useSearch({ strict: false }) as UnauthorizedSearch;
    const { t } = useTranslation('common');
    const { isSuperAdmin, isAdmin, role } = usePermissions();

    const fromPath = search?.from || '/';
    
    // Message personnalisé selon le rôle
    const getHelpMessage = () => {
        if (isSuperAdmin || isAdmin) {
            return "En tant qu'administrateur, vous devriez avoir accès à cette ressource. Il s'agit peut-être d'un problème de configuration.";
        }
        
        return "Votre rôle actuel ne vous donne pas accès à cette fonctionnalité. Contactez un administrateur si vous pensez avoir besoin de cet accès.";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full"
            >
                {/* Card principale */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                    {/* Header avec icône */}
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-4"
                        >
                            <ShieldX className="w-12 h-12 text-white" />
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {t('errors.unauthorized.title', 'Accès Non Autorisé')}
                        </h1>
                        <p className="text-red-50 text-lg">
                            {t('errors.unauthorized.subtitle', 'Vous n\'avez pas les permissions nécessaires')}
                        </p>
                    </div>

                    {/* Corps */}
                    <div className="p-8 space-y-6">
                        {/* Informations */}
                        <div className="space-y-4">
                            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded-r-lg">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                                            {t('errors.unauthorized.details', 'Détails de l\'accès')}
                                        </h3>
                                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                            <li>
                                                <strong>Page demandée :</strong> <code className="bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded">{fromPath}</code>
                                            </li>
                                            <li>
                                                <strong>Votre rôle :</strong> <span className="font-medium">{role || 'Non défini'}</span>
                                            </li>
                                            {search?.reason && (
                                                <li>
                                                    <strong>Raison :</strong> {search.reason}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Message d'aide */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    💡 {getHelpMessage()}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <ElisaButton
                                variant="outline"
                                icon={<ArrowLeft className="w-4 h-4" />}
                                onClick={() => window.history.back()}
                            >
                                {t('actions.back', 'Retour')}
                            </ElisaButton>

                            <ElisaButton
                                variant="primary"
                                icon={<Home className="w-4 h-4" />}
                                onClick={() => navigate({ to: '/dashboard' })}
                            >
                                {t('navigation.dashboard', 'Tableau de bord')}
                            </ElisaButton>

                            {!isSuperAdmin && !isAdmin && (
                                <ElisaButton
                                    variant="outline"
                                    icon={<Mail className="w-4 h-4" />}
                                    onClick={() => navigate({ to: '/communication' })}
                                >
                                    {t('actions.contactAdmin', 'Contacter un administrateur')}
                                </ElisaButton>
                            )}
                        </div>

                        {/* Notes pour admins */}
                        {(isSuperAdmin || isAdmin) && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                                    🔧 Note Administrateur
                                </h4>
                                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                                    Si vous voyez cette page en tant qu'administrateur, vérifiez :
                                </p>
                                <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 list-disc list-inside">
                                    <li>Les permissions de votre rôle dans Paramètres → Rôles & Permissions</li>
                                    <li>Que le module est activé dans Paramètres → Modules</li>
                                    <li>Que votre session est à jour (déconnectez-vous et reconnectez-vous)</li>
                                    <li>Les logs d'audit pour diagnostiquer le problème</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
                    <p>
                                        Si le problème persiste, contactez le support technique à{' '}
                        <a href="mailto:support@elisaschool.com" className="text-blue-600 hover:underline">
                            support@elisaschool.com
                        </a>
                                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default UnauthorizedPage;
