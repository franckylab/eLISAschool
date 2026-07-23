import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, User, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export interface PersonnelSearchResult {
    id: string;
    nom: string;
    prenom: string;
    matricule?: string;
    email?: string;
    posteExact?: string;
}

interface PersonnelSearchFieldProps {
    value: PersonnelSearchResult | null;
    onChange: (personnel: PersonnelSearchResult | null) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    typeCode?: string;
}

export function PersonnelSearchField({
    value,
    onChange,
    label,
    placeholder,
    error,
    typeCode,
}: PersonnelSearchFieldProps) {
    const { t } = useTranslation('organisation');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PersonnelSearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (!query.trim() || value) {
            setResults([]);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const params: Record<string, string | number> = { search: query.trim(), limit: 10 };
                if (typeCode) params.typeCode = typeCode;
                const raw = await apiClient.get('/api/personnel', params) as any;
                // La réponse est paginée : { success, data: { items: MembrePersonnel[], meta } }
                const membres = raw?.data?.items ?? raw?.data ?? [];
                const mapped: PersonnelSearchResult[] = membres.map((m: any) => ({
                    id: m.id,
                    nom: m.utilisateur?.profil?.nom ?? '',
                    prenom: m.utilisateur?.profil?.prenom ?? '',
                    matricule: m.matricule ?? '',
                    email: m.utilisateur?.email ?? '',
                    posteExact: m.posteExact ?? '',
                }));
                setResults(mapped);
            } catch (e) {
                console.error('[PersonnelSearchField] Erreur recherche:', e);
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, value]);

    if (value) {
        return (
            <div>
                {label && <label className="block text-sm font-medium text-secondary mb-1">{label}</label>}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                {value.prenom} {value.nom}
                            </p>
                            {value.matricule && (
                                <p className="text-xs text-muted-foreground">{value.matricule}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { onChange(null); setQuery(''); }}
                        className="text-xs text-destructive hover:text-destructive/80 font-medium"
                    >
                        {t('changer')}
                    </button>
                </div>
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            </div>
        );
    }

    return (
        <div>
            {label && <label className="block text-sm font-medium text-secondary mb-1">{label}</label>}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder || t('rechercherPersonnel')}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-card text-sm focus:ring-2 focus:ring-primary focus:border-primary ${
                        error ? 'border-destructive' : 'border-border'
                    }`}
                />
                {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
            {query && !searching && results.length > 0 && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-border rounded-lg bg-card divide-y divide-border">
                    {results.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onChange(p)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{p.prenom} {p.nom}</p>
                                <p className="text-xs text-muted-foreground">
                                    {p.matricule && <span>{p.matricule}</span>}
                                    {p.posteExact && <span>{p.matricule ? ' · ' : ''}{p.posteExact}</span>}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            {query && !searching && results.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">{t('aucunResultat')}</p>
            )}
        </div>
    );
}
