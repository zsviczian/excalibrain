import {
  App,
  DropdownComponent,
  PluginSettingTab,
  Setting,
  SliderComponent,
  TextAreaComponent,
  TextComponent,
  ToggleComponent,
} from "obsidian";
import { FillStyle, getEA, StrokeSharpness, StrokeStyle } from "obsidian-excalidraw-plugin";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { Page } from "./graph/Page";
import { t } from "./lang/helpers";
import ExcaliBrain from "./main";
import { Hierarchy, NodeStyle, LinkStyle, RelationType, NodeStyleData, LinkStyleData, LinkDirection, Role } from "./Types";
import { WarningPrompt } from "./utils/Prompts";
import { Node } from "./graph/Node";
import { svgToBase64 } from "./utils/utils";
import { Arrowhead } from "@zsviczian/excalidraw/types/element/types";
import { Link } from "./graph/Link";
import { DEFAULT_LINK_STYLE, DEFAULT_NODE_STYLE, PREDEFINED_LINK_STYLES } from "./constants/constants";

export interface ExcaliBrainSettings {
  excalibrainFilepath: string;
  hierarchy: Hierarchy;
  inferAllLinksAsFriends: boolean;
  renderAlias: boolean;
  nodeTitleScript: string;
  backgroundColor: string;
  excludeFilepaths: string[];
  showInferredNodes: boolean;
  showAttachments: boolean;
  showVirtualNodes: boolean;
  showFolderNodes: boolean;
  showTagNodes: boolean;
  showPageNodes: boolean;
  showNeighborCount: boolean;
  showFullTagName: boolean;
  maxItemCount: number;
  renderSiblings: boolean;
  baseNodeStyle: NodeStyle;
  centralNodeStyle: NodeStyle;
  inferredNodeStyle: NodeStyle;
  virtualNodeStyle: NodeStyle;
  siblingNodeStyle: NodeStyle;
  attachmentNodeStyle: NodeStyle;
  folderNodeStyle: NodeStyle;
  tagNodeStyle: NodeStyle;
  tagNodeStyles: {[key: string]: NodeStyle};
  tagStyleList: string[];
  baseLinkStyle: LinkStyle;
  inferredLinkStyle: LinkStyle;
  folderLinkStyle: LinkStyle;
  tagLinkStyle: LinkStyle;
  hierarchyLinkStyles: {[key: string]: LinkStyle};
  navigationHistory: string[];
  allowOntologySuggester: boolean;
  ontologySuggesterParentTrigger: string;
  ontologySuggesterChildTrigger: string;
  ontologySuggesterFriendTrigger: string;
  ontologySuggesterTrigger: string;
  ontologySuggesterMidSentenceTrigger: string;
  boldFields: boolean;
}

export const DEFAULT_SETTINGS: ExcaliBrainSettings = {
  excalibrainFilepath: "excalibrain.md",
  hierarchy: {
    exclusions: ["excalidraw-font","excalidraw-font-color","excalidraw-css","excalidraw-plugin",
      "excalidraw-link-brackets","excalidraw-link-prefix","excalidraw-border-color","excalidraw-default-mode",
      "excalidraw-export-dark","excalidraw-export-transparent","excalidraw-export-svgpadding","excalidraw-export-pngscale",
      "excalidraw-url-prefix", "excalidraw-linkbutton-opacity", "excalidraw-onload-script", "kanban-plugin"],
    parents: ["Parent", "Parents", "up", "u"],
    children: ["Children", "Child", "down", "d"],
    friends: ["Friends", "Friend", "Jump", "Jumps", "j"]
  },
  inferAllLinksAsFriends: false,
  renderAlias: true,
  nodeTitleScript: "",
  backgroundColor: "#0c3e6aff",
  excludeFilepaths: [],
  showInferredNodes: true,
  showAttachments: true,
  showVirtualNodes: true,
  showFolderNodes: false,
  showTagNodes: false,
  showPageNodes: true,
  showNeighborCount: true,
  showFullTagName: false,
  maxItemCount: 30,
  renderSiblings: true,
  baseNodeStyle: DEFAULT_NODE_STYLE,
  centralNodeStyle: {
    fontSize: 30,
    backgroundColor: "#C49A13FF",
    textColor: "#000000ff",
  },
  inferredNodeStyle: {
    backgroundColor: "#000005b3",
    textColor: "#95c7f3ff",
  },
  virtualNodeStyle: {
    backgroundColor: "#ff000066",
    fillStyle: "hachure",
    textColor: "#ffffffff",
  },
  siblingNodeStyle: {
    fontSize: 15,
  },
  attachmentNodeStyle: {
    prefix: "???? ",
  },
  folderNodeStyle: {
    prefix: "???? ",
    strokeShaprness: "sharp",
    borderColor: "#ffd700ff",
    textColor: "#ffd700ff"
  },
  tagNodeStyle: {
    prefix: "#",
    strokeShaprness: "sharp",
    borderColor: "#4682b4ff",
    textColor: "#4682b4ff"
  },
  tagNodeStyles: {},
  tagStyleList: [],
  baseLinkStyle: DEFAULT_LINK_STYLE,
  inferredLinkStyle: {
    strokeStyle: "dashed",
  },
  folderLinkStyle: {
    strokeColor: "#ffd700ff",
  },
  tagLinkStyle: {
    strokeColor: "#4682b4ff",
  },
  hierarchyLinkStyles: {},
  navigationHistory: [],
  allowOntologySuggester: true,
  ontologySuggesterParentTrigger: "::p",
  ontologySuggesterChildTrigger: "::c",
  ontologySuggesterFriendTrigger: "::f",
  ontologySuggesterTrigger: ":::",
  ontologySuggesterMidSentenceTrigger: "(",
  boldFields: false,
};

const HIDE_DISABLED_STYLE = "excalibrain-hide-disabled";
const HIDE_DISABLED_CLASS = "excalibrain-settings-disabled";

const getHex = (color:string) => color.substring(0,7);
const getAlphaFloat = (color:string) => parseInt(color.substring(7,9),16)/255;
const getAlphaHex = (a: number) => ((a * 255) | 1 << 8).toString(16).slice(1)

const fragWithHTML = (html: string) =>
  createFragment((frag) => (frag.createDiv().innerHTML = html));

const removeStylesheet = (name:string) => {
  const sheetToBeRemoved = document.getElementById(name);
  if(!sheetToBeRemoved) return;
  const sheetParent = sheetToBeRemoved.parentNode;
  if(!sheetParent) return;
  sheetParent.removeChild(sheetToBeRemoved);
}

const addStylesheet = (stylesheet: string, classname: string) => {
  const sheet = document.createElement('style');
  sheet.id = stylesheet;
  sheet.innerHTML = `.${classname} {display: none;}`;
  document.body.appendChild(sheet);
}

export class ExcaliBrainSettingTab extends PluginSettingTab {
  plugin: ExcaliBrain;
  ea: ExcalidrawAutomate;
  private dirty:boolean = false;
  private demoNode: Node;
  private demoNodeImg: HTMLImageElement;
  private demoLinkImg: HTMLImageElement;
  private demoLinkStyle: LinkStyleData;
  private demoNodeStyle: NodeStyleData;

  constructor(app: App, plugin: ExcaliBrain) {
    super(app, plugin);
    this.plugin = plugin;
  }

  get hierarchyStyleList(): string[] {
    return PREDEFINED_LINK_STYLES
      .concat(Array.from(this.plugin.settings.hierarchy.parents))
      .concat(Array.from(this.plugin.settings.hierarchy.children))
      .concat(Array.from(this.plugin.settings.hierarchy.friends));
  };

  async updateNodeDemoImg() {
    this.ea.reset();
    this.ea.canvas.viewBackgroundColor = this.plugin.settings.backgroundColor;
    this.demoNode.style = {
      ...this.demoNodeStyle.getInheritedStyle(),
      ...this.demoNodeStyle.style
    }
    this.demoNode.render();
    const svg = await this.ea.createSVG(null,true,{withBackground:true, withTheme:false},null,"",40);
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    this.demoNodeImg.setAttribute("src", svgToBase64(svg.outerHTML));
  };

  async updateLinkDemoImg() {
    this.ea.reset();
    this.ea.canvas.viewBackgroundColor = this.plugin.settings.backgroundColor;    

    const page = new Page(
      null,
      "Start node",
      null,
      this.plugin
    )
    const page2 = new Page(
      null,
      "End node",
      null,
      this.plugin
    )

    const hierarchy = this.plugin.settings.hierarchy;

    if(hierarchy.friends.contains(this.demoLinkStyle.display)) {
      page.addFriend(page2,RelationType.DEFINED,LinkDirection.FROM);
      page2.addFriend(page,RelationType.DEFINED,LinkDirection.TO);        
    } else if(hierarchy.parents.contains(this.demoLinkStyle.display)) {
      page.addParent(page2,RelationType.DEFINED,LinkDirection.FROM);
      page2.addChild(page,RelationType.DEFINED,LinkDirection.TO);  
    } else {
      page.addChild(page2,RelationType.DEFINED,LinkDirection.FROM);
      page2.addParent(page,RelationType.DEFINED,LinkDirection.TO);  
    }

    const demoNode = new Node({
      ea: this.ea,
      page,
      isInferred: false,
      isCentral: true,
      isSibling: false,
      friendGateOnLeft: true
    })
    demoNode.ea = this.ea;
    demoNode.setCenter({x:0,y:0}) 

    const demoNode2 = new Node({
      ea: this.ea,
      page: page2,
      isInferred:false,
      isCentral: false,
      isSibling: false,
      friendGateOnLeft: false
    })
    demoNode2.ea = this.ea;
    let role:Role = Role.CHILD;
    if(hierarchy.friends.contains(this.demoLinkStyle.display)) {
      demoNode2.setCenter({x:-300,y:0});
      role = Role.FRIEND;
    } else if(hierarchy.parents.contains(this.demoLinkStyle.display)) {
      demoNode2.setCenter({x:0,y:-150});
      role = Role.PARENT
    } else {
      demoNode2.setCenter({x:0,y:150});
    }       

    const demoLink = new Link(
      demoNode,
      demoNode2,
      role,
      RelationType.DEFINED,
      "base",
      this.ea,
      this.plugin.settings,
      this.plugin
    );

    demoNode.style = {
      ...this.plugin.settings.baseNodeStyle,
      ...this.plugin.settings.centralNodeStyle,
    }
    demoNode.render();

    demoNode2.style = {
      ...this.demoNodeStyle.getInheritedStyle(),
      ...this.demoNodeStyle.style
    }
    demoNode2.render();

    demoLink.style = {
      ...this.demoLinkStyle.getInheritedStyle(),
      ...this.demoLinkStyle.style
    }
    demoLink.render(false);

    const svg = await this.ea.createSVG(null,true,{withBackground:true, withTheme:false},null,"",40);
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    this.demoLinkImg.setAttribute("src", svgToBase64(svg.outerHTML));
  };


  async hide() {
    if(!this.dirty) {
      return;
    }
    if(this.plugin.settings.ontologySuggesterParentTrigger === "") {
      this.plugin.settings.ontologySuggesterParentTrigger = "::p";
    }
    if(this.plugin.settings.ontologySuggesterChildTrigger === "") {
      this.plugin.settings.ontologySuggesterChildTrigger = "::c";
    }
    if(this.plugin.settings.ontologySuggesterFriendTrigger === "") {
      this.plugin.settings.ontologySuggesterFriendTrigger = "::c";
    }
    if(this.plugin.settings.ontologySuggesterTrigger === "") {
      this.plugin.settings.ontologySuggesterTrigger = ":::";
    }
    if(this.plugin.settings.ontologySuggesterMidSentenceTrigger === "") {
      this.plugin.settings.ontologySuggesterMidSentenceTrigger = "(";
    }

    this.plugin.setHierarchyLinkStylesExtended();
    this.plugin.settings.tagStyleList = Object.keys(this.plugin.settings.tagNodeStyles);
    this.plugin.loadCustomNodeLabelFunction();
    this.plugin.saveSettings();
    this.plugin.scene?.reRender();
  }

  colorpicker(
    containerEl: HTMLElement,
    name: string,
    description: string,
    getValue:()=>string,
    setValue:(val:string)=>void,
    deleteValue:()=>void,
    allowOverride: boolean,
    defaultValue: string
  ) {
    let sliderComponent: SliderComponent;
    let picker: HTMLInputElement;
    let toggleComponent: ToggleComponent;
    let colorLabel: HTMLSpanElement;
    let opacityLabel: HTMLSpanElement;
    let displayText: HTMLDivElement;

    const setting = new Setting(containerEl)
      .setName(name)

    if(description) {
      setting.setDesc(fragWithHTML(description));
    }

    const setDisabled = (isDisabled:boolean) => {
      if(isDisabled) {
        setting.settingEl.addClass(HIDE_DISABLED_CLASS);
      } else {
        setting.settingEl.removeClass(HIDE_DISABLED_CLASS);
      }      
      picker.disabled = isDisabled;
      picker.style.opacity = isDisabled ? "0.3" : "1";
      sliderComponent.setDisabled(isDisabled);
      sliderComponent.sliderEl.style.opacity = isDisabled ? "0.3" : "1";
      colorLabel.style.opacity = isDisabled ? "0.3" : "1";
      opacityLabel.style.opacity = isDisabled ? "0.3" : "1";
      displayText.style.opacity = isDisabled ? "0.3" : "1";
    }
    if(allowOverride) {
      setting.addToggle(toggle => {
        toggleComponent = toggle;
        toggle.toggleEl.addClass("excalibrain-settings-toggle");
        toggle
          .setValue(typeof getValue() !== "undefined")
          .setTooltip(t("NODESTYLE_INCLUDE_TOGGLE"))
          .onChange(value => {
            this.dirty = true;
            if(!value) {
              setDisabled(true);
              deleteValue();
              return;
            }
            setValue(picker.value + getAlphaHex(sliderComponent.getValue()))
            setDisabled(false);
          })
      })
    }
    setting.settingEl.removeClass("mod-toggle");
    colorLabel = createEl("span",{
      text: "color:",
      cls: "excalibrain-settings-colorlabel"
    });
    
    setting.controlEl.appendChild(colorLabel)   

    picker = createEl("input", {
      type: "color",
      cls: "excalibrain-settings-colorpicker"
    },(el:HTMLInputElement)=>{
      el.value = getHex(getValue()??defaultValue);
      el.onchange = () => {
        setValue(el.value+ getAlphaHex(sliderComponent.getValue()));
      }
    });
    setting.controlEl.appendChild(picker);

    opacityLabel = createEl("span",{
      text: "opacity:",
      cls: "excalibrain-settings-opacitylabel"
    });
    setting.controlEl.appendChild(opacityLabel);

    setting.addSlider(slider => {
      sliderComponent = slider;
      slider
        .setLimits(0,1,0.1)
        .setValue(getAlphaFloat(getValue()??defaultValue))
        .onChange((value)=>{
          setValue(picker.value + getAlphaHex(value));
          displayText.innerText = ` ${value.toString()}`;
          picker.style.opacity = value.toString();
        })
    })

    displayText = createDiv({
      text: `${sliderComponent.getValue().toString()}`,
      cls: "excalibrain-settings-sliderlabel"
    });
    setting.controlEl.appendChild(displayText);
    picker.style.opacity = sliderComponent.getValue().toString();

    setDisabled(allowOverride && !toggleComponent.getValue());
    
  }

  numberslider(
    containerEl: HTMLElement,
    name: string,
    description: string,
    limits: {min:number,max:number,step:number},
    getValue:()=>number,
    setValue:(val:number)=>void,
    deleteValue:()=>void,
    allowOverride: boolean,
    defaultValue: number,
  ) {
    let displayText: HTMLDivElement;
    let toggleComponent: ToggleComponent;
    let sliderComponent: SliderComponent;

    const setting = new Setting(containerEl).setName(name);

    const setDisabled = (isDisabled:boolean) => {
      if(isDisabled) {
        setting.settingEl.addClass(HIDE_DISABLED_CLASS);
      } else {
        setting.settingEl.removeClass(HIDE_DISABLED_CLASS);
      }
      sliderComponent.setDisabled(isDisabled);
      sliderComponent.sliderEl.style.opacity = isDisabled ? "0.3" : "1";
      displayText.style.opacity = isDisabled ? "0.3" : "1";
    }

    if(allowOverride) {
      setting.addToggle(toggle => {
        toggleComponent = toggle;
        toggle.toggleEl.addClass("excalibrain-settings-toggle");
        toggle
          .setValue(typeof getValue() !== "undefined")
          .setTooltip(t("NODESTYLE_INCLUDE_TOGGLE"))
          .onChange(value => {
            this.dirty = true;
            if(!value) {
              setDisabled(true);
              deleteValue();
              return;
            }
            setValue(sliderComponent.getValue())
            setDisabled(false);
          })
      })
    }
    
    setting.addSlider((slider) => {
      sliderComponent = slider;
      slider
        .setLimits(limits.min,limits.max,limits.step)
        .setValue(getValue()??defaultValue)
        .onChange(async (value) => {
          displayText.innerText = ` ${value.toString()}`;
          setValue(value);
          this.dirty = true;
        })
      });

    if(description) {
      setting.setDesc(fragWithHTML(description));
    }

    setting.settingEl.createDiv("", (el) => {
      displayText = el;
      el.style.minWidth = "2.3em";
      el.style.textAlign = "right";
      el.innerText = ` ${sliderComponent.getValue().toString()}`;
    });

    setDisabled(allowOverride && !toggleComponent.getValue());
  }

  toggle(
    containerEl: HTMLElement,
    name: string,
    description: string,
    getValue:()=>boolean,
    setValue:(val:boolean)=>void,
    deleteValue:()=>void,
    allowOverride: boolean,
    defaultValue: boolean,
  ) {
    let toggleComponent: ToggleComponent;
    let valueComponent: ToggleComponent;

    const setting = new Setting(containerEl).setName(name);

    const setDisabled = (isDisabled:boolean) => {
      if(isDisabled) {
        setting.settingEl.addClass(HIDE_DISABLED_CLASS);
      } else {
        setting.settingEl.removeClass(HIDE_DISABLED_CLASS);
      }
      valueComponent.setDisabled(isDisabled);
      valueComponent.toggleEl.style.opacity = isDisabled ? "0.3" : "1";
    }

    if(allowOverride) {
      setting.addToggle(toggle => {
        toggleComponent = toggle;
        toggle.toggleEl.addClass("excalibrain-settings-toggle");
        toggle
          .setValue(typeof getValue() !== "undefined")
          .setTooltip(t("NODESTYLE_INCLUDE_TOGGLE"))
          .onChange(value => {
            this.dirty = true;
            if(!value) {
              setDisabled(true);
              deleteValue();
              return;
            }
            setValue(valueComponent.getValue())
            setDisabled(false);
          })
      })
    }
    
    setting.addToggle((toggle) => {
      valueComponent = toggle;
      toggle
        .setValue(getValue()??defaultValue)
        .onChange(async (value) => {
          setValue(value);
          this.dirty = true;
        })
      });

    if(description) {
      setting.setDesc(fragWithHTML(description));
    }

    setDisabled(allowOverride && !toggleComponent.getValue());
  }  

  dropdownpicker(
    containerEl: HTMLElement,
    name: string,
    description: string,
    options: Record<string,string>,
    getValue:()=>string,
    setValue:(val:string)=>void,
    deleteValue:()=>void,
    allowOverride: boolean,
    defaultValue: string,
  ) {
    let dropdownComponent: DropdownComponent;
    let toggleComponent: ToggleComponent;

    const setting = new Setting(containerEl).setName(name);

    const setDisabled = (isDisabled:boolean) => {
      if(isDisabled) {
        setting.settingEl.addClass(HIDE_DISABLED_CLASS);
      } else {
        setting.settingEl.removeClass(HIDE_DISABLED_CLASS);
      }
      dropdownComponent.setDisabled(isDisabled);
      dropdownComponent.selectEl.style.opacity = isDisabled ? "0.3" : "1";
    }

    if(allowOverride) {
      setting.addToggle(toggle => {
        toggleComponent = toggle;
        toggle.toggleEl.addClass("excalibrain-settings-toggle");
        toggle
          .setValue(typeof getValue() !== "undefined")
          .setTooltip(t("NODESTYLE_INCLUDE_TOGGLE"))
          .onChange(value => {
            this.dirty = true;
            if(!value) {
              setDisabled(true);
              deleteValue();
              return;
            }
            setValue(dropdownComponent.getValue())
            setDisabled(false);
          })
      })
    }

    setting.addDropdown(dropdown => {
      dropdownComponent = dropdown;
      dropdown
        .addOptions(options)
        .setValue(getValue()??defaultValue)
        .onChange(value => {
          setValue(value);
          this.dirty = true;
        })
      })

    if(description) {
      setting.setDesc(fragWithHTML(description));
    }

    setDisabled(allowOverride && !toggleComponent.getValue());
  }

  nodeSettings(
    containerEl: HTMLElement,
    setting: NodeStyle,
    allowOverride: boolean = true,
    inheritedStyle: NodeStyle
  ) {
   
    let textComponent: TextComponent;
    let toggleComponent: ToggleComponent;
    const prefixSetting = new Setting(containerEl)
      .setName(t("NODESTYLE_PREFIX_NAME"))
      .setDesc(fragWithHTML(t("NODESTYLE_PREFIX_DESC")));

    const setDisabled = (isDisabled: boolean) => {
      if(isDisabled) {
        prefixSetting.settingEl.addClass(HIDE_DISABLED_CLASS);
      } else {
        prefixSetting.settingEl.removeClass(HIDE_DISABLED_CLASS);
      }
      textComponent.setDisabled(isDisabled);
      textComponent.inputEl.style.opacity = isDisabled ? "0.3": "1"; 
    }
    if(allowOverride) {
      prefixSetting.addToggle(toggle => {
        toggleComponent = toggle;
        toggle.toggleEl.addClass("excalibrain-settings-toggle");
        toggle
          .setValue(typeof setting.prefix !== "undefined")
          .setTooltip(t("NODESTYLE_INCLUDE_TOGGLE"))
          .onChange(value => {
            this.dirty = true;
            if(!value) {
              setDisabled(true);
              setting.prefix = undefined;
              this.updateNodeDemoImg();
              return;
            }
            setDisabled(false);
          })
      })
    }
    prefixSetting
      .addText(text => {
        textComponent = text;
        text
          .setValue(setting.prefix??inheritedStyle.prefix)
          .onChange(value => {
            setting.prefix = value;
            this.updateNodeDemoImg();
            this.dirty = true;
          })
      })  
    setDisabled(allowOverride && !toggleComponent.getValue());

    this.colorpicker(
      containerEl,
      t("NODESTYLE_BGCOLOR"),
      null,
      ()=>setting.backgroundColor,
      val=>{ 
        setting.backgroundColor=val;
        this.updateNodeDemoImg();
      },
      ()=>{
        delete setting.backgroundColor;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.backgroundColor,
    );

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_BG_FILLSTYLE"),
      null,
      {"hachure": "Hachure", "cross-hatch": "Cross-hatch", "solid": "Solid"},
      () => setting.fillStyle?.toString(),
      (val) => {
        setting.fillStyle = val as FillStyle;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.fillStyle;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.fillStyle.toString(),
    )

    this.colorpicker(
      containerEl,
      t("NODESTYLE_TEXTCOLOR"),
      null,
      ()=>setting.textColor,
      val=> {
        setting.textColor=val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.textColor;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.textColor,
    );

    this.colorpicker(
      containerEl,
      t("NODESTYLE_BORDERCOLOR"),
      null,
      ()=>setting.borderColor,
      val=> {
        setting.borderColor=val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.borderColor;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.borderColor,
    );

    this.numberslider(
      containerEl,
      t("NODESTYLE_FONTSIZE"),
      null,
      {min:10,max:50,step:5},
      () => setting.fontSize,
      (val) => {
        setting.fontSize = val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.fontSize;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.fontSize,
    )

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_FONTFAMILY"),
      null,
      {1:"Hand-drawn",2:"Normal",3:"Code",4:"Fourth (custom) Font"},
      () => setting.fontFamily?.toString(),
      (val) => {
        setting.fontFamily =  parseInt(val);
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.fontFamily;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.fontFamily.toString(),
    )

    this.numberslider(
      containerEl,
      t("NODESTYLE_MAXLABELLENGTH_NAME"),
      t("NODESTYLE_MAXLABELLENGTH_DESC"),
      {min:15,max:100,step:5},
      () => setting.maxLabelLength,
      (val) => {
        setting.maxLabelLength = val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.maxLabelLength;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.maxLabelLength,
    )
    
    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_ROUGHNESS"),
      null,
      {0:"Architect",1:"Artist",2:"Cartoonist"},
      () => setting.roughness?.toString(),
      (val) => {
        setting.roughness =  parseInt(val);
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.roughness;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.roughness.toString(),
    )

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_SHARPNESS"),
      null,
      {"sharp":"Sharp","round":"Round"},
      () => setting.strokeShaprness,
      (val) => {
        setting.strokeShaprness = val as StrokeSharpness;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.strokeShaprness;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.strokeShaprness,
    )

    this.numberslider(
      containerEl,
      t("NODESTYLE_STROKEWIDTH"),
      null,
      {min:0.5,max:6,step:0.5},
      () => setting.strokeWidth,
      (val) => {
        setting.strokeWidth = val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.strokeWidth;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.strokeWidth,
    )

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_STROKESTYLE"),
      null,
      {"solid":"Solid","dashed":"Dashed","dotted":"Dotted"},
      () => setting.strokeStyle,
      (val) => {
        setting.strokeStyle = val as StrokeStyle;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.strokeStyle;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.strokeStyle,
    )

    this.numberslider(
      containerEl,
      t("NODESTYLE_RECTANGLEPADDING"),
      null,
      {min:5,max:50,step:5},
      () => setting.padding,
      (val) => {
        setting.padding = val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.padding;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.padding,
    )

    this.numberslider(
      containerEl,
      t("NODESTYLE_GATE_RADIUS_NAME"),
      t("NODESTYLE_GATE_RADIUS_DESC"),
      {min:3,max:10,step:1},
      () => setting.gateRadius,
      (val) => {
        setting.gateRadius = val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.gateRadius;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.gateRadius,
    )
    
    this.numberslider(
      containerEl,
      t("NODESTYLE_GATE_OFFSET_NAME"),
      t("NODESTYLE_GATE_OFFSET_DESC"),
      {min:0,max:25,step:1},
      () => setting.gateOffset,
      (val) => {
        setting.gateOffset = val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.gateOffset;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.gateOffset,
    )

    this.colorpicker(
      containerEl,
      t("NODESTYLE_GATE_COLOR"),
      null,
      ()=>setting.gateStrokeColor,
      val=> {
        setting.gateStrokeColor=val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.gateStrokeColor;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.gateStrokeColor,
    );
    
    this.colorpicker(
      containerEl,
      t("NODESTYLE_GATE_BGCOLOR_NAME"),
      t("NODESTYLE_GATE_BGCOLOR_DESC"),
      ()=>setting.gateBackgroundColor,
      val=> {
        setting.gateBackgroundColor=val;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.gateBackgroundColor;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.gateBackgroundColor,
    );

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_GATE_FILLSTYLE"),
      null,
      {"hachure": "Hachure", "cross-hatch": "Cross-hatch", "solid": "Solid"},
      () => setting.gateFillStyle?.toString(),
      (val) => {
        setting.gateFillStyle = val as FillStyle;
        this.updateNodeDemoImg();
      },
      ()=> {
        delete setting.gateFillStyle;
        this.updateNodeDemoImg();
      },
      allowOverride,
      inheritedStyle.gateFillStyle.toString(),
    )
  }

  linkSettings(
    containerEl: HTMLElement,
    setting: LinkStyle,
    allowOverride: boolean = true,
    inheritedStyle: LinkStyle
  ) {
    this.colorpicker(
      containerEl,
      t("LINKSTYLE_COLOR"),
      null,
      ()=>setting.strokeColor,
      val=>{ 
        setting.strokeColor=val;
        this.updateLinkDemoImg();
      },
      ()=>{
        delete setting.strokeColor;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.strokeColor,
    );

  this.numberslider(
      containerEl,
      t("LINKSTYLE_WIDTH"),
      null,
      {min:0.5,max:10,step:0.5},
      () => setting.strokeWidth,
      (val) => {
        setting.strokeWidth = val;
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.strokeWidth;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.strokeWidth,
    )

  this.dropdownpicker(
      containerEl,
      t("LINKSTYLE_ROUGHNESS"),
      null,
      {0:"Architect",1:"Artist",2:"Cartoonist"},
      () => setting.roughness?.toString(),
      (val) => {
        setting.roughness =  parseInt(val);
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.roughness;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.roughness.toString(),
    )

  this.dropdownpicker(
      containerEl,
      t("LINKSTYLE_STROKE"),
      null,
      {"solid":"Solid","dashed":"Dashed","dotted":"Dotted"},
      () => setting.strokeStyle,
      (val) => {
        setting.strokeStyle = val as StrokeStyle;
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.strokeStyle;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.strokeStyle,
    )
    
    this.dropdownpicker(
      containerEl,
      t("LINKSTYLE_ARROWSTART"),
      null,
      {"none":"None","arrow":"Arrow","bar":"Bar","dot":"Dot","triangle":"Triangle"},
      () => setting.startArrowHead,
      (val) => {
        setting.startArrowHead = (val === "") ? null : val as Arrowhead;
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.startArrowHead;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.startArrowHead,
    )

    this.dropdownpicker(
      containerEl,
      t("LINKSTYLE_ARROWEND"),
      null,
      {"none":"None","arrow":"Arrow","bar":"Bar","dot":"Dot","triangle":"Triangle"},
      () => setting.endArrowHead,
      (val) => {
        setting.endArrowHead = (val === "") ? null : val as Arrowhead;
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.endArrowHead;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.endArrowHead,
    )

    this.toggle(
      containerEl,
      t("LINKSTYLE_SHOWLABEL"),
      null,
      () => setting.showLabel,
      (val) => {
        setting.showLabel = val;
        this.updateLinkDemoImg();
      },
      () => {
        delete setting.showLabel;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.showLabel
    )

    this.colorpicker(
      containerEl,
      t("NODESTYLE_TEXTCOLOR"),
      null,
      ()=>setting.textColor,
      val=> {
        setting.textColor=val;
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.textColor;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.textColor,
    );


    this.numberslider(
      containerEl,
      t("LINKSTYLE_FONTSIZE"),
      null,
      {min:6,max:30,step:3},
      () => setting.fontSize,
      (val) => {
        setting.fontSize = val;
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.fontSize;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.fontSize,
    )

    this.dropdownpicker(
      containerEl,
      t("LINKSTYLE_FONTFAMILY"),
      null,
      {1:"Hand-drawn",2:"Normal",3:"Code",4:"Fourth (custom) Font"},
      () => setting.fontFamily?.toString(),
      (val) => {
        setting.fontFamily =  parseInt(val);
        this.updateLinkDemoImg();
      },
      ()=> {
        delete setting.fontFamily;
        this.updateLinkDemoImg();
      },
      allowOverride,
      inheritedStyle.fontFamily.toString(),
    )

  }  

  getUnusedFieldNames():string {
    const fieldSet = new Set();
    //@ts-ignore
    this.plugin.DVAPI.index.pages.forEach(p=>{
      const keys:IterableIterator<string> = p?.fields.keys();
      if(!keys) return;
      let f;
      while(!(f = keys.next()).done) {
        if(
          !f.value.contains(",") && 
          !(f.value.startsWith("**") && f.value.endsWith("**"))
        ) {
          fieldSet.add(f.value);
        }
      }
    });
    const fieldNameMap = new Map();
    fieldSet.forEach((f:string)=>{
      fieldNameMap.set(f,f.toLowerCase().replaceAll(" ","-"))
    });
    const assigned = new Set();
    this.plugin.settings.hierarchy.parents.forEach(x=>assigned.add(x.toLowerCase().replaceAll(" ","-")))
    this.plugin.settings.hierarchy.children.forEach(x=>assigned.add(x.toLowerCase().replaceAll(" ","-")))
    this.plugin.settings.hierarchy.friends.forEach(x=>assigned.add(x.toLowerCase().replaceAll(" ","-")))
    this.plugin.settings.hierarchy.exclusions.forEach(x=>assigned.add(x.toLowerCase().replaceAll(" ","-")))

    Array.from(fieldNameMap.entries()).forEach(([k,v])=>{
      if(assigned.has(k.toLowerCase().replaceAll(" ","-"))) {
        fieldNameMap.delete(k);
        fieldNameMap.delete(v);
        return;
      }
      if(assigned.has(v)) {
        fieldNameMap.delete(k);
        fieldNameMap.delete(v);
        return;
      }
      if(k!==v) fieldNameMap.delete(v);
    });
    return Array.from(fieldNameMap.keys()).sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1).join(", ")
  }

  async display() {
    const nh = this.plugin.settings.navigationHistory;
    await this.plugin.loadSettings(); //in case sync loaded changed settings in the background
    this.plugin.settings.navigationHistory = nh;

    this.ea = getEA();

    //initialize sample 
    const page = new Page(
      null,
      "This is a demo node that is 46 characters long",
      null,
      this.plugin
    )
    const page2 = new Page(
      null,
      "This is a child node",
      null,
      this.plugin
    )
    page.addChild(page2,RelationType.DEFINED,LinkDirection.FROM);
    page2.addParent(page,RelationType.DEFINED,LinkDirection.TO);
    this.demoNode = new Node({
      ea: this.ea,
      page,
      isInferred: false,
      isCentral: false,
      isSibling: false,
      friendGateOnLeft: true
    })
    this.demoNode.ea = this.ea;
    this.demoNode.setCenter({x:0,y:0}) 

    const { containerEl } = this;
    this.containerEl.empty();

    const coffeeDiv = containerEl.createDiv("coffee");
    coffeeDiv.addClass("ex-coffee-div");
    const coffeeLink = coffeeDiv.createEl("a", {
      href: "https://ko-fi.com/zsolt",
    });
    const coffeeImg = coffeeLink.createEl("img", {
      attr: {
        src: "https://cdn.ko-fi.com/cdn/kofi3.png?v=3",
      },
    });
    coffeeImg.height = 45;

    new Setting(containerEl)
      .setName(t("EXCALIBRAIN_FILE_NAME"))
      .setDesc(fragWithHTML(t("EXCALIBRAIN_FILE_DESC")))
      .addText(text=>
        text
          .setValue(this.plugin.settings.excalibrainFilepath)
          .onChange((value) => {
            this.dirty = true;
            if(!value.endsWith(".md")) {
              value = value + (value.endsWith(".m") ? "d" : value.endsWith(".") ? "md" : ".md");
            }
            const f = this.app.vault.getAbstractFileByPath(value);
            if(f) {
              new WarningPrompt(
                this.app,
                "??? File Exists",
                `${value} already exists in your Vault. Is it ok to overwrite this file?`)
              .show((result: boolean) => {
                if(result) {
                  this.plugin.settings.excalibrainFilepath = value;
                  this.dirty = true;
                  text.inputEl.value = value;
                }
              });
              return;
            }
            this.plugin.settings.excalibrainFilepath = value;
            this.dirty = true;
          })
          .inputEl.onblur = () => {text.setValue(this.plugin.settings.excalibrainFilepath)}
      )
    
    this.containerEl.createEl("h1", {
      cls: "excalibrain-settings-h1",
      text: t("HIERARCHY_HEAD")
    });
    const hierarchyDesc = this.containerEl.createEl("p", {});
    hierarchyDesc.innerHTML =  t("HIERARCHY_DESC");

    let onHierarchyChange: Function = ()=>{};
    const hierarchyParentSetting = new Setting(containerEl)
      .setName(t("PARENTS_NAME"))
      .addTextArea((text)=> {
        text.inputEl.style.height = "90px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.hierarchy.parents.join(", "))
          .onChange(value => {
            this.plugin.settings.hierarchy.parents = value
              .split(",")
              .map(s=>s.trim())
              .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.plugin.hierarchyLowerCase.parents = [];
            this.plugin.settings.hierarchy.parents.forEach(f=>this.plugin.hierarchyLowerCase.parents.push(f.toLowerCase().replaceAll(" ","-")))
            onHierarchyChange();
            this.dirty = true;
          })
      })
    hierarchyParentSetting.nameEl.addClass("excalibrain-setting-nameEl");
    hierarchyParentSetting.descEl.addClass("excalibrain-setting-descEl");
    hierarchyParentSetting.controlEl.addClass("excalibrain-setting-controlEl");

    const hierarchyChildSetting = new Setting(containerEl)
      .setName(t("CHILDREN_NAME"))
      .addTextArea((text)=> {
        text.inputEl.style.height = "90px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.hierarchy.children.join(", "))
          .onChange(value => {
            this.plugin.settings.hierarchy.children = value
              .split(",")
              .map(s=>s.trim())
              .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.plugin.hierarchyLowerCase.children = [];
            this.plugin.settings.hierarchy.children.forEach(f=>this.plugin.hierarchyLowerCase.children.push(f.toLowerCase().replaceAll(" ","-")))
            onHierarchyChange();
            this.dirty = true;
          })
      })
    hierarchyChildSetting.nameEl.addClass("excalibrain-setting-nameEl");
    hierarchyChildSetting.descEl.addClass("excalibrain-setting-descEl");
    hierarchyChildSetting.controlEl.addClass("excalibrain-setting-controlEl");
  
    const hierarchyFriendSetting = new Setting(containerEl)
      .setName(t("FRIENDS_NAME"))
      .addTextArea((text)=> {
        text.inputEl.style.height = "90px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.hierarchy.friends.join(", "))
          .onChange(value => {
            this.plugin.settings.hierarchy.friends = value
              .split(",")
              .map(s=>s.trim())
              .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.plugin.hierarchyLowerCase.friends = [];
            this.plugin.settings.hierarchy.friends.forEach(f=>this.plugin.hierarchyLowerCase.friends.push(f.toLowerCase().replaceAll(" ","-")))
            onHierarchyChange();
            this.dirty = true;
          })
      })
    hierarchyFriendSetting.nameEl.addClass("excalibrain-setting-nameEl");
    hierarchyFriendSetting.descEl.addClass("excalibrain-setting-descEl");
    hierarchyFriendSetting.controlEl.addClass("excalibrain-setting-controlEl");
   
    const hierarchyExclusionSetting = new Setting(containerEl)
      .setName(t("EXCLUSIONS_NAME"))
      .setDesc(t("EXCLUSIONS_DESC"))
      .addTextArea((text)=> {
        text.inputEl.style.height = "90px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.hierarchy.exclusions.join(", "))
          .onChange(value => {
            this.plugin.settings.hierarchy.exclusions = value
              .split(",")
              .map(s=>s.trim())
              .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
              onHierarchyChange();
            this.dirty = true;
          })
      })
    hierarchyExclusionSetting.nameEl.addClass("excalibrain-setting-nameEl");
    hierarchyExclusionSetting.descEl.addClass("excalibrain-setting-descEl");
    hierarchyExclusionSetting.controlEl.addClass("excalibrain-setting-controlEl");

    let unassingedFieldsTextArea: TextAreaComponent;
    const hierarchyUnassignedSetting =new Setting(containerEl)
      .setName(t("UNASSIGNED_NAME"))
      .setDesc(t("UNASSIGNED_DESC"))
      .addTextArea((text)=> {
        unassingedFieldsTextArea = text;
        text.inputEl.style.height = "90px";
        text.inputEl.style.width = "100%";
        text.setValue(this.getUnusedFieldNames())
        text.setDisabled(true);
      })
    hierarchyUnassignedSetting.nameEl.addClass("excalibrain-setting-nameEl");
    hierarchyUnassignedSetting.descEl.addClass("excalibrain-setting-descEl");
    hierarchyUnassignedSetting.controlEl.addClass("excalibrain-setting-controlEl");

    new Setting(containerEl)
      .setName(t("INFER_NAME"))
      .setDesc(fragWithHTML(t("INFER_DESC")))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.inferAllLinksAsFriends)
          .onChange(value => {
            this.plugin.settings.inferAllLinksAsFriends = value;
            this.dirty = true;
          })
        )

    let pSetting:Setting, cSetting:Setting, fSetting:Setting, gSetting: Setting, mSetting: Setting, bSetting: Setting;

    new Setting(containerEl)
      .setName(t("ONTOLOGY_SUGGESTER_NAME"))
      .setDesc(t("ONTOLOGY_SUGGESTER_DESC"))
      .addToggle(toggle=> 
        toggle
          .setValue(this.plugin.settings.allowOntologySuggester)
          .onChange(value => {
            this.plugin.settings.allowOntologySuggester = value;
            gSetting.setDisabled(!value);
            pSetting.setDisabled(!value);
            cSetting.setDisabled(!value);
            fSetting.setDisabled(!value);
            mSetting.setDisabled(!value);
            bSetting.setDisabled(!value);
            this.dirty = true;
          })
      )

    gSetting = new Setting(containerEl)
      .setName(t("ONTOLOGY_SUGGESTER_ALL_NAME"))
      .setDisabled(!this.plugin.settings.allowOntologySuggester)
      .addText(text=>
        text
          .setValue(this.plugin.settings.ontologySuggesterTrigger)
          .onChange(value => {
            this.plugin.settings.ontologySuggesterTrigger = value;
            this.dirty = true;
          })  
      )

    pSetting = new Setting(containerEl)
      .setName(t("ONTOLOGY_SUGGESTER_PARENT_NAME"))
      .setDisabled(!this.plugin.settings.allowOntologySuggester)
      .addText(text=>
        text
          .setValue(this.plugin.settings.ontologySuggesterParentTrigger)
          .onChange(value => {
            this.plugin.settings.ontologySuggesterParentTrigger = value;
            this.dirty = true;
          })  
      )
    

    cSetting = new Setting(containerEl)
      .setName(t("ONTOLOGY_SUGGESTER_CHILD_NAME"))
      .setDisabled(!this.plugin.settings.allowOntologySuggester)
      .addText(text=>
        text
          .setValue(this.plugin.settings.ontologySuggesterChildTrigger)
          .onChange(value => {
            this.plugin.settings.ontologySuggesterChildTrigger = value;
            this.dirty = true;
          })  
      )

    fSetting = new Setting(containerEl)
      .setName(t("ONTOLOGY_SUGGESTER_FRIEND_NAME"))
      .setDisabled(!this.plugin.settings.allowOntologySuggester)
      .addText(text=>
        text
          .setValue(this.plugin.settings.ontologySuggesterFriendTrigger)
          .onChange(value => {
            this.plugin.settings.ontologySuggesterFriendTrigger = value;
            this.dirty = true;
          })  
      )
    
    mSetting = new Setting(containerEl)
      .setName(t("MID_SENTENCE_SUGGESTER_TRIGGER_NAME"))
      .setDesc(fragWithHTML(t("MID_SENTENCE_SUGGESTER_TRIGGER_DESC")))
      .addDropdown(dropdown => {
        dropdown
          .addOption("(","(")
          .addOption("[","[")
          .setValue(this.plugin.settings.ontologySuggesterMidSentenceTrigger)
          .onChange(value => {
            this.plugin.settings.ontologySuggesterMidSentenceTrigger = value;
            this.dirty = true;
          })
      })

    bSetting = new Setting(containerEl)
      .setName(t("BOLD_FIELDS_NAME"))
      .setDesc(fragWithHTML(t("BOLD_FIELDS_DESC")))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.boldFields)
          .onChange(value => {
            this.plugin.settings.boldFields = value;
            this.dirty = true;
          }))
    
    this.containerEl.createEl("h1", {
      cls: "excalibrain-settings-h1",
      text: t("DISPLAY_HEAD") 
    });

    const filepathList = new Setting(containerEl)
      .setName(t("EXCLUDE_PATHLIST_NAME"))
      .setDesc(fragWithHTML(t("EXCLUDE_PATHLIST_DESC")))
      .addTextArea((text)=> {
        text.inputEl.style.height = "100px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.excludeFilepaths.join(", "))
          .onChange(value => {
            value = value.replaceAll("\n"," ");
            const paths = value.split(",").map(s=>s.trim());
            this.plugin.settings.excludeFilepaths = paths.filter(p=>p!=="");
            this.dirty = true;
          });
        })
    filepathList.descEl.style.width = "90%";
    filepathList.controlEl.style.width = "90%";

    new Setting(containerEl)
      .setName(t("SHOW_FULL_TAG_PATH_NAME"))
      .setDesc(fragWithHTML(t("SHOW_FULL_TAG_PATH_DESC")))
      .addToggle(toggle => 
        toggle
          .setValue(this.plugin.settings.showFullTagName)
          .onChange(value => {
            this.plugin.settings.showFullTagName = value;
            this.dirty = true;
          }))

    new Setting(containerEl)
      .setName(t("RENDERALIAS_NAME"))
      .setDesc(fragWithHTML(t("RENDERALIAS_DESC")))
      .addToggle(toggle=>
        toggle
          .setValue(this.plugin.settings.renderAlias)
          .onChange(value => {
            this.plugin.settings.renderAlias = value;
            this.dirty = true;
          })
      );

    const nodeScriptSetting = new Setting(containerEl)
      .setName(t("NODETITLE_SCRIPT_NAME"))
      .setDesc(fragWithHTML(t("NODETITLE_SCRIPT_DESC")))
      .addTextArea(text=> {
        text.inputEl.style.height = "200px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.nodeTitleScript)
          .onChange(value => {
            this.plugin.settings.nodeTitleScript = value;
            this.dirty = true;
          })
        });
    nodeScriptSetting.descEl.style.width="90%";
    nodeScriptSetting.controlEl.style.width="90%";

    new Setting(containerEl)
      .setName(t("SHOWINFERRED_NAME"))
      .setDesc(fragWithHTML(t("SHOWINFERRED_DESC")))
      .addToggle(toggle=>
        toggle
          .setValue(this.plugin.settings.showInferredNodes)
          .onChange(value => {
            this.plugin.settings.showInferredNodes = value;
            this.dirty = true;
          })
      );
    
    new Setting(containerEl)
      .setName(t("SHOWATTACHMENTS_NAME"))
      .setDesc(fragWithHTML(t("SHOWATTACHMENTS_DESC")))
      .addToggle(toggle=>
        toggle
          .setValue(this.plugin.settings.showAttachments)
          .onChange(value => {
            this.plugin.settings.showAttachments = value;
            this.dirty = true;
          })
      );

    new Setting(containerEl)
      .setName(t("SHOWVIRTUAL_NAME"))
      .setDesc(fragWithHTML(t("SHOWVIRTUAL_DESC")))
      .addToggle(toggle=>
        toggle
          .setValue(this.plugin.settings.showVirtualNodes)
          .onChange(value => {
            this.plugin.settings.showVirtualNodes = value;
            this.dirty = true;
          })
      );

    this.numberslider(
      containerEl,
      t("MAX_ITEMCOUNT_NAME"),
      t("MAX_ITEMCOUNT_DESC"),
      {min:5,max:150, step:5},
      ()=>this.plugin.settings.maxItemCount,
      (val)=>this.plugin.settings.maxItemCount = val,
      ()=>{},
      false,
      30
    )

    new Setting(containerEl)
    .setName(t("SHOW_COUNT_NAME"))
    .setDesc(fragWithHTML(t("SHOW_COUNT_DESC")))
    .addToggle(toggle => 
      toggle
        .setValue(this.plugin.settings.showNeighborCount)
        .onChange(value => {
          this.plugin.settings.showNeighborCount = value;
          this.dirty = true;
        }))
     
    containerEl.createEl("h1", {
      cls: "excalibrain-settings-h1",
      text: t("STYLE_HEAD")
    });
    const styleDesc = this.containerEl.createEl("p", {});
    styleDesc.innerHTML =  t("STYLE_DESC");

    this.colorpicker(
      containerEl,
      t("CANVAS_BGCOLOR"),
      null,
      ()=>this.plugin.settings.backgroundColor,
      (val)=> {
        this.plugin.settings.backgroundColor=val;
        this.updateNodeDemoImg();
      },
      ()=>{},
      false,
      this.plugin.settings.backgroundColor
    )

    //-----------------------------
    //Node Style settings
    //-----------------------------    
    let nodeStylesDropdown: DropdownComponent;
    let nodeStyleDiv: HTMLDivElement;
    const nodeDropdownOnChange = (value:string) => {
      nodeStyleDiv.empty();
      const nodeStyle = this.plugin.nodeStyles[value];
      this.nodeSettings(
        nodeStyleDiv,
        nodeStyle.style,
        nodeStyle.allowOverride,
        nodeStyle.getInheritedStyle()
      )
      this.demoNodeStyle = nodeStyle;
      this.updateNodeDemoImg();
    }

    const taglist = new Setting(containerEl)
      .setName(t("TAGLIST_NAME"))
      .setDesc(t("TAGLIST_DESC"))
      .addTextArea((text)=> {
        text.inputEl.style.height = "200px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.tagStyleList.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1).join(", "))
          .onChange(value => {
            const tagStyles = this.plugin.settings.tagNodeStyles
            const nodeStyles = this.plugin.nodeStyles;
            value = value.replaceAll("\n"," ");
            const tags = value.split(",").map(s=>s.trim()).sort((a,b)=>a.toLocaleLowerCase()<b.toLocaleLowerCase()?-1:1);
            this.plugin.settings.tagStyleList = tags;
            Object.keys(tagStyles).forEach(key => {
              if(!tags.contains(key)) {
                delete tagStyles[key];
                delete nodeStyles[key];
              }
            });
            tags.forEach(tag => {
              if(!Object.keys(tagStyles).contains(tag)) {
                tagStyles[tag] = {};
                nodeStyles[tag] = {
                  style: tagStyles[tag],
                  allowOverride: true,
                  userStyle: true,
                  display: tag,
                  getInheritedStyle: () => this.plugin.settings.baseNodeStyle
                }
              }
            });
            const selectedItem = nodeStylesDropdown.getValue();
            for(let i=nodeStylesDropdown.selectEl.options.length-1;i>=0;i--) {
              nodeStylesDropdown.selectEl.remove(i);
            }
            Object.entries(nodeStyles).forEach(item=>{
              nodeStylesDropdown.addOption(item[0],item[1].display)
            })
            if(nodeStyles[selectedItem]) {
              nodeStylesDropdown.setValue(selectedItem);
            } else {
              nodeStylesDropdown.setValue("base");
              nodeDropdownOnChange("base");
            }
            this.dirty = true;
        })
      })

    taglist.descEl.style.width="90%";
    taglist.controlEl.style.width="90%";
    const nodeStylesWrapper = containerEl.createDiv({cls:"setting-item"});
    const nodeStylesDropdownWrapper = nodeStylesWrapper.createDiv({cls:"setting-item-info"});
    nodeStylesDropdown = new DropdownComponent(nodeStylesDropdownWrapper);
    
    const nodeStylestoggleLabel = nodeStylesWrapper.createDiv({
      text: "Show inherited",
      cls: "setting-item-name"
    });
    nodeStylestoggleLabel.style.marginRight = "10px";

    let linkStylesToggle: ToggleComponent;

    let boundToggleChange = false;
    const nodeStylesToggle = new ToggleComponent(nodeStylesWrapper)
    nodeStylesToggle
      .setValue(true)
      .setTooltip("Show/Hide Inherited Properties")
      .onChange(value => {
        if(boundToggleChange) {
          boundToggleChange = false;
          return;
        }
        if(value) {
          removeStylesheet(HIDE_DISABLED_STYLE);
        } else {
          addStylesheet(HIDE_DISABLED_STYLE, HIDE_DISABLED_CLASS);
        }
        boundToggleChange = true;
        linkStylesToggle.setValue(value);
      });

    Object.entries(this.plugin.nodeStyles).forEach(item=>{
      nodeStylesDropdown.addOption(item[0],item[1].display)
    })

    this.demoNodeImg = containerEl.createEl("img",{cls: "excalibrain-settings-demoimg"});

    nodeStyleDiv = containerEl.createDiv({
      cls: "excalibrain-setting-style-section"
    });
    removeStylesheet(HIDE_DISABLED_STYLE);
    nodeStylesDropdown
      .setValue("base")
      .onChange(nodeDropdownOnChange)
      const nodeStyle = this.plugin.nodeStyles["base"];
      this.nodeSettings(
        nodeStyleDiv,
        nodeStyle.style,
        nodeStyle.allowOverride,
        nodeStyle.getInheritedStyle()
      )
      this.demoNodeStyle = nodeStyle;
      this.updateNodeDemoImg();

    //-----------------------------
    // Link Style settings
    //-----------------------------
    
    let linkStylesDropdown: DropdownComponent;
    let linkStyleDiv: HTMLDivElement;
    const linkDropdownOnChange = (value:string) => {
      linkStyleDiv.empty();
      const ls = this.plugin.linkStyles[value];
      this.linkSettings(
        linkStyleDiv,
        ls.style,
        ls.allowOverride,
        ls.getInheritedStyle()
      )
      this.demoLinkStyle = ls;
      this.updateLinkDemoImg();
    }

    const linkStylesWrapper = containerEl.createDiv({cls:"setting-item"});
    
    const linkStylesDropdownWrapper = linkStylesWrapper.createDiv({cls:"setting-item-info"});
    linkStylesDropdown = new DropdownComponent(linkStylesDropdownWrapper);
    
    const linkStylesToggleLabel = linkStylesWrapper.createDiv({
      text: "Show inherited",
      cls: "setting-item-name"
    });
    linkStylesToggleLabel.style.marginRight = "10px";
    
    linkStylesToggle = new ToggleComponent(linkStylesWrapper)

    linkStylesToggle
      .setValue(true)
      .setTooltip("Show/Hide Inherited Properties")
      .onChange(value => {
        if(boundToggleChange) {
          boundToggleChange = false;
          return;
        }
        if(value) {
          removeStylesheet(HIDE_DISABLED_STYLE);
        } else {
          addStylesheet(HIDE_DISABLED_STYLE, HIDE_DISABLED_CLASS);
        }
        boundToggleChange = true;
        nodeStylesToggle.setValue(value);
      });

    Object.entries(this.plugin.linkStyles).forEach(item=>{
      linkStylesDropdown.addOption(item[0],item[1].display)
    })

    this.demoLinkImg = containerEl.createEl("img",{cls: "excalibrain-settings-demoimg"});

    linkStyleDiv = containerEl.createDiv({
      cls: "excalibrain-setting-nodestyle-section"
    });

    linkStylesDropdown
      .setValue("base")
      .onChange(linkDropdownOnChange)
      const ls = this.plugin.linkStyles["base"];
      this.linkSettings(
        linkStyleDiv,
        ls.style,
        ls.allowOverride,
        ls.getInheritedStyle()
      )
      this.demoLinkStyle = ls;
      this.updateLinkDemoImg();

    onHierarchyChange = () => {
      unassingedFieldsTextArea.setValue(this.getUnusedFieldNames());
      const hierarchyLinkStyles = this.plugin.settings.hierarchyLinkStyles
      const linkStyles = this.plugin.linkStyles;

      Object.keys(linkStyles).forEach(key => {
        if(PREDEFINED_LINK_STYLES.contains(key)) {
          return;
        }
        if(!this.hierarchyStyleList.contains(key)) {
          delete linkStyles[key];
          delete hierarchyLinkStyles[key];
        }
      });
      this.hierarchyStyleList.forEach(dataviewfield => {
        if(
          !(Object.keys(hierarchyLinkStyles).contains(dataviewfield) ||
          PREDEFINED_LINK_STYLES.contains(dataviewfield))
        ) {
          hierarchyLinkStyles[dataviewfield] = {};
          linkStyles[dataviewfield] = {
            style: hierarchyLinkStyles[dataviewfield],
            allowOverride: true,
            userStyle: true,
            display: dataviewfield,
            getInheritedStyle: () => this.plugin.settings.baseLinkStyle
          }
        }
      });
      const selectedItem = linkStylesDropdown.getValue();
      for(let i=linkStylesDropdown.selectEl.options.length-1;i>=0;i--) {
        linkStylesDropdown.selectEl.remove(i);
      }
      const h = this.plugin.settings.hierarchy;
      const sortHelper = (a:string):string =>
        PREDEFINED_LINK_STYLES.includes(a)
        ? ("0"+a.toLowerCase())
        : h.parents.includes(a)
          ? ("1"+a.toLowerCase())
          : h.children.includes(a)
            ? ("2"+a.toLowerCase())
            : ("3"+a.toLowerCase());
      Object.entries(linkStyles)
        .sort((a,b)=>sortHelper(a[0])<sortHelper(b[0])?-1:1)
        .forEach(item=>{
          linkStylesDropdown.addOption(
            item[0],
            this.plugin.settings.hierarchy.parents.includes(item[1].display)
                ? ("Parent > " + item[1].display)
                : this.plugin.settings.hierarchy.children.includes(item[1].display)
                  ? ("Child > " + item[1].display)
                  : this.plugin.settings.hierarchy.friends.includes(item[1].display)
                    ? ("Friend > " + item[1].display)
                    : item[1].display
          )
      })
      if(linkStyles[selectedItem]) {
        linkStylesDropdown.setValue(selectedItem);
      } else {
        linkStylesDropdown.setValue("base");
        linkDropdownOnChange("base");
      }
    }
    onHierarchyChange();
  }
}