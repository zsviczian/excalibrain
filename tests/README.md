# Scanner regression checks

Apply the ZIP at the repository root. It contains only changed source/CSS files and new compatibility/test files; dependencies, manifests and generated bundles are not included.

## Changes

`ExcaliBrainSettingTab.getSettingDefinitions()` exposes searchable settings on Obsidian 1.13 and later. The existing `display()` fallback and the minimum supported version, 1.8.7, remain intact. A small, local, type-only API subset avoids introducing newer runtime imports or changing the pinned Obsidian dependency.

The complex style editor is shared between the two rendering paths. Searches for its control labels, such as font size or arrow head, lead to the styling editor through search aliases rather than separate per-attribute results. Both paths retain the original controls, previews and support banner. Model reconciliation also works when only an ontology search result is rendered.

All four legacy HTML headings now use `Setting.setHeading()`. Suggestion-popup coordinates use `setCssStyles()` while retaining their original viewport anchoring and owner-document behavior.

API references:

- https://docs.obsidian.md/plugins/guides/migrate-declarative-settings
- https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts

## Run

```sh
npm ci
npm run typecheck
node --test tests/scanner-regressions.cjs
npm run build
```

The regression suite uses the existing TypeScript development dependency and Node's built-in test runner. It models the relevant Obsidian APIs without adding test dependencies. Tests cover search metadata without initialization side effects, parity with the legacy controls, reload/teardown behavior, unit conversions, overwrite confirmation, ontology and style updates, persistence, dependent controls, and popup placement in another document.

## Verification status

All **nine regression tests passed** in the editing environment, using Node 22.16.0 and the available TypeScript 5.8.3 installation. The repository's pinned dependencies were not changed.

Dependency installation could not complete because the npm registry was unreachable. Consequently, the full project typecheck and production build with the pinned dependencies could not be completed. These mock-host tests are not a live Obsidian test or an actual scanner rerun.

Before releasing, run the commands above, rerun the Obsidian scanner, and check settings on both Obsidian 1.8.7 and 1.13+. Verify global settings search, style-selector previews and inheritance toggles, persistence after closing/reopening settings, and suggestion positioning in a popout window.
