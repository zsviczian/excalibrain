import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { ExcaliBrainSettings } from "src/Settings";
import { NodeStyle } from "src/Types";
import { getFilenameFromPath } from "src/utils/fileUtils";
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

  constructor(x:{page:Page, isInferred: boolean, isCentral: boolean, isSibling: boolean, friendGateOnLeft:boolean}) {
    this.page = x.page;
    this.settings = x.page.plugin.settings;
    this.ea = x.page.plugin.EA;
    this.style = {
      ...this.settings.baseNodeStyle,
      ...this.getTagStyle(),
      ...x.isInferred?this.settings.inferredNodeStyle:{},
      ...x.page.file?{}:this.settings.virtualNodeStyle,
      ...x.isCentral?this.settings.centralNodeStyle:{},
      ...x.isSibling?this.settings.siblingNodeStyle:{}
    };
    this.friendGateOnLeft = x.friendGateOnLeft;
    this.title = this.getTitle();
  }

  private getTitle(): string {
    const aliases = (this.page.file && this.settings.renderAlias)
      ? (this.page.dvPage?.file?.aliases?.values??[])
      : [];
    return aliases.length > 0 
      ? aliases[0] 
      : (this.page.file
        ? (this.page.file.extension === "md" ? this.page.file.basename : this.page.file.name)
        : getFilenameFromPath(this.page.path));
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

  getTagStyle():NodeStyle {
    const tag = (this.page.dvPage?.file?.tags?.values??[])
      .filter((t:string)=>this.settings.tagStyleList.some(x=>t.startsWith(x)))[0];
    if(!tag) {
      return {};
    }
    return this.settings.tagNodeStyles[this.settings.tagStyleList.filter(x=>tag.startsWith(x))[0]];
  }

  render() {
    const ea = this.ea;
    const label = this.displayText();
    ea.style.fontSize = this.style.fontSize;
    ea.style.fontFamily = this.style.fontFamily;
    const labelSize = ea.measureText(label);
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
    ea.style.backgroundColor =  this.page.hasFriends() ? this.style.gateBackgroundColor : "transparent";
    this.friendGateId = ea.addEllipse(
      this.friendGateOnLeft
        ? this.center.x - this.style.gateRadius * 2 - this.style.padding - labelSize.width / 2
        : this.center.x + this.style.padding + labelSize.width / 2,
      this.center.y - this.style.gateRadius,
      this.style.gateRadius * 2,
      this.style.gateRadius * 2
    );
    ea.style.backgroundColor =  this.page.hasParents() ? this.style.gateBackgroundColor : "transparent";
    this.parentGateId = ea.addEllipse(
      this.center.x - this.style.gateRadius - this.style.gateOffset,
      this.center.y - 2 * this.style.gateRadius - this.style.padding - labelSize.height / 2,
      this.style.gateRadius * 2,
      this.style.gateRadius * 2
    );
    ea.style.backgroundColor =  this.page.hasChildren() ? this.style.gateBackgroundColor : "transparent";
    this.childGateId = ea.addEllipse(
      this.center.x - this.style.gateRadius + this.style.gateOffset,
      this.center.y + this.style.padding + labelSize.height / 2,
      this.style.gateRadius * 2,
      this.style.gateRadius * 2
    );
    
    ea.addToGroup([this.friendGateId,this.parentGateId,this.childGateId,this.id, box.boundElements[0].id]);
  }

}