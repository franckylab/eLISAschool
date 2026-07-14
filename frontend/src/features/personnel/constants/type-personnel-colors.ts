import {
    GraduationCap, Building2, ClipboardList, Wrench, Settings2, BookOpen, Users, UserRound,
    type LucideIcon,
} from 'lucide-react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary' | 'primary';

export const TYPE_PERSONNEL_COLORS: Record<string, string> = {
    ENSEIGNANT: '#22c55e',
    DIRECTION: '#a855f7',
    ADMINISTRATIF: '#3b82f6',
    TECHNIQUE: '#6b7280',
    SERVICE: '#f97316',
    STAGE: '#06b6d4',
    TEMPORAIRE: '#eab308',
};

export const TYPE_PERSONNEL_BADGE_VARIANTS: Record<string, BadgeVariant> = {
    ENSEIGNANT: 'success',
    DIRECTION: 'secondary',
    ADMINISTRATIF: 'primary',
    TECHNIQUE: 'secondary',
    SERVICE: 'warning',
    STAGE: 'default',
    TEMPORAIRE: 'default',
};

export const TYPE_PERSONNEL_ICONS: Record<string, LucideIcon> = {
    ENSEIGNANT: GraduationCap,
    DIRECTION: Building2,
    ADMINISTRATIF: ClipboardList,
    TECHNIQUE: Wrench,
    SERVICE: Settings2,
    STAGE: BookOpen,
    TEMPORAIRE: Users,
};

export function getTypeColor(code?: string): string {
    return (code && TYPE_PERSONNEL_COLORS[code]) || '#6b7280';
}

export function getTypeBadgeVariant(code?: string): BadgeVariant {
    return (code && TYPE_PERSONNEL_BADGE_VARIANTS[code]) || 'default';
}

export function getTypeIcon(code?: string): LucideIcon {
    return (code && TYPE_PERSONNEL_ICONS[code]) || UserRound;
}
