import type { ComponentConfig } from '@puckeditor/core';

export type FaqProps = {
    faqs: { _id: string; question: string; reponse: string }[];
};

export const FaqPuck: ComponentConfig<FaqProps> = {
    fields: {
        faqs: {
            type: 'array',
            arrayFields: {
                question: { type: 'text' },
                reponse: { type: 'textarea' },
            },
        },
    },
    defaultProps: { faqs: [] },
    render({ faqs }) {
        return (
            <div className="mx-auto max-w-3xl space-y-3">
                {faqs.length === 0 && <p className="text-center text-sm opacity-50">Ajoutez des questions fréquentes</p>}
                {faqs.map((faq, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border">
                        <div className="flex w-full items-center justify-between px-6 py-4 text-left font-medium">
                            <span className="pr-4">{faq.question || 'Question'}</span>
                            <span className="ml-4 shrink-0 text-xl">▾</span>
                        </div>
                        <div className="border-t px-6 pb-4 pt-2 text-sm leading-relaxed opacity-70">
                            {faq.reponse}
                        </div>
                    </div>
                ))}
            </div>
        );
    },
};
