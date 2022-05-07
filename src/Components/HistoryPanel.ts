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
      let displayName = "", link = "", label = "";
      if(f && f instanceof TFile) { 
        displayName = f.extension === "md" ? f.basename : f.name;
        link = label = f.path;
      } else {
        const page = this.plugin.pages.get(nh[i]);
        if(!page) {
          return;
        }
        displayName = page.name;
        label = page.path;
        link = page.path.startsWith("folder:") 
          ? page.path.substring(7)
          : page.path.startsWith("tag:")
            ? page.path.substring(4)
            : page.path;
      }
      container.createDiv({
        text: displayName,
        cls: "excalibrain-history-item"
      }, el=> {
        el.ariaLabel = `[[${label}]]`
        el.onclick = () => this.plugin.scene?.renderGraphForPath(link);
      })
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