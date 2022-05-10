import { TFile } from "obsidian";
import ExcaliBrain from "src/main";
import { getTagStyle } from "src/utils/dataview";

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
          text: "•",
          cls: "excalibrain-history-divider"
        })
      }
      let displayName = "", link = "", label = "";
      const page = this.plugin.pages.get(nh[i]);
      if(!page) {
        return;
      }
      const style = page.path.startsWith("folder:")
        ? this.plugin.settings.folderNodeStyle
        : page.path.startsWith("tag:")
          ? this.plugin.settings.tagNodeStyle
          :  {
               ...this.plugin.settings.baseNodeStyle,
               ...getTagStyle(page.dvPage,this.plugin.settings)
             };

      if(page.file) {
        displayName = style.prefix + page.name;
        link = label = page.path;
      } else {

        displayName = style.prefix + page.name;        
        label = page.path;
        link = page.path;
      }
      container.createDiv({
        text: displayName,
        cls: "excalibrain-history-item"
      }, el=> {
        //el.ariaLabel = `[[${label}]]`;
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