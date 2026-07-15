import { Check, X } from 'lucide-react';

export type PermissionState = 'GRANTED' | 'DENIED' | null;

interface PermissionCheckboxProps {
    state: PermissionState;
    onToggle: () => void;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-5 w-5' };
const iconMap = { sm: 'h-3 w-3', md: 'h-3.5 w-3.5' };

const stateStyles: Record<string, string> = {
    GRANTED: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700',
    DENIED: 'bg-red-50 border-red-400 text-red-500 dark:bg-red-900/30 dark:border-red-500 hover:bg-red-100 dark:hover:bg-red-900/50',
    null: 'border-gray-300 dark:border-gray-500 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20',
};

const stateTitles: Record<string, string> = {
    GRANTED: 'Activée — cliquer pour refuser',
    DENIED: 'Refusée — cliquer pour réinitialiser',
    null: 'Non définie — cliquer pour activer',
};

export function PermissionCheckbox({ state, onToggle, disabled = false, size = 'sm' }: PermissionCheckboxProps) {
    const key = String(state);
    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`relative ${sizeMap[size]} rounded border flex items-center justify-center flex-shrink-0 transition-all duration-150
                ${stateStyles[key] ?? stateStyles.null}
                ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer active:scale-90'}
            `}
            title={stateTitles[key] ?? stateTitles.null}
        >
            {state === 'GRANTED' && <Check className={`${iconMap[size]} text-white`} />}
            {state === 'DENIED' && <X className={`${iconMap[size]}`} />}
        </button>
    );
}
