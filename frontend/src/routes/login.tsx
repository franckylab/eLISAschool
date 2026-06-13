/**
 * ==================================
 * eLISAschool - Login Route
 * ==================================
 * Route publique : page de connexion
 */

import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from '@/features/auth/LoginPage';
import { publicOnlyGuard } from '@/app/route-guards';

export const Route = createFileRoute('/login')({
    validateSearch: (search) => ({
        redirect: (search as Record<string, string>).redirect || undefined,
    }),
    component: LoginPage,
    beforeLoad: () => {
        publicOnlyGuard();
    },
});
