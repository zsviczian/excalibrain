export interface ErrorLog {
  fn: Function;
  where: string;
  message: string;
  error?: Error;
  data?: any;
}

export const errorlog = (data: ErrorLog) => {
  console.error({ plugin: "NeuroGraph", ...data });
};
export const log = console.log.bind(window.console);
export const debug = console.log.bind(window.console);