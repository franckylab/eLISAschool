---
kind: design
name: Adopt i18n keys for all toast messages and user-facing strings
source: session
category: adr
---

# Adopt i18n keys for all toast messages and user-facing strings

_Source: coding plans from commit period cdafea3 → f36bb82 — records intent at planning time; the implementation may lag or differ._

**Status:** accepted

## Context
21 hardcoded French toast strings were scattered across 7 hook files, making them impossible to translate and inconsistent with the project's i18n strategy.

## Decision drivers
- internationalisation
- consistency with existing i18n pattern
- maintainability

## Considered options
- **Extract keys into organisation.json (hooks.*) and call t() in toasts** — pros: fully translatable, follows existing pattern used elsewhere
- **Leave hardcoded FR strings** _(rejected)_ — pros: zero changes; cons: blocks EN support, breaks i18n tooling

## Decision
Add hooks.unites.*, hooks.hierarchies.*, hooks.echelons.*, hooks.niveaux.*, hooks.modes.*, hooks.templates.* and generic error keys to both locales/fr/organisation.json and locales/en/organisation.json, then replace every toast.success('...') with toast.success(t('hooks.<key>')).

## Consequences
All user feedback is now translatable. New hooks must follow the same pattern to stay consistent. English translations must be kept in sync with French keys.