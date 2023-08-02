import { type } from "os";
import ExcaliBrain from "src/excalibrain-main";
import { keepOnTop } from "src/utils/utils";

export class ToggleButton {
  private button: HTMLButtonElement;
  private getVal: ()=>boolean;
  private isEnabled: ()=>boolean;

  constructor({ plugin, getVal, setVal, isEnabled, wrapper, options, updateIndex} : {
    plugin: ExcaliBrain,
    getVal: ()=>boolean,
    setVal: (val:boolean)=>boolean,
    isEnabled?: ()=>boolean,
    wrapper: HTMLElement,
    options: {
      display?: string,
      icon?: string | {on: string, off: string},
      tooltip: string
    },
    updateIndex: boolean
  }) {
    this.getVal = getVal;
    this.isEnabled = isEnabled;
    this.button = wrapper.createEl("button", {
      cls: "excalibrain-button",
    });
    const getIcon = (state: boolean) => {
      if(typeof options.icon === "string") return options.icon;
      if(state) return options.icon?.on;
      return options.icon?.off;
    }

    if(options.icon) {
      this.button.innerHTML = getIcon(getVal());
    } else {
      this.button.createSpan({text: options.display??""})
    }
    this.button.ariaLabel = options.tooltip;

    this.updateButton();

    this.button.onclick = () => {
      const shouldSaveSettings = setVal(!getVal());
      if(shouldSaveSettings) plugin.saveSettings();
      this.updateButton();
      if(options.icon) this.button.innerHTML = getIcon(getVal());
      plugin.scene?.reRender(updateIndex);
    }
  }

  public updateButton() {
    this.setColor();
    this.setEnabled();
  }

  private setColor() {
    if(this.getVal()) {
      this.button.removeClass("off");
      this.button.addClass("on");
      return;
    }
    this.button.removeClass("on");
    this.button.addClass("off");
  }

  private setEnabled() {
    if(!this.isEnabled) return;
    if(this.isEnabled()) {
      this.button.removeClass("disabled");
      return;
    }
    this.button.addClass("disabled");
  }
}