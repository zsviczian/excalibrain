import { App, Notice, Plugin, PluginManifest, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { Page } from './graph/Page';
import { DEFAULT_SETTINGS, ExcaliBrainSettings, ExcaliBrainSettingTab } from './Settings';
import { errorlog } from './utils/utils';
import { getAPI } from "obsidian-dataview"
import { t } from './lang/helpers';
import { DEFAULT_LINK_STYLE, DEFAULT_NODE_STYLE, MINEXCALIDRAWVERSION, PLUGIN_NAME, PREDEFINED_LINK_STYLES } from './constants/constants';
import { DvAPIInterface } from 'obsidian-dataview/lib/typings/api';
import { Pages } from './graph/Pages';
import { getEA } from "obsidian-excalidraw-plugin";
import { ExcalidrawAutomate, search } from 'obsidian-excalidraw-plugin/lib/ExcalidrawAutomate';
import { Scene } from './Scene';
import { LinkStyles, NodeStyles, LinkStyle, RelationType, LinkDirection } from './Types';
import { WarningPrompt } from './utils/Prompts';

declare module "obsidian" {
  interface App {
    plugins: {
      disablePlugin(plugin: string):Promise<any>;
    };
  }
}

export default class ExcaliBrain extends Plugin {
  public settings:ExcaliBrainSettings;
  public nodeStyles: NodeStyles;
  public linkStyles: LinkStyles;
  public hierarchyLowerCase: {
    parents: string[],
    children: string[],
    friends: string[]
  } = {parents: [], children: [], friends: []};
  public hierarchyLinkStylesExtended: {[key: string]: LinkStyle}; //including datafields lowercase and "-" instead of " "
  public pages: Pages;
  public DVAPI: DvAPIInterface;
  public EA: ExcalidrawAutomate;
  public scene: Scene = null;
  private disregardLeafChangeTimer: NodeJS.Timeout;
  private pluginLoaded: boolean = false;
  public starred: Page[] = [];
  private focusSearchAfterInitiation:boolean = false;
  
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.starred = [
      new Page(
        "Initializing index, please wait",
        null,this,false,false,
        "Initializing index, please wait"
      )
    ]
  }

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ExcaliBrainSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(()=>{
      this.DVAPI = getAPI();
      if(!this.DVAPI) {
        (new WarningPrompt(
          app,
          "⚠ ExcaliBrain Disabled: DataView Plugin not found",
          t("DATAVIEW_NOT_FOUND"))
        ).show(async (result: boolean) => {
          new Notice("Disabling ExcaliBrain Plugin", 8000);
          errorlog({fn:this.onload, where:"main.ts/onload()", message:"Dataview not found"});
          this.app.plugins.disablePlugin(PLUGIN_NAME)  
        });
        return;
      }

      this.EA = getEA();
      if(!this.EA) {
        (new WarningPrompt(
          app,
          "⚠ ExcaliBrain Disabled: Excalidraw Plugin not found",
          t("EXCALIDRAW_NOT_FOUND"))
        ).show(async (result: boolean) => {
          new Notice("Disabling ExcaliBrain Plugin", 8000);
          errorlog({fn:this.onload, where:"main.ts/onload()", message:"Excalidraw not found"});
          this.app.plugins.disablePlugin(PLUGIN_NAME)  
        });
        return;
      }

      if(!this.EA.verifyMinimumPluginVersion(MINEXCALIDRAWVERSION)) {
        (new WarningPrompt(
          app,
          "⚠ ExcaliBrain Disabled: Please upgrade Excalidraw and try again",
          t("EXCALIDRAW_MINAPP_VERSION"))
        ).show(async (result: boolean) => {
          new Notice("Disabling ExcaliBrain Plugin", 8000);
          errorlog({fn:this.onload, where:"main.ts/onload()", message:"ExcaliBrain requires a new version of Excalidraw"});
          this.app.plugins.disablePlugin(PLUGIN_NAME)  
        });
        return;
      }

      this.registerCommands();
      this.registerExcalidrawAutomateHooks();
      this.pluginLoaded = true;
    });
	}

  public async createIndex() {
    this.pages = new Pages(this);

    //wait for Dataview to complete reloading the index
    let counter = 0;
    while(
      //@ts-ignore
      this.app.metadataCache.inProgressTaskCount > 0 ||
      this.DVAPI.index.importer.reloadQueue.length > 0
    ) {
      if(counter++ % 100 === 10) {
        new Notice("ExcaliBrain is waiting for Dataview to update its index",1000);
      }
      await sleep(100);
    }

    //const timestamps:{[key:string]: number} = {};
    
    //timestamps.start = Date.now();
    //Add all folders and files
    const addFolderChildren = (parentFolder: TFolder, parent: Page) => {
      const children = parentFolder.children; //.filter(f=>f instanceof TFolder) as TFolder[];
      children.forEach(f => {
        if(f instanceof TFolder) {
          const child = new Page("folder:"+f.path, null, this, true, false, f.name);
          this.pages.add("folder:"+f.path,child);
          child.addParent(parent,RelationType.DEFINED,LinkDirection.FROM,"file-tree");
          parent.addChild(child,RelationType.DEFINED,LinkDirection.TO,"file-tree");
          addFolderChildren(f,child);
          return;
        } else {
          const child = new Page(f.path,f as TFile,this);
          this.pages.add(f.path,child);
          child.addParent(parent,RelationType.DEFINED,LinkDirection.FROM,"file-tree");
          parent.addChild(child,RelationType.DEFINED,LinkDirection.TO,"file-tree");
        }
      })
    }
    const rootFolder = app.vault.getRoot();
    const rootFolderPage = new Page("folder:/", null, this, true, false, "/");
    this.pages.add("folder:/",rootFolderPage);
    addFolderChildren(rootFolder, rootFolderPage);
    //timestamps._1FoldersAndFiles = Date.now();

    //Add all tags
    //@ts-ignore
    const tags = Object.keys(app.metadataCache.getTags()).map(t=>t.substring(1).split("/"))
    tags.forEach(tag => {
      const tagPages: Page[] = [];
      tag.forEach((el,idx,t)=> {
        const path = "tag:" + t.slice(0,idx+1).join("/");
        let child = this.pages.get(path);
        if(child) {
          tagPages.push(child);
          return;
        }
        child = new Page(path, null, this, false, true, el);
        this.pages.add(path,child);
        tagPages.push(child);
        if(idx>0) {
          const parent = tagPages[idx-1];
          child.addParent(parent,RelationType.DEFINED,LinkDirection.FROM,"tag-tree");
          parent.addChild(child,RelationType.DEFINED,LinkDirection.TO,"tag-tree");
        }
      })
    })
    //timestamps._2Tags = Date.now();
    
    //Add all unresolved links and make child of page where it was found
    this.pages.addUnresolvedLinks()
    //timestamps._3UnresolvedLinks = Date.now();

    //Add all links as inferred children to pages on which they were found
    this.pages.addResolvedLinks();

    //timestamps._4ResolvedLinks = Date.now();
    //Iterate all pages and add defined links based on Dataview fields

    //This eats up 75% of the indexing resources
    //I moved this code to Scene.render() because there I can run it only for
    //those nodes that I actually plan to display
    /*this.pages.forEach((page:Page)=>{
      if(!page?.file) return;
      this.pages.addDVFieldLinksToPage(page);
    })*/
    //timestamps._5DataviewLinks = Date.now();

    /*console.log({
      total: timestamps._4ResolvedLinks-timestamps.start,
      files: timestamps._1FoldersAndFiles-timestamps.start,
      tags: timestamps._2Tags - timestamps._1FoldersAndFiles,
      "unresolved links": timestamps._3UnresolvedLinks - timestamps._2Tags,
      "resolved links": timestamps._4ResolvedLinks - timestamps._3UnresolvedLinks,
      //"Dataview fields": timestamps._5DataviewLinks - timestamps._4ResolvedLinks,
      size: this.pages.size
    })*/

    const self = this;
    setTimeout(async()=>{
      //@ts-ignore
      self.starred = (await app.internalPlugins.getPluginById("starred").loadData())
        .items
        .filter((i: any)=>i.type==="file")
        .map((i: any)=>i.path)
        .filter((p:string)=>(p!==self.settings.excalibrainFilepath) && self.pages.has(p))
        .map((p:string)=>self.pages.get(p));
    })
  }

  private excalidrawAvailable():boolean {
    const ea = getEA();
    if(!ea) {
      this.EA = null;
      if(this.scene) {
        this.scene.unloadScene();
      }
      new Notice("ExcaliBrain: Please start Excalidraw and try again.",4000);
      return false;
    }
    if(!this.EA) {
      this.EA = ea;
      this.registerExcalidrawAutomateHooks()
    }
    return true;
  }

  private revealBrainLeaf() {
    if(!this.scene || this.scene.terminated) {
      return;
    }
    app.workspace.revealLeaf(this.scene.leaf);
    //@ts-ignore
    const hoverEditor = app.plugins.getPlugin("obsidian-hover-editor");
    if(hoverEditor) {
      const activeEditor = hoverEditor.activePopovers.filter((he:any) => he.leaves()[0] === this.scene.leaf)[0];
      if(activeEditor) {
        if(this.scene.leaf.view.containerEl.offsetHeight === 0) {
          activeEditor.titleEl.querySelector("a.popover-action.mod-minimize").click();
        }
      }
    }
    const searchElement = this.scene.toolsPanel?.searchElement;
    searchElement?.focus();
  }

  private registerCommands() {
    this.addCommand({
      id: "excalibrain-start",
      name: t("COMMAND_START"),
      callback: async () => {
        if(!this.excalidrawAvailable()) return;
        if(this.scene && !this.scene.terminated) {
          this.revealBrainLeaf();
          return;
        }
        const leaf = this.getBrainLeaf();
        if(leaf) {
          this.scene = new Scene(this,true,leaf);
          this.scene.initialize(true);
          this.revealBrainLeaf();
          return;
        }
        this.focusSearchAfterInitiation = true;
        await Scene.openExcalidrawLeaf(window.ExcalidrawAutomate,this.settings,leaf);
      },
    });

    this.addCommand({
      id: "excalibrain-open-hover",
      name: t("COMMAND_START_HOVER"),
      checkCallback: (checking: boolean) => {
        //@ts-ignore
        const hoverEditor = app.plugins.getPlugin("obsidian-hover-editor");
        if(checking) {
          return hoverEditor;
        }
        if(!this.excalidrawAvailable()) return;        
        if(this.scene && !this.scene.terminated) {
          this.revealBrainLeaf();
          return;
        }
        try {
          //getBrainLeaf will only return one leaf. If there are multiple leaves open, some in hover editors other docked, the
          //current logic might miss the open hover editor. However, this is likely an uncommon scenario, thus no
          //value in making the logic more sophisticated.
          const brainLeaf = this.getBrainLeaf();
          if(brainLeaf) {
            const activeEditor = hoverEditor.activePopovers.filter((he:any) => he.leaves()[0] === brainLeaf)[0];
            if(activeEditor) {
              app.workspace.revealLeaf(brainLeaf);
              if(brainLeaf.view.containerEl.offsetHeight === 0) { //if hover editor is minimized
                activeEditor.titleEl.querySelector("a.popover-action.mod-maximize").click();
              }
              this.scene = new Scene(this,true,brainLeaf);
              this.scene.initialize(true);              
              return;
            }
          }
          const leaf = hoverEditor.spawnPopover(undefined,()=>{
            this.app.workspace.setActiveLeaf(leaf, false, true);
            const activeEditor = hoverEditor.activePopovers.filter((he:any) => he.leaves()[0] === leaf)[0];
            if(!activeEditor) {
              new Notice(t("HOVER_EDITOR_ERROR"), 6000);
              return false;
            }
            //@ts-ignore
            setTimeout(()=>app.commands.commands["obsidian-hover-editor:snap-active-popover-to-viewport"].checkCallback(false));
            this.focusSearchAfterInitiation = true;
            Scene.openExcalidrawLeaf(window.ExcalidrawAutomate,this.settings,leaf);
          });
        } catch(e) {
          new Notice(t("HOVER_EDITOR_ERROR"), 6000);
        }
      }
    })
  }

  getBrainLeaf():WorkspaceLeaf {
    let brainLeaf: WorkspaceLeaf;
    app.workspace.iterateAllLeaves(leaf=>{
      if(
        leaf.view &&
        this.EA.isExcalidrawView(leaf.view) &&
        //@ts-ignore
        leaf.view.file.path === this.settings.excalibrainFilepath
      ) {
        brainLeaf = leaf;
      }
    });
    return brainLeaf;
  }

  registerExcalidrawAutomateHooks() {
    this.EA.onViewModeChangeHook = (isViewModeEnabled) => {
      if(!this.EA.targetView || this.EA.targetView.file?.path !== this.settings.excalibrainFilepath) {
        return;
      }
      if(!isViewModeEnabled) {
        this.stop();
      }
    }

    this.EA.onLinkHoverHook = (element,linkText) => {
      if(
        !this.scene ||
        !this.EA.targetView ||
        this.EA.targetView.file?.path !== this.settings.excalibrainFilepath ||
        !this.EA.targetView.excalidrawAPI ||
        !this.EA.targetView.excalidrawAPI.getAppState().viewModeEnabled
      ) {
        return true;
      }
      this.scene.disregardLeafChange = true;
      if(this.disregardLeafChangeTimer) {
        clearTimeout(this.disregardLeafChangeTimer);
      }
      this.disregardLeafChangeTimer = setTimeout(()=>{
        this.disregardLeafChangeTimer = null;
        if(!this.scene) {
          return;
        }
        this.scene.disregardLeafChange = false;
      },1000);
      return true;
    }

    this.EA.onLinkClickHook = (element,linkText,event) => {
      const path = linkText.match(/\[\[([^\]]*)/)[1];
      const page =  this.pages.get(path);
      if(!event.shiftKey && page && page.isVirtual) {
        this.scene?.renderGraphForPath(path);
        return false;
      }
      if(!linkText.startsWith("[[folder:") && !linkText.startsWith("[[tag:")) {
        //@ts-ignore
        if(this.scene?.centralLeaf?.view?.file?.path === path) {
          this.scene?.renderGraphForPath(path);
          return false;
        }
        if(this.scene?.pinLeaf && this.scene?.isCentralLeafStillThere()) {
          const f = app.vault.getAbstractFileByPath(path.split("#")[0]);
          if(f && f instanceof TFile) {
            this.scene.centralLeaf.openFile(f);
            this.scene.renderGraphForPath(path);
            return false;
          }
        }
        return true;
      }
      this.scene?.renderGraphForPath(path);
      return false;
    }

    this.EA.onViewUnloadHook = (view) => {    
      if(this.scene && this.scene.leaf === view.leaf) {
        this.stop();
      }
    }
  }

	onunload() {
    if(this.scene) {
      this.scene.unloadScene();
      this.scene = null;
    }
	}

  public setHierarchyLinkStylesExtended() {
    this.hierarchyLinkStylesExtended = {};
    Object.entries(this.settings.hierarchyLinkStyles).forEach(item=>{
      const lowercase = item[0].toLowerCase().replaceAll(" ","-");
      this.hierarchyLinkStylesExtended[item[0]] = item[1];
      if(item[0]!==lowercase) {
        this.hierarchyLinkStylesExtended[lowercase] = item[1];
      }
    })
  }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.baseLinkStyle = {
      ...DEFAULT_LINK_STYLE,
      ...this.settings.baseLinkStyle,
    };
    this.settings.baseNodeStyle = {
      ...DEFAULT_NODE_STYLE,
      ...this.settings.baseNodeStyle,
    };

    this.hierarchyLowerCase.parents = [];
    this.settings.hierarchy.parents.forEach(f=>this.hierarchyLowerCase.parents.push(f.toLowerCase().replaceAll(" ","-")))
    this.hierarchyLowerCase.children = [];
    this.settings.hierarchy.children.forEach(f=>this.hierarchyLowerCase.children.push(f.toLowerCase().replaceAll(" ","-")))
    this.hierarchyLowerCase.friends = [];
    this.settings.hierarchy.friends.forEach(f=>this.hierarchyLowerCase.friends.push(f.toLowerCase().replaceAll(" ","-")))


    this.setHierarchyLinkStylesExtended();

    this.linkStyles = {};
    this.linkStyles["base"] = { //! update also constants.ts PREDEFINED_LINK_STYLES
      style: this.settings.baseLinkStyle,
      allowOverride: false,
      userStyle: false,
      display: t("LINKSTYLE_BASE"),
      getInheritedStyle: () => this.settings.baseLinkStyle,
    }

    this.linkStyles["inferred"] = { //! update also constants.ts PREDEFINED_LINK_STYLES
      style: this.settings.inferredLinkStyle,
      allowOverride: true,
      userStyle: false,
      display: t("LINKSTYLE_INFERRED"),
      getInheritedStyle: () => this.settings.baseLinkStyle,
    }

    this.linkStyles["file-tree"] = { //! update also constants.ts PREDEFINED_LINK_STYLES
      style: this.settings.folderLinkStyle,
      allowOverride: true,
      userStyle: false,
      display: t("LINKSTYLE_FOLDER"),
      getInheritedStyle: () => this.settings.baseLinkStyle,
    }

    this.linkStyles["tag-tree"] = { //! update also constants.ts PREDEFINED_LINK_STYLES
      style: this.settings.tagLinkStyle,
      allowOverride: true,
      userStyle: false,
      display: t("LINKSTYLE_TAG"),
      getInheritedStyle: () => this.settings.baseLinkStyle,
    }

    Object.entries(this.settings.hierarchyLinkStyles).forEach((item:[string,LinkStyle])=>{
      if(PREDEFINED_LINK_STYLES.contains(item[0])) { 
        return;
      }
      this.linkStyles[item[0]] = {
        style: item[1],
        allowOverride: true,
        userStyle: true,
        display: item[0],
        getInheritedStyle: ()=> this.settings.baseLinkStyle,
      }
    })

    this.nodeStyles = {};
    this.nodeStyles["base"] = {
      style: this.settings.baseNodeStyle,
      allowOverride: false,
      userStyle: false,
      display: t("NODESTYLE_BASE"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle,
    };
    this.nodeStyles["inferred"] = {
      style: this.settings.inferredNodeStyle,
      allowOverride: true,
      userStyle: false,
      display: t("NODESTYLE_INFERRED"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle
    };
    this.nodeStyles["virtual"] = {
      style: this.settings.virtualNodeStyle,
      allowOverride: true,
      userStyle: false,
      display: t("NODESTYLE_VIRTUAL"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle
    };
    this.nodeStyles["central"] = {
      style: this.settings.centralNodeStyle,
      allowOverride: true,
      userStyle: false,
      display: t("NODESTYLE_CENTRAL"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle
    };
    this.nodeStyles["sibling"] = {
      style: this.settings.siblingNodeStyle,
      allowOverride: true,
      userStyle: false,
      display: t("NODESTYLE_SIBLING"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle
    };
    this.nodeStyles["attachment"] = {
      style: this.settings.attachmentNodeStyle,
      allowOverride: true,
      userStyle: false,
      display: t("NODESTYLE_ATTACHMENT"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle     
    };
    this.nodeStyles["folder"] = {
      style: this.settings.folderNodeStyle,
      allowOverride: true,
      userStyle: false,
      display: t("NODESTYLE_FOLDER"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle     
    };
    this.nodeStyles["tag"] = {
      style: this.settings.tagNodeStyle,
      allowOverride: true,
      userStyle: false,
      display: t("NODESTYLE_TAG"),
      getInheritedStyle: ()=> this.settings.baseNodeStyle     
    };
    Object.entries(this.settings.tagNodeStyles).forEach(item=>{
      this.nodeStyles[item[0]] = {
        style: item[1],
        allowOverride: true,
        userStyle: true,
        display: item[0],
        getInheritedStyle: ()=> this.settings.baseNodeStyle
      }
    })
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

  public stop() {
    if(this.scene && !this.scene.terminated) {
      this.scene.unloadScene();
      this.scene = null;
    } 
  }

  public async start(leaf: WorkspaceLeaf) {
    if(!leaf.view) {
      return;
    }
    let counter = 0;
    while(!this.pluginLoaded && counter++<100) await sleep(50);
    if(!this.pluginLoaded) {
      new Notice("ExcaliBrain plugin did not load - aborting start()");
      errorlog({where: "ExcaliBrain.start()", fn: this.start, message: "ExcaliBrain did not load. Aborting after 5000ms of trying"});
      return;
    }
    if(!this.excalidrawAvailable()) return;
    this.stop();
    if(!leaf) {
      await Scene.openExcalidrawLeaf(window.ExcalidrawAutomate,this.settings,this.getBrainLeaf());
      return;
    }
    this.scene = new Scene(this,true,leaf)
    this.scene.initialize(this.focusSearchAfterInitiation);
    this.focusSearchAfterInitiation = false;
  }

  /*  private registerDataviewEventHandlers() {
    const metaCache: MetadataCache = self.app.metadataCache;
    this.registerEvent(
      metaCache.on("dataview:metadata-change",(type:string, file: TAbstractFile|TFile, oldPath?: string) => {
        if(type!=="rename") return;
        if(!(file instanceof TFile)) return;
        this.pages.delete(oldPath);
        this.pages.addWithConnections(file);
        //register page: path
        log({type,fileType: file instanceof TFile ? "file":"folder", path:file.path,oldPath});
      })
    );
    this.registerEvent(
      metaCache.on("dataview:metadata-change",(type:string, file: TFile) => {
        if(type==="rename") return;
        switch (type) {
          case "update":
            this.pages.delete(file.path);
            this.pages.addWithConnections(file);
            break;
          case "delete":
            this.pages.delete(file.path);
            break;
        }
        log({type, path:file.path});       
      })
    );
  }*/
}

