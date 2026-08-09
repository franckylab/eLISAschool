/**
 * ==================================
 * eLISAschool - MFA Verify Route
 * ==================================
 * Route publique : vérification du code MFA après login
 * Accessible uniquement si le store a mfaRequired = true
 */

import { createFileRoute } from '@tanstack/react-router';
import { MFAVerifyPage } from '@/features/auth/MFAVerifyPage';

export const Route = createFileRoute('/mfa-verify')({
    component: MFAVerifyPage,
});
