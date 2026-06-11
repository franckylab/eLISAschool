/**
 * ==================================
 * eLISAschool - LanguageSwitcher
 * ==================================
 * Toggle FR/EN avec hook useLanguage
 */

import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/cn';

export function LanguageSwitcher() {
    const { changerLangue, isFR } = useLanguage();

    return (
        <button
            onClick={() => changerLangue(isFR ? 'en' : 'fr')}
            className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
            aria-label={isFR ? 'Switch to English' : 'Passer en français'}
            title={isFR ? 'Switch to English' : 'Passer en français'}
        >
            <span className={cn('text-xs', isFR && 'font-bold text-[var(--color-texte)]')}>FR</span>
            <span className="text-xs text-[var(--color-bordure)]">/</span>
            <span className={cn('text-xs', !isFR && 'font-bold text-[var(--color-texte)]')}>EN</span>
        </button>
    );
}
