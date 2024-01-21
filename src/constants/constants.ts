import { NodeStyle, LinkStyle } from "../types";

export const APPNAME = "ExcaliBrain";
export const PLUGIN_NAME = "excalibrain"
export const MINEXCALIDRAWVERSION = "1.9.14"
export const PREDEFINED_LINK_STYLES = ["base","inferred","file-tree","tag-tree"];
export const SUGGEST_LIMIT = 30;

export const DEFAULT_LINK_STYLE:LinkStyle = {
  strokeColor: "#696969FF",
  strokeWidth: 1,
  strokeStyle: "solid",
  roughness: 0,
  startArrowHead: "none",
  endArrowHead: "none",
  showLabel: false,
  fontSize: 10,
  fontFamily: 3,
  textColor: "#ffffffff"
}

export const DEFAULT_NODE_STYLE:NodeStyle = {
  prefix: "",
  backgroundColor: "#00000066",
  fillStyle: "solid",
  textColor: "#ffffffff",
  borderColor: "#00000000",
  fontSize: 20,
  fontFamily: 3,
  maxLabelLength: 30,
  roughness: 0,
  strokeShaprness: "round",
  strokeWidth: 1,
  strokeStyle: "solid",
  padding: 10,
  gateRadius: 5,
  gateOffset: 15,
  gateStrokeColor: "#ffffffff",
  gateBackgroundColor: "#ffffffff",
  gateFillStyle: "solid"
}

export const DEFAULT_HIERARCHY_DEFINITION = {
  exclusions: ["excalidraw-font","excalidraw-font-color","excalidraw-css","excalidraw-plugin",
    "excalidraw-link-brackets","excalidraw-link-prefix","excalidraw-border-color","excalidraw-default-mode",
    "excalidraw-export-dark","excalidraw-export-transparent","excalidraw-export-svgpadding","excalidraw-export-pngscale",
    "excalidraw-url-prefix", "excalidraw-linkbutton-opacity", "excalidraw-onload-script", "kanban-plugin"],
  parents: ["Parent", "Parents", "up", "u", "North", "origin", "inception", "source", "parent domain"],
  children: ["Children", "Child", "down", "d", "South", "leads to", "contributes to", "nurtures"],
  leftFriends: ["Friends", "Friend", "Jump", "Jumps", "j", "similar", "supports", "alternatives", "advantages", "pros"],
  rightFriends: ["opposes", "disadvantages", "missing", "cons"],
  previous: ["Previous", "Prev", "West", "w", "Before"],
  next: ["Next", "n", "East", "e", "After"],
  hidden: ["hidden"],
}
