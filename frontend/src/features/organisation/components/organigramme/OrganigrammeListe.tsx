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
import { Building2 } from 'lucide-react';
import { TreeView, type TreeNode } from '@/components/ui/TreeView';
import type { OrganigrammeNode } from '../../types/organisation.types';

interface OrganigrammeListeProps {
    data: OrganigrammeNode[];
    onNodeSelect?: (unite: OrganigrammeNode) => void;
}

function convertirEnTreeNode(nodes: OrganigrammeNode[]): TreeNode<OrganigrammeNode>[] {
    return nodes.map((n) => ({
        id: n.id,
        label: `${n.nom}${n.code ? ` (${n.code})` : ''}`,
        data: n,
        icon: <Building2 className="h-4 w-4 text-[var(--color-dominant-600)]" />,
        children: n.enfants?.length ? convertirEnTreeNode(n.enfants) : [],
    }));
}

export function OrganigrammeListe({ data, onNodeSelect }: OrganigrammeListeProps) {
    const [selectedId, setSelectedId] = useState<string | undefined>();

    const treeNodes = useMemo(() => convertirEnTreeNode(data), [data]);

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
