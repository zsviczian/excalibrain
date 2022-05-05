import { link } from "fs";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import ExcaliBrain from "src/main";
import { ExcaliBrainSettings } from "src/Settings";
import { LinkStyle, RelationType, Role } from "src/Types";
import { Node } from "./Node";

export class Link {
  style: LinkStyle;

  constructor(
    public nodeA: Node,
    public nodeB: Node,
    private nodeBRole: Role,
    relation: RelationType,
    hierarchyDefinition: string,
    private ea: ExcalidrawAutomate,
    settings: ExcaliBrainSettings,
    plugin: ExcaliBrain
  ) {
    const hlist = hierarchyDefinition?.split(",").map(h=>h.trim());
    let linkstyle: LinkStyle = {};
    if(hlist) {
      hlist.forEach(h=>{
        if(!plugin.hierarchyLinkStylesExtended[h]) {
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
      ...relation === RelationType.INFERRED
        ? settings.inferredLinkStyle
        : {},
      ...linkstyle
    };
  }


  render() {
    const ea = this.ea;
    const style = this.style;
    ea.style.strokeStyle = style.strokeStyle;
    ea.style.strokeColor = style.strokeColor;
    ea.style.strokeWidth = style.strokeWidth;
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
      default:
        gateAId = this.nodeA.friendGateId;
        gateBId = this.nodeB.friendGateId;
        break;
    }
    ea.connectObjects(
      gateAId,
      null,
      gateBId,
      null,
      {
        startArrowHead: style.startArrowHead,
        endArrowHead: style.endArrowHead,
      }
    )
  }
}