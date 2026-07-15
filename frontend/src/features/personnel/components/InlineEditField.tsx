import { type ReactNode } from 'react';
import { Edit2, Save, X, Loader2, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface InlineEditFieldProps {
    label: string;
    value: string | ReactNode;
    icon: LucideIcon;
    /** @deprecated Utilise désormais les tons du thème */
    color?: string;
    editable: boolean;
    loading?: boolean;
    children?: ReactNode;
    onStartEdit?: () => void;
    editing?: boolean;
    className?: string;
}

export function InlineEditField({
    label,
    value,
    icon: Icon,
    color,
    editable,
    loading,
    children,
    onStartEdit,
    editing,
    className,
}: InlineEditFieldProps) {
    const isStringValue = typeof value === 'string';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'relative rounded-xl border border-border bg-card/50 hover:bg-card hover:shadow-sm transition-all duration-200 px-[clamp(0.625rem,2vw,1rem)] py-[clamp(0.5rem,1.5vw,0.75rem)]',
                editing && 'bg-card shadow-sm',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-[clamp(0.375rem,1.25vw,0.75rem)]">
                <div className="flex items-center gap-[clamp(0.375rem,1vw,0.5rem)] min-w-0 flex-1">
                    <div
                        className="h-[clamp(1.5rem,4vw,1.75rem)] w-[clamp(1.5rem,4vw,1.75rem)] rounded-lg flex items-center justify-center shrink-0 bg-[var(--color-surface-alt)]"
                        style={color ? { backgroundColor: `${color}15` } : undefined}
                    >
                        <Icon
                            className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)] text-muted-foreground"
                            style={color ? { color } : undefined}
                        />
                    </div>
                    <span className="text-[clamp(0.5625rem,1.25vw,0.6875rem)] font-semibold uppercase tracking-wider text-text-muted truncate leading-tight">
                        {label}
                    </span>
                </div>

                {!editing && (
                    <div className="flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] shrink-0">
                        {loading ? (
                            <Loader2 className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)] animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                {isStringValue ? (
                                    <span className="text-[clamp(0.75rem,1.5vw,0.875rem)] font-medium text-card-foreground truncate max-w-[clamp(4rem,15vw,10rem)] leading-tight">
                                        {value}
                                    </span>
                                ) : (
                                    <div className="flex items-center">{value}</div>
                                )}
                                {editable && (
                                    <button
                                        onClick={onStartEdit}
                                        className="p-[clamp(0.1875rem,0.5vw,0.25rem)] rounded-md hover:bg-surface-alt transition-colors text-muted-foreground hover:text-foreground"
                                        title={`Modifier ${label.toLowerCase()}`}
                                    >
                                        <Edit2 className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)]" />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {editing && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-[clamp(0.5rem,1.5vw,0.75rem)] pt-[clamp(0.5rem,1.5vw,0.75rem)] border-t border-border"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            )}
        </motion.div>
    );
}

export interface InlineEditActionsProps {
    onSave: () => void;
    onCancel: () => void;
    saving?: boolean;
    disabled?: boolean;
}

export function InlineEditActions({ onSave, onCancel, saving, disabled }: InlineEditActionsProps) {
    return (
        <div className="flex items-center justify-end gap-[clamp(0.375rem,1vw,0.5rem)] mt-[clamp(0.375rem,1vw,0.5rem)]">
            <button
                onClick={onCancel}
                disabled={saving}
                className="inline-flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.25rem,0.75vw,0.375rem)] text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium text-text-secondary bg-surface-alt hover:bg-surface-hover rounded-lg transition-colors disabled:opacity-50"
            >
                <X className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)]" />
                Annuler
            </button>
            <button
                onClick={onSave}
                disabled={disabled || saving}
                className="inline-flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.25rem,0.75vw,0.375rem)] text-[clamp(0.75rem,1.25vw,0.875rem)] font-medium text-white bg-success hover:opacity-90 rounded-lg transition-all disabled:opacity-50 active:scale-[0.97]"
            >
                {saving ? <Loader2 className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)] animate-spin" /> : <Save className="h-[clamp(0.75rem,1.5vw,0.875rem)] w-[clamp(0.75rem,1.5vw,0.875rem)]" />}
                Valider
            </button>
        </div>
    );
}
