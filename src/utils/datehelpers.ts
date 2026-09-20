//source: https://github.com/liamcain/obsidian-daily-notes-interface/blob/main/src/settings.ts

import { App } from "obsidian";
import type {
  CalendarPluginLike,
  CommunityPluginsLike,
  InternalPluginsLike,
  PeriodicNotesPluginLike,
  Periodicity,
} from "./ExternalPluginTypes";

export type IGranularity = "day" | "week" | "month" | "quarter" | "year";
export interface IPeriodicNoteSettings {
  folder?: string;
  format?: string;
  template?: string;
}

const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
const DEFAULT_WEEKLY_NOTE_FORMAT = "gggg-[W]ww";
const DEFAULT_MONTHLY_NOTE_FORMAT = "YYYY-MM";
const DEFAULT_QUARTERLY_NOTE_FORMAT = "YYYY-[Q]Q";
const DEFAULT_YEARLY_NOTE_FORMAT = "YYYY";

const getCommunityPlugins = (app: App): CommunityPluginsLike =>
  app.plugins as unknown as CommunityPluginsLike;

const getInternalPlugins = (app: App): InternalPluginsLike =>
  (app as App & { internalPlugins: InternalPluginsLike }).internalPlugins;

const getPeriodicNotesPlugin = (app: App): PeriodicNotesPluginLike | undefined =>
  getCommunityPlugins(app).getPlugin("periodic-notes") as PeriodicNotesPluginLike | undefined;

export function shouldUsePeriodicNotesSettings(
  app: App,
  periodicity: Periodicity,
): boolean {
  return getPeriodicNotesPlugin(app)?.settings?.[periodicity]?.enabled === true;
}

/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getDailyNoteSettings(app: App): IPeriodicNoteSettings {
  try {
    if (shouldUsePeriodicNotesSettings(app, "daily")) {
      const { format, folder, template } =
        getPeriodicNotesPlugin(app)?.settings?.daily ?? {};
      return {
        format: format || DEFAULT_DAILY_NOTE_FORMAT,
        folder: folder?.trim() || "",
        template: template?.trim() || "",
      };
    }

    const dailyNotesPlugin = getInternalPlugins(app).getPluginById("daily-notes");
    const { folder, format, template } = dailyNotesPlugin?.instance?.options ?? {};
    return {
      format: format || DEFAULT_DAILY_NOTE_FORMAT,
      folder: folder?.trim() || "",
      template: template?.trim() || "",
    };
  } catch {
    return {};
  }
}

/**
 * Read the user settings for the `weekly-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getWeeklyNoteSettings(app: App): IPeriodicNoteSettings {
  try {
    const pluginManager = getCommunityPlugins(app);
    const calendarSettings =
      (pluginManager.getPlugin("calendar") as CalendarPluginLike | undefined)?.options;
    const periodicNotesSettings = getPeriodicNotesPlugin(app)?.settings?.weekly;

    if (shouldUsePeriodicNotesSettings(app, "weekly") && periodicNotesSettings) {
      return {
        format: periodicNotesSettings.format || DEFAULT_WEEKLY_NOTE_FORMAT,
        folder: periodicNotesSettings.folder?.trim() || "",
        template: periodicNotesSettings.template?.trim() || "",
      };
    }

    return {
      format: calendarSettings?.weeklyNoteFormat || DEFAULT_WEEKLY_NOTE_FORMAT,
      folder: calendarSettings?.weeklyNoteFolder?.trim() || "",
      template: calendarSettings?.weeklyNoteTemplate?.trim() || "",
    };
  } catch {
    return {};
  }
}

const getPeriodicNoteSettings = (
  app: App,
  periodicity: "monthly" | "quarterly" | "yearly",
  defaultFormat: string,
): IPeriodicNoteSettings => {
  try {
    const settings = shouldUsePeriodicNotesSettings(app, periodicity)
      ? getPeriodicNotesPlugin(app)?.settings?.[periodicity]
      : undefined;

    return {
      format: settings?.format || defaultFormat,
      folder: settings?.folder?.trim() || "",
      template: settings?.template?.trim() || "",
    };
  } catch {
    return {};
  }
};

/** Read the user settings for the `periodic-notes` plugin. */
export function getMonthlyNoteSettings(app: App): IPeriodicNoteSettings {
  return getPeriodicNoteSettings(app, "monthly", DEFAULT_MONTHLY_NOTE_FORMAT);
}

/** Read the user settings for the `periodic-notes` plugin. */
export function getQuarterlyNoteSettings(app: App): IPeriodicNoteSettings {
  return getPeriodicNoteSettings(app, "quarterly", DEFAULT_QUARTERLY_NOTE_FORMAT);
}

/** Read the user settings for the `periodic-notes` plugin. */
export function getYearlyNoteSettings(app: App): IPeriodicNoteSettings {
  return getPeriodicNoteSettings(app, "yearly", DEFAULT_YEARLY_NOTE_FORMAT);
}
