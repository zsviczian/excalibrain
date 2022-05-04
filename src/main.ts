import { App, Notice, Plugin, PluginManifest, TAbstractFile, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { Page } from './graph/Page';
import { DEFAULT_SETTINGS, ExcaliBrainSettings, ExcaliBrainSettingTab } from './Settings';
import { errorlog, log } from './utils/utils';
import { getAPI } from "obsidian-dataview"
import { t } from './lang/helpers';
import { MINEXCALIDRAWVERSION, PLUGIN_NAME } from './constants/constants';
import { DvAPIInterface } from 'obsidian-dataview/lib/typings/api';
import { Pages } from './graph/Pages';
import { getEA } from "obsidian-excalidraw-plugin";
import { ExcalidrawAutomate } from 'obsidian-excalidraw-plugin/lib/ExcalidrawAutomate';
import { Scene } from './Scene';
import { LinkStyles, NodeStyles, LinkStyle } from './Types';


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
  public pages: Pages;
  public DVAPI: DvAPIInterface;
  public EA: ExcalidrawAutomate;
  public scene: Scene = null;
  private disregardLeafChangeTimer: NodeJS.Timeout;
  private pluginLoaded: boolean = false;
  
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ExcaliBrainSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(()=>{
      this.DVAPI = getAPI();
      if(!this.DVAPI) {
        new Notice(t("DATAVIEW_NOT_FOUND"),4000);
        errorlog({fn:this.onload, where:"main.ts/onload()", message:"Dataview not found"});
        this.app.plugins.disablePlugin(PLUGIN_NAME)
        return;
      }
      this.EA = getEA();
      if(!this.EA) {
        new Notice(t("EXCALIDRAW_NOT_FOUND"),4000);
        errorlog({fn:this.onload, where:"main.ts/onload()", message:"Excalidraw not found"});
        this.app.plugins.disablePlugin(PLUGIN_NAME)
        return;
      }
      if(!this.EA.verifyMinimumPluginVersion(MINEXCALIDRAWVERSION)) {
        new Notice(t("EXCALIDRAW_MINAPP_VERSION"), 4000);
        errorlog({fn:this.onload, where:"main.ts/onload()", message:"ExcaliBrain requires a new version of Excalidraw"});
        this.app.plugins.disablePlugin(PLUGIN_NAME)
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
        new Notice("ExcaliBrain is waiting for Dataview initialization",1000);
      }
      await sleep(100);
    }

    //Add all existing files
    for(const f of this.app.vault.getFiles()) {
      this.pages.add(f.path,new Page(f.path,f,this));
    }
    //Add all unresolved links and make child of page where it was found
    this.pages.addUnresolvedLinks()
    //Add all links as inferred children to pages on which they were found
    this.pages.addResolvedLinks();
    //Iterate all pages and add defined links based on Dataview fields

    this.pages.forEach((page:Page,key:string)=>{
      if(!page?.file) return;
      this.pages.addDVFieldLinksToPage(page);
    })
  }

  private registerCommands() {
    this.addCommand({
      id: "excalibrain-start",
      name: t("COMMAND_START"),
      callback: () => {
        if(this.scene && !this.scene.terminated) {
          this.scene.unloadScene();
          this.scene = null;
        } else {
          const leaf = this.getBrainLeaf();
          //@ts-ignore
          if(leaf && leaf.view && leaf.view.file && leaf.view.file.path == this.settings.excalibrainFilepath) {
            this.scene = new Scene(this,true,leaf);
            this.scene.initialize();
            return;
          }
          Scene.openExcalidrawLeaf(window.ExcalidrawAutomate,this.settings,leaf);
        }
      },
    });
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.linkStyles = {};
    this.linkStyles["base"] = {
      style: this.settings.baseLinkStyle,
      allowOverride: false,
      userStyle: false,
      display: t("LINKSTYLE_BASE"),
      getInheritedStyle: () => this.settings.baseLinkStyle,
    }

    this.linkStyles["inferred"] = {
      style: this.settings.inferredLinkStyle,
      allowOverride: true,
      userStyle: false,
      display: t("LINKSTYLE_INFERRED"),
      getInheritedStyle: () => this.settings.baseLinkStyle,
    }

    Object.entries(this.settings.hierarchyLinkStyles).forEach((item:[string,LinkStyle])=>{
      this.linkStyles[item[0]] = {
        style: item[1],
        allowOverride: true,
        userStyle: true,
        display: item[0],
        getInheritedStyle: ()=> this.settings.baseNodeStyle
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
    let counter = 0;
    while(!this.pluginLoaded && counter++<100) await sleep(50);
    if(!this.pluginLoaded) {
      new Notice("ExcaliBrain plugin did not load - aborting start()");
      errorlog({where: "ExcaliBrain.start()", fn: this.start, message: "ExcaliBrain did not load. Aborting after 5000ms of trying"});
      return;
    }
    if(counter<4) { //sleep as a temp workaround for a race condition starting Excalidraw
      while(counter++<8) await sleep(50);
    }
    this.stop();
    if(!leaf) {
      await Scene.openExcalidrawLeaf(window.ExcalidrawAutomate,this.settings,this.getBrainLeaf());
      return;
    }
    this.scene = new Scene(this,true,leaf)
    this.scene.initialize();
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

