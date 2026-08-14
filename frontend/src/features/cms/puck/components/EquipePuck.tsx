import type { ComponentConfig } from '@puckeditor/core';

export type EquipeProps = {
    membres: { _id: string; nom: string; photo: string; fonction: string; bio: string; email: string; linkedin: string; twitter: string }[];
};

export const EquipePuck: ComponentConfig<EquipeProps> = {
    fields: {
        membres: {
            type: 'array',
            arrayFields: {
                nom: { type: 'text' },
                photo: { type: 'text' },
                fonction: { type: 'text' },
                bio: { type: 'textarea' },
                email: { type: 'text' },
                linkedin: { type: 'text' },
                twitter: { type: 'text' },
            },
        },
    },
    defaultProps: { membres: [] },
    render({ membres }) {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {membres.map((m, i) => (
                    <div key={i} className="text-center space-y-3 rounded-xl p-4">
                        {m.photo ? (
                            <img src={m.photo} alt={m.nom} className="mx-auto h-24 w-24 rounded-full object-cover ring-2 ring-primary/30" />
                        ) : (
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
                                <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h4 className="font-bold">{m.nom || 'Nom'}</h4>
                            <span className="inline-block mt-1 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">{m.fonction}</span>
                        </div>
                        {m.bio && <p className="text-xs opacity-50">{m.bio}</p>}
                    </div>
                ))}
            </div>
        );
    },
};
