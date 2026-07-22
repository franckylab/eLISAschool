import { createFileRoute } from '@tanstack/react-router';
import { TemplatesPage } from '@/features/organisation/components/templates-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/templates')({
    component: TemplatesPage,
});
