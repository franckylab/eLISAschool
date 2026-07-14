import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, User, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface PersonnelSearchResult {
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
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (!query.trim() || value) {
            setResults([]);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const params: Record<string, any> = { search: query.trim(), limit: 10 };
                if (typeCode) params.typeCode = typeCode;
                const response = await apiClient.get<PersonnelSearchResult[]>('/api/personnel', params);
                setResults(response.data || []);
            } catch {
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
                {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {value.prenom} {value.nom}
                            </p>
                            {value.matricule && (
                                <p className="text-xs text-gray-500">{value.matricule}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { onChange(null); setQuery(''); }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                        {t('changer')}
                    </button>
                </div>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }

    return (
        <div>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder || t('rechercherPersonnel')}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                />
                {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            {query && !searching && results.length > 0 && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                    {results.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onChange(p)}
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                        >
                            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                <User className="h-3.5 w-3.5 text-gray-500" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{p.prenom} {p.nom}</p>
                                <p className="text-xs text-gray-500">
                                    {p.matricule && <span>{p.matricule}</span>}
                                    {p.posteExact && <span>{p.matricule ? ' · ' : ''}{p.posteExact}</span>}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            {query && !searching && results.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">{t('aucunResultat')}</p>
            )}
        </div>
    );
}
