import { useTranslation } from 'react-i18next';

export function useEnumOptions<T extends string>(
    namespace: string,
    values: readonly T[] | T[],
    keyPrefix: string,
): { value: T; label: string }[] {
    const { t } = useTranslation(namespace);
    return values.map((value) => ({
        value,
        label: t(`${keyPrefix}_${value}`),
    }));
}
