/**
 * ==================================
 * eLISAschool - FAQ Section
 * ==================================
 * Accordéon de questions fréquentes sur la facturation.
 *
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

// =============================================
// Types
// =============================================

interface FAQItem {
    q: string;
    r: string;
}

interface FAQSectionProps {
    className?: string;
}

// =============================================
// Composant
// =============================================

export function FAQSection({ className }: FAQSectionProps) {
    const { t } = useTranslation('billing');
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const baseId = useId();

    // Charger les items FAQ depuis i18n (fallback sur données hardcodées)
    const faqItems: FAQItem[] = t('faq.items', { returnObjects: true, defaultValue: [] as any }) as FAQItem[];
    const items = faqItems.length > 0 ? faqItems : [];

    return (
        <section className={cn('space-y-4', className)}>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[var(--color-texte)]">
                    {t('faq.titre', 'Questions fréquentes')}
                </h2>
                <p className="mt-2 text-[var(--color-texte-secondaire)]">
                    {t('faq.description', 'Tout ce que vous devez savoir sur nos plans et la facturation')}
                </p>
            </div>

            <div className="mx-auto max-w-3xl space-y-2">
                {items.map((item, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div
                            key={index}
                            className={cn(
                                'rounded-xl border transition-all',
                                isOpen
                                    ? 'border-[var(--color-dominante)]/30 bg-[var(--color-dominante)]/5'
                                    : 'border-[var(--color-bordure)] hover:border-[var(--color-dominante)]/20',
                            )}
                        >
                            <button
                                onClick={() => setOpenIndex(isOpen ? null : index)}
                                className="flex w-full items-center justify-between px-5 py-4 text-left"
                                aria-expanded={isOpen}
                                aria-controls={`${baseId}-panel-${index}`}
                                id={`${baseId}-header-${index}`}
                            >
                                <span className={cn(
                                    'text-sm font-medium transition-colors',
                                    isOpen ? 'text-[var(--color-dominante)]' : 'text-[var(--color-texte)]',
                                )}>
                                    {item.q}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 shrink-0 text-[var(--color-texte-secondaire)] transition-transform duration-200',
                                        isOpen && 'rotate-180 text-[var(--color-dominante)]',
                                    )}
                                />
                            </button>
                            {isOpen && (
                                <div
                                    className="px-5 pb-4"
                                    role="region"
                                    aria-labelledby={`${baseId}-header-${index}`}
                                    id={`${baseId}-panel-${index}`}
                                >
                                    <p className="text-sm leading-relaxed text-[var(--color-texte-secondaire)]">
                                        {item.r}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default FAQSection;
