/**
 * ==================================
 * eLISAschool - Landing Page Route
 * ==================================
 * Route publique : page d'accueil marketing
 */

import { createFileRoute } from '@tanstack/react-router';
import { LandingPage } from '@/features/landing/LandingPage';
import { publicOnlyGuard } from '@/app/route-guards';

export const Route = createFileRoute('/')({
    component: LandingPage,
    beforeLoad: () => {
        // Pas de guard sur la landing — accessible même connecté
        // publicOnlyGuard(); // Décommenter pour rediriger les connectés
    },
});
