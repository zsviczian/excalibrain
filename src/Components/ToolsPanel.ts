import { ExcalidrawElement } from "obsidian-excalidraw-plugin";
import { ToggleButton } from "src/Components/ToggleButton";
import { t } from "src/lang/helpers";
import ExcaliBrain from "src/excalibrain-main";
import { splitFolderAndFilename } from "src/utils/fileUtils";
import { PageSuggest } from "../Suggesters/PageSuggester";
import { LinkTagFilter } from "./LinkTagFilter";
import { getIcon } from "obsidian";
import { addVerticalDivider } from "./VerticalDivider";

export class ToolsPanel {
  private wrapperDiv: HTMLDivElement;
  private buttons: (ToggleButton|HTMLElement)[] = [];
  public linkTagFilter: LinkTagFilter;
  public searchElement: HTMLInputElement;

  constructor(
    private contentEl: HTMLElement,
    private plugin: ExcaliBrain
  ) {
    contentEl.addClass("excalibrain-contentEl");
    this.wrapperDiv = this.contentEl.createDiv({
      cls: "excalibrain-toolspanel-wrapper"
    });
    
    const dropdownWrapperDiv = this.wrapperDiv.createDiv({
      cls: "excalibrain-dropdown-wrapper"
    });
    
    //------
    //search
    //------
    const inputEl = dropdownWrapperDiv.createEl("input",{
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
      this.plugin,
      contentEl
    );
    this.searchElement = inputEl;

    //-------
    //Filter
    //-------
    this.linkTagFilter = new LinkTagFilter(plugin,dropdownWrapperDiv);
    this.linkTagFilter.render();
    
    
    const buttonsWrapperDiv = this.wrapperDiv.createDiv({
      cls: "excalibrain-buttons"
    })
    //------------
    //Edit drawing
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>false,
        (val:boolean)=>{
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
          return false;
        },
        buttonsWrapperDiv,
        {
          display: "✏",
          icon: getIcon("lucide-pencil").outerHTML,
          tooltip: t("OPEN_DRAWING"),
        },
    ));

    addVerticalDivider(buttonsWrapperDiv);

    //------------
    //Navigate back
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>false,
        (val:boolean)=>false,
        buttonsWrapperDiv,
        {
          display: "<",
          icon: getIcon("lucide-arrow-big-left").outerHTML,
          tooltip: t("NAVIGATE_BACK")
        },
        false
     )
    )

    //------------
    //Navigate forward
    //------------
    new ToggleButton(
      this.plugin,
      ()=>false,
      (val:boolean)=>{
        const lastItemIDX = this.plugin.settings.navigationHistory.length;
        this.plugin.scene.renderGraphForPath(this.plugin.settings.navigationHistory[lastItemIDX-1]);
        return false;
      },
      buttonsWrapperDiv,
      {
        display: ">",
        icon: getIcon("lucide-arrow-big-right").outerHTML,
        tooltip: t("NAVIGATE_FORWARD")
      },
      false
   )
    
    //------------
    //Refresh view
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>false,
        (val:boolean)=>false,
        buttonsWrapperDiv,
        {
          display: "🔄",
          icon: getIcon("lucide-refresh-cw").outerHTML,
          tooltip: t("REFRESH_VIEW")
        },
        false
     )
    )

    //------------
    //Pin Leaf
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.scene.pinLeaf,
        (val:boolean)=>{
          this.plugin.scene.pinLeaf = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "📌",
          icon: getIcon("lucide-pin").outerHTML,
          tooltip: t("PIN_LEAF")
        },
        false
     )
    )

    //------------
    //Automatically open central node in leaf
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.autoOpenCentralDocument,
        (val:boolean)=>{
          this.plugin.settings.autoOpenCentralDocument = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "🔌",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-unplug"><path d="m19 5 3-3"/><path d="m2 22 3-3"/><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"/></svg>`, //getIcon("lucide-unplug").outerHTML,
          tooltip: t("AUTO_OPEN_DOCUMENT")
        },
        false
     )
    )

    addVerticalDivider(buttonsWrapperDiv);
    //------------
    //Attachments
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showAttachments,
        (val:boolean)=>{
          this.plugin.settings.showAttachments = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "📎",
          icon: getIcon("lucide-paperclip").outerHTML,
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
        (val:boolean)=>{
          this.plugin.settings.showVirtualNodes = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "∅",
          icon: getIcon("lucide-minus-circle").outerHTML,
          tooltip: t("SHOW_HIDE_VIRTUAL")
        },
        false
     )
    )
    
    //------------
    //Inferred
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showInferredNodes,
        (val:boolean)=>{
          this.plugin.settings.showInferredNodes = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "🤔",
          icon: getIcon("lucide-git-pull-request-draft").outerHTML,
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
        (val:boolean)=>{
          this.plugin.settings.showPageNodes = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "📄",
          icon: getIcon("lucide-file-text").outerHTML,
          tooltip: t("SHOW_HIDE_PAGES")
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
        (val:boolean)=>{
          this.plugin.settings.renderAlias = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "🧥",
          icon: getIcon("lucide-venetian-mask").outerHTML,
          tooltip: t("SHOW_HIDE_ALIAS")
        },
        false
     )
    )

    //------------
    //Folder
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showFolderNodes,
        (val:boolean)=>{
          this.plugin.settings.showFolderNodes = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "📂",
          icon: getIcon("lucide-folder").outerHTML,
          tooltip: t("SHOW_HIDE_FOLDER")
        },
        true
     )
    )

    //------------
    //Tag
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showTagNodes,
        (val:boolean)=>{
          this.plugin.settings.showTagNodes = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "#",
          icon: getIcon("lucide-tag").outerHTML,
          tooltip: t("SHOW_HIDE_TAG")
        },
        false
     )
    )

    //------------
    // Render weblinks in page
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.showURLNodes,
        (val:boolean)=>{
          this.plugin.settings.showURLNodes = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "🌐",
          icon: getIcon("lucide-globe").outerHTML,
          tooltip: t("SHOW_HIDE_URLS")
        },
        false
     )
    )
    
    //------------
    //Display siblings
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.renderSiblings,
        (val:boolean)=>{
          this.plugin.settings.renderSiblings = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "👨‍👩‍👧‍👦",
          icon: getIcon("lucide-grip").outerHTML,
          tooltip: t("SHOW_HIDE_SIBLINGS")
        },
        false
     )
    )

    //------------
    // Central node as interactive frame
    //------------
    this.buttons.push(
      new ToggleButton(
        this.plugin,
        ()=>this.plugin.settings.embedCentralNode,
        (val:boolean)=>{
          this.plugin.settings.embedCentralNode = val;
          return true;
        },
        buttonsWrapperDiv,
        {
          display: "⏹️",
          icon: getIcon("lucide-code").outerHTML,
          tooltip: t("SHOW_HIDE_EMBEDDEDCENTRAL")
        },
        false
     )
    )

    this.contentEl.appendChild(this.wrapperDiv);

  }

  rerender() {
    this.buttons.forEach(b => {
      if(b instanceof ToggleButton) b.setColor();
    });
    this.linkTagFilter.render();
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