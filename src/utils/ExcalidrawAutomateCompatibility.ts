import type { TFile, WorkspaceLeaf } from "obsidian";

/**
 * Minimal structural types for the public ExcalidrawAutomate surface consumed
 * by ExcaliBrain. Keeping these local avoids bundling/pinning an old copy of
 * the entire Obsidian Excalidraw plugin just to obtain TypeScript declarations.
 */
export type FillStyle = string;
export type StrokeStyle = string;
export type StrokeRoundness = "round" | "sharp" | number | null;
export type Arrowhead = string | null;

export type Literal = Record<string, unknown> & {
  file?: {
    path?: string;
    name?: string;
    tags?: { values?: string[] };
    etags?: { values?: string[] };
    [key: string]: unknown;
  };
};

export interface BoundElementLike {
  id: string;
  type?: string;
}

export interface ExcalidrawElement {
  id: string;
  type?: string;
  isDeleted?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  strokeColor?: string;
  strokeStyle?: string;
  fillStyle?: string;
  boundElements?: BoundElementLike[] | null;
  link?: string;
  [key: string]: unknown;
}

export interface ExcalidrawImageElement extends ExcalidrawElement {
  fileId?: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ExcalidrawAppStateLike {
  viewModeEnabled?: boolean;
  viewBackgroundColor?: string;
  [key: string]: unknown;
}

export interface ExcalidrawSceneUpdate {
  elements?: ExcalidrawElement[];
  appState?: Partial<ExcalidrawAppStateLike>;
  files?: Record<string, unknown>;
  commitToHistory?: boolean;
  storeAction?: string;
  captureUpdate?: "IMMEDIATELY" | "NEVER" | "EVENTUALLY";
  [key: string]: unknown;
}

export interface ExcalidrawImperativeAPI {
  getAppState(): ExcalidrawAppStateLike;
  getSceneElements?(): ExcalidrawElement[];
  updateScene(scene: ExcalidrawSceneUpdate): void;
  setMobileModeAllowed?(allowed: boolean): void;
  zoomToFit?(
    elements?: readonly ExcalidrawElement[] | null,
    maxZoom?: number,
    viewportZoomFactor?: number,
  ): void;
}

export interface ExcalidrawViewLike {
  leaf?: WorkspaceLeaf;
  file?: TFile | { path?: string } | null;
  contentEl?: HTMLElement;
  containerEl?: HTMLElement;
  ownerWindow?: Window;
  excalidrawAPI?: ExcalidrawImperativeAPI;
  _loaded?: boolean;
  isLoaded?: boolean;
  linksAlwaysOpenInANewPane?: boolean;
  allowFrameButtonsInViewMode?: boolean;
  clearDirty?(): void;
  setHookServer?(ea?: ExcalidrawAutomate): void;
}

export interface ExcalidrawStyleLike {
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: string;
  strokeStyle?: string;
  strokeWidth?: number;
  strokeSharpness?: StrokeRoundness;
  roughness?: number;
  opacity?: number;
  fontFamily?: number;
  fontSize?: number;
  verticalAlign?: string;
}

export interface ExcalidrawCanvasLike {
  viewBackgroundColor?: string;
  theme?: string;
}

export interface ExcalidrawAutomate {
  targetView?: ExcalidrawViewLike | null;
  DEVICE?: { isMobile?: boolean; isDesktop?: boolean };
  style: ExcalidrawStyleLike;
  canvas: ExcalidrawCanvasLike;
  elementsDict: Record<string, ExcalidrawElement>;
  width?: number;
  height?: number;
  onViewModeChangeHook?: ((isViewModeEnabled: boolean) => void) | undefined;
  onLinkHoverHook?: ((element: ExcalidrawElement, linkText: string) => boolean) | undefined;
  onLinkClickHook?: ((element: ExcalidrawElement, linkText: string, event: MouseEvent) => boolean) | undefined;
  onViewUnloadHook?: ((view: ExcalidrawViewLike) => void) | undefined;
  getAPI?(view?: unknown): ExcalidrawAutomate | null;
  setView?(view: unknown): void;
  getExcalidrawAPI?(): ExcalidrawImperativeAPI;
  addElementsToView?(
    repositionToCursor?: boolean,
    save?: boolean,
    newElementsOnTop?: boolean,
    shouldRestoreElements?: boolean,
    captureUpdate?: "IMMEDIATELY" | "NEVER" | "EVENTUALLY",
  ): Promise<boolean>;
  viewUpdateScene?(scene: ExcalidrawSceneUpdate, restore?: boolean): void;
  setViewModeEnabled?(enabled: boolean): void;
  registerThisAsViewEA?(): boolean;
  deregisterThisAsViewEA?(): boolean;
  clearViewDirty?(): void;
  destroy?(): void;
  verifyMinimumPluginVersion?(version: string): boolean;
  isExcalidrawView?(view: unknown): boolean;
  isExcalidrawFile(file: TFile): boolean;
  getLeaf(leaf?: WorkspaceLeaf | null, openState?: string): WorkspaceLeaf;
  openFileInNewOrAdjacentLeaf(file: TFile, openState?: { active?: boolean }): WorkspaceLeaf;
  getActiveEmbeddableViewOrEditor?(view: unknown): unknown;
  clear(): void;
  reset(): void;
  copyViewElementsToEAforEditing(elements: ExcalidrawElement[]): void;
  getViewElements(): ExcalidrawElement[];
  getElements(): ExcalidrawElement[];
  getElement<T extends ExcalidrawElement = ExcalidrawElement>(id: string): T;
  measureText(text: string): { width: number; height: number };
  addText(...args: unknown[]): string;
  addRect(...args: unknown[]): string;
  addEllipse(...args: unknown[]): string;
  addEmbeddable(...args: unknown[]): string;
  addImage(...args: unknown[]): Promise<string>;
  connectObjects(...args: unknown[]): string;
  addLabelToLine(...args: unknown[]): void;
  addToGroup(...args: unknown[]): void;
  create(options: Record<string, unknown>): unknown;
  createSVG(...args: unknown[]): Promise<SVGSVGElement>;
}

declare global {
  interface Window {
    ExcalidrawAutomate?: ExcalidrawAutomate;
    DataviewAPI?: unknown;
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));


export function applyEAStyle(
  ea: ExcalidrawAutomate,
  style: Partial<ExcalidrawStyleLike>,
): void {
  Object.assign(ea.style, style);
}

/** Obtain a disposable EA instance from the installed Excalidraw plugin. */
export function getEA(view?: unknown): ExcalidrawAutomate | null {
  const root = window.ExcalidrawAutomate;
  if (!root || typeof root.getAPI !== "function") return null;
  try {
    return root.getAPI(view) ?? null;
  } catch {
    return null;
  }
}

/** Wait until Excalidraw has completed mounting and the view API is usable. */
export async function waitForExcalidrawViewReady(
  ea: ExcalidrawAutomate,
  timeoutMs = 10000,
): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const view = ea.targetView;
    const api = view?.excalidrawAPI ?? ea.getExcalidrawAPI?.();
    const loaded =
      typeof view !== "undefined" && view !== null &&
      typeof api !== "undefined" && api !== null &&
      view._loaded !== false &&
      (typeof view.isLoaded !== "boolean" || view.isLoaded) &&
      typeof view.contentEl !== "undefined" &&
      view.contentEl.querySelector(".excalidraw") !== null;

    if (loaded) {
      await new Promise<void>((resolve) => {
        const ownerWindow = view?.contentEl?.ownerDocument?.defaultView ?? window;
        if (typeof ownerWindow.requestAnimationFrame === "function") {
          ownerWindow.requestAnimationFrame(() => resolve());
        } else {
          ownerWindow.setTimeout(resolve, 0);
        }
      });
      return true;
    }
    await sleep(50);
  }
  return false;
}

/** Clear dirty state created by a generated ExcaliBrain scene without saving it. */
export function clearTransientViewDirty(ea: ExcalidrawAutomate): void {
  if (typeof ea.clearViewDirty === "function") {
    ea.clearViewDirty();
    return;
  }
  ea.targetView?.clearDirty?.();
}

function settleTransientViewDirty(ea: ExcalidrawAutomate): void {
  clearTransientViewDirty(ea);
  const ownerWindow = ea.targetView?.contentEl?.ownerDocument?.defaultView ?? window;
  ownerWindow.setTimeout(() => clearTransientViewDirty(ea), 0);
  ownerWindow.setTimeout(() => clearTransientViewDirty(ea), 100);
  ownerWindow.setTimeout(() => clearTransientViewDirty(ea), 300);
  ownerWindow.requestAnimationFrame?.(() => clearTransientViewDirty(ea));
}

/** Commit generated elements to the live view without saving/history capture. */
export async function addElementsToViewTransient(
  ea: ExcalidrawAutomate,
): Promise<boolean> {
  if (typeof ea.addElementsToView !== "function") return false;
  const result = await ea.addElementsToView(false, false, false, false, "NEVER");
  settleTransientViewDirty(ea);
  return result;
}

/** Apply generated app-state/scene changes without undo-history capture. */
export function updateViewSceneTransient(
  ea: ExcalidrawAutomate,
  scene: ExcalidrawSceneUpdate,
): void {
  const update: ExcalidrawSceneUpdate = {
    ...scene,
    commitToHistory: false,
    storeAction: "none",
    captureUpdate: "NEVER",
  };
  if (typeof ea.viewUpdateScene === "function") {
    ea.viewUpdateScene(update);
  } else {
    ea.getExcalidrawAPI?.()?.updateScene(update);
  }
  settleTransientViewDirty(ea);
}

/** Configure the non-persistence view flags historically used by ExcaliBrain. */
export function configureExcaliBrainView(
  ea: ExcalidrawAutomate,
  enabled: boolean,
): void {
  const view = ea.targetView;
  if (!view) return;
  view.linksAlwaysOpenInANewPane = enabled;
  view.allowFrameButtonsInViewMode = enabled;
}

/** Temporarily allow Excalidraw's native same-pane link-open behavior. */
export function temporarilyAllowSamePaneLinkOpen(ea: ExcalidrawAutomate): void {
  const view = ea.targetView;
  if (!view) return;
  view.linksAlwaysOpenInANewPane = false;
  const ownerWindow = view.contentEl?.ownerDocument?.defaultView ?? window;
  ownerWindow.setTimeout(() => {
    if (ea.targetView) ea.targetView.linksAlwaysOpenInANewPane = true;
  }, 300);
}

/** Release a view-local hook server. */
export function releaseViewEA(ea: ExcalidrawAutomate): void {
  ea.onViewModeChangeHook = undefined;
  ea.onLinkHoverHook = undefined;
  ea.onLinkClickHook = undefined;
  ea.onViewUnloadHook = undefined;

  try {
    ea.deregisterThisAsViewEA?.();
  } catch {
    // View teardown may already have released the hook server.
  }

  try {
    ea.targetView?.setHookServer?.();
  } catch {
    // Older Excalidraw versions may not expose setHookServer.
  }
}

/** Destroy only disposable view-local EA instances, never the plugin-global EA. */
export function destroyViewEA(ea: ExcalidrawAutomate): void {
  if (ea === window.ExcalidrawAutomate) return;
  try {
    ea.destroy?.();
  } catch {
    // View teardown may already have released the underlying API.
  }
}
