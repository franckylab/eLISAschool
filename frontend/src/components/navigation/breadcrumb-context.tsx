import { createContext, useContext, type ReactNode } from 'react';

const BreadcrumbContext = createContext<string | undefined>(undefined);

export function BreadcrumbLabelProvider({ value, children }: { value?: string; children: ReactNode }) {
    return (
        <BreadcrumbContext.Provider value={value}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useCurrentBreadcrumbLabel() {
    return useContext(BreadcrumbContext);
}
