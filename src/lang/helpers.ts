//Solution copied from obsidian-kanban: https://github.com/mgmeyers/obsidian-kanban/blob/44118e25661bff9ebfe54f71ae33805dc88ffa53/src/lang/helpers.ts

import { moment } from "obsidian";
import { errorlog } from "src/utils/logging";
import en from "./locale/en";

const localeMap: { [k: string]: Partial<typeof en> } = {
  en,
/*  ar,
  cs: cz,
  da,
  de,
  "en-gb": enGB,
  es,
  fr,
  hi,
  id,
  it,
  ja,
  ko,
  nl,
  nn: no,
  pl,
  pt,
  "pt-br": ptBR,
  ro,
  ru,
  tr,
  "zh-cn": zhCN,
  "zh-tw": zhTW,*/
};

const locale = localeMap[moment.locale()];

export function t(str: keyof typeof en): string {
  if (!locale) {
    errorlog({
      fn: t,
      where: "src/lang/helpers.ts",
      message: "Error: locale not found",
      data: moment.locale(),
    });
  }

  return (locale && locale[str]) || en[str];
}
