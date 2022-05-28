import { NodeStyle, LinkStyle } from "../Types";

export const APPNAME = "ExcaliBrain";
export const PLUGIN_NAME = "excalibrain"
export const MINEXCALIDRAWVERSION = "1.6.33"
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