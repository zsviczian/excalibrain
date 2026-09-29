import type { Setting } from "obsidian";

/**
 * The render-only subset of Obsidian 1.13's declarative settings API used here.
 * Keep these types local so that the plugin still compiles against its minimum
 * supported API (1.8.7), without importing newer runtime classes or augmenting
 * Obsidian's declarations. Older hosts simply use the display() fallback.
 *
 * Contract: https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts
 * Migration: https://docs.obsidian.md/plugins/guides/migrate-declarative-settings
 */
export interface SearchableSettingDefinition {
  name: string;
  desc?: string;
  aliases?: string[];
  searchable?: boolean;
  render: (setting: Setting) => void | (() => void);
}

export interface SearchableSettingGroup {
  type: "group";
  heading: string;
  items: SearchableSettingDefinition[];
}

export type SearchableSettingItem = SearchableSettingDefinition | SearchableSettingGroup;
