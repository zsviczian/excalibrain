import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { ExcaliBrainSettings } from "src/Settings";
import { NodeStyle } from "src/Types";
import { getTagStyle } from "src/utils/dataview";
import { Page } from "./Page";

export class Node {
  page: Page;
  settings: ExcaliBrainSettings;
  ea: ExcalidrawAutomate;
  style: NodeStyle = {};
  private center: {x:number, y:number} = {x:0,y:0};
  public id: string;
  public friendGateId: string;
  public parentGateId: string;
  public childGateId: string;
  private friendGateOnLeft: boolean;
  public title: string;

  constructor(x:{
    ea: ExcalidrawAutomate,
    page:Page,
    isInferred: boolean,
    isCentral: boolean,
    isSibling: boolean,
    friendGateOnLeft:boolean
  }) {
    this.page = x.page;
    this.settings = x.page.plugin.settings;
    this.ea = x.ea;
    if(this.page.isFolder) {
      this.style = {
        ...this.settings.baseNodeStyle,
        ...x.isCentral?this.settings.centralNodeStyle:{},
        ...x.isSibling?this.settings.siblingNodeStyle:{},
        ...this.settings.folderNodeStyle
      }
    } else if (this.page.isTag) {
      this.style = {
        ...this.settings.baseNodeStyle,
        ...x.isCentral?this.settings.centralNodeStyle:{},
        ...x.isSibling?this.settings.siblingNodeStyle:{},
        ...this.settings.tagNodeStyle
      }
    } else {
      this.style = {
        ...this.settings.baseNodeStyle,
        ...x.isInferred?this.settings.inferredNodeStyle:{},
        ...x.page.isVirtual?this.settings.virtualNodeStyle:{},
        ...x.isCentral?this.settings.centralNodeStyle:{},
        ...x.isSibling?this.settings.siblingNodeStyle:{},
        ...x.page.isAttachment?this.settings.attachmentNodeStyle:{},
        ...getTagStyle(this.page.primaryStyleTag,this.settings),
      };
    }
    this.friendGateOnLeft = x.friendGateOnLeft;
    this.title = this.page.getTitle();
  }


  private displayText(): string {
    const label = (this.style.prefix??"") + this.title;
    return label.length > this.style.maxLabelLength
      ? label.substring(0,this.style.maxLabelLength-1) + "..."
      : label;
  }

  setCenter(center:{x:number, y:number}) {
    this.center = center;
  }


  render() {
    const ea = this.ea;
    const label = this.displayText();
    const gateDiameter = this.style.gateRadius*2;
    ea.style.fontSize = this.style.fontSize;
    ea.style.fontFamily = this.style.fontFamily;
    const labelSize = ea.measureText(`${label}m`);
    ea.style.fillStyle = this.style.fillStyle;
    ea.style.roughness = this.style.roughness;
    ea.style.strokeSharpness = this.style.strokeShaprness;
    ea.style.strokeWidth = this.style.strokeWidth;
    ea.style.strokeColor = this.style.textColor;
    ea.style.backgroundColor = "transparent";
    this.id = ea.addText(
      this.center.x - labelSize.width / 2, 
      this.center.y - labelSize.height / 2,
      label,
      {
        wrapAt: this.style.maxLabelLength+5,
        textAlign: "center",
        box: true,
        boxPadding: this.style.padding,
      }
    );
    const box = ea.getElement(this.id) as any;
    box.link = `[[${this.page.file?.path??this.page.path}]]`;
    box.backgroundColor = this.style.backgroundColor;
    box.strokeColor = this.style.borderColor;
    box.strokeStyle = this.style.strokeStyle;

    ea.style.fillStyle = this.style.gateFillStyle;
    ea.style.strokeColor = this.style.gateStrokeColor;
    ea.style.strokeStyle = "solid";

    const friendCount = this.page.friendCount()
    ea.style.backgroundColor =  friendCount > 0 
      ? this.style.gateBackgroundColor
      : "transparent";
    this.friendGateId = ea.addEllipse(
      this.friendGateOnLeft
        ? this.center.x - gateDiameter - this.style.padding - labelSize.width / 2
        : this.center.x + this.style.padding + labelSize.width / 2,
      this.center.y - this.style.gateRadius,
      gateDiameter,
      gateDiameter
    );
    if(this.settings.showNeighborCount && friendCount>0) {
      ea.style.fontSize = gateDiameter;
      ea.addText(
        this.friendGateOnLeft
        ? friendCount>9
          ? this.center.x - 2*gateDiameter - this.style.padding - labelSize.width / 2
          : this.center.x - gateDiameter - this.style.padding - labelSize.width / 2
        : this.center.x + this.style.padding + labelSize.width / 2,
        this.friendGateOnLeft
        ? this.center.y - 2*gateDiameter
        : this.center.y - this.style.gateRadius + gateDiameter,
        friendCount.toString()
      );
    }

    const parentCount = this.page.parentCount()
    ea.style.backgroundColor =  parentCount > 0
      ? this.style.gateBackgroundColor
      : "transparent";
    this.parentGateId = ea.addEllipse(
      this.center.x - this.style.gateRadius - this.style.gateOffset,
      this.center.y - gateDiameter - this.style.padding - labelSize.height / 2,
      gateDiameter,
      gateDiameter
    );
    if(this.settings.showNeighborCount && parentCount>0) {
      ea.style.fontSize = gateDiameter;
      ea.addText(
        this.center.x + gateDiameter - this.style.gateOffset,
        this.center.y - gateDiameter - this.style.padding - labelSize.height / 2,
        parentCount.toString()
      );
    }

    const childrenCount = this.page.childrenCount()
    ea.style.backgroundColor =  childrenCount > 0
      ? this.style.gateBackgroundColor
      : "transparent";
    this.childGateId = ea.addEllipse(
      this.center.x - this.style.gateRadius + this.style.gateOffset,
      this.center.y + this.style.padding + labelSize.height / 2,
      gateDiameter,
      gateDiameter
    );
    if(this.settings.showNeighborCount && childrenCount>0) {
      ea.style.fontSize = gateDiameter;
      ea.addText(
        this.center.x + gateDiameter + this.style.gateOffset,
        this.center.y + this.style.padding + labelSize.height / 2,
        childrenCount.toString()
      );
    }
    
    ea.addToGroup([this.friendGateId,this.parentGateId,this.childGateId,this.id, box.boundElements[0].id]);
  }

}