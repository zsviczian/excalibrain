import { Arrowhead, FillStyle } from "@zsviczian/excalidraw/types/element/types";
import { StrokeSharpness, StrokeStyle } from "obsidian-excalidraw-plugin";
import { Page } from "./graph/Page";

export enum RelationType {
  DEFINED = 1,
  INFERRED = 2
}

export enum Role {
  PARENT,
  CHILD,
  FRIEND
}

export enum LinkDirection {
  TO = 1,
  FROM = 2,
  BOTH = 3,
}

export type Relation = {
  target: Page;
  direction: LinkDirection;
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

export type Hierarchy = {
  parents: string[],
  children: string[],
  friends: string[]
}

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

export type NodeStyleData = {
  style: NodeStyle,
  allowOverride:boolean,
  userStyle: boolean,
  display: string,
  getInheritedStyle: ()=>NodeStyle
}

export type NodeStyles = {
  [key:string]: NodeStyleData
};

export type LinkStyle = {
  strokeColor?: string,
  strokeWidth?: number,
  strokeStyle?: StrokeStyle,
  roughness?: number,
  startArrowHead?: Arrowhead,
  endArrowHead?: Arrowhead,
}

export type LinkStyleData = {
  style: LinkStyle,
  allowOverride:boolean,
  userStyle: boolean,
  display: string,
  getInheritedStyle: ()=>LinkStyle,
}

export type LinkStyles = {
  [key:string]: LinkStyleData
};

export type Neighbour = {
  page: Page;
  relationType: RelationType;
  typeDefinition: string;
  linkDirection: LinkDirection;
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