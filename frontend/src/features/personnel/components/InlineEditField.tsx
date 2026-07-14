import { type ReactNode } from 'react';
import { Edit2, Save, X, Loader2, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InlineEditFieldProps {
    label: string;
    value: string | ReactNode;
    icon: LucideIcon;
    color: string;
    editable: boolean;
    loading?: boolean;
    children?: ReactNode;
    onStartEdit?: () => void;
    editing?: boolean;
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
}: InlineEditFieldProps) {
    const isStringValue = typeof value === 'string';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-xl p-4 border transition-all duration-200 hover:shadow-sm"
            style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}15`, color }}
                    >
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: `${color}cc` }}
                    >
                        {label}
                    </span>
                </div>
                {!editing && editable && (
                    <button
                        onClick={onStartEdit}
                        className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all shrink-0"
                        style={{ color: `${color}99` }}
                        title={`Modifier ${label.toLowerCase()}`}
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center gap-2 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color }} />
                    <span className="text-sm text-gray-400 dark:text-gray-300">Mise à jour...</span>
                </div>
            ) : editing ? (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            ) : isStringValue ? (
                <div className="text-lg font-bold truncate" style={{ color: `${color}dd` }}>
                    {value}
                </div>
            ) : (
                <div className="min-h-[2rem] flex items-center">
                    {value}
                </div>
            )}
        </motion.div>
    );
}

interface InlineEditActionsProps {
    onSave: () => void;
    onCancel: () => void;
    saving?: boolean;
    disabled?: boolean;
}

export function InlineEditActions({ onSave, onCancel, saving, disabled }: InlineEditActionsProps) {
    return (
        <div className="flex items-center gap-2 mt-3">
            <button
                onClick={onSave}
                disabled={disabled || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: disabled ? '#9ca3af' : '#22c55e' }}
            >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Valider
            </button>
            <button
                onClick={onCancel}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
                Annuler
            </button>
        </div>
    );
}