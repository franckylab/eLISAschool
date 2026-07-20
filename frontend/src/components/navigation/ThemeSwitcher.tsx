import { Sun, Moon } from 'lucide-react';
import { useThemeStore, type ModeTheme } from '@/stores/theme.store';

export function ThemeSwitcher() {
    const { mode, setMode } = useThemeStore();

    const next: ModeTheme = mode === 'dark' ? 'light' : 'dark';

    return (
        <button
            onClick={() => setMode(next)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
            aria-label={mode === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
            title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
            {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    );
}
