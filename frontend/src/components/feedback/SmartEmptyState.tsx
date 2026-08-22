/**
 * ==================================
 * eLISAschool - EmptyState intelligent avec détection de permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Composant qui affiche un état vide contextuel avec :
 * - Détection automatique des permissions pour afficher/masquer le bouton d'action
 * - Icônes dynamiques selon le type de ressource
 * - Messages personnalisables avec support i18n
 */

import { FolderOpen, Users, School, BookOpen, Calendar, CreditCard, ClipboardList, FileText, DollarSign, UserCheck, Package, Megaphone, Bus, UtensilsCrossed, MessageSquare, BarChart3, Settings } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { usePermissions } from '@/hooks';
import type { LucideIcon } from 'lucide-react';

// Mapping des ressources vers leurs icônes par défaut
const RESOURCE_ICONS: Record<string, LucideIcon> = {
    // Ressources académiques
    'eleves': Users,
    'classes': School,
    'matieres': BookOpen,
    'annees-scolaires': Calendar,
    'niveaux': BarChart3,
    'filieres': BarChart3,
    'periodes': Calendar,
    
    // Ressources humaines
    'personnel': Users,
    'enseignants': UserCheck,
    'membres-personnel': UserCheck,
    
    // Finances
    'finances': DollarSign,
    'paiements': CreditCard,
    'factures': CreditCard,
    'depenses': DollarSign,
    'budgets': DollarSign,
    
    // Pédagogie
    'notes': ClipboardList,
    'bulletins': FileText,
    'evaluations': ClipboardList,
    'competences': BarChart3,
    
    // Infrastructure
    'salles': School,
    'materiel': Package,
    'equipements': Package,
    
    // Communication
    'annonces': Megaphone,
    'messages': MessageSquare,
    'notifications': Megaphone,
    'sondages': MessageSquare,
    
    // Services
    'cantine': UtensilsCrossed,
    'transport': Bus,
    'restaurants': UtensilsCrossed,
    'lignes-bus': Bus,
    
    // Configuration
    'parametres': Settings,
    'configuration': Settings,
    'etablissements': School,
    
    // Default
    'default': FolderOpen,
};

// Mapping des ressources vers les permissions de création
const CREATE_PERMISSIONS: Record<string, string> = {
    'eleves': 'eleves:create',
    'classes': 'classes:create',
    'matieres': 'matieres:create',
    'annees-scolaires': 'annees:create',
    'niveaux': 'niveaux:create',
    'filieres': 'filieres:create',
    'periodes': 'periodes:create',
    'personnel': 'personnel:create',
    'enseignants': 'personnel:create',
    'finances': 'finances:create',
    'paiements': 'finances:create',
    'factures': 'finances:create',
    'notes': 'notes:create',
    'bulletins': 'bulletins:generate',
    'salles': 'salles:create',
    'materiel': 'materiel:create',
    'annonces': 'annonces:create',
    'cantine': 'cantine:manage',
    'transport': 'transport:manage',
    'parametres': 'config:module:toggle',
    'default': 'admin',
};

export interface SmartEmptyStateProps {
    /** Type de ressource (détermine icône et permissions automatiquement) */
    ressource: string;
    
    /** Titre personnalisé (optionnel - sinon généré automatiquement) */
    title?: string;
    
    /** Description personnalisée (optionnel - sinon générée automatiquement) */
    description?: string;
    
    /** Label du bouton d'action (optionnel - sinon "Ajouter un(e) {ressource}") */
    actionLabel?: string;
    
    /** Callback quand l'utilisateur clique sur le bouton d'action */
    onAction?: () => void;
    
    /** Callback pour rafraîchir les données */
    onRefresh?: () => void;
    
    /** Permission de création explicite (override la détection automatique) */
    createPermission?: string;
    
    /** Forcer l'affichage du bouton d'action (ignore les permissions) */
    forceAction?: boolean;
    
    /** Classe CSS supplémentaire */
    className?: string;
}

/**
 * Composant EmptyState intelligent avec détection automatique des permissions
 * 
 * @example
 * // Usage basique - détection automatique
 * <SmartEmptyState ressource="eleves" onAction={() => creerEleve()} />
 * 
 * @example
 * // Avec personnalisation
 * <SmartEmptyState
 *     ressource="notes"
 *     title="Aucune note enregistrée"
 *     description="Commencez par ajouter des notes pour les élèves"
 *     onAction={() => ajouterNote()}
 * />
 * 
 * @example
 * // Sans bouton d'action (utilisateur sans permission)
 * <SmartEmptyState ressource="bulletins" />
 */
export function SmartEmptyState({
    ressource,
    title,
    description,
    actionLabel,
    onAction,
    onRefresh,
    createPermission,
    forceAction = false,
    className,
}: SmartEmptyStateProps) {
    const { hasPermission } = usePermissions();
    
    // Déterminer l'icône
    const Icon = RESOURCE_ICONS[ressource] || RESOURCE_ICONS['default'];
    
    // Déterminer la permission requise
    const permissionRequise = createPermission || CREATE_PERMISSIONS[ressource] || CREATE_PERMISSIONS['default'];
    
    // Vérifier si l'utilisateur peut créer
    const peutCreer = forceAction || hasPermission(permissionRequise);
    
    // Générer le titre par défaut si non fourni
    const titreAuto = title || getDefaultTitle(ressource);
    
    // Générer la description par défaut si non fournie
    const descriptionAuto = description || getDefaultDescription(ressource);
    
    // Générer le label du bouton si non fourni
    const labelAuto = actionLabel || getDefaultActionLabel(ressource);
    
    return (
        <EmptyState
            title={titreAuto}
            description={descriptionAuto}
            icon={Icon}
            actionLabel={peutCreer ? labelAuto : undefined}
            onAction={peutCreer && onAction ? onAction : undefined}
            onRefresh={onRefresh}
            className={className}
        />
    );
}

/**
 * Génère un titre par défaut basé sur le type de ressource
 */
function getDefaultTitle(ressource: string): string {
    const titres: Record<string, string> = {
        'eleves': 'Aucun élève inscrit',
        'classes': 'Aucune classe configurée',
        'matieres': 'Aucune matière configurée',
        'annees-scolaires': 'Aucune année scolaire',
        'niveaux': 'Aucun niveau configuré',
        'filieres': 'Aucune filière configurée',
        'periodes': 'Aucune période configurée',
        'personnel': 'Aucun membre du personnel',
        'enseignants': 'Aucun enseignant enregistré',
        'finances': 'Aucune donnée financière',
        'paiements': 'Aucun paiement enregistré',
        'factures': 'Aucune facture générée',
        'notes': 'Aucune note enregistrée',
        'bulletins': 'Aucun bulletin généré',
        'evaluations': 'Aucune évaluation configurée',
        'salles': 'Aucune salle configurée',
        'materiel': 'Aucun matériel enregistré',
        'annonces': 'Aucune annonce publiée',
        'messages': 'Aucun message',
        'cantine': 'Aucune inscription à la cantine',
        'transport': 'Aucune inscription au transport',
        'parametres': 'Aucun paramètre configuré',
        'etablissements': 'Aucun établissement configuré',
    };
    
    return titres[ressource] || 'Aucune donnée disponible';
}

/**
 * Génère une description par défaut basée sur le type de ressource
 */
function getDefaultDescription(ressource: string): string {
    const descriptions: Record<string, string> = {
        'eleves': 'Commencez par inscrire vos premiers élèves pour gérer leur parcours scolaire',
        'classes': 'Créez vos classes pour organiser les élèves par niveau et filière',
        'matieres': 'Ajoutez les matières enseignées dans votre établissement',
        'annees-scolaires': 'Configurez l\'année scolaire en cours pour commencer',
        'niveaux': 'Définissez les niveaux scolaires (CP, CE1, 6ème, etc.)',
        'filieres': 'Créez les filières (Générale, Technique, Professionnelle)',
        'periodes': 'Configurez les périodes d\'évaluation (Trimestres, Semestres)',
        'personnel': 'Ajoutez les membres du personnel administratif et technique',
        'enseignants': 'Enregistrez vos enseignants pour gérer les emplois du temps',
        'finances': 'Les données financières apparaîtront ici une fois configurées',
        'paiements': 'Les paiements effectués par les parents seront visibles ici',
        'factures': 'Générez des factures pour les frais scolaires et services',
        'notes': 'Saisissez les notes des élèves pour générer les bulletins',
        'bulletins': 'Générez les bulletins après avoir saisi les notes',
        'evaluations': 'Configurez les types d\'évaluation pour chaque matière',
        'salles': 'Ajoutez les salles de classe et espaces de l\'établissement',
        'materiel': 'Enregistrez le matériel et les équipements de l\'établissement',
        'annonces': 'Publiez des annonces pour informer la communauté scolaire',
        'messages': 'Les messages reçus apparaîtront ici',
        'cantine': 'Gérez les inscriptions et paiements de la cantine',
        'transport': 'Gérez les inscriptions et lignes de transport scolaire',
        'parametres': 'Configurez les paramètres de votre établissement',
        'etablissements': 'Ajoutez votre premier établissement pour commencer',
    };
    
    return descriptions[ressource] || 'Commencez par ajouter votre premier élément';
}

/**
 * Génère un label de bouton par défaut basé sur le type de ressource
 */
function getDefaultActionLabel(ressource: string): string {
    const labels: Record<string, string> = {
        'eleves': 'Inscrire un élève',
        'classes': 'Créer une classe',
        'matieres': 'Ajouter une matière',
        'annees-scolaires': 'Créer une année scolaire',
        'niveaux': 'Ajouter un niveau',
        'filieres': 'Créer une filière',
        'periodes': 'Créer une période',
        'personnel': 'Ajouter un membre',
        'enseignants': 'Ajouter un enseignant',
        'finances': 'Ajouter une transaction',
        'paiements': 'Enregistrer un paiement',
        'factures': 'Créer une facture',
        'notes': 'Saisir des notes',
        'bulletins': 'Générer un bulletin',
        'evaluations': 'Créer une évaluation',
        'salles': 'Ajouter une salle',
        'materiel': 'Ajouter du matériel',
        'annonces': 'Publier une annonce',
        'messages': 'Envoyer un message',
        'cantine': 'Inscrire à la cantine',
        'transport': 'Inscrire au transport',
        'parametres': 'Configurer',
        'etablissements': 'Ajouter un établissement',
    };
    
    return labels[ressource] || 'Ajouter';
}
