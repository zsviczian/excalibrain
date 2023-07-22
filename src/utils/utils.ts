import { TextFileView } from "obsidian";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";

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

export const keepOnTop = (ea: ExcalidrawAutomate, ownerWindow?: Window) => {
  if(!ea.DEVICE.isDesktop) return;
  let keepontop = true;
  if(!ownerWindow) {
    const view = ea.targetView;
    if(!view) return;
    keepontop = (app.workspace.activeLeaf === view.leaf);
    ownerWindow = view.ownerWindow;
  }

  if (keepontop) {
    //@ts-ignore
    if(!ownerWindow.electronWindow.isAlwaysOnTop()) {
      //@ts-ignore
      ownerWindow.electronWindow.setAlwaysOnTop(true);
      setTimeout(() => {
        //@ts-ignore
        ownerWindow.electronWindow.setAlwaysOnTop(false);
      }, 500);
    }
  }
};