import { Arrowhead, FillStyle } from "@zsviczian/excalidraw/types/element/types";
import { StrokeSharpness, StrokeStyle } from "obsidian-excalidraw-plugin";
import { Page } from "./graph/Page";

export enum RelationType {
  DEFINED,
  INFERRED
}

export enum Role {
  PARENT,
  CHILD,
  FRIEND
}

export type Relation = {
  target: Page;
  isParent: boolean;
  parentType?: RelationType;
  parentTypeDefinition?: string;
  isChild: boolean;
  childType?: RelationType;
  childTypeDefinition?: string;
  isFriend: boolean;
  friendType?: RelationType;
  friendTypeDefinition?: string;
}

export type Hierarchy = {[key:string]: string[]}

export type NodeStyle = {
  prefix?: string
  backgroundColor?: string,
  fillStyle?: FillStyle,
  textColor?: string,
  borderColor?: string,
  fontSize?: number,
  fontFamily?: number,
  maxLabelLength?: number,
  roughness?: number,
  strokeShaprness?: StrokeSharpness,
  strokeWidth?: number,
  strokeStyle?: StrokeStyle,
  padding?: number,
  gateRadius?: number,
  gateOffset?: number,
  gateStrokeColor?: string,
  gateBackgroundColor?: string,
  gateFillStyle?: FillStyle,
}

export type LinkStyle = {
  strokeColor?: string,
  strokeWidth?: number,
  strokeStyle?: StrokeStyle,
  roughness?: number,
  startArrowHead?: Arrowhead,
  endArrowHead?: Arrowhead,
}

export type Neighbour = {
  page: Page;
  relationType: RelationType;
  typeDefinition: string;
}

export type LayoutSpecification = {
  columns: number;
  origoX: number;
  origoY: number;
  top: number;
  bottom: number;
  rowHeight: number;
  columnWidth: number;
}