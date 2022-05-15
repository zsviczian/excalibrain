import { TFile } from "obsidian";
import { ExcalidrawElement } from "obsidian-excalidraw-plugin";
import { ToggleButton } from "src/Components/ToggleButton";
import { t } from "src/lang/helpers";
import ExcaliBrain from "src/main";
import { splitFolderAndFilename } from "src/utils/fileUtils";
import { PageSuggest } from "../Suggesters/PageSuggester";

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
      const page = this.plugin.pages.get(inputEl.value);
      if(page) {
        this.plugin.scene?.renderGraphForPath(page.path);
      }
    }
    inputEl.onblur = () => {
      inputEl.value = "";
    }
    new PageSuggest(
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
        onNewPane: true
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
    //Page
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showPageNodes,
        (val:boolean)=>this.plugin.settings.showPageNodes = val,
        buttonsWrapperDiv,
        {
          display: "📄",
          tooltip: t("SHOW_HIDE_PAGES")
        }
     )
    )

    //------------
    //Folder
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showFolderNodes,
        (val:boolean)=>this.plugin.settings.showFolderNodes = val,
        buttonsWrapperDiv,
        {
          display: "📂",
          tooltip: t("SHOW_HIDE_FOLDER")
        }
     )
    )

    //------------
    //Tag
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showTagNodes,
        (val:boolean)=>this.plugin.settings.showTagNodes = val,
        buttonsWrapperDiv,
        {
          display: "#",
          tooltip: t("SHOW_HIDE_TAG")
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

    //------------
    //Pin Leaf
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.scene.pinLeaf,
        (val:boolean)=>this.plugin.scene.pinLeaf = val,
        buttonsWrapperDiv,
        {
          display: "📌",
          tooltip: t("PIN_LEAF")
        }
     )
    )
    
    //------------
    //Display siblings
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.renderSiblings,
        (val:boolean)=>this.plugin.settings.renderSiblings = val,
        buttonsWrapperDiv,
        {
          display: "👨‍👩‍👧‍👦",
          tooltip: t("SHOW_HIDE_SIBLINGS")
        }
     )
    )

    this.contentEl.appendChild(this.wrapperDiv);

  }

  rerender() {
    this.buttons.forEach(b=>b.setColor());
  }

  terminate() {
    if(this.contentEl) {
      this.contentEl.removeClass("excalibrain-contentEl");
    }   
    if(this.wrapperDiv) {
      try{
        this.contentEl?.removeChild(this.wrapperDiv);
      } catch{}
      this.wrapperDiv = null;
    }
  }
}