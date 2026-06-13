/**
 * ==================================
 * eLISAschool - Verify Email Route
 * ==================================
 */

import { createFileRoute } from '@tanstack/react-router';
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage';

export const Route = createFileRoute('/verify-email')({
    validateSearch: (search) => ({
        token: (search as Record<string, string>).token || '',
    }),
    component: VerifyEmailPage,
});
