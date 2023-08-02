import { type } from "os";
import ExcaliBrain from "src/excalibrain-main";
import { keepOnTop } from "src/utils/utils";

export class ToggleButton {
  private button: HTMLButtonElement;
  private updateIndex: boolean = true;
  private getVal: ()=>boolean;

  constructor({ plugin, getVal, setVal, wrapper, options, updateIndex} : {
    plugin: ExcaliBrain,
    getVal: ()=>boolean,
    setVal: (val:boolean)=>boolean,
    wrapper: HTMLElement,
    options: {
      display?: string,
      icon?: string,
      tooltip: string
    },
    updateIndex?: boolean
  }) {
    if(typeof updateIndex === "boolean") this.updateIndex = updateIndex;
    this.getVal = getVal;
    this.button = wrapper.createEl("button", {
      cls: "excalibrain-button",
    });
    if(options.icon) {
      this.button.innerHTML = options.icon;
    } else {
      this.button.createSpan({text: options.display??""})
    }
    this.button.ariaLabel = options.tooltip;

    this.setColor();

    this.button.onclick = () => {
      const shouldSaveSettings = setVal(!getVal());
      if(shouldSaveSettings) plugin.saveSettings();
      this.setColor();
      plugin.scene?.reRender(this.updateIndex);
    }
  }

  setColor() {
    if(this.getVal()) {
      this.button.removeClass("off");
      this.button.addClass("on");
      return;
    }
    this.button.removeClass("on");
    this.button.addClass("off");
  }
}