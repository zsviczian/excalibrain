//source: https://github.com/liamcain/obsidian-daily-notes-interface/blob/main/src/settings.ts

import { App } from "obsidian";

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

export function shouldUsePeriodicNotesSettings(
  app: App,
  periodicity: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodicNotes = (app as any).plugins.getPlugin("periodic-notes");
  return periodicNotes && periodicNotes.settings?.[periodicity]?.enabled;
}

/**
 * Read the user settings for the `daily-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getDailyNoteSettings(app: App): IPeriodicNoteSettings {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { internalPlugins, plugins } = app as any;

    if (shouldUsePeriodicNotesSettings(app, "daily")) {
      const { format, folder, template } =
        plugins.getPlugin("periodic-notes")?.settings?.daily || {};
      return {
        format: format || DEFAULT_DAILY_NOTE_FORMAT,
        folder: folder?.trim() || "",
        template: template?.trim() || "",
      };
    }

    const { folder, format, template } =
      internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
    return {
      format: format || DEFAULT_DAILY_NOTE_FORMAT,
      folder: folder?.trim() || "",
      template: template?.trim() || "",
    };
  } catch (err) {
    console.info("No custom daily note settings found!", err);
  }
}

/**
 * Read the user settings for the `weekly-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getWeeklyNoteSettings(app: App): IPeriodicNoteSettings {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pluginManager = (app).plugins as any;

    const calendarSettings = pluginManager.getPlugin("calendar")?.options;
    const periodicNotesSettings =
      pluginManager.getPlugin("periodic-notes")?.settings?.weekly;

    if (shouldUsePeriodicNotesSettings(app, "weekly")) {
      return {
        format: periodicNotesSettings.format || DEFAULT_WEEKLY_NOTE_FORMAT,
        folder: periodicNotesSettings.folder?.trim() || "",
        template: periodicNotesSettings.template?.trim() || "",
      };
    }

    const settings = calendarSettings || {};
    return {
      format: settings.weeklyNoteFormat || DEFAULT_WEEKLY_NOTE_FORMAT,
      folder: settings.weeklyNoteFolder?.trim() || "",
      template: settings.weeklyNoteTemplate?.trim() || "",
    };
  } catch (err) {
    console.info("No custom weekly note settings found!", err);
  }
}

/**
 * Read the user settings for the `periodic-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getMonthlyNoteSettings(app: App): IPeriodicNoteSettings {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginManager = (app).plugins as any;

  try {
    const settings =
      (shouldUsePeriodicNotesSettings(app, "monthly") &&
        pluginManager.getPlugin("periodic-notes")?.settings?.monthly) ||
      {};

    return {
      format: settings.format || DEFAULT_MONTHLY_NOTE_FORMAT,
      folder: settings.folder?.trim() || "",
      template: settings.template?.trim() || "",
    };
  } catch (err) {
    console.info("No custom monthly note settings found!", err);
  }
}

/**
 * Read the user settings for the `periodic-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getQuarterlyNoteSettings(app: App): IPeriodicNoteSettings {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginManager = (app).plugins as any;

  try {
    const settings =
      (shouldUsePeriodicNotesSettings(app, "quarterly") &&
        pluginManager.getPlugin("periodic-notes")?.settings?.quarterly) ||
      {};

    return {
      format: settings.format || DEFAULT_QUARTERLY_NOTE_FORMAT,
      folder: settings.folder?.trim() || "",
      template: settings.template?.trim() || "",
    };
  } catch (err) {
    console.info("No custom quarterly note settings found!", err);
  }
}

/**
 * Read the user settings for the `periodic-notes` plugin
 * to keep behavior of creating a new note in-sync.
 */
export function getYearlyNoteSettings(app:App): IPeriodicNoteSettings {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginManager = (app).plugins as any;

  try {
    const settings =
      (shouldUsePeriodicNotesSettings(app, "yearly") &&
        pluginManager.getPlugin("periodic-notes")?.settings?.yearly) ||
      {};

    return {
      format: settings.format || DEFAULT_YEARLY_NOTE_FORMAT,
      folder: settings.folder?.trim() || "",
      template: settings.template?.trim() || "",
    };
  } catch (err) {
    console.info("No custom yearly note settings found!", err);
  }
}