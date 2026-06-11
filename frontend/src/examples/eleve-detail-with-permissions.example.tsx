/**
 * ==================================
 * eLISAschool - Exemple Page Détail Élève avec Onglets Sensibles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Exemple d'implémentation des permissions sur les onglets sensibles
 */

import { useState } from 'react';
import { useModulePermissions } from '@/hooks/use-permissions-advanced';
import { useCanViewSensitiveTab, useCanEditSensitiveTab } from '@/hooks/use-sensitive-tabs';
import { PermissionGate, PermissionButton } from '@/components/permissions';

export function EleveDetailPageExample() {
    const [activeTab, setActiveTab] = useState('info');

    // Permissions générales du module élèves
    const { canEdit, canDelete, canExport } = useModulePermissions('eleves');

    // Permissions pour onglets sensibles
    const canViewMedical = useCanViewSensitiveTab('eleves', 'medical');
    const canViewFinancier = useCanViewSensitiveTab('eleves', 'financier');
    const canViewDisciplinaire = useCanViewSensitiveTab('eleves', 'disciplinaire');

    // Permissions d'édition pour onglets sensibles
    const canEditMedical = useCanEditSensitiveTab('eleves', 'medical');
    const canEditFinancier = useCanEditSensitiveTab('eleves', 'financier');

    return (
        <div className="space-y-6">
            {/* Header avec boutons d'action */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Détail Élève</h1>

                <div className="flex gap-2">
                    {/* Bouton Éditer - contrôlé par permission */}
                    <PermissionGate permission="eleves:edit">
                        <button className="btn-primary">
                            Modifier
                        </button>
                    </PermissionGate>

                    {/* Bouton Export - contrôlé par permission */}
                    <PermissionGate permission="eleves:export">
                        <button className="btn-secondary">
                            Exporter
                        </button>
                    </PermissionGate>

                    {/* Bouton Supprimer - avec message */}
                    <PermissionButton
                        permission="eleves:delete"
                        disabledMessage="Suppression non autorisée"
                    >
                        <button className="btn-danger">
                            Supprimer
                        </button>
                    </PermissionButton>
                </div>
            </div>

            {/* Onglets - filtrés par permissions */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {/* Onglet Info - toujours visible */}
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'info'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Informations
                    </button>

                    {/* Onglet Médical - sensible */}
                    {canViewMedical && (
                        <button
                            onClick={() => setActiveTab('medical')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'medical'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Médical
                        </button>
                    )}

                    {/* Onglet Financier - sensible */}
                    {canViewFinancier && (
                        <button
                            onClick={() => setActiveTab('financier')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'financier'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Financier
                        </button>
                    )}

                    {/* Onglet Disciplinaire - sensible */}
                    {canViewDisciplinaire && (
                        <button
                            onClick={() => setActiveTab('disciplinaire')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'disciplinaire'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Disciplinaire
                        </button>
                    )}

                    {/* Onglet Notes - toujours visible si accès module */}
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'notes'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Notes
                    </button>
                </nav>
            </div>

            {/* Contenu des onglets */}
            <div className="mt-6">
                {activeTab === 'info' && (
                    <div className="space-y-4">
                        <h2>Informations Générales</h2>
                        {/* Contenu non sensible */}
                    </div>
                )}

                {activeTab === 'medical' && canViewMedical && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2>Dossier Médical</h2>

                            {/* Bouton édition médicale - permission sensible */}
                            {canEditMedical && (
                                <button className="btn-primary">
                                    Modifier dossier médical
                                </button>
                            )}
                        </div>

                        {/* Contenu médical - données sensibles */}
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                            <p className="text-sm text-yellow-800">
                                ⚠️ Données médicales confidentielles
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'financier' && canViewFinancier && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2>Historique Financier</h2>

                            {/* Bouton édition financière - permission sensible */}
                            {canEditFinancier && (
                                <button className="btn-primary">
                                    Ajuster paiement
                                </button>
                            )}
                        </div>

                        {/* Contenu financier - données sensibles */}
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Données financières */}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'disciplinaire' && canViewDisciplinaire && (
                    <div className="space-y-4">
                        <h2>Sanctions Disciplinaires</h2>
                        {/* Contenu disciplinaire */}
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <h2>Notes et Bulletins</h2>
                        {/* Contenu notes */}
                    </div>
                )}
            </div>
        </div>
    );
}

export default EleveDetailPageExample;
