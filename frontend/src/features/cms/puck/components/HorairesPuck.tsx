import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

export type HorairesProps = {
    horaires: { _id: string; jour: string; horaires: string }[];
    styleConfig?: any;
};

export const HorairesPuck: ComponentConfig<HorairesProps> = {
    fields: {
        horaires: {
            type: 'array',
            arrayFields: {
                jour: { type: 'text' },
                horaires: { type: 'text' },
            },
        },
    },
    defaultProps: { horaires: [] },
    render({ horaires, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-primary/10">
                            <th className="px-4 py-3 text-left font-semibold">Jour</th>
                            <th className="px-4 py-3 text-left font-semibold">Horaires</th>
                        </tr>
                    </thead>
                    <tbody>
                        {horaires.map((h, i) => (
                            <tr key={i} className="border-t">
                                <td className="px-4 py-3 font-medium">{h.jour || 'Jour'}</td>
                                <td className="px-4 py-3 opacity-70">{h.horaires || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </SectionWrapper>
        );
    },
};
