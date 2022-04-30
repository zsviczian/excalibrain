import { settings } from "cluster";
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
import { t } from "./lang/helpers";
import ExcaliBrain from "./main";
import { Scene } from "./Scene";
import { Hierarchy, NodeStyle, LinkStyle } from "./Types";
import { WarningPrompt } from "./utils/Prompts";

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
  hierarchyLinkStyle: {[key: string]: LinkStyle};
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
  inferredLinkStyle: {},
  hierarchyLinkStyle: {},
  hierarchyStyleList: []
};

const getHex = (color:string) => color.substring(0,7);
const getAlphaFloat = (color:string) => parseInt(color.substring(7,9),16)/255;
const getAlphaHex = (a: number) => ((a * 255) | 1 << 8).toString(16).slice(1)

const fragWithHTML = (html: string) =>
  createFragment((frag) => (frag.createDiv().innerHTML = html));

const details = (text: string, parent: HTMLElement) =>
  parent.createEl("details", {}, (d) => d.createEl("summary", { text }));

export class ExcaliBrainSettingTab extends PluginSettingTab {
  plugin: ExcaliBrain;
  ea: ExcalidrawAutomate;
  private hierarchy: string = null;
  private dirty:boolean = false;

  constructor(app: App, plugin: ExcaliBrain) {
    super(app, plugin);
    this.plugin = plugin;
    this.ea = getEA();
  }

  async sampleNode(style: NodeStyle):Promise<HTMLElement> {
    this.ea.canvas.viewBackgroundColor = style.backgroundColor;

    return;
  }

  async hide() {
    if(!this.dirty) {
      return;
    }
    this.plugin.settings.tagStyleList = Object.keys(this.plugin.settings.tagNodeStyles);
    if(this.hierarchy) {
      this.plugin.settings.hierarchy = JSON.parse(this.hierarchy);
      //this.plugin.initializeIndex();
    }
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
    defaultValue: number
  ) {
    let displayText: HTMLDivElement;
    let toggleComponent: ToggleComponent;
    let sliderComponent: SliderComponent;

    const setting = new Setting(containerEl).setName(name);

    const setDisabled = (isDisabled:boolean) => {
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
    defaultValue: string
  ) {
    let dropdownComponent: DropdownComponent;
    let toggleComponent: ToggleComponent;

    const setting = new Setting(containerEl).setName(name);

    const setDisabled = (isDisabled:boolean) => {
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

  nodeSettings(heading: string, setting: NodeStyle, allowOverride: boolean = true) {
    const containerEl = details(heading,this.containerEl);

    let textComponent: TextComponent;
    let toggleComponent: ToggleComponent;
    const setDisabled = (isDisabled: boolean) => {
      textComponent.setDisabled(isDisabled);
      textComponent.inputEl.style.opacity = isDisabled ? "0.3": "1"; 
    }
    const prefixSetting = new Setting(containerEl)
      .setName(t("NODESTYLE_PREFIX_NAME"))
      .setDesc(fragWithHTML(t("NODESTYLE_PREFIX_DESC")));
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
          .setValue(setting.prefix??"")
          .onChange(value => {
            setting.prefix = value;
            this.dirty = true;
          })
      })  
    textComponent.setDisabled(allowOverride && !toggleComponent.getValue());

    this.colorpicker(
      containerEl,
      t("NODESTYLE_BGCOLOR"),
      null,
      ()=>setting.backgroundColor,
      val=>setting.backgroundColor=val,
      ()=>delete setting.backgroundColor,
      allowOverride,
      this.plugin.settings.baseNodeStyle.backgroundColor
    );

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_BG_FILLSTYLE"),
      null,
      {"hachure": "Hachure", "cross-hatch": "Cross-hatch", "solid": "Solid"},
      () => setting.fillStyle?.toString(),
      (val) => setting.fillStyle = val as FillStyle,
      ()=>delete setting.fillStyle,
      allowOverride,
      this.plugin.settings.baseNodeStyle.fillStyle.toString()
    )

    this.colorpicker(
      containerEl,
      t("NODESTYLE_TEXTCOLOR"),
      null,
      ()=>setting.textColor,
      val=>setting.textColor=val,
      ()=>delete setting.textColor,
      allowOverride,
      this.plugin.settings.baseNodeStyle.textColor
    );

    this.colorpicker(
      containerEl,
      t("NODESTYLE_BORDERCOLOR"),
      null,
      ()=>setting.borderColor,
      val=>setting.borderColor=val,
      ()=>delete setting.borderColor,
      allowOverride,
      this.plugin.settings.baseNodeStyle.borderColor
    );

    this.numberslider(
      containerEl,
      t("NODESTYLE_FONTSIZE"),
      null,
      {min:10,max:50,step:5},
      () => setting.fontSize,
      (val) => setting.fontSize = val,
      ()=>delete setting.fontSize,
      allowOverride,
      this.plugin.settings.baseNodeStyle.fontSize
    )

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_FONTFAMILY"),
      null,
      {1:"Hand-drawn",2:"Normal",3:"Code",4:"Fourth (custom) Font"},
      () => setting.fontFamily?.toString(),
      (val) => setting.fontFamily =  parseInt(val),
      ()=>delete setting.fontFamily,
      allowOverride,
      this.plugin.settings.baseNodeStyle.fontFamily.toString()
    )

    this.numberslider(
      containerEl,
      t("NODESTYLE_MAXLABELLENGTH_NAME"),
      t("NODESTYLE_MAXLABELLENGTH_DESC"),
      {min:15,max:100,step:5},
      () => setting.maxLabelLength,
      (val) => setting.maxLabelLength = val,
      ()=>delete setting.maxLabelLength,
      allowOverride,
      this.plugin.settings.baseNodeStyle.maxLabelLength
    )
    
    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_ROUGHNESS"),
      null,
      {0:"Architect",1:"Artist",2:"Cartoonist"},
      () => setting.roughness?.toString(),
      (val) => setting.roughness =  parseInt(val),
      ()=>delete setting.roughness,
      allowOverride,
      this.plugin.settings.baseNodeStyle.toString()
    )

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_SHARPNESS"),
      null,
      {"sharp":"Sharp","round":"Round"},
      () => setting.strokeShaprness,
      (val) => setting.strokeShaprness = val as StrokeSharpness,
      ()=>delete setting.strokeShaprness,
      allowOverride,
      this.plugin.settings.baseNodeStyle.strokeShaprness
    )

    this.numberslider(
      containerEl,
      t("NODESTYLE_STROKEWIDTH"),
      null,
      {min:0.5,max:6,step:0.5},
      () => setting.strokeWidth,
      (val) => setting.strokeWidth = val,
      ()=>delete setting.strokeWidth,
      allowOverride,
      this.plugin.settings.baseNodeStyle.strokeWidth
    )

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_STROKESTYLE"),
      null,
      {"solid":"Solid","dashed":"Dashed","dotted":"Dotted"},
      () => setting.strokeStyle,
      (val) => setting.strokeStyle = val as StrokeStyle,
      ()=>delete setting.strokeStyle,
      allowOverride,
      this.plugin.settings.baseNodeStyle.strokeStyle
    )

    this.numberslider(
      containerEl,
      t("NODESTYLE_RECTANGLEPADDING"),
      null,
      {min:5,max:50,step:5},
      () => setting.padding,
      (val) => setting.padding = val,
      ()=>delete setting.padding,
      allowOverride,
      this.plugin.settings.baseNodeStyle.padding
    )


    this.numberslider(
      containerEl,
      t("NODESTYLE_GATE_RADIUS_NAME"),
      t("NODESTYLE_GATE_RADIUS_DESC"),
      {min:3,max:10,step:1},
      () => setting.gateRadius,
      (val) => setting.gateRadius = val,
      ()=>delete setting.gateRadius,
      allowOverride,
      this.plugin.settings.baseNodeStyle.gateRadius
    )
    
    this.numberslider(
      containerEl,
      t("NODESTYLE_GATE_OFFSET_NAME"),
      t("NODESTYLE_GATE_OFFSET_DESC"),
      {min:0,max:25,step:1},
      () => setting.gateOffset,
      (val) => setting.gateOffset = val,
      ()=>delete setting.gateOffset,
      allowOverride,
      this.plugin.settings.baseNodeStyle.gateOffset
    )

    this.colorpicker(
      containerEl,
      t("NODESTYLE_GATE_COLOR"),
      null,
      ()=>setting.gateStrokeColor,
      val=>setting.gateStrokeColor=val,
      ()=>delete setting.gateStrokeColor,
      allowOverride,
      this.plugin.settings.baseNodeStyle.gateStrokeColor
    );
    
    this.colorpicker(
      containerEl,
      t("NODESTYLE_GATE_BGCOLOR_NAME"),
      t("NODESTYLE_GATE_BGCOLOR_DESC"),
      ()=>setting.gateBackgroundColor,
      val=>setting.gateBackgroundColor=val,
      ()=>delete setting.gateBackgroundColor,
      allowOverride,
      this.plugin.settings.baseNodeStyle.gateBackgroundColor
    );

    this.dropdownpicker(
      containerEl,
      t("NODESTYLE_GATE_FILLSTYLE"),
      null,
      {"hachure": "Hachure", "cross-hatch": "Cross-hatch", "solid": "Solid"},
      () => setting.gateFillStyle?.toString(),
      (val) => setting.gateFillStyle = val as FillStyle,
      ()=>delete setting.gateFillStyle,
      allowOverride,
      this.plugin.settings.baseNodeStyle.gateFillStyle.toString()
    )
  }

  async display() {
    await this.plugin.loadSettings(); //in case sync loaded changed settings in the background
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
    
    const malformedJSON = containerEl.createEl("p", { text: t("JSON_MALFORMED"), cls:"excalibrain-warning" });
    malformedJSON.hide();
    new Setting(containerEl)
      .setName(t("HIERARCHY_NAME"))
      .setDesc(fragWithHTML(t("HIERARCHY_DESC")))
      .addTextArea((text) => {
        text.inputEl.style.minHeight = "300px";
        text.inputEl.style.minWidth = "400px";
        text
          .setValue(JSON.stringify(this.plugin.settings.hierarchy,null,2))
          .onChange((value) => {
            try {
              const j = JSON.parse(value);
              if(!(j.hasOwnProperty("parents") && j.hasOwnProperty("children") && j.hasOwnProperty("friends"))) {
                malformedJSON.setText(t("JSON_MISSING_KEYS"));
                malformedJSON.show();
                return;
              }
              if(!(Array.isArray(j.parents) && Array.isArray(j.children) && Array.isArray(j.friends))) {
                malformedJSON.setText(t("JSON_VALUES_NOT_STRING_ARRAYS"));
                malformedJSON.show();
                return;  
              }
              if(j.parents.length===0 || j.children.length===0 || j.friends.length === 0) {
                malformedJSON.setText(t("JSON_VALUES_NOT_STRING_ARRAYS"));
                malformedJSON.show();
                return;
              }
              if(!(j.parents.every((v:any)=>typeof v === "string") && j.children.every((v:any)=>typeof v === "string") && j.friends.every((v:any)=>typeof v === "string"))) {
                malformedJSON.setText(t("JSON_VALUES_NOT_STRING_ARRAYS"));
                malformedJSON.show();
                return;
              }
              malformedJSON.hide();
              this.hierarchy = value;
              this.dirty = true;
            }
            catch {
              malformedJSON.setText(t("JSON_MALFORMED"));
              malformedJSON.show();
            }
        });
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
      
    this.containerEl.createEl("h1", { text: t("STYLE_HEAD") });
    const styleDesc = this.containerEl.createEl("p", {});
    styleDesc.innerHTML =  t("STYLE_DESC");

    this.colorpicker(
      containerEl,
      t("CANVAS_BGCOLOR"),
      null,
      ()=>this.plugin.settings.backgroundColor,
      (val)=>this.plugin.settings.backgroundColor=val,
      ()=>{},
      false,
      this.plugin.settings.backgroundColor
    )

    this.nodeSettings(
      t("NODESTYLE_BASE"),
      this.plugin.settings.baseNodeStyle,
      false
    )

    this.nodeSettings(
      t("NODESTYLE_INFERRED"),
      this.plugin.settings.inferredNodeStyle
    )

    this.nodeSettings(
      t("NODESTYLE_VIRTUAL"),
      this.plugin.settings.virtualNodeStyle
    )

    this.nodeSettings(
      t("NODESTYLE_CENTRAL"),
      this.plugin.settings.centralNodeStyle
    )

    this.nodeSettings(
      t("NODESTYLE_SIBLING"),
      this.plugin.settings.siblingNodeStyle
    )

    this.nodeSettings(
      t("NODESTYLE_ATTACHMENT"),
      this.plugin.settings.attachmentNodeStyle
    )
  }
}
