/**
 * ==================================
 * eLISAschool - SecuriteTab
 * ==================================
 * Composant principal de l'onglet Sécurité dans la page Configuration
 * 5 sous-sections: Authentification, Mots de passe, Sécurité avancée,
 * Protection & Monitoring, Actions de sécurité
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    Shield,
    Lock,
    Key,
    AlertTriangle,
    ShieldAlert,
    Info,
    Save,
    RotateCcw,
} from 'lucide-react';
import { useSecuriteConfig } from '../hooks/useSecuriteConfig';
import { SchoolLoading } from '@/components/feedback';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { ElisaToggle } from '@/components/ui/ElisaToggle';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { SecuriteActionCard } from './SecuriteActionCard';

export function SecuriteTab() {
    const { t } = useTranslation('securite-config');
    const {
        values,
        isLoading,
        isSaving,
        errors,
        updateValue,
        saveParametre,
        saveAll,
        resetChanges,
        hasChanges,
        executeAction,
        modificationsCount,
    } = useSecuriteConfig();

    if (isLoading) {
        return <SchoolLoading variant="compact" message="Chargement de la configuration..." />;
    }

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-texte)]">
                    {t('sections.securite.titre')}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">
                    {t('sections.securite.description')}
                </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {/* 1. Authentification & Sessions */}
                <SecuriteSection
                    icon={Shield}
                    titre={t('sections.securite.authentification.titre')}
                    description={t('sections.securite.authentification.description')}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ElisaSelect
                            label={t('sections.securite.authentification.session_duration.label')}
                            hint={t('sections.securite.authentification.session_duration.hint')}
                            value={String(values.session_duration || 1440)}
                            onValueChange={(val) => updateValue('session_duration', Number(val))}
                            options={[
                                { value: '15', label: t('sections.securite.authentification.session_duration.options.15') },
                                { value: '30', label: t('sections.securite.authentification.session_duration.options.30') },
                                { value: '60', label: t('sections.securite.authentification.session_duration.options.60') },
                                { value: '120', label: t('sections.securite.authentification.session_duration.options.120') },
                                { value: '240', label: t('sections.securite.authentification.session_duration.options.240') },
                                { value: '480', label: t('sections.securite.authentification.session_duration.options.480') },
                                { value: '1440', label: t('sections.securite.authentification.session_duration.options.1440') },
                            ]}
                        />

                        <ElisaInput
                            label={t('sections.securite.authentification.max_login_attempts.label')}
                            hint={t('sections.securite.authentification.max_login_attempts.hint')}
                            type="number"
                            min={3}
                            max={10}
                            value={String(values.max_login_attempts || 5)}
                            onChange={(e) => updateValue('max_login_attempts', Number(e.target.value))}
                            error={errors.max_login_attempts}
                        />

                        <ElisaSelect
                            label={t('sections.securite.authentification.lockout_duration.label')}
                            hint={t('sections.securite.authentification.lockout_duration.hint')}
                            value={String(values.lockout_duration || 15)}
                            onValueChange={(val) => {
                                updateValue('lockout_duration', Number(val));
                                saveParametre('lockout_duration');
                            }}
                            options={[
                                { value: '5', label: t('sections.securite.authentification.lockout_duration.options.5') },
                                { value: '15', label: t('sections.securite.authentification.lockout_duration.options.15') },
                                { value: '30', label: t('sections.securite.authentification.lockout_duration.options.30') },
                                { value: '60', label: t('sections.securite.authentification.lockout_duration.options.60') },
                                { value: '1440', label: t('sections.securite.authentification.lockout_duration.options.1440') },
                            ]}
                        />

                        <ElisaToggle
                            checked={values.require_2fa ?? false}
                            onCheckedChange={(val) => {
                                updateValue('require_2fa', val);
                                saveParametre('require_2fa');
                            }}
                            label={t('sections.securite.authentification.require_2fa.label')}
                            description={t('sections.securite.authentification.require_2fa.hint')}
                        />
                    </div>
                </SecuriteSection>

                {/* 2. Politique de Mots de Passe */}
                <SecuriteSection
                    icon={Lock}
                    titre={t('sections.securite.motsDePasse.titre')}
                    description={t('sections.securite.motsDePasse.description')}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ElisaInput
                            label={t('sections.securite.motsDePasse.password_min_length.label')}
                            hint={t('sections.securite.motsDePasse.password_min_length.hint')}
                            type="number"
                            min={6}
                            max={32}
                            value={String(values.password_min_length || 8)}
                            onChange={(e) => updateValue('password_min_length', Number(e.target.value))}
                            error={errors.password_min_length}
                        />

                        <ElisaInput
                            label={t('sections.securite.motsDePasse.password_history_count.label')}
                            hint={t('sections.securite.motsDePasse.password_history_count.hint')}
                            type="number"
                            min={0}
                            max={12}
                            value={String(values.password_history_count || 3)}
                            onChange={(e) => updateValue('password_history_count', Number(e.target.value))}
                            error={errors.password_history_count}
                        />

                        <ElisaSelect
                            label={t('sections.securite.motsDePasse.password_expiry_days.label')}
                            hint={t('sections.securite.motsDePasse.password_expiry_days.hint')}
                            value={String(values.password_expiry_days || 0)}
                            onValueChange={(val) => {
                                updateValue('password_expiry_days', Number(val));
                                saveParametre('password_expiry_days');
                            }}
                            options={[
                                { value: '0', label: t('sections.securite.motsDePasse.password_expiry_days.options.0') },
                                { value: '30', label: t('sections.securite.motsDePasse.password_expiry_days.options.30') },
                                { value: '60', label: t('sections.securite.motsDePasse.password_expiry_days.options.60') },
                                { value: '90', label: t('sections.securite.motsDePasse.password_expiry_days.options.90') },
                                { value: '180', label: t('sections.securite.motsDePasse.password_expiry_days.options.180') },
                                { value: '365', label: t('sections.securite.motsDePasse.password_expiry_days.options.365') },
                            ]}
                        />

                        <div className="space-y-3">
                            <ElisaToggle
                                checked={values.password_require_uppercase ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('password_require_uppercase', val);
                                    saveParametre('password_require_uppercase');
                                }}
                                label={t('sections.securite.motsDePasse.password_require_uppercase.label')}
                                description={t('sections.securite.motsDePasse.password_require_uppercase.hint')}
                            />

                            <ElisaToggle
                                checked={values.password_require_lowercase ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('password_require_lowercase', val);
                                    saveParametre('password_require_lowercase');
                                }}
                                label={t('sections.securite.motsDePasse.password_require_lowercase.label')}
                                description={t('sections.securite.motsDePasse.password_require_lowercase.hint')}
                            />

                            <ElisaToggle
                                checked={values.password_require_number ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('password_require_number', val);
                                    saveParametre('password_require_number');
                                }}
                                label={t('sections.securite.motsDePasse.password_require_number.label')}
                                description={t('sections.securite.motsDePasse.password_require_number.hint')}
                            />

                            <ElisaToggle
                                checked={values.password_require_special ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('password_require_special', val);
                                    saveParametre('password_require_special');
                                }}
                                label={t('sections.securite.motsDePasse.password_require_special.label')}
                                description={t('sections.securite.motsDePasse.password_require_special.hint')}
                            />
                        </div>
                    </div>
                </SecuriteSection>

                {/* 3. Sécurité Avancée */}
                <SecuriteSection
                    icon={Key}
                    titre={t('sections.securite.avancee.titre')}
                    description={t('sections.securite.avancee.description')}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ElisaInput
                            label={t('sections.securite.avancee.inactivity_timeout.label')}
                            hint={t('sections.securite.avancee.inactivity_timeout.hint')}
                            type="number"
                            min={5}
                            max={480}
                            value={String(values.inactivity_timeout || 30)}
                            onChange={(e) => updateValue('inactivity_timeout', Number(e.target.value))}
                            error={errors.inactivity_timeout}
                        />

                        <ElisaInput
                            label={t('sections.securite.avancee.ip_whitelist.label')}
                            hint={t('sections.securite.avancee.ip_whitelist.hint')}
                            placeholder={t('sections.securite.avancee.ip_whitelist.placeholder')}
                            value={values.ip_whitelist || ''}
                            onChange={(e) => updateValue('ip_whitelist', e.target.value)}
                            error={errors.ip_whitelist}
                            className="sm:col-span-2"
                        />

                        <div className="space-y-3">
                            <ElisaToggle
                                checked={values.require_email_verification ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('require_email_verification', val);
                                    saveParametre('require_email_verification');
                                }}
                                label={t('sections.securite.avancee.require_email_verification.label')}
                                description={t('sections.securite.avancee.require_email_verification.hint')}
                            />

                            <ElisaToggle
                                checked={values.allow_self_registration ?? false}
                                onCheckedChange={(val) => {
                                    updateValue('allow_self_registration', val);
                                    saveParametre('allow_self_registration');
                                }}
                                label={t('sections.securite.avancee.allow_self_registration.label')}
                                description={t('sections.securite.avancee.allow_self_registration.hint')}
                            />

                            <ElisaToggle
                                checked={values.log_sensitive_actions ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('log_sensitive_actions', val);
                                    saveParametre('log_sensitive_actions');
                                }}
                                label={t('sections.securite.avancee.log_sensitive_actions.label')}
                                description={t('sections.securite.avancee.log_sensitive_actions.hint')}
                            />
                        </div>
                    </div>
                </SecuriteSection>

                {/* 4. Protection & Monitoring */}
                <SecuriteSection
                    icon={AlertTriangle}
                    titre={t('sections.securite.protection.titre')}
                    description={t('sections.securite.protection.description')}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ElisaSelect
                            label={t('sections.securite.protection.rate_limiting.label')}
                            hint={t('sections.securite.protection.rate_limiting.hint')}
                            value={values.rate_limiting || 'medium'}
                            onValueChange={(val) => {
                                updateValue('rate_limiting', val as 'low' | 'medium' | 'high');
                                saveParametre('rate_limiting');
                            }}
                            options={[
                                { value: 'low', label: t('sections.securite.protection.rate_limiting.options.low') },
                                { value: 'medium', label: t('sections.securite.protection.rate_limiting.options.medium') },
                                { value: 'high', label: t('sections.securite.protection.rate_limiting.options.high') },
                            ]}
                        />

                        <div className="space-y-3">
                            <ElisaToggle
                                checked={values.brute_force_protection ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('brute_force_protection', val);
                                    saveParametre('brute_force_protection');
                                }}
                                label={t('sections.securite.protection.brute_force_protection.label')}
                                description={t('sections.securite.protection.brute_force_protection.hint')}
                            />

                            <ElisaToggle
                                checked={values.security_email_alerts ?? false}
                                onCheckedChange={(val) => {
                                    updateValue('security_email_alerts', val);
                                    saveParametre('security_email_alerts');
                                }}
                                label={t('sections.securite.protection.security_email_alerts.label')}
                                description={t('sections.securite.protection.security_email_alerts.hint')}
                            />

                            <ElisaToggle
                                checked={values.suspicious_activity_notifications ?? true}
                                onCheckedChange={(val) => {
                                    updateValue('suspicious_activity_notifications', val);
                                    saveParametre('suspicious_activity_notifications');
                                }}
                                label={t('sections.securite.protection.suspicious_activity_notifications.label')}
                                description={t('sections.securite.protection.suspicious_activity_notifications.hint')}
                            />
                        </div>
                    </div>
                </SecuriteSection>

                {/* 5. Actions de Sécurité */}
                <SecuriteSection
                    icon={ShieldAlert}
                    titre={t('sections.securite.actions.titre')}
                    description={t('sections.securite.actions.description')}
                >
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <SecuriteActionCard
                            action="invalidate-sessions"
                            onExecute={executeAction}
                            isLoading={isSaving}
                        />
                        <SecuriteActionCard
                            action="reset-login-attempts"
                            onExecute={executeAction}
                            isLoading={isSaving}
                        />
                        <SecuriteActionCard
                            action="force-password-reset"
                            onExecute={executeAction}
                            isLoading={isSaving}
                        />
                    </div>
                </SecuriteSection>
            </div>

            {/* Barre d'actions sticky */}
            {hasChanges && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="sticky bottom-4 rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 shadow-lg"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Info className="h-5 w-5 text-[var(--color-dominante)]" />
                            <span className="text-sm font-medium text-[var(--color-texte)]">
                                {t('messages.modificationsNonEnregistrees', { count: modificationsCount })}
                            </span>
                        </div>

                        <div className="flex gap-2">
                            <ElisaButton
                                variant="outline"
                                size="sm"
                                onClick={resetChanges}
                                icon={<RotateCcw className="h-4 w-4" />}
                            >
                                {t('boutons.reinitialiser')}
                            </ElisaButton>

                            <ElisaButton
                                variant="primary"
                                size="sm"
                                onClick={saveAll}
                                isLoading={isSaving}
                                loadingText="Enregistrement..."
                                icon={<Save className="h-4 w-4" />}
                            >
                                {t('boutons.enregistrer')}
                            </ElisaButton>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/**
 * Composant wrapper pour une section de sécurité
 */
function SecuriteSection({
    icon: Icon,
    titre,
    description,
    children,
}: {
    icon: React.ElementType;
    titre: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <motion.div
            className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg bg-[var(--color-dominante)]/10 p-2">
                    <Icon className="h-5 w-5 text-[var(--color-dominante)]" />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-[var(--color-texte)]">{titre}</h3>
                    <p className="mt-1 text-sm text-[var(--color-texte-secondaire)]">{description}</p>
                </div>
            </div>

            {children}
        </motion.div>
    );
}
