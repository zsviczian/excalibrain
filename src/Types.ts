import { Page } from "./graph/Page";
import { StrokeRoundness, StrokeStyle, Arrowhead, FillStyle } from "@zsviczian/excalidraw/types/element/types";

export enum RelationType {
  DEFINED = 1,
  INFERRED = 2
}

export enum Role {
  PARENT,
  CHILD,
  FRIEND,
  NEXT,
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
  isLeftFriend: boolean;
  friendType?: RelationType;
  friendTypeDefinition?: string;
  isRightFriend: boolean;
  nextFriendType?: RelationType;
  nextFriendTypeDefinition?: string;
}

export type Hierarchy = {
  parents: string[],
  children: string[],
  leftFriends: string[],
  rightFriends: string[],
  previous: string[],
  next: string[],
  exclusions: string[],
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
  strokeShaprness?: StrokeRoundness,
  strokeWidth?: number,
  strokeStyle?: StrokeStyle,
  padding?: number,
  gateRadius?: number,
  gateOffset?: number,
  gateStrokeColor?: string,
  gateBackgroundColor?: string,
  gateFillStyle?: FillStyle,
  embedWidth?: number,
  embedHeight?: number,
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
  startArrowHead?: Arrowhead|"none",
  endArrowHead?: Arrowhead|"none",
  showLabel?: boolean,
  fontSize?: number,
  fontFamily?: number,
  textColor?: string
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

export type Dimensions = {width:number, height:number};

export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};