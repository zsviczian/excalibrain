import type { WorkspaceLeaf } from "obsidian";

/**
 * Minimal structural types for the public ExcalidrawAutomate surface consumed
 * by ExcaliBrain. Keeping these local avoids bundling/pinning an old copy of
 * the entire Obsidian Excalidraw plugin just to obtain TypeScript declarations.
 */
export type FillStyle = "hachure" | "cross-hatch" | "solid" | "zigzag" | string;
export type StrokeStyle = "solid" | "dashed" | "dotted" | string;
export type StrokeRoundness = "round" | "sharp" | number | null;
export type Arrowhead =
  | "arrow"
  | "bar"
  | "circle"
  | "circle_outline"
  | "triangle"
  | "triangle_outline"
  | "diamond"
  | "diamond_outline"
  | "dot"
  | "none"
  | null
  | string;

export type Literal = Record<string, unknown> & {
  file?: {
    path?: string;
    name?: string;
    [key: string]: unknown;
  };
};

export interface ExcalidrawElement {
  id: string;
  type?: string;
  isDeleted?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export interface ExcalidrawImageElement extends ExcalidrawElement {
  fileId?: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ExcalidrawViewLike {
  leaf?: WorkspaceLeaf;
  file?: { path?: string };
  contentEl?: HTMLElement;
  ownerWindow?: Window;
  excalidrawAPI?: ExcalidrawImperativeAPI;
  _loaded?: boolean;
  isLoaded?: boolean;
  linksAlwaysOpenInANewPane?: boolean;
  allowFrameButtonsInViewMode?: boolean;
  clearDirty?: () => void;
  setHookServer?: (ea?: ExcalidrawAutomate) => void;
  [key: string]: any;
}

export interface ExcalidrawImperativeAPI {
  getAppState: () => any;
  getSceneElements?: () => ExcalidrawElement[];
  updateScene: (scene: any) => void;
  setMobileModeAllowed?: (allowed: boolean) => void;
  zoomToFit?: (...args: any[]) => void;
  [key: string]: any;
}

export interface ExcalidrawAutomate {
  targetView?: ExcalidrawViewLike | null;
  DEVICE?: { isMobile?: boolean; isDesktop?: boolean; [key: string]: any };
  style?: any;
  canvas?: any;
  elementsDict?: Record<string, ExcalidrawElement>;
  onViewModeChangeHook?: ((isViewModeEnabled: boolean) => void) | undefined;
  onLinkHoverHook?: ((element: any, linkText: string) => boolean) | undefined;
  onLinkClickHook?: ((element: any, linkText: string, event: MouseEvent) => boolean) | undefined;
  onViewUnloadHook?: ((view: ExcalidrawViewLike) => void) | undefined;
  getAPI?: (view?: any) => ExcalidrawAutomate | null;
  setView?: (view: any) => void;
  getExcalidrawAPI?: () => ExcalidrawImperativeAPI;
  addElementsToView?: (
    repositionToCursor?: boolean,
    save?: boolean,
    newElementsOnTop?: boolean,
    shouldRestoreElements?: boolean,
    captureUpdate?: "IMMEDIATELY" | "NEVER" | "EVENTUALLY",
  ) => Promise<boolean>;
  viewUpdateScene?: (scene: any, restore?: boolean) => void;
  setViewModeEnabled?: (enabled: boolean) => void;
  registerThisAsViewEA?: () => boolean;
  deregisterThisAsViewEA?: () => boolean;
  clearViewDirty?: () => void;
  destroy?: () => void;
  verifyMinimumPluginVersion?: (version: string) => boolean;
  isExcalidrawView?: (view: any) => boolean;
  [key: string]: any;
}

declare global {
  interface Window {
    ExcalidrawAutomate?: ExcalidrawAutomate;
    DataviewAPI?: any;
  }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * Obtain an EA instance from the installed Excalidraw plugin without importing
 * or bundling the Excalidraw plugin package. Modern Excalidraw exposes getAPI()
 * on window.ExcalidrawAutomate. This API is present in the minimum supported
 * Excalidraw release (2.27.3), so no global-instance mutation fallback is used.
 */
export function getEA(view?: any): ExcalidrawAutomate | null {
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
      Boolean(view) &&
      Boolean(api) &&
      view?._loaded !== false &&
      (typeof view?.isLoaded !== "boolean" || view.isLoaded) &&
      Boolean(view?.contentEl?.querySelector(".excalidraw"));

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

/**
 * Clear dirty state created by a generated ExcaliBrain scene without saving it.
 * Prefer the public EA bridge when available; retain one isolated legacy
 * fallback for current Excalidraw releases that do not expose it yet.
 */
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
  if (typeof ownerWindow.requestAnimationFrame === "function") {
    ownerWindow.requestAnimationFrame(() => clearTransientViewDirty(ea));
  }
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
  scene: Record<string, any>,
): void {
  if (typeof ea.viewUpdateScene === "function") {
    ea.viewUpdateScene({
      ...scene,
      commitToHistory: false,
      storeAction: "none",
      captureUpdate: "NEVER",
    });
  } else {
    ea.getExcalidrawAPI?.()?.updateScene({
      ...scene,
      commitToHistory: false,
      captureUpdate: "NEVER",
    });
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

/**
 * Release a view-local hook server. Current Excalidraw builds contain a
 * deregisterThisAsViewEA implementation that re-registers the same EA; the
 * setHookServer() fallback is therefore intentionally isolated here.
 */
export function releaseViewEA(ea: ExcalidrawAutomate): void {
  ea.onViewModeChangeHook = undefined;
  ea.onLinkHoverHook = undefined;
  ea.onLinkClickHook = undefined;
  ea.onViewUnloadHook = undefined;

  try {
    ea.deregisterThisAsViewEA?.();
  } catch {
    // The view may already be tearing down.
  }

  try {
    ea.targetView?.setHookServer?.();
  } catch {
    // Older versions may not expose setHookServer.
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
