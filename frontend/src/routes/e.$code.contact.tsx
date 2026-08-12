/**
 * ==================================
 * eLISAschool - Page contact publique établissement
 * ==================================
 * Route: /e/:code/contact
 * Formulaire de contact + carte GPS + infos établissement.
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useEtablissementPublic, useThemePublic, useMenusPublic, usePagesPubliques, envoyerContactPublic } from '@/features/cms/hooks/use-cms-public';
import { PublicLayout } from '@/features/cms/components/PublicLayout';
import { CmsPageRenderer } from '@/features/cms/components/CmsPageRenderer';
import { Mail, Phone, MapPin, Clock, Globe, Facebook, Twitter, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionType } from '@/features/cms/types/cms.types';

export const Route = createFileRoute('/e/$code/contact')({
    component: PageContactPublique,
});

function PageContactPublique() {
    const { code } = Route.useParams();
    const { data: etab } = useEtablissementPublic(code);
    const { data: theme } = useThemePublic(code);
    const { data: menus } = useMenusPublic(code);
    const { data: pages } = usePagesPubliques(code);

    const pageContact = pages?.find(p => p.template === 'contact' || p.slug === 'contact');
    const sectionsContact = pageContact?.sections || [];

    // État formulaire
    const [formNom, setFormNom] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formSujet, setFormSujet] = useState('');
    const [formMessage, setFormMessage] = useState('');
    const [envoiEtat, setEnvoiEtat] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [erreurMsg, setErreurMsg] = useState('');

    const primaryColor = theme?.couleurs?.primaire || '#28a745';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnvoiEtat('loading');
        setErreurMsg('');
        try {
            await envoyerContactPublic(code, {
                nom: formNom,
                email: formEmail,
                sujet: formSujet,
                message: formMessage,
            });
            setEnvoiEtat('success');
            setFormNom('');
            setFormEmail('');
            setFormSujet('');
            setFormMessage('');
        } catch (err: any) {
            setEnvoiEtat('error');
            setErreurMsg(err?.message || 'Erreur lors de l\'envoi');
        }
    };

    if (!etab) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
            </div>
        );
    }

    const inputStyle = {
        borderColor: 'var(--cms-text, #1a1a2e)',
        backgroundColor: 'var(--cms-bg, #ffffff)',
        color: 'var(--cms-text, #1a1a2e)',
        fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)',
    };

    return (
        <PublicLayout etablissement={etab} theme={theme} menus={menus || []}>
            {/* Sections CMS hors formulaire (hero, texte, etc.) */}
            {sectionsContact.filter(s => s.type !== SectionType.FORMULAIRE).length > 0 && (
                <CmsPageRenderer
                    sections={sectionsContact.filter(s => s.type !== SectionType.FORMULAIRE)}
                    theme={theme}
                    etablissement={etab}
                    codeEtablissement={code}
                />
            )}

            <div className="mx-auto max-w-6xl px-4 py-10">
                {/* Titre */}
                <div className="mb-10 text-center">
                    <h1
                        className="mb-2 font-bold"
                        style={{
                            fontSize: 'clamp(1.5rem, 1rem + 2.5vw, 2.5rem)',
                            color: primaryColor,
                            fontFamily: 'var(--cms-font-title)',
                        }}
                    >
                        Contactez-nous
                    </h1>
                    <p className="text-sm opacity-60">Nous vous répondrons dans les plus brefs délais</p>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Colonne gauche — Informations */}
                    <div className="space-y-6">
                        {/* Coordonnées */}
                        <div className="rounded-xl border p-6" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                            <h2 className="mb-4 text-lg font-semibold">Coordonnées</h2>
                            <div className="space-y-4">
                                {etab.contactEmail && (
                                    <div className="flex items-start gap-3">
                                        <Mail className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                                        <div>
                                            <p className="text-xs font-medium opacity-60">Email</p>
                                            <a href={`mailto:${etab.contactEmail}`} className="text-sm hover:underline">
                                                {etab.contactEmail}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {etab.contactTelephone && (
                                    <div className="flex items-start gap-3">
                                        <Phone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                                        <div>
                                            <p className="text-xs font-medium opacity-60">Téléphone</p>
                                            <a href={`tel:${etab.contactTelephone}`} className="text-sm hover:underline">
                                                {etab.contactTelephone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                                    <div>
                                        <p className="text-xs font-medium opacity-60">Adresse</p>
                                        <p className="text-sm">
                                            {[etab.adresse, etab.quartier, etab.ville, etab.pays].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                                {(etab.heuresOuverture || etab.heuresFermeture) && (
                                    <div className="flex items-start gap-3">
                                        <Clock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: primaryColor }} />
                                        <div>
                                            <p className="text-xs font-medium opacity-60">Horaires</p>
                                            <p className="text-sm">
                                                {etab.heuresOuverture && `Ouverture: ${etab.heuresOuverture}`}
                                                {etab.heuresFermeture && ` — Fermeture: ${etab.heuresFermeture}`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Réseaux sociaux */}
                        {(etab.facebook || etab.twitter || etab.siteWeb) && (
                            <div className="rounded-xl border p-6" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                                <h2 className="mb-4 text-lg font-semibold">Suivez-nous</h2>
                                <div className="flex gap-3">
                                    {etab.siteWeb && (
                                        <a
                                            href={etab.siteWeb}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                                            style={{ backgroundColor: primaryColor, color: '#fff' }}
                                        >
                                            <Globe className="h-5 w-5" />
                                        </a>
                                    )}
                                    {etab.facebook && (
                                        <a
                                            href={etab.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                                            style={{ backgroundColor: '#1877f2', color: '#fff' }}
                                        >
                                            <Facebook className="h-5 w-5" />
                                        </a>
                                    )}
                                    {etab.twitter && (
                                        <a
                                            href={etab.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                                            style={{ backgroundColor: '#1da1f2', color: '#fff' }}
                                        >
                                            <Twitter className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Carte GPS */}
                        {etab.latitude && etab.longitude && (
                            <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                                <iframe
                                    title="Localisation"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${etab.longitude - 0.005},${etab.latitude - 0.003},${etab.longitude + 0.005},${etab.latitude + 0.003}&layer=mapnik&marker=${etab.latitude},${etab.longitude}`}
                                    className="h-64 w-full border-0"
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>

                    {/* Colonne droite — Formulaire */}
                    <div className="rounded-xl border p-6" style={{ borderColor: 'rgba(128,128,128,0.2)' }}>
                        <h2 className="mb-6 text-lg font-semibold">Envoyez-nous un message</h2>

                        {envoiEtat === 'success' ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CheckCircle className="mb-4 h-16 w-16" style={{ color: primaryColor }} />
                                <h3 className="mb-2 text-lg font-semibold">Message envoyé !</h3>
                                <p className="text-sm opacity-60">Nous vous répondrons dans les plus brefs délais.</p>
                                <button
                                    onClick={() => setEnvoiEtat('idle')}
                                    className="mt-6 rounded-lg px-4 py-2 text-sm font-medium text-white"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    Envoyer un autre message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Nom complet *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formNom}
                                        onChange={(e) => setFormNom(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
                                        style={{ ...inputStyle, borderWidth: '1px' }}
                                        placeholder="Votre nom"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
                                        style={{ ...inputStyle, borderWidth: '1px' }}
                                        placeholder="votre@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Sujet *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formSujet}
                                        onChange={(e) => setFormSujet(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2"
                                        style={{ ...inputStyle, borderWidth: '1px' }}
                                        placeholder="Objet de votre message"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Message *</label>
                                    <textarea
                                        required
                                        rows={5}
                                        value={formMessage}
                                        onChange={(e) => setFormMessage(e.target.value)}
                                        className="w-full rounded-lg border px-3 py-2.5 outline-none focus:ring-2 resize-y"
                                        style={{ ...inputStyle, borderWidth: '1px' }}
                                        placeholder="Votre message..."
                                    />
                                </div>

                                {envoiEtat === 'error' && (
                                    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {erreurMsg || 'Une erreur est survenue'}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={envoiEtat === 'loading'}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                    style={{ backgroundColor: primaryColor }}
                                >
                                    {envoiEtat === 'loading' ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Envoyer le message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
