/**
 * ==================================
 * eLISAschool - Organigramme Liste (TreeView)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Vue liste — wrapper autour du TreeView existant.
 * Pas de React Flow, affichage arborescent compact.
 */

import { useMemo, useState, useCallback } from 'react';
import { Building2, Briefcase, Users } from 'lucide-react';
import { TreeView, type TreeNode } from '@/components/ui/TreeView';
import { useTranslation } from 'react-i18next';
import type { OrganigrammeNode } from '../../types/organisation.types';

interface OrganigrammeListeProps {
    data: OrganigrammeNode[];
    onNodeSelect?: (unite: OrganigrammeNode) => void;
}

function convertirEnTreeNode(nodes: OrganigrammeNode[], t: (key: string, fallback?: string) => string): TreeNode<OrganigrammeNode>[] {
    return nodes.map((n) => ({
        id: n.id,
        label: `${n.nom}${n.code ? ` (${n.code})` : ''}`,
        data: n,
        icon: <Building2 className="h-4 w-4 text-[var(--color-dominant-600)]" />,
        badge: (
            <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                {n.echelonStructurelLabel && (
                    <span
                        className="px-1 py-0.5 rounded-full text-[9px] font-medium text-white/90"
                        style={{ backgroundColor: n.echelonStructurelCouleur || 'var(--color-dominant-400)' }}
                        title={n.echelonStructurelLabel}
                    >
                        {n.echelonStructurelLabel}
                    </span>
                )}
                <span className="flex items-center gap-0.5" title={t('organigramme.liste.postes', 'Postes')}>
                    <Briefcase className="h-3 w-3" />
                    {n.postes?.length || 0}
                </span>
                <span className="flex items-center gap-0.5" title={t('organigramme.liste.membres', 'Membres')}>
                    <Users className="h-3 w-3" />
                    {n.totalMembres || 0}
                </span>
                {(n.postesVacants || 0) > 0 && (
                    <span className="text-[var(--color-warning)] font-medium" title={t('organigramme.liste.postesVacants', 'Postes vacants')}>
                        {n.postesVacants}v
                    </span>
                )}
            </div>
        ),
        children: n.enfants?.length ? convertirEnTreeNode(n.enfants, t) : [],
    }));
}

export function OrganigrammeListe({ data, onNodeSelect }: OrganigrammeListeProps) {
    const { t } = useTranslation('organisation');
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const treeNodes = useMemo(() => convertirEnTreeNode(data, t), [data, t]);

    const handleSelect = useCallback((node: TreeNode<OrganigrammeNode>) => {
        setSelectedId(node.id);
        onNodeSelect?.(node.data);
    }, [onNodeSelect]);

    return (
        <div className="w-full h-full overflow-auto p-4">
            <TreeView
                nodes={treeNodes}
                onSelect={handleSelect}
                selectedId={selectedId}
                enableDrag={false}
            />
        </div>
    );
}
