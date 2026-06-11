/**
 * ==================================
 * eLISAschool - Formulaire Modal Utilisateur
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Modal de création/édition d'utilisateur avec validation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Shield, Calendar, MapPin } from 'lucide-react';
import { useCreerUtilisateur, useModifierUtilisateur } from '../hooks/use-utilisateurs';
import { useTousRoles } from '../hooks/use-roles-permissions';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import type { Utilisateur, CreerUtilisateurDto } from '../types/utilisateur.types';

interface UtilisateurFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'creation' | 'edition';
    utilisateur?: Utilisateur;
}

export function UtilisateurFormModal({ 
    open, 
    onOpenChange, 
    mode, 
    utilisateur 
}: UtilisateurFormModalProps) {
    const creer = useCreerUtilisateur();
    const modifier = useModifierUtilisateur();
    const { data: roles } = useTousRoles();

    const [formData, setFormData] = useState<CreerUtilisateurDto>({
        email: '',
        nom: '',
        prenom: '',
        telephone: '',
        role: '',
        motDePasse: '',
        etablissementId: '',
        profil: {
            adresse: '',
            dateNaissance: '',
            sexe: 'M',
        },
    });

    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    // Initialiser le formulaire en mode édition
    useEffect(() => {
        if (mode === 'edition' && utilisateur) {
            setFormData({
                email: utilisateur.email,
                nom: utilisateur.nom,
                prenom: utilisateur.prenom,
                telephone: utilisateur.telephone || '',
                role: utilisateur.role,
                motDePasse: '', // Ne pas pré-remplir le mot de passe
                etablissementId: utilisateur.etablissementId,
                profil: {
                    adresse: utilisateur.profil?.adresse || '',
                    dateNaissance: utilisateur.profil?.dateNaissance || '',
                    sexe: utilisateur.profil?.sexe || 'M',
                },
            });
        }
    }, [mode, utilisateur, open]);

    const validerFormulaire = (): boolean => {
        const nouvellesErreurs: Record<string, string> = {};

        if (!formData.email) {
            nouvellesErreurs.email = 'L\'email est requis';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            nouvellesErreurs.email = 'Email invalide';
        }

        if (!formData.nom) nouvellesErreurs.nom = 'Le nom est requis';
        if (!formData.prenom) nouvellesErreurs.prenom = 'Le prénom est requis';
        if (!formData.role) nouvellesErreurs.role = 'Le rôle est requis';

        if (mode === 'creation' && !formData.motDePasse) {
            nouvellesErreurs.motDePasse = 'Le mot de passe est requis';
        } else if (formData.motDePasse && formData.motDePasse.length < 8) {
            nouvellesErreurs.motDePasse = 'Le mot de passe doit contenir au moins 8 caractères';
        }

        setErreurs(nouvellesErreurs);
        return Object.keys(nouvellesErreurs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validerFormulaire()) return;

        try {
            if (mode === 'creation') {
                await creer.mutateAsync(formData);
            } else if (utilisateur) {
                await modifier.mutateAsync({ id: utilisateur.id, ...formData });
            }
            onOpenChange(false);
        } catch (error) {
            // Erreur déjà gérée par le hook
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Effacer l'erreur quand l'utilisateur modifie le champ
        if (erreurs[field]) {
            setErreurs(prev => {
                const newErreurs = { ...prev };
                delete newErreurs[field];
                return newErreurs;
            });
        }
    };

    const isLoading = creer.isPending || modifier.isPending;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={() => onOpenChange(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div 
                            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {mode === 'creation' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {mode === 'creation' 
                                            ? 'Créer un nouveau compte utilisateur' 
                                            : 'Modifier les informations de l\'utilisateur'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="Fermer"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Formulaire */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* Section Informations */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Informations personnelles
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ElisaInput
                                            label="Prénom"
                                            value={formData.prenom}
                                            onChange={(e) => handleChange('prenom', e.target.value)}
                                            erreur={erreurs.prenom}
                                            placeholder="Jean"
                                            required
                                        />
                                        <ElisaInput
                                            label="Nom"
                                            value={formData.nom}
                                            onChange={(e) => handleChange('nom', e.target.value)}
                                            erreur={erreurs.nom}
                                            placeholder="Dupont"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Section Contact */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Mail className="h-5 w-5" />
                                        Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ElisaInput
                                            label="Email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            erreur={erreurs.email}
                                            placeholder="jean.dupont@exemple.com"
                                            icon={<Mail className="h-4 w-4" />}
                                            required
                                        />
                                        <ElisaInput
                                            label="Téléphone"
                                            type="tel"
                                            value={formData.telephone || ''}
                                            onChange={(e) => handleChange('telephone', e.target.value)}
                                            placeholder="+237 6XX XXX XXX"
                                            icon={<Phone className="h-4 w-4" />}
                                        />
                                    </div>
                                </div>

                                {/* Section Sécurité */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Sécurité et rôle
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Rôle <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => handleChange('role', e.target.value)}
                                                className={`w-full rounded-lg border ${erreurs.role ? 'border-red-500' : 'border-gray-300'} bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                            >
                                                <option value="">Sélectionner un rôle</option>
                                                {roles?.map((role) => (
                                                    <option key={role.id} value={role.code}>
                                                        {role.nom}
                                                    </option>
                                                ))}
                                            </select>
                                            {erreurs.role && (
                                                <p className="mt-1 text-sm text-red-600">{erreurs.role}</p>
                                            )}
                                        </div>

                                        {mode === 'creation' && (
                                            <ElisaInput
                                                label="Mot de passe"
                                                type="password"
                                                value={formData.motDePasse}
                                                onChange={(e) => handleChange('motDePasse', e.target.value)}
                                                erreur={erreurs.motDePasse}
                                                placeholder="••••••••"
                                                required
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Section Profil */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Profil (optionnel)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ElisaInput
                                            label="Date de naissance"
                                            type="date"
                                            value={formData.profil?.dateNaissance || ''}
                                            onChange={(e) => handleChange('profil', { ...formData.profil, dateNaissance: e.target.value })}
                                            icon={<Calendar className="h-4 w-4" />}
                                        />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Sexe
                                            </label>
                                            <select
                                                value={formData.profil?.sexe || 'M'}
                                                onChange={(e) => handleChange('profil', { ...formData.profil, sexe: e.target.value })}
                                                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="M">Masculin</option>
                                                <option value="F">Féminin</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <ElisaInput
                                                label="Adresse"
                                                value={formData.profil?.adresse || ''}
                                                onChange={(e) => handleChange('profil', { ...formData.profil, adresse: e.target.value })}
                                                placeholder="Adresse complète"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                    <ElisaButton
                                        type="button"
                                        variant="outline"
                                        onClick={() => onOpenChange(false)}
                                        disabled={isLoading}
                                    >
                                        Annuler
                                    </ElisaButton>
                                    <ElisaButton
                                        type="submit"
                                        variant="primary"
                                        isLoading={isLoading}
                                    >
                                        {mode === 'creation' ? 'Créer l\'utilisateur' : 'Enregistrer'}
                                    </ElisaButton>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
