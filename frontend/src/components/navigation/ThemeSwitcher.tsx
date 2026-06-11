/**
 * ==================================
 * eLISAschool - ThemeSwitcher
 * ==================================
 * Sélection de couleur dominante + dark mode avec preview temps réel
 */

import { useState } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useThemeStore, type ModeTheme } from '@/stores/theme.store';
import { COULEURS_DOMINANTES } from '@/lib/theme-utils';
import { cn } from '@/lib/cn';

export function ThemeSwitcher() {
    const { couleurDominante, mode, setCouleurDominante, setMode } = useThemeStore();
    const [open, setOpen] = useState(false);

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-texte-secondaire)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-texte)]"
                    aria-label="Thème"
                    title="Personnaliser le thème"
                >
                    <Palette className="h-5 w-5" />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 w-64 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 shadow-lg"
                >
                    {/* Mode clair/sombre */}
                    <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase text-[var(--color-texte-secondaire)]">
                            Mode
                        </p>
                        <div className="flex gap-2">
                            {([
                                { value: 'light' as ModeTheme, icon: Sun, label: 'Clair' },
                                { value: 'dark' as ModeTheme, icon: Moon, label: 'Sombre' },
                            ]).map(({ value, icon: Icon, label }) => (
                                <button
                                    key={value}
                                    onClick={() => setMode(value)}
                                    className={cn(
                                        'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                                        mode === value
                                            ? 'bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]'
                                            : 'bg-[var(--color-fond)] text-[var(--color-texte-secondaire)] hover:text-[var(--color-texte)]',
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Couleurs */}
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-[var(--color-texte-secondaire)]">
                            Couleur
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                            {COULEURS_DOMINANTES.map((couleur) => (
                                <button
                                    key={couleur.valeur}
                                    onClick={() => setCouleurDominante(couleur.valeur)}
                                    className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110',
                                        couleurDominante === couleur.valeur
                                            ? 'border-[var(--color-texte)] scale-110'
                                            : 'border-transparent',
                                    )}
                                    style={{ backgroundColor: couleur.valeur }}
                                    title={couleur.nom}
                                    aria-label={couleur.nom}
                                />
                            ))}
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
