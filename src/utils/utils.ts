export interface ErrorLog {
  fn: Function;
  where: string;
  message: string;
  error?: Error;
  data?: any;
}

export const errorlog = (data: ErrorLog) => {
  console.error({ plugin: "ExcaliBrain", ...data });
};
export const log = console.log.bind(window.console);
export const debug = console.log.bind(window.console);

export const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const svgToBase64 = (svg: string): string => {
  return `data:image/svg+xml;base64,${btoa(
    unescape(encodeURIComponent(svg.replaceAll("&nbsp;", " "))),
  )}`;
};