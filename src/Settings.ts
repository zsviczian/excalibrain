import {
  App,
  DropdownComponent,
  PluginSettingTab,
  Setting,
  SliderComponent,
  TextComponent,
  ToggleComponent,
} from "obsidian";
import { FillStyle, getEA, StrokeSharpness, StrokeStyle } from "obsidian-excalidraw-plugin";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { Page } from "./graph/Page";
import { t } from "./lang/helpers";
import ExcaliBrain from "./main";
import { Hierarchy, NodeStyle, LinkStyle, RelationType, NodeStyleData, LinkStyleData } from "./Types";
import { WarningPrompt } from "./utils/Prompts";
import { Node } from "./graph/Node";
import { svgToBase64 } from "./utils/utils";
import { Arrowhead } from "@zsviczian/excalidraw/types/element/types";

export interface ExcaliBrainSettings {
  excalibrainFilepath: string;
  hierarchy: Hierarchy;
  renderAlias: boolean;
  backgroundColor: string;
  showInferredNodes: boolean;
  showAttachments: boolean;
  showVirtualNodes: boolean;
  maxItemCount: number;
  baseNodeStyle: NodeStyle;
  centralNodeStyle: NodeStyle;
  inferredNodeStyle: NodeStyle;
  virtualNodeStyle: NodeStyle;
  siblingNodeStyle: NodeStyle;
  attachmentNodeStyle: NodeStyle;
  tagNodeStyles: {[key: string]: NodeStyle};
  tagStyleList: string[];
  baseLinkStyle: LinkStyle;
  inferredLinkStyle: LinkStyle;
  hierarchyLinkStyles: {[key: string]: LinkStyle};
  hierarchyStyleList: string[];
}

export const DEFAULT_SETTINGS: ExcaliBrainSettings = {
  excalibrainFilepath: "excalibrain.md",
  hierarchy: {
    parents: ["Parent", "Parents", "up", "u"],
    children: ["Children", "Child", "down", "d"],
    friends: ["Friends", "Friend", "Jump", "Jumps", "j"]
  },
  renderAlias: true,
  backgroundColor: "#0c3e6aff",
  showInferredNodes: true,
  showAttachments: true,
  showVirtualNodes: true,
  maxItemCount: 30,
  baseNodeStyle: {
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
  },
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
    prefix: "📎 ",
  },
  tagNodeStyles: {},
  tagStyleList: [],
  baseLinkStyle: {
    strokeColor: "#696969FF",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    startArrowHead: null,
    endArrowHead: null,
  },
  inferredLinkStyle: {
    strokeStyle: "dashed",
  },
  hierarchyLinkStyles: {},
  hierarchyStyleList: []
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
  private demoImg: HTMLImageElement;
  private demoLinkImg: HTMLImageElement;
  private demoLinkStyle: LinkStyleData;
  private demoNodeStyle: NodeStyleData;

  constructor(app: App, plugin: ExcaliBrain) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async updateDemoImg() {
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
    this.demoImg.setAttribute("src", svgToBase64(svg.outerHTML));
  };

  async updateLinkDemoImg() {
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
    this.demoLinkImg.setAttribute("src", svgToBase64(svg.outerHTML));
  };


  async hide() {
    if(!this.dirty) {
      return;
    }
    this.plugin.settings.tagStyleList = Object.keys(this.plugin.settings.tagNodeStyles);
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
        toggleComponent.toggleEl.style.marginRight = "5px";
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

    colorLabel = createEl("span",{text:"color:"});
    colorLabel.style.paddingRight="5px";
    setting.controlEl.appendChild(colorLabel)   

    picker = createEl("input", {type:"color"},(el:HTMLInputElement)=>{
      el.value = getHex(getValue()??defaultValue);
      el.onchange = () => {
        setValue(el.value+ getAlphaHex(sliderComponent.getValue()));
      }
    });
    setting.controlEl.appendChild(picker);

    opacityLabel = createEl("span",{text: "opacity:"});
    opacityLabel.style.paddingLeft = "10px";
    opacityLabel.style.paddingRight = "5px";
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

    displayText = createDiv("", (el) => {
      el.style.minWidth = "2em";
      el.style.textAlign = "right";
      el.innerText = ` ${sliderComponent.getValue().toString()}`;
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
        toggleComponent.toggleEl.style.marginRight = "5px";
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
        toggleComponent.toggleEl.style.marginRight = "5px";
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
        toggleComponent.toggleEl.style.marginRight = "5px";
        toggle
          .setValue(typeof setting.prefix !== "undefined")
          .setTooltip(t("NODESTYLE_INCLUDE_TOGGLE"))
          .onChange(value => {
            this.dirty = true;
            if(!value) {
              setDisabled(true);
              setting.prefix = undefined;
              this.updateDemoImg();
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
            this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=>{
        delete setting.backgroundColor;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.fillStyle;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.textColor;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.borderColor;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.fontSize;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.fontFamily;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.maxLabelLength;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.roughness;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.strokeShaprness;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.strokeWidth;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.strokeStyle;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.padding;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.gateRadius;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.gateOffset;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.gateStrokeColor;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.gateBackgroundColor;
        this.updateDemoImg();
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
        this.updateDemoImg();
      },
      ()=> {
        delete setting.gateFillStyle;
        this.updateDemoImg();
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
      {"":"None","arrow":"Arrow","bar":"Bar","dot":"Dot","triangle":"Triangle"},
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
      {"":"None","arrow":"Arrow","bar":"Bar","dot":"Dot","triangle":"Triangle"},
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
  }  

  async display() {
    await this.plugin.loadSettings(); //in case sync loaded changed settings in the background
    this.ea = getEA();

    //initialize sample 
    const page = new Page(
      "This is a demo node that is 46 characters long",
      null,
      this.plugin
    )
    const page2 = new Page(
      "Dummy child",
      null,
      this.plugin
    )
    page.addChild(page2,RelationType.DEFINED);
    this.demoNode = new Node({
      page,
      isInferred: false,
      isCentral: false,
      isSibling: false,
      friendGateOnLeft: false
    })
    this.demoNode.ea = this.ea;  

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
          .onChange(async (value) => {
            this.dirty = true;
            if(!value.endsWith(".md")) {
              value = value + ".md";
            }
            const f = this.app.vault.getAbstractFileByPath(value);
            if(f) {
              (new WarningPrompt(
                this.app,
                "⚠ File Exists",
                `${value} already exists in your Vault. Is it ok to overwrite this file?`)
              ).show((result: boolean) => {
                if(result) {
                  this.plugin.settings.excalibrainFilepath = value;
                  this.dirty = true;
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
    new Setting(containerEl)
      .setName(t("PARENTS_NAME"))
      .addText((text)=> {
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.hierarchy.parents.join(", "))
          .onChange(value => {
            this.plugin.settings.hierarchy.parents = value.split(",").map(s=>s.trim());
            onHierarchyChange();
            this.dirty = true;
          })
      })

    new Setting(containerEl)
      .setName(t("CHILDREN_NAME"))
      .addText((text)=> {
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.hierarchy.children.join(", "))
          .onChange(value => {
            this.plugin.settings.hierarchy.children = value.split(",").map(s=>s.trim());
            onHierarchyChange();
            this.dirty = true;
          })
      })

    new Setting(containerEl)
      .setName(t("FRIENDS_NAME"))
      .addText((text)=> {
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.hierarchy.friends.join(", "))
          .onChange(value => {
            this.plugin.settings.hierarchy.friends = value.split(",").map(s=>s.trim());
            onHierarchyChange();
            this.dirty = true;
          })
      })

    this.containerEl.createEl("h1", {
      cls: "excalibrain-settings-h1",
      text: t("DISPLAY_HEAD") 
    });
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
        this.updateDemoImg();
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
      this.updateDemoImg();
    }

    const taglist = new Setting(containerEl)
      .setName(t("TAGLIST_NAME"))
      .setDesc(t("TAGLIST_DESC"))
      .addTextArea((text)=> {
        text.inputEl.style.height = "200px";
        text.inputEl.style.width = "100%";
        text
          .setValue(this.plugin.settings.tagStyleList.join(", "))
          .onChange(value => {
            const tagStyles = this.plugin.settings.tagNodeStyles
            const nodeStyles = this.plugin.nodeStyles;
            value = value.replaceAll("\n"," ");
            const tags = value.split(",").map(s=>s.trim());
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

    taglist.descEl.style.maxWidth="400px";
    const nodeStylesWrapper = containerEl.createDiv({cls:"setting-item"});
    const dropodownWrapper = nodeStylesWrapper.createDiv({cls:"setting-item-info"});
    nodeStylesDropdown = new DropdownComponent(dropodownWrapper);
    
    const toggleLabel = nodeStylesWrapper.createDiv({
      text: "Show inherited",
      cls: "setting-item-name"
    });
    toggleLabel.style.marginRight = "10px";

    let linkStylesToggle: ToggleComponent;

    const toggle = new ToggleComponent(nodeStylesWrapper)
    toggle
      .setValue(true)
      .setTooltip("Show/Hide Inherited Properties")
      .onChange(value => {
        if(value) {
          removeStylesheet(HIDE_DISABLED_STYLE);
        } else {
          addStylesheet(HIDE_DISABLED_STYLE, HIDE_DISABLED_CLASS);
        }
        linkStylesToggle.setValue(value);
      });

    Object.entries(this.plugin.nodeStyles).forEach(item=>{
      nodeStylesDropdown.addOption(item[0],item[1].display)
    })

    this.demoImg = containerEl.createEl("img",{cls: "excalibrain-settings-demoimg"});

    nodeStyleDiv = containerEl.createDiv({
      cls: "excalibrain-setting-nodestyle-section"
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
      this.updateDemoImg();

    //-----------------------------
    // Link Style settings
    //-----------------------------
    
    let linkStylesDropdown: DropdownComponent;
    let linkStyleDiv: HTMLDivElement;
    const linkDropdownOnChange = (value:string) => {
      linkStyleDiv.empty();
      const linkStyle = this.plugin.linkStyles[value];
      this.linkSettings(
        linkStyleDiv,
        linkStyle.style,
        linkStyle.allowOverride,
        linkStyle.getInheritedStyle()
      )
      this.demoLinkStyle = linkStyle;
      this.updateLinkDemoImg();
    }

    const linkStylesWrapper = containerEl.createDiv({cls:"setting-item"});
    
    const linkStylesDropodownWrapper = linkStylesWrapper.createDiv({cls:"setting-item-info"});
    linkStylesDropdown = new DropdownComponent(linkStylesDropodownWrapper);
    
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
        if(value) {
          removeStylesheet(HIDE_DISABLED_STYLE);
        } else {
          addStylesheet(HIDE_DISABLED_STYLE, HIDE_DISABLED_CLASS);
        }
        linkStylesToggle.setValue(value);
      });

    Object.entries(this.plugin.linkStyles).forEach(item=>{
      linkStylesDropdown.addOption(item[0],item[1].display)
    })

    this.demoLinkImg = containerEl.createEl("img",{cls: "excalibrain-settings-demoimg"});

    linkStyleDiv = containerEl.createDiv({
      cls: "excalibrain-setting-nodestyle-section"
    });
    removeStylesheet(HIDE_DISABLED_STYLE);
    linkStylesDropdown
      .setValue("base")
      .onChange(linkDropdownOnChange)
      const linkStyle = this.plugin.linkStyles["base"];
      this.linkSettings(
        linkStyleDiv,
        linkStyle.style,
        linkStyle.allowOverride,
        linkStyle.getInheritedStyle()
      )
      this.demoLinkStyle = linkStyle;
      this.updateLinkDemoImg();

    onHierarchyChange = () => {
      const hierarchy = this.plugin.settings.hierarchy;
      const hierarchyLinkStyles = this.plugin.settings.hierarchyLinkStyles
      const linkStyles = this.plugin.linkStyles;
      this.plugin.settings.hierarchyStyleList = 
        Array.from(hierarchy.parents)
          .concat(Array.from(hierarchy.children))
          .concat(Array.from(hierarchy.friends));
      Object.keys(linkStyles).forEach(key => {
        if(!this.plugin.settings.hierarchyStyleList.contains(key)) {
          delete linkStyles[key];
          delete hierarchyLinkStyles[key];
        }
      });
      this.plugin.settings.hierarchyStyleList.forEach(link => {
        if(!Object.keys(hierarchyLinkStyles).contains(link)) {
          hierarchyLinkStyles[link] = {};
          linkStyles[link] = {
            style: hierarchyLinkStyles[link],
            allowOverride: true,
            userStyle: true,
            display: link,
            getInheritedStyle: () => this.plugin.settings.baseLinkStyle
          }
        }
      });
      const selectedItem = linkStylesDropdown.getValue();
      for(let i=linkStylesDropdown.selectEl.options.length-1;i>=0;i--) {
        linkStylesDropdown.selectEl.remove(i);
      }
      Object.entries(linkStyles).forEach(item=>{
        linkStylesDropdown.addOption(item[0],item[1].display)
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