import { App, TFile, moment } from "obsidian";
import { Literal } from "./ExcalidrawAutomateCompatibility";
import ExcaliBrain from "src/excalibrain-main";
import { linkRegex } from "src/graph/URLParser";
import { ExcaliBrainSettings } from "src/Settings";
import { NodeStyle } from "src/Types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getPathOrSelf = (app: App, link: string, hostPath: string): string => {
  const file = app.metadataCache.getFirstLinkpathDest(link, hostPath);
  return file ? file.path : link;
};

const readLinksFromString = (app: App, data: string, file: TFile): string[] => {
  const result = new Set<string>();
  const linkReg = /[^[]*\[\[(?<wikiLink>[^#|]*)[^\]]*]]|\[[^\]]*]\((?<mdLink>[^)]*)\)/g;

  for (const match of data.matchAll(linkReg)) {
    const wikiLink = match.groups?.wikiLink;
    if (wikiLink) {
      result.add(getPathOrSelf(app, wikiLink, file.path));
    }

    const markdownLink = match.groups?.mdLink;
    if (markdownLink) {
      try {
        result.add(getPathOrSelf(app, decodeURIComponent(markdownLink), file.path));
      } catch {
        // Ignore malformed percent-encoding while continuing to parse other links.
      }
    }
  }

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(data)) !== null) {
    const url = match[2] ?? match[4];
    if (url) result.add(url);
  }

  return Array.from(result);
};

const readDailyNoteLinks = (
  plugin: ExcaliBrain,
  data: unknown[],
): string[] => {
  const result = new Set<string>();
  data.forEach((value) => {
    if (!isRecord(value) || !Object.hasOwn(value, "ts")) return;
    const timestamp = value.ts;
    if (timestamp === undefined || timestamp === null) return;
    result.add(moment(timestamp).format(plugin.dailyNoteSettings.format));
  });
  return Array.from(result);
};

const readDVField = (plugin: ExcaliBrain, field: unknown, file: TFile): string[] => {
  const result = new Set<string>();

  if (isRecord(field) && typeof field.values === "function") {
    if (Object.hasOwn(field, "conversionAccuracy")) return [];

    const values = Array.from((field.values as () => Iterable<unknown>)());

    values.forEach((value) => {
      if (!isRecord(value)) return;
      const type = value.type;
      const path = value.path;
      if (
        typeof path === "string" &&
        (type === "file" || type === "header" || type === "block")
      ) {
        result.add(getPathOrSelf(plugin.app, path, file.path));
      }
    });

    values.forEach((value) => {
      if (!isRecord(value) || typeof value.values !== "function") return;
      const nestedValues = Array.from((value.values as () => Iterable<unknown>)());
      readDVField(plugin, nestedValues, file).forEach((path) => result.add(path));
    });

    const stringLinks = readLinksFromString(
      plugin.app,
      values.filter((value): value is string => typeof value === "string").join(" "),
      file,
    );

    const objectLinks = values
      .filter((value): value is Record<string, unknown> => isRecord(value))
      .map((value) => value.values)
      .filter((nested): nested is unknown[] => Array.isArray(nested))
      .filter((nested) => typeof nested[0] === "string")
      .map((nested) => getPathOrSelf(plugin.app, nested[0] as string, file.path));

    const dateLinks = readDailyNoteLinks(plugin, values);
    return Array.from(result).concat(stringLinks, objectLinks, dateLinks);
  }

  if (Array.isArray(field)) {
    field.forEach((value) => readDVField(plugin, value, file).forEach((path) => result.add(path)));
    return Array.from(result);
  }

  if (isRecord(field) && typeof field.path === "string") {
    return [getPathOrSelf(plugin.app, field.path, file.path)];
  }

  if (typeof field === "string") {
    return readLinksFromString(plugin.app, field, file);
  }

  return [];
};

export const getDVFieldLinksForPage = (
  plugin: ExcaliBrain,
  dvPage: Literal,
  fields: string[],
): { link: string; field: string }[] => {
  const links: { link: string; field: string }[] = [];
  const processed = new Set<string>();
  fields.forEach((fieldName) => {
    const fieldValue = dvPage[fieldName];
    if (fieldValue !== undefined && !processed.has(fieldName)) {
      processed.add(fieldName);
      const filePath = dvPage.file?.path;
      const file = filePath ? plugin.app.vault.getAbstractFileByPath(filePath) : null;
      if (!(file instanceof TFile)) return;
      readDVField(plugin, fieldValue, file).forEach((link) => links.push({ link, field: fieldName }));
    }
  });
  return links;
};

export const getPrimaryTag = (
  dvPage: Literal | undefined,
  settings: ExcaliBrainSettings,
): [string, string[]] | [null, null] => {
  const pageTags = getPageTags(dvPage, settings);
  if (!pageTags) return [null, null];

  const primaryTagValue = dvPage[settings.primaryTagFieldLowerCase];
  if (typeof primaryTagValue === "string") {
    const tags = primaryTagValue
      .match(/#([^\s\])$"'\\]*)(?:$|\s)/g)
      ?.map((match) => match.trim())
      .filter((tag) => settings.tagStyleList.some((styleTag) => tag.startsWith(styleTag)));
    const styleTag = tags && tags.length > 0 ? tags[0] : pageTags[0];
    return [styleTag, pageTags.filter((tag) => tag !== styleTag)];
  }
  return [pageTags[0], pageTags.slice(1)];
};

const getPageTags = (
  dvPage: Literal | undefined,
  settings: ExcaliBrainSettings,
): string[] | null => {
  if (!dvPage) return null;
  const tags = dvPage.file?.tags?.values;
  if (!tags) return null;
  return tags.filter((tag) => settings.tagStyleList.some((styleTag) => tag.startsWith(styleTag)));
};

export const getTagStyle = (
  tags: [string, string[]],
  settings: ExcaliBrainSettings,
): NodeStyle => {
  const [tag, otherTags] = tags;
  if (!tag) return {};

  const style = settings.tagNodeStyles[settings.tagStyleList.filter((item) => tag.startsWith(item))[0]];
  if (style && settings.displayAllStylePrefixes) {
    const keys = Object.keys(settings.tagNodeStyles).filter((key) => otherTags.includes(key));
    const prefixSet = new Set<string>();
    if (style.prefix) prefixSet.add(style.prefix);
    keys
      .map((key) => settings.tagNodeStyles[key].prefix)
      .filter((prefix): prefix is string => typeof prefix === "string" && prefix.length > 0)
      .forEach((prefix) => prefixSet.add(prefix));
    return { ...style, prefix: Array.from(prefixSet).join("") };
  }
  return style;
};
