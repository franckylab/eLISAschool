import type { ComponentConfig } from '@puckeditor/core';

export type FormulaireProps = { description: string };

export const FormulairePuck: ComponentConfig<FormulaireProps> = {
    fields: { description: { type: 'textarea' } },
    defaultProps: { description: 'Contactez-nous' },
    render({ description }) {
        return (
            <div className="mx-auto max-w-2xl space-y-4">
                {description && <p className="text-center text-sm text-gray-600 dark:text-gray-400">{description}</p>}
                <div className="rounded-xl border-2 border-dashed p-8 text-center opacity-50">
                    <p className="text-sm">Formulaire de contact (rendu interactif sur le site public)</p>
                    <p className="mt-2 text-xs">Champs : Nom, Email, Sujet, Message</p>
                </div>
            </div>
        );
    },
};
