import { TFile } from "obsidian";
import ExcaliBrain from "src/main";

export class HistoryPanel {
  private wrapperDiv: HTMLDivElement;

  constructor(
    private contentEl: HTMLElement,
    private plugin: ExcaliBrain
  ) {
    this.wrapperDiv = this.contentEl.createDiv({
      cls: "excalibrain-history-wrapper"
    });
    
    this.rerender();
    this.contentEl.appendChild(this.wrapperDiv);

  }

  rerender() {
    this.wrapperDiv.empty();
    const container = this.wrapperDiv.createDiv({
      cls: "excalibrain-history-container"
    })
    const nh = this.plugin.settings.navigationHistory;
    for(let i=nh.length-1;i>=0;i--) {
      if(i !== nh.length-1) {
        container.createDiv({
          text: "<",
          cls: "excalibrain-history-divider"
        })
      }
      const f = app.vault.getAbstractFileByPath(nh[i]);
      if(f && f instanceof TFile) {
        
        container.createDiv({
          text: f.extension === "md" ? f.basename : f.name,
          cls: "excalibrain-history-item"
        }, el=> {
          el.ariaLabel = `[[${f.path}]]`
          el.onclick = () => this.plugin.scene?.renderGraphForFile(f.path);
        })
      }
    }
  }

  terminate() {
    if(this.wrapperDiv) {
      try{
        this.contentEl?.removeChild(this.wrapperDiv);
      } catch{}
      this.wrapperDiv = null;
    }
  }
}