/**
 * TelechargementsSection — Lazy-loaded
 * Liste de fichiers téléchargeables.
 */

export function TelechargementsSection({ contenu }: { contenu: Record<string, any> }) {
    const fichiers: any[] = contenu.fichiers || [];
    return (
        <div className="space-y-3">
            {fichiers.map((f: any, i: number) => (
                <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    style={{ borderColor: 'var(--cms-primary)' + '20' }}
                >
                    <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                        style={{ backgroundColor: 'var(--cms-primary)' + '15' }}
                    >
                        📄
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{f.nom}</p>
                        {f.description && <p className="truncate text-xs opacity-50">{f.description}</p>}
                    </div>
                    {f.taille && <span className="shrink-0 text-xs opacity-40">{f.taille}</span>}
                </a>
            ))}
        </div>
    );
}

export default TelechargementsSection;
