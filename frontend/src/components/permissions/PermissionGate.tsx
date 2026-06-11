/**
 * ==================================
 * eLISAschool - Composant PermissionGate
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant de contrôle conditionnel d'affichage basé sur les permissions
 * Permet de masquer/afficher des éléments UI selon les permissions de l'utilisateur
 */

import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';

interface PermissionGateProps {
    /** Permission requise pour afficher les enfants */
    permission: string;
    
    /** Permissions alternatives (au moins une requise) */
    permissions?: string[];
    
    /** UI alternative à afficher si la permission n'est pas accordée */
    fallback?: React.ReactNode;
    
    /** Contenu à afficher si la permission est accordée */
    children: React.ReactNode;
    
    /** Mode de vérification : 'any' (au moins une) ou 'all' (toutes) */
    mode?: 'any' | 'all';
    
    /** Affiche les enfants si l'utilisateur N'A PAS la permission (négation) */
    negate?: boolean;
    
    /** Tooltip à afficher sur le fallback (si fourni) */
    tooltip?: string;
}

/**
 * Composant de porte de permission pour contrôle conditionnel UI
 * 
 * @example Usage simple
 * <PermissionGate permission="eleves:create">
 *     <Button>Nouvel élève</Button>
 * </PermissionGate>
 * 
 * @example Avec fallback
 * <PermissionGate 
 *     permission="finances:remise:edit"
 *     fallback={<Tooltip>Permission requise pour modifier les remises</Tooltip>}
 * >
 *     <Input type="number" name="remise" />
 * </PermissionGate>
 * 
 * @example Avec plusieurs permissions (mode 'any')
 * <PermissionGate 
 *     permissions={['eleves:view', 'eleves:manage']}
 *     mode="any"
 * >
 *     <ModuleEleves />
 * </PermissionGate>
 * 
 * @example Avec négation (afficher si PAS la permission)
 * <PermissionGate permission="eleves:delete" negate>
 *     <Message>Vous ne pouvez pas supprimer cet élève</Message>
 * </PermissionGate>
 */
export function PermissionGate({
    permission,
    permissions,
    fallback = null,
    children,
    mode = 'any',
    negate = false,
    tooltip,
}: PermissionGateProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    // Déterminer si l'accès est accordé
    let hasAccess = false;

    if (permissions && permissions.length > 0) {
        // Vérification multiple
        hasAccess = mode === 'all' 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    } else if (permission) {
        // Vérification simple
        hasAccess = hasPermission(permission);
    }

    // Appliquer la négation si demandée
    if (negate) {
        hasAccess = !hasAccess;
    }

    // Rendu conditionnel
    if (hasAccess) {
        return <>{children}</>;
    }

    // Fallback avec tooltip optionnel
    if (tooltip && fallback) {
        return (
            <div title={tooltip} className="opacity-50 cursor-not-allowed">
                {fallback}
            </div>
        );
    }

    return <>{fallback}</>;
}

/**
 * Composant spécialisé pour les boutons avec permission
 * 
 * @example
 * <PermissionButton permission="eleves:create" variant="primary">
 *     <Plus /> Nouvel élève
 * </PermissionButton>
 */
interface PermissionButtonProps extends Omit<PermissionGateProps, 'fallback'> {
    /** Message à afficher dans le tooltip quand pas de permission */
    disabledMessage?: string;
    
    /** Classe CSS à appliquer quand désactivé */
    disabledClassName?: string;
}

export function PermissionButton({
    permission,
    permissions,
    disabledMessage = 'Action non autorisée',
    disabledClassName = 'opacity-50 cursor-not-allowed pointer-events-none',
    children,
    mode = 'any',
    ...props
}: PermissionButtonProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

    let hasAccess = false;

    if (permissions && permissions.length > 0) {
        hasAccess = mode === 'all' 
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    } else if (permission) {
        hasAccess = hasPermission(permission);
    }

    if (!hasAccess) {
        return (
            <div 
                title={disabledMessage} 
                className={disabledClassName}
            >
                {children}
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Composant pour afficher un message si pas de permission
 * 
 * @example
 * <PermissionMessage permission="rapports:finances:generate">
 *     Contactez l'administrateur pour accéder aux rapports financiers
 * </PermissionMessage>
 */
interface PermissionMessageProps {
    permission: string;
    children: React.ReactNode;
    /** Type de message: 'info', 'warning', 'error' */
    type?: 'info' | 'warning' | 'error';
}

export function PermissionMessage({
    permission,
    children,
    type = 'info',
}: PermissionMessageProps) {
    const { hasPermission } = usePermissions();

    if (hasPermission(permission)) {
        return null; // Ne rien afficher si la permission existe
    }

    const colors = {
        info: 'bg-blue-50 text-blue-800 border-blue-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        error: 'bg-red-50 text-red-800 border-red-200',
    };

    const icons = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '🚫',
    };

    return (
        <div className={`p-4 rounded-lg border ${colors[type]}`}>
            <div className="flex items-center gap-2">
                <span>{icons[type]}</span>
                <span className="font-medium">{children}</span>
            </div>
        </div>
    );
}

export default PermissionGate;
