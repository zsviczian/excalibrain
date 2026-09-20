import ExcaliBrain from "src/excalibrain-main";
import { getPrimaryTag, getTagStyle } from "src/utils/dataview";

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
    const nh = this.plugin.navigationHistory.get();

    for(let i=nh.length-1;i>=0;i--) {
      if(i !== nh.length-1) {
        container.createDiv({
          text: "•",
          cls: "excalibrain-history-divider"
        })
      }
      let displayName = "", link = "";
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
               ...getTagStyle(getPrimaryTag(page.dvPage,this.plugin.settings),this.plugin.settings)
             };

      if(page.file) {
        displayName = style.prefix + page.getTitle();
        link = page.path;
      } else {

        displayName = style.prefix + page.name;        
        link = page.path;
      }
      container.createDiv({
        text: displayName,
        cls: "excalibrain-history-item"
      }, el=> {
        //el.ariaLabel = `[[${label}]]`;
        el.onclick = () => { void this.plugin.scene?.renderGraphForPath(link); };
      })
    }
  }

  terminate() {
    if(this.wrapperDiv) {
      try{
        this.contentEl?.removeChild(this.wrapperDiv);
      } catch {
        // The wrapper may already have been detached during view teardown.
      }
      this.wrapperDiv = null;
    }
  }
}