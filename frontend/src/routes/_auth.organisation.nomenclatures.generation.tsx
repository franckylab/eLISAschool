import { createFileRoute } from '@tanstack/react-router';
import { GenerationPage } from '@/features/organisation/components/generation-page';

export const Route = createFileRoute('/_auth/organisation/nomenclatures/generation')({
    component: GenerationPage,
});
