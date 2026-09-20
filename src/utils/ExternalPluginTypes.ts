import type { Literal } from "./ExcalidrawAutomateCompatibility";

export type Periodicity = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface PeriodicNoteSettingsLike {
  enabled?: boolean;
  folder?: string;
  format?: string;
  template?: string;
}

export interface PeriodicNotesPluginLike {
  settings?: Partial<Record<Periodicity, PeriodicNoteSettingsLike>>;
}

export interface CalendarPluginLike {
  options?: {
    weeklyNoteFormat?: string;
    weeklyNoteFolder?: string;
    weeklyNoteTemplate?: string;
  };
}

export interface DailyNotesInternalPluginLike {
  instance?: {
    options?: PeriodicNoteSettingsLike;
  };
}

export interface BookmarkItemLike {
  type: string;
  path?: string;
  items?: BookmarkItemLike[];
}

export interface InternalPluginLike {
  _loaded?: boolean;
  instance?: {
    items?: BookmarkItemLike[];
    options?: PeriodicNoteSettingsLike;
  };
  loadData?: () => Promise<{ items?: BookmarkItemLike[] }>;
}

export interface InternalPluginsLike {
  getPluginById(id: string): InternalPluginLike | DailyNotesInternalPluginLike | undefined;
}

export interface CommunityPluginsLike {
  getPlugin(id: string): PeriodicNotesPluginLike | CalendarPluginLike | undefined;
}

export interface DataviewIndexedPageLike {
  fields: {
    keys(): IterableIterator<string>;
  };
}

export interface DataviewApiLike {
  index: {
    importer: {
      reloadQueue: unknown[];
    };
    pages: {
      forEach(callback: (page: DataviewIndexedPageLike) => void): void;
    };
    etags: {
      getInverse(tag: string): Set<string> | undefined;
    };
  };
  page(path: string): Literal | null;
  tryEvaluate?: (
    expression: string,
    context: Record<string, unknown>,
    originFile?: string,
  ) => unknown;
}
