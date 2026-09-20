import { ToggleButton } from "src/Components/ToggleButton";
import { t } from "src/lang/helpers";
import ExcaliBrain from "src/excalibrain-main";
import { splitFolderAndFilename } from "src/utils/fileUtils";
import { PageSuggest } from "../Suggesters/PageSuggester";
import { LinkTagFilter } from "./LinkTagFilter";
import { EditableFileView, WorkspaceLeaf } from "obsidian";
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
        void this.plugin.scene?.renderGraphForPath(page.path);
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
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => false,
        setVal: (val: boolean) => {
          const elements = this.plugin.EA.getExcalidrawAPI?.()?.getSceneElements?.() ?? [];
          const appState = this.plugin.EA.getExcalidrawAPI().getAppState();
          const ea = this.plugin.EA; //window.ExcalidrawAutomate;
          ea.reset();
          ea.canvas.viewBackgroundColor = appState.viewBackgroundColor;
          ea.canvas.theme = "light";
          elements.forEach((el) => (ea.elementsDict[el.id] = el));
          ea.create({
            filename: `ExcaliBrain Snapshot - ${splitFolderAndFilename(
              this.plugin.scene.centralPagePath
            ).basename}`,
            onNewPane: true,
          });
          return false;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "✏",
          icon: "lucide-pencil",
          tooltip: t("OPEN_DRAWING"),
        },
        updateIndex: true,
      })
    );

    addVerticalDivider(buttonsWrapperDiv);

    //------------
    //Navigate back
    //------------
    const bb = new ToggleButton({
      plugin: this.plugin,
      getVal: () => false,
      setVal: (val: boolean) => {
        void this.plugin.scene.renderGraphForPath(this.plugin.navigationHistory.getPrevious());
        this.rerender();
        return false;
      },
      isEnabled: () => this.plugin.navigationHistory.hasPrevious(),
      wrapper: buttonsWrapperDiv,
      options: {
        display: "<",
        icon: "lucide-arrow-big-left",
        tooltip: t("NAVIGATE_BACK"),
      },
      updateIndex: false,
      shouldRerenderOnToggle: false,
    });
    this.buttons.push(bb);

    //------------
    //Navigate forward
    //------------
    const fb = new ToggleButton({
      plugin: this.plugin,
      getVal: () => false,
      setVal: (val: boolean) => {
        void this.plugin.scene.renderGraphForPath(this.plugin.navigationHistory.getNext());
        this.rerender();
        return false;
      },
      isEnabled: () => this.plugin.navigationHistory.hasNext(),
      wrapper: buttonsWrapperDiv,
      options: {
        display: ">",
        icon: "lucide-arrow-big-right",
        tooltip: t("NAVIGATE_FORWARD"),
      },
      updateIndex: false,
      shouldRerenderOnToggle: false,
    });

    this.buttons.push(fb);
    this.plugin.navigationHistory.setNavigateButtons([bb,fb]);

    //------------
    //Refresh view
    //------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => false,
        setVal: (val: boolean) => false,
        wrapper: buttonsWrapperDiv,
        options: {
          display: "🔄",
          icon: "lucide-refresh-cw",
          tooltip: t("REFRESH_VIEW"),
        },
        updateIndex: true,
      })
    );

    //------------
    //Pin Leaf
    //------------
    const pinLeafButton = new ToggleButton({
      plugin: this.plugin,
      getVal: () => this.plugin.scene.pinLeaf,
      setVal: (val: boolean) => {
        this.plugin.scene.pinLeaf = val;
        if(val) {
          const leaves: WorkspaceLeaf[] = [];
          this.plugin.app.workspace.iterateAllLeaves(leaf => {
            if(
              leaf.view?.getViewType() === "empty" ||
              leaf.view instanceof EditableFileView && leaf !== this.plugin.scene?.leaf
            ) {
              leaves.push(leaf);
            }
          });
          leaves.sort((a,b) => (a.activeTime - b.activeTime)>0?-1:1);
          if(leaves.length>0) {
            this.plugin.scene.centralLeaf = leaves[0];
          }
        }
        return true;
      },
      isEnabled: () => {
        if(!this.plugin.settings.autoOpenCentralDocument) return false;
        if(this.plugin.scene && !this.plugin.scene.isCentralLeafStillThere()) {
          this.plugin.scene.pinLeaf = false;
        }
        return true;
      },
      wrapper: buttonsWrapperDiv,
      options: {
        display: "📌",
        icon: {
          on: "lucide-pin",
          off: "lucide-pin-off",
        },
        tooltip: t("PIN_LEAF"),
      },
      updateIndex: false,
    })
    this.buttons.push(pinLeafButton);

    //------------
    //Automatically open central node in leaf
    //------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.autoOpenCentralDocument,
        setVal: (val: boolean) => {
          this.plugin.settings.autoOpenCentralDocument = val;
          pinLeafButton.updateButton();
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "🔌",
          icon: {
            on: "lucide-link",
            off: "lucide-unlink",
          },
          tooltip: t("AUTO_OPEN_DOCUMENT"),
        },
        updateIndex: false,
      })
    );

    addVerticalDivider(buttonsWrapperDiv);

    // ------------
    // Attachments
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.showAttachments,
        setVal: (val: boolean) => {
          this.plugin.settings.showAttachments = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "📎",
          icon: "lucide-paperclip",
          tooltip: t("SHOW_HIDE_ATTACHMENTS"),
        },
        updateIndex: true,
      }),
    );

    // ------------
    // Virtual
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.showVirtualNodes,
        setVal: (val: boolean) => {
          this.plugin.settings.showVirtualNodes = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "∅",
          icon: "lucide-minus-circle",
          tooltip: t("SHOW_HIDE_VIRTUAL"),
        },
        updateIndex: false,
      })
    );

    // ------------
    // Inferred
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.showInferredNodes,
        setVal: (val: boolean) => {
          this.plugin.settings.showInferredNodes = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "🤔",
          icon: "lucide-git-pull-request-draft",
          tooltip: t("SHOW_HIDE_INFERRED"),
        },
        updateIndex: true,
      })
    );

    // ------------
    // Page
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.showPageNodes,
        setVal: (val: boolean) => {
          this.plugin.settings.showPageNodes = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "📄",
          icon: "lucide-file-text",
          tooltip: t("SHOW_HIDE_PAGES"),
        },
        updateIndex: true,
      })
    );

    // ------------
    // Alias
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.renderAlias,
        setVal: (val: boolean) => {
          this.plugin.settings.renderAlias = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "🧥",
          icon: "lucide-venetian-mask",
          tooltip: t("SHOW_HIDE_ALIAS"),
        },
        updateIndex: false,
      })
    );

    // ------------
    // Folder
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.showFolderNodes,
        setVal: (val: boolean) => {
          this.plugin.settings.showFolderNodes = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "📂",
          icon: "lucide-folder",
          tooltip: t("SHOW_HIDE_FOLDER"),
        },
        updateIndex: true,
      })
    );

    // ------------
    // Tag
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.showTagNodes,
        setVal: (val: boolean) => {
          this.plugin.settings.showTagNodes = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "#",
          icon: "lucide-tag",
          tooltip: t("SHOW_HIDE_TAG"),
        },
        updateIndex: false,
      })
    );

    // ------------
    // Render weblinks in page
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.showURLNodes,
        setVal: (val: boolean) => {
          this.plugin.settings.showURLNodes = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "🌐",
          icon: "lucide-globe",
          tooltip: t("SHOW_HIDE_URLS"),
        },
        updateIndex: false,
      })
    );

    // ------------
    // Display siblings
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.renderSiblings,
        setVal: (val: boolean) => {
          this.plugin.settings.renderSiblings = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "👨‍👩‍👧‍👦",
          icon: "lucide-grip",
          tooltip: t("SHOW_HIDE_SIBLINGS"),
        },
        updateIndex: false,
      })
    );

    // ------------
    // Power Filter
    // ------------
    /*this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.applyPowerFilter,
        setVal: (val: boolean) => {
          this.plugin.settings.applyPowerFilter = val;
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "V",
          icon: "lucide-filter",
          tooltip: t("SHOW_HIDE_POWERFILTER"),
        },
        updateIndex: false,
      })
    );*/

    // ------------
    // Central node as interactive frame
    // ------------
    this.buttons.push(
      new ToggleButton({
        plugin: this.plugin,
        getVal: () => this.plugin.settings.embedCentralNode,
        setVal: (val: boolean) => {
          this.plugin.settings.embedCentralNode = val;
          if(this.plugin.settings.toggleEmbedTogglesAutoOpen) {
            this.plugin.settings.autoOpenCentralDocument = !val;
          }
          return true;
        },
        wrapper: buttonsWrapperDiv,
        options: {
          display: "⏹️",
          icon: "lucide-code",
          tooltip: t("SHOW_HIDE_EMBEDDEDCENTRAL"),
        },
        updateIndex: false,
      })
    );

    this.contentEl.appendChild(this.wrapperDiv);
  }

  rerender() {
    this.buttons.forEach(b => {
      if(b instanceof ToggleButton) b.updateButton();
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
      } catch {
        // The wrapper may already have been detached during view teardown.
      }
      this.wrapperDiv = null;
    }
  }
}