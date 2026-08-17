import { Divider, Grid, H1, H2, Stack, Stat, Table, Text, Badge } from 'qoder/canvas';

export default function HeaderSearchReport() {
  return (
    <Stack gap={20}>
      <H1>Platform Header v2.0 — Completion Report</H1>
      <Text tone="secondary">
        Ajout de 3 boutons (Theme, Language, Connectivity) + refactorisation recherche Cmd+K
      </Text>

      <Divider />

      <H2>Metrics</H2>
      <Grid columns={4} gap={16}>
        <Stat value="4" label="Fichiers modifiés" />
        <Stat value="6" label="Fichiers i18n (FR+EN)" />
        <Stat value="+27 / -59" label="Lignes header (net)" />
        <Stat value="23" label="Commandes platform" />
      </Grid>

      <Divider />

      <H2>Changements par fichier</H2>
      <Table
        headers={['Fichier', 'Action', 'Détails']}
        rows={[
          ['PlatformHeader.tsx', 'Modifié v2.0', '+ThemeSwitcher, +LanguageSwitcher, +ConnectionIndicator, -recherche inline, +event custom'],
          ['CommandPalette.tsx', 'Réécrit v3.0', 'Détection contexte (platform/tenant), i18n complet, fuzzy search amélioré, animations framer-motion, style CSS vars'],
          ['admin.json FR', '+94 lignes', 'Section commandPalette : 94 clés i18n (labels, descriptions, catégories)'],
          ['admin.json EN', '+94 lignes', 'Section commandPalette : parité FR/EN complète'],
          ['common.json FR', '+4 clés', 'header.rechercherPlateforme, santeOk, santeWarning, santeCritical'],
          ['common.json EN', '+4 clés', 'header.rechercherPlateforme, santeOk, santeWarning, santeCritical'],
        ]}
        rowTone={[undefined, undefined, undefined, undefined, undefined, undefined]}
      />

      <Divider />

      <H2>Architecture — Flux de recherche</H2>
      <Table
        headers={['Étape', 'Composant', 'Mécanisme']}
        rows={[
          ['1. Déclenchement', 'PlatformHeader / Clavier', 'Clic bouton search OU Cmd+K → dispatch CustomEvent("open-command-palette")'],
          ['2. Réception', 'CommandPalette', 'Listener useEffect → setIsOpen(true), reset query + selectedIndex'],
          ['3. Contexte', 'CommandPalette', 'useLocation() → pathname.startsWith("/platform") → filtre PLATFORM ou TENANT commands'],
          ['4. Recherche', 'CommandPalette', 'fuzzyMatch() : includes + début de mot sur label, description, keywords, path'],
          ['5. Affichage', 'CommandPalette', 'Groupement par catégorie, scroll-into-view, highlight sélection, compteur résultats'],
          ['6. Navigation', 'CommandPalette', 'useNavigate() → route TanStack Router vers la page sélectionnée'],
        ]}
      />

      <Divider />

      <H2>Composants réutilisés (existants)</H2>
      <Table
        headers={['Composant', 'Source', 'Lignes', 'Rôle']}
        rows={[
          ['ThemeSwitcher', 'components/navigation/ThemeSwitcher.tsx', '20', 'Toggle binaire dark/light (Sun/Moon icons)'],
          ['LanguageSwitcher', 'components/navigation/LanguageSwitcher.tsx', '67', 'Toggle FR/EN animé (framer-motion spring)'],
          ['ConnectionIndicator', 'features/network/components/', '278', '5 états (connected/degraded/server-down/lan-only/offline) + Popover'],
        ]}
      />

      <Divider />

      <H2>Décisions clés</H2>
      <Table
        headers={['Décision', 'Raison']}
        rows={[
          ['Supprimer recherche inline du header', 'Éviter double système (inline + CommandPalette). Un seul point d\'entrée Cmd+K.'],
          ['CustomEvent pour ouvrir CommandPalette', 'Découplage : le header n\'importe pas CommandPalette. Communication via DOM event bus.'],
          ['Filtrage platform/tenant par route', 'useLocation().pathname détecte le contexte. 23 commandes platform vs 15 tenant.'],
          ['i18n avec labelKey + labelFallback', 'Support FR/EN complet avec fallback si clé manquante. Pas de crash UI.'],
          ['fuzzyMatch custom (includes + début de mot)', 'Pas de dépendance externe (fuse.js). Léger et suffisant pour 23 commandes.'],
          ['CSS variables (pas de classes dark:)', 'Conforme convention eLISAschool — dark mode via data-theme + CSS variables uniquement.'],
        ]}
      />

      <Divider />

      <H2>Améliorations CommandPalette v3.0</H2>
      <Table
        headers={['Avant (v2.0)', 'Après (v3.0)']}
        rows={[
          ['36 commandes hardcodées mixtes', '23 platform + 15 tenant, filtrées par contexte'],
          ['Recherche .includes() basique', 'fuzzyMatch : includes + début de mot multi-termes'],
          ['Labels en français uniquement', 'i18n complet FR/EN (94 clés par langue)'],
          ['Style Tailwind générique (bg-background)', 'CSS variables (var(--color-surface), var(--color-dominante))'],
          ['Overlay fixe sans animation', 'framer-motion : fade + scale + spring physics'],
          ['Pas de compteur résultats', 'Compteur live affiché dans le header input'],
          ['Scroll sans snap', 'scrollIntoView({ block: "nearest" }) sur sélection'],
          ['Footer basique', 'Footer avec indicateur contexte (Control Plane / Data Plane)'],
          ['Aucun état vide', 'État vide avec icône + message + suggestion'],
        ]}
      />

      <Divider />

      <Text tone="secondary" size="small">
        Généré pour eLISAschool — Session Platform Header v2.0 / CommandPalette v3.0
      </Text>
    </Stack>
  );
}
