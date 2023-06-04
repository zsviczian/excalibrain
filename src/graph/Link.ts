import { link } from "fs";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import ExcaliBrain from "src/excalibrain-main";
import { ExcaliBrainSettings } from "src/Settings";
import { LinkStyle, RelationType, Role } from "src/Types";
import { Node } from "./Node";

export class Link {
  style: LinkStyle;
  public isInferred: boolean = false;

  constructor(
    public nodeA: Node,
    public nodeB: Node,
    private nodeBRole: Role,
    relation: RelationType,
    public hierarchyDefinition: string,
    private ea: ExcalidrawAutomate,
    settings: ExcaliBrainSettings,
    plugin: ExcaliBrain
  ) {
    const hlist = hierarchyDefinition?.split(",").map(h=>h.trim());
    this.isInferred = relation === RelationType.INFERRED;
    let linkstyle: LinkStyle = {};
    if(hlist) {
      hlist.forEach(h=>{
        if(!plugin.hierarchyLinkStylesExtended[h]) {
          switch(h) {
            case "file-tree": 
              linkstyle = {
                ...linkstyle,
                ...plugin.settings.folderLinkStyle    
              };
              break;
            case "tag-tree":
              linkstyle = {
                ...linkstyle,
                ...plugin.settings.tagLinkStyle    
              };
              break;
          }
          return;
        }
        linkstyle = {
          ...linkstyle,
          ...plugin.hierarchyLinkStylesExtended[h]
        }
      })
    }
    this.style = {
      ...settings.baseLinkStyle,
      ...this.isInferred
        ? settings.inferredLinkStyle
        : {},
      ...linkstyle
    };
  }

  render(hide: boolean) {
    const ea = this.ea;
    const style = this.style;
    ea.style.strokeStyle = style.strokeStyle;
    ea.style.roughness = style.roughness;
    ea.style.strokeColor = style.strokeColor;
    ea.style.strokeWidth = style.strokeWidth;
    ea.style.opacity = hide ? 10 : 100;
    let gateAId: string;
    let gateBId: string;
    switch(this.nodeBRole) {
      case Role.CHILD: 
        gateAId = this.nodeA.childGateId;
        gateBId = this.nodeB.parentGateId; 
        break;
      case Role.PARENT:
        gateAId = this.nodeA.parentGateId;
        gateBId = this.nodeB.childGateId;
        break;
      case Role.NEXT:
          gateAId = this.nodeA.nextFriendGateId;
          gateBId = this.nodeB.nextFriendGateId;
          break;
      default:
        gateAId = this.nodeA.friendGateId;
        gateBId = this.nodeB.friendGateId;
        break;
    }
    const id = ea.connectObjects(
      gateAId,
      null,
      gateBId,
      null,
      {
        startArrowHead: style.startArrowHead === "none" ? null : style.startArrowHead,
        endArrowHead: style.endArrowHead === "none" ? null : style.endArrowHead,
      }
    )
    if(style.showLabel && this.hierarchyDefinition) {
      ea.style.fontSize = style.fontSize;
      ea.style.fontFamily = style.fontFamily;
      ea.style.strokeColor = style.textColor;
      ea.addLabelToLine(id,this.hierarchyDefinition);
    }   
  }
}