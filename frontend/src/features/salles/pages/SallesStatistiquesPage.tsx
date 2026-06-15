/**
 * ==================================
 * eLISAschool - Page Statistiques Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Dashboard statistiques des salles avec graphiques
 */

import { useStatistiquesSalles, useSalles } from '../hooks/use-salles';
import { TypeSalle } from '../types/salle.types';
import {
    Building2,
    Users,
    AlertCircle,
    CheckCircle,
    Wrench,
} from 'lucide-react';

// Composants UI simplifiés (inline pour éviter les dépendances manquantes)
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>;
}

function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`p-6 pb-4 ${className}`}>{children}</div>;
}

function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>;
}

function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
}

function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`px-6 pb-6 ${className}`}>{children}</div>;
}

function Progress({ value, className = '' }: { value: number; className?: string }) {
    return (
        <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
            <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline'; className?: string }) {
    const variants = {
        default: 'bg-blue-100 text-blue-800',
        secondary: 'bg-gray-100 text-gray-800',
        outline: 'border border-gray-300 text-gray-700',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}

export function SallesStatistiquesPage() {
    const { data: stats, isLoading: statsLoading } = useStatistiquesSalles();
    const { data: sallesData } = useSalles({ limit: 1000 });

    if (statsLoading) {
        return <div className="flex items-center justify-center py-20">Chargement...</div>;
    }

    if (!stats) {
        return <div className="text-center py-20">Aucune statistique disponible</div>;
    }

    // Calculer le taux d'occupation
    const tauxOccupation = stats.total > 0
        ? Math.round((stats.disponibles / stats.total) * 100)
        : 0;

    // Répartition par type
    const typesStats = Object.entries(stats.parType)
        .map(([type, count]) => ({
            type: type as TypeSalle,
            count,
            percentage: stats.total > 0 ? Math.round((count / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

    const getTypeLabel = (type: TypeSalle) => {
        const labels: Record<TypeSalle, string> = {
            [TypeSalle.CLASSIQUE]: 'Classique',
            [TypeSalle.LABORATOIRE]: 'Laboratoire',
            [TypeSalle.INFORMATIQUE]: 'Informatique',
            [TypeSalle.AMPHITHEATRE]: 'Amphithéâtre',
            [TypeSalle.SPORT]: 'Sport',
            [TypeSalle.MUSIQUE]: 'Musique',
            [TypeSalle.ARTS]: 'Arts',
            [TypeSalle.BIBLIOTHEQUE]: 'Bibliothèque',
            [TypeSalle.ADMINISTRATION]: 'Administration',
            [TypeSalle.AUTRE]: 'Autre',
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: TypeSalle) => {
        const colors: Record<TypeSalle, string> = {
            [TypeSalle.CLASSIQUE]: 'bg-blue-500',
            [TypeSalle.LABORATOIRE]: 'bg-purple-500',
            [TypeSalle.INFORMATIQUE]: 'bg-cyan-500',
            [TypeSalle.AMPHITHEATRE]: 'bg-red-500',
            [TypeSalle.SPORT]: 'bg-green-500',
            [TypeSalle.MUSIQUE]: 'bg-pink-500',
            [TypeSalle.ARTS]: 'bg-orange-500',
            [TypeSalle.BIBLIOTHEQUE]: 'bg-indigo-500',
            [TypeSalle.ADMINISTRATION]: 'bg-gray-500',
            [TypeSalle.AUTRE]: 'bg-yellow-500',
        };
        return colors[type] || 'bg-gray-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Statistiques des Salles
                </h1>
                <p className="text-gray-500 mt-1">
                    Vue d'ensemble de l'infrastructure de l'établissement
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total salles</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">
                            Salles enregistrées
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.disponibles}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Prêtes à l'utilisation
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En maintenance</CardTitle>
                        <Wrench className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {stats.enMaintenance}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Intervention en cours
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capacité totale</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.capaciteTotale}</div>
                        <p className="text-xs text-muted-foreground">
                            Places disponibles
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Taux d'occupation */}
            <Card>
                <CardHeader>
                    <CardTitle>Taux de disponibilité</CardTitle>
                    <CardDescription>
                        Pourcentage de salles disponibles par rapport au total
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                                {tauxOccupation}% disponible
                            </span>
                            <span className="text-sm text-gray-500">
                                {stats.disponibles}/{stats.total}
                            </span>
                        </div>
                        <Progress value={tauxOccupation} className="h-2" />
                        {tauxOccupation < 50 && (
                            <div className="flex items-center gap-2 text-orange-600 mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">
                                    Attention: moins de 50% des salles sont disponibles
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Répartition par type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par type</CardTitle>
                        <CardDescription>
                            Distribution des salles selon leur type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {typesStats.map(({ type, count, percentage }) => (
                                <div key={type} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-3 h-3 rounded ${getTypeColor(type)}`}
                                            />
                                            <span>{getTypeLabel(type)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{count}</Badge>
                                            <span className="text-gray-500 w-12 text-right">
                                                {percentage}%
                                            </span>
                                        </div>
                                    </div>
                                    <Progress value={percentage} className="h-1" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par statut</CardTitle>
                        <CardDescription>
                            État actuel des salles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <span>Disponibles</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">
                                        {stats.disponibles}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {stats.total > 0
                                            ? Math.round((stats.disponibles / stats.total) * 100)
                                            : 0}
                                        %
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wrench className="h-5 w-5 text-orange-600" />
                                    <span>En maintenance</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {stats.enMaintenance}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {stats.total > 0
                                            ? Math.round(
                                                  (stats.enMaintenance / stats.total) * 100
                                              )
                                            : 0}
                                        %
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <span>Indisponibles</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-red-600">
                                        {stats.indisponibles}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {stats.total > 0
                                            ? Math.round(
                                                  (stats.indisponibles / stats.total) * 100
                                              )
                                            : 0}
                                        %
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top salles par capacité */}
            {sallesData && sallesData.data.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Top salles par capacité</CardTitle>
                        <CardDescription>
                            Les 10 salles les plus grandes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {sallesData.data
                                .sort((a, b) => b.capacite - a.capacite)
                                .slice(0, 10)
                                .map((salle, index) => (
                                    <div
                                        key={salle.id}
                                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-sm font-mono text-gray-500 w-6">
                                                #{index + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{salle.nom}</div>
                                                <div className="text-xs text-gray-500">
                                                    {salle.code} - {getTypeLabel(salle.typeSalle)}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{salle.capacite} places</Badge>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
