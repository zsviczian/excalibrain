import { App } from "obsidian";
import { ExcalidrawAutomate } from "./ExcalidrawAutomateCompatibility";

export interface ErrorLog {
  fn: string;
  where: string;
  message: string;
  error?: Error;
  data?: unknown;
}

export const errorlog = (data: ErrorLog): void => {
  console.error({ plugin: "ExcaliBrain", ...data });
};

export const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

export const svgToBase64 = (svg: string): string => {
  const bytes = new TextEncoder().encode(svg.replaceAll("&nbsp;", " "));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `data:image/svg+xml;base64,${btoa(binary)}`;
};

interface ElectronWindowLike {
  isAlwaysOnTop(): boolean;
  setAlwaysOnTop(value: boolean): void;
}

type WindowWithElectron = Window & { electronWindow?: ElectronWindowLike };

export const keepOnTop = (
  ea: ExcalidrawAutomate,
  app: App,
  ownerWindow?: Window,
): void => {
  if(!ea.DEVICE?.isDesktop) return;
  let keepontop = true;
  if(!ownerWindow) {
    const view = ea.targetView;
    if(!view) return;
    keepontop = app.workspace.activeLeaf === view.leaf;
    ownerWindow = view.ownerWindow;
  }

  const electronWindow = (ownerWindow as WindowWithElectron)?.electronWindow;
  if (keepontop && electronWindow && !electronWindow.isAlwaysOnTop()) {
    electronWindow.setAlwaysOnTop(true);
    window.setTimeout(() => electronWindow.setAlwaysOnTop(false), 500);
  }
};
