/**
 * eLISAschool - Platform Audit
 * Audit global — logs TOUS établissements
 * Phase 1.2
 */

import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AuditPage } from '@/features/admin/components/audit-page';

function PlatformAuditPage() {
    const { t } = useTranslation('admin');
    return (
        <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
            <div className="mb-[var(--space-md)]">
                <h1 className="font-bold text-[var(--color-texte)]" style={{ fontSize: 'clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem)' }}>{t('audit.titre')}</h1>
                <p style={{ fontSize: 'clamp(0.75rem, 0.68rem + 0.25vw, 0.875rem)', color: 'var(--color-texte-muted)' }}>
                    {t('audit.sousTitre')}
                </p>
            </div>
            <AuditPage />
        </div>
    );
}

export const Route = createFileRoute('/platform/audit')({
    component: PlatformAuditPage,
});
