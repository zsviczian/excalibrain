import { TFile } from "obsidian";
import { ExcalidrawElement } from "obsidian-excalidraw-plugin";
import { ToggleButton } from "src/Components/ToggleButton";
import { t } from "src/lang/helpers";
import ExcaliBrain from "src/main";
import { splitFolderAndFilename } from "src/utils/fileUtils";
import { FileSuggest } from "./FileSuggester";

export class ToolsPanel {
  private wrapperDiv: HTMLDivElement;
  private buttons: ToggleButton[] = [];

  constructor(
    private contentEl: HTMLElement,
    private plugin: ExcaliBrain
  ) {
    contentEl.addClass("excalibrain-contentEl");
    this.wrapperDiv = this.contentEl.createDiv({
      cls: "excalibrain-toolspanel-wrapper"
    });
    
    //------
    //search
    //------
    const inputEl = this.wrapperDiv.createEl("input",{
      type: "text",
      cls: "excalibrain-searchinput"
    });
    inputEl.ariaLabel = t("SEARCH_IN_VAULT");
    inputEl.oninput = () => {
      const file = app.vault.getAbstractFileByPath(inputEl.value);
      if(file && file instanceof TFile) {
        this.plugin.scene?.renderGraphForFile(inputEl.value);
        inputEl.value = file.basename;
      }
    }
    new FileSuggest(
      this.plugin.app,
      inputEl,
      this.plugin
    );

    
    const buttonsWrapperDiv = this.wrapperDiv.createDiv({
      cls: "excalibrain-buttons"
    })
    //------------
    //Edit drawing
    //------------
    const saveAsDrawingButton = buttonsWrapperDiv.createEl("button", {
      cls: "excalibrain-button",
      text: "✏"
    });
    saveAsDrawingButton.ariaLabel = t("OPEN_DRAWING");
    saveAsDrawingButton.onclick = () => {
      const elements = this.plugin.EA.getExcalidrawAPI().getSceneElements() as ExcalidrawElement[];
      const appState = this.plugin.EA.getExcalidrawAPI().getAppState();
      const ea = this.plugin.EA; //window.ExcalidrawAutomate;
      ea.reset();
      ea.canvas.viewBackgroundColor = appState.viewBackgroundColor;
      ea.canvas.theme = "light";
      elements.forEach(el=>ea.elementsDict[el.id] = el);
      ea.create({
        filename: `ExcaliBrain Snapshot - ${splitFolderAndFilename(this.plugin.scene.centralPagePath).basename}`,
        onNewPane:true
      });
    }

    //------------
    //Attachments
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showAttachments,
        (val:boolean)=>this.plugin.settings.showAttachments = val,
        buttonsWrapperDiv,
        {
          display: "📎",
          tooltip: t("SHOW_HIDE_ATTACHMENTS")
        }
     )
    )

    //------------
    //Virtual
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showVirtualNodes,
        (val:boolean)=>this.plugin.settings.showVirtualNodes = val,
        buttonsWrapperDiv,
        {
          display: "∅",
          tooltip: t("SHOW_HIDE_VIRTUAL")
        }
     )
    )
    
    //------------
    //Inferred
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showInferredNodes,
        (val:boolean)=>this.plugin.settings.showInferredNodes = val,
        buttonsWrapperDiv,
        {
          display: "🤔",
          tooltip: t("SHOW_HIDE_INFERRED")
        }
     )
    )

    //------------
    //Alias
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.renderAlias,
        (val:boolean)=>this.plugin.settings.renderAlias = val,
        buttonsWrapperDiv,
        {
          display: "🧥",
          tooltip: t("SHOW_HIDE_ALIAS")
        }
     )
    )

    this.contentEl.appendChild(this.wrapperDiv);

  }

  rerender() {
    this.buttons.forEach(b=>b.setColor());
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