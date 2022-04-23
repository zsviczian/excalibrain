export type Hierarchy = {[key:string]: string[]}

export type NodeStyle = {
  prefix?: string
  backgroundColor?: string,
  textColor?: string,
  borderColor?: string,
  fontSize?: number,
  fontFamily?: number,
  maxLabelLength?: number,
  roughness?: number,
  strokeShaprness?: string,
  strokeWidth?: number,
  strokeStyle?: string,
  padding?: number,
  gateRadius?: number,
  gateOffset?: number,
  gateStrokeColor?: string,
  gateBackgroundColor?: string  
}

export type LinkStyle = {
  strokeColor: string,
  roughness: string,
  strokeWidth: number,
  startArrowHead: string | null,
  endArrowHead: string | null,
}