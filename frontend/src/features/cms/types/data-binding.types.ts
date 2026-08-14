/**
 * ==================================
 * Types Data Binding CMS
 * ==================================
 */

export interface BindingContexte {
    [key: string]: string | number | boolean | null | undefined;
}

export interface BindingVariable {
    key: string;
    label: string;
    value: string | number | boolean | null | undefined;
    category: string;
}

export interface BindingSource {
    name: string;
    variables: BindingVariable[];
}

export interface PreviewBindingResponse {
    contexte: BindingContexte;
    variables: BindingContexte;
}
