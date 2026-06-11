/**
 * ==================================
 * eLISAschool - Exemple Dashboard avec Widgets Conditionnels
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Exemple d'implémentation des permissions sur les widgets dashboard
 */

import { useState } from 'react';
import {
    useVisibleDashboardWidgets,
    useDashboardWidgetCategories,
    useCanViewDashboardWidget,
} from '@/hooks/use-dashboard-widgets';

export function DashboardPageExample() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Obtenir tous les widgets visibles
    const visibleWidgets = useVisibleDashboardWidgets(
        selectedCategory === 'all' ? undefined : selectedCategory
    );

    // Obtenir les catégories disponibles
    const categories = useDashboardWidgetCategories();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
                <p className="text-gray-600 mt-1">
                    Vue d'ensemble personnalisée selon vos permissions
                </p>
            </div>

            {/* Filtres par catégorie */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                        selectedCategory === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Tous ({visibleWidgets.length})
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                            selectedCategory === cat.name
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {cat.label} ({cat.count})
                    </button>
                ))}
            </div>

            {/* Grille de widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Widget Statistiques Générales */}
                {visibleWidgets.includes('dashboard-stats') && (
                    <DashboardCard title="Statistiques Générales" icon="📊">
                        <div className="space-y-2">
                            <StatItem label="Élèves" value="1,234" />
                            <StatItem label="Enseignants" value="89" />
                            <StatItem label="Classes" value="45" />
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Notes */}
                {visibleWidgets.includes('dashboard-notes') && (
                    <DashboardCard title="Aperçu des Notes" icon="📝">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Dernières notes saisies</p>
                            <div className="text-2xl font-bold text-blue-600">156</div>
                            <p className="text-xs text-gray-500">Cette semaine</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Bulletins */}
                {visibleWidgets.includes('dashboard-bulletins') && (
                    <DashboardCard title="Derniers Bulletins" icon="📄">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Bulletins générés</p>
                            <div className="text-2xl font-bold text-green-600">89</div>
                            <p className="text-xs text-gray-500">Ce mois</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Absences */}
                {visibleWidgets.includes('dashboard-absences') && (
                    <DashboardCard title="Absences Récentes" icon="⚠️">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Aujourd'hui</p>
                            <div className="text-2xl font-bold text-orange-600">23</div>
                            <p className="text-xs text-gray-500">Élèves absents</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Paiements */}
                {visibleWidgets.includes('dashboard-paiements') && (
                    <DashboardCard title="Paiements Récents" icon="💰">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Ce mois</p>
                            <div className="text-2xl font-bold text-green-600">45,678 €</div>
                            <p className="text-xs text-gray-500">123 transactions</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Impayés */}
                {visibleWidgets.includes('dashboard-impayes') && (
                    <DashboardCard title="Impayés" icon="🚨">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Total</p>
                            <div className="text-2xl font-bold text-red-600">12,345 €</div>
                            <p className="text-xs text-gray-500">67 familles</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Messagerie */}
                {visibleWidgets.includes('dashboard-messagerie') && (
                    <DashboardCard title="Messages Non Lus" icon="✉️">
                        <div className="space-y-2">
                            <div className="text-2xl font-bold text-purple-600">8</div>
                            <p className="text-xs text-gray-500">Messages en attente</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Annonces */}
                {visibleWidgets.includes('dashboard-annonces') && (
                    <DashboardCard title="Dernières Annonces" icon="📢">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Réunion parents-profs</p>
                            <p className="text-xs text-gray-500">15 Juin 2026</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Cantine */}
                {visibleWidgets.includes('dashboard-cantine') && (
                    <DashboardCard title="Cantine" icon="🍽️">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Inscriptions jour</p>
                            <div className="text-2xl font-bold text-yellow-600">456</div>
                            <p className="text-xs text-gray-500">Repas prévus</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Transport */}
                {visibleWidgets.includes('dashboard-transport') && (
                    <DashboardCard title="Transport" icon="🚌">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Présences today</p>
                            <div className="text-2xl font-bold text-blue-600">234</div>
                            <p className="text-xs text-gray-500">Élèves transportés</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Personnel */}
                {visibleWidgets.includes('dashboard-personnel') && (
                    <DashboardCard title="Effectif Personnel" icon="👥">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Total</p>
                            <div className="text-2xl font-bold text-indigo-600">145</div>
                            <p className="text-xs text-gray-500">Présents: 132</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Congés */}
                {visibleWidgets.includes('dashboard-conges') && (
                    <DashboardCard title="Congés en Cours" icon="🏖️">
                        <div className="space-y-2">
                            <div className="text-2xl font-bold text-teal-600">5</div>
                            <p className="text-xs text-gray-500">Personnels en congé</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Config (Admin uniquement) */}
                {visibleWidgets.includes('dashboard-config') && (
                    <DashboardCard title="Configuration Système" icon="⚙️" admin>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Version</p>
                            <div className="text-lg font-mono">v2.0.0</div>
                            <p className="text-xs text-green-600">✓ Système opérationnel</p>
                        </div>
                    </DashboardCard>
                )}

                {/* Widget Audit (Admin uniquement) */}
                {visibleWidgets.includes('dashboard-audit') && (
                    <DashboardCard title="Journal d'Audit" icon="📋" admin>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Actions aujourd'hui</p>
                            <div className="text-2xl font-bold text-gray-700">567</div>
                            <p className="text-xs text-gray-500">Dernière: il y a 2 min</p>
                        </div>
                    </DashboardCard>
                )}
            </div>

            {/* Message si aucun widget */}
            {visibleWidgets.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">
                        Aucun widget disponible pour votre profil
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Contactez un administrateur pour obtenir des accès
                    </p>
                </div>
            )}
        </div>
    );
}

// ==================================
// COMPOSANTS AUXILIAIRES
// ==================================

function DashboardCard({
    title,
    icon,
    children,
    admin = false,
}: {
    title: string;
    icon: string;
    children: React.ReactNode;
    admin?: boolean;
}) {
    return (
        <div
            className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                admin ? 'border-red-500' : 'border-blue-500'
            } hover:shadow-lg transition-shadow`}
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    <span className="mr-2">{icon}</span>
                    {title}
                </h3>
                {admin && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Admin
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{value}</span>
        </div>
    );
}

export default DashboardPageExample;
