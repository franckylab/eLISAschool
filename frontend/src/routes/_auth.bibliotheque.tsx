/**
 * ==================================
 * eLISAschool - Route Bibliothèque
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { BibliothequePage } from '@/features/bibliotheque';

export const Route = createFileRoute('/_auth/bibliotheque')({
    component: BibliothequePage,
});
