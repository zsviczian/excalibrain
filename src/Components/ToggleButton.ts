import ExcaliBrain from "src/excalibrain-main";
import { keepOnTop } from "src/utils/utils";

export class ToggleButton {
  private button: HTMLButtonElement;

  constructor(
    plugin: ExcaliBrain,
    private getVal: ()=>boolean,
    setVal: (val:boolean)=>void,
    wrapper: HTMLElement,
    options: {
      display: string,
      tooltip: string
    },
    private updateIndex: boolean = true
  ) {
    this.button = wrapper.createEl("button", {
      cls: "excalibrain-button",
    });
    this.button.createSpan({text: options.display})
    this.button.ariaLabel = options.tooltip;

    this.setColor();

    this.button.onclick = () => {
      setVal(!getVal());
      plugin.saveSettings();
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