import { App, MarkdownView, Notice, Plugin, PluginManifest, TextFileView, TFile, TFolder, WorkspaceLeaf } from 'obsidian';
import { Page } from './graph/Page';
import { DEFAULT_SETTINGS, ExcaliBrainSettings, ExcaliBrainSettingTab } from './Settings';
import { errorlog } from './utils/utils';
import { getAPI } from "obsidian-dataview"
import { t } from './lang/helpers';
import { DEFAULT_HIERARCHY_DEFINITION, DEFAULT_LINK_STYLE, DEFAULT_NODE_STYLE, MINEXCALIDRAWVERSION, PLUGIN_NAME, PREDEFINED_LINK_STYLES } from './constants/constants';
import { DvAPIInterface } from 'obsidian-dataview/lib/typings/api';
import { Pages } from './graph/Pages';
import { getEA } from "obsidian-excalidraw-plugin";
import { ExcalidrawAutomate, search } from 'obsidian-excalidraw-plugin/lib/ExcalidrawAutomate';
import { Scene } from './Scene';
import { LinkStyles, NodeStyles, LinkStyle, RelationType, LinkDirection } from './types';
import { WarningPrompt } from './utils/Prompts';
import { FieldSuggester } from './Suggesters/OntologySuggester';
import { Literal } from 'obsidian-dataview/lib/data-model/value';
import { isEmbedFileType } from './utils/fileUtils';

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
    leftFriends: string[],
    rightFriends: string[],
    previous: string[],
    next: string[],
  } = {parents: [], children: [], leftFriends: [], rightFriends: [], previous: [], next: []};
  public hierarchyLinkStylesExtended: {[key: string]: LinkStyle}; //including datafields lowercase and "-" instead of " "
  public pages: Pages;
  public DVAPI: DvAPIInterface;
  public EA: ExcalidrawAutomate;
  public scene: Scene = null;
  private disregardLeafChangeTimer: NodeJS.Timeout;
  private pluginLoaded: boolean = false;
  public starred: Page[] = [];
  private focusSearchAfterInitiation:boolean = false;
  public customNodeLabel: (dvPage: Literal, defaultName:string) => string
  public navigationHistory: string[] = [];
  
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.starred = [
      new Page(
        null,
        "Initializing index, please wait",
        null,this,false,false,
        "Initializing index, please wait"
      )
    ]
  }

	async onload() {
		await this.loadSettings();
    this.navigationHistory = this.settings.navigationHistory;
		this.addSettingTab(new ExcaliBrainSettingTab(this.app, this));
    this.registerEditorSuggest(new FieldSuggester(this));
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
      if(!this.DVAPI.version.compare('>=', '0.5.31')) {
        (new WarningPrompt(
          app,
          "⚠ ExcaliBrain Disabled: Dataview upgrade requried",
          t("DATAVIEW_UPGRADE"))
        ).show(async (result: boolean) => {
          new Notice("Disabling ExcaliBrain Plugin", 8000);
          errorlog({fn:this.onload, where:"main.ts/onload()", message:"Dataview version error"});
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

  public lowercasePathMap: Map<string,string>;

  public async createIndex() {
    this.pages = new Pages(this);
    this.lowercasePathMap = new Map<string,string>();

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

    //Add all folders and files
    const addFolderChildren = (parentFolder: TFolder, parent: Page) => {
      const children = parentFolder.children; 
      children.forEach(f => {
        if(f instanceof TFolder) {
          const child = new Page(this.pages,"folder:"+f.path, null, this, true, false, f.name);
          this.pages.add("folder:"+f.path,child);
          child.addParent(parent,RelationType.DEFINED,LinkDirection.FROM,"file-tree");
          parent.addChild(child,RelationType.DEFINED,LinkDirection.TO,"file-tree");
          addFolderChildren(f,child);
          return;
        } else {
          this.lowercasePathMap.set(f.path.toLowerCase(),f.path); //path case sensitivity issue (see Pages.ts and Scene.ts for more)
          const child = new Page(this.pages,f.path,f as TFile,this);
          this.pages.add(f.path,child);
          child.addParent(parent,RelationType.DEFINED,LinkDirection.FROM,"file-tree");
          parent.addChild(child,RelationType.DEFINED,LinkDirection.TO,"file-tree");
        }
      })
    }
    const rootFolder = app.vault.getRoot();
    const rootFolderPage = new Page(this.pages,"folder:/", null, this, true, false, "/");
    this.pages.add("folder:/",rootFolderPage);
    addFolderChildren(rootFolder, rootFolderPage);

    //Add all tags
    //@ts-ignore
    const tags = Object.keys(app.metadataCache.getTags()).map(t=>t.substring(1).split("/"))
    tags.forEach(tag => {
      const tagPages: Page[] = [];
      tag.forEach((el,idx,t)=> {
        const tagPath = t.slice(0,idx+1).join("/")
        const path = "tag:" + tagPath;
        let child = this.pages.get(path);
        if(child) {
          tagPages.push(child);
          return;
        }
        child = new Page(this.pages,path, null, this, false, true, this.settings.showFullTagName?tagPath:el);
        this.pages.add(path,child);
        tagPages.push(child);
        if(idx>0) {
          const parent = tagPages[idx-1];
          child.addParent(parent,RelationType.DEFINED,LinkDirection.FROM,"tag-tree");
          parent.addChild(child,RelationType.DEFINED,LinkDirection.TO,"tag-tree");
        }
      })
    })
    
    //Add all unresolved links and make child of page where it was found
    this.pages.addUnresolvedLinks()

    //Add all links as inferred children to pages on which they were found
    this.pages.addResolvedLinks();

    const self = this;
    setTimeout(async()=>{
      //@ts-ignore
      const bookmarksPlugin = app.internalPlugins.getPluginById("bookmarks");
      if(!bookmarksPlugin) { //code to be removed when bookmarks plugin is released, only leave return
        //@ts-ignore
        const starredPlugin = app.internalPlugins.getPluginById("starred");
        if(!starredPlugin) {
          return;
        }
        self.starred = (await starredPlugin.loadData())
          .items
          .filter((i: any)=>i.type==="file")
          .map((i: any)=>i.path)
          .filter((p:string)=>(p!==self.settings.excalibrainFilepath) && self.pages.has(p))
          .map((p:string)=>self.pages.get(p));
        return;
      }
      if(!bookmarksPlugin._loaded) await bookmarksPlugin.loadData();
      const groupElements = (items: any[]):any[] => {
        if(!items) return;
        let elements = items
          .filter((i: any)=>i.type==="file")
          .map((i: any)=>i.path)
          .filter((p:string)=>(p!==self.settings.excalibrainFilepath) && self.pages.has(p))
          .map((p:string)=>self.pages.get(p));
        elements = elements.concat(items
          .filter((i: any)=>i.type==="folder")
          .map((i: any)=>i.path)
          .filter((p:string)=>(p!==self.settings.excalibrainFilepath) && self.pages.has(`folder:${p}`))
          .map((p:string)=>self.pages.get(`folder:${p}`)));
        items.filter((i: any)=>i.type==="group").forEach((g: any)=>
          elements = elements.concat(groupElements(g.items)));
        return elements;
      }
      self.starred = groupElements(bookmarksPlugin.instance.items);      
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
    if(!this.EA !== ea) {
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
    
    const addFieldToOntology = (checking: boolean, desc: string):boolean => {
      const activeView = app.workspace.activeLeaf?.view; 
      if(checking) {
        return (activeView instanceof MarkdownView) && activeView.getMode() === "source";
      }
      if(!(activeView instanceof MarkdownView) || activeView.getMode() !== "source") {
        return false;
      }
      const cursor = activeView.editor.getCursor();
      const line = activeView.editor.getLine(cursor.line);
      const field = line.match(/^([^\:]*)::/);
      if(!field) {
        return false;
      }

      (async() => {
        await this.loadSettings();

        if(this.settings.hierarchy.parents.includes(field[1])) {
          new Notice(`${field[1]} is already registered as a PARENT`);
          return;
        }
        if(this.settings.hierarchy.children.includes(field[1])) {
          new Notice(`${field[1]} is already registered as a CHILD`);
          return;
        }
        if(this.settings.hierarchy.leftFriends.includes(field[1])) {
          new Notice(`${field[1]} is already registered as a LEFT-SIDE FRIEND`);
          return;
        }
        if(this.settings.hierarchy.rightFriends.includes(field[1])) {
          new Notice(`${field[1]} is already registered as a RIGHT-SIDE FRIEND`);
          return;
        }
        if(this.settings.hierarchy.previous.includes(field[1])) {
          new Notice(`${field[1]} is already registered as a PREVIOUS (FRIEND)`);
          return;
        }
        if(this.settings.hierarchy.next.includes(field[1])) {
          new Notice(`${field[1]} is already registered as a NEXT (FRIEND)`);
          return;
        }
        
        switch (desc) {
          case "parent":
            this.settings.hierarchy.parents.push(field[1]);
            this.settings.hierarchy.parents = this.settings.hierarchy.parents.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.hierarchyLowerCase.parents = [];
            this.settings.hierarchy.parents.forEach(f=>this.hierarchyLowerCase.parents.push(f.toLowerCase().replaceAll(" ","-")))    
            break;
          case "child":
            this.settings.hierarchy.children.push(field[1]);
            this.settings.hierarchy.children = this.settings.hierarchy.children.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.hierarchyLowerCase.children = [];
            this.settings.hierarchy.children.forEach(f=>this.hierarchyLowerCase.children.push(f.toLowerCase().replaceAll(" ","-")))    
            break;
          case "rightFriend":
            this.settings.hierarchy.rightFriends.push(field[1]);
            this.settings.hierarchy.rightFriends = this.settings.hierarchy.rightFriends.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.hierarchyLowerCase.rightFriends = [];
            this.settings.hierarchy.rightFriends.forEach(f=>this.hierarchyLowerCase.rightFriends.push(f.toLowerCase().replaceAll(" ","-")))    
            break;
          case "previous":
            this.settings.hierarchy.previous.push(field[1]);
            this.settings.hierarchy.previous = this.settings.hierarchy.previous.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.hierarchyLowerCase.previous = [];
            this.settings.hierarchy.previous.forEach(f=>this.hierarchyLowerCase.previous.push(f.toLowerCase().replaceAll(" ","-")))    
            break;
          case "next":
            this.settings.hierarchy.next.push(field[1]);
            this.settings.hierarchy.next = this.settings.hierarchy.next.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.hierarchyLowerCase.next = [];
            this.settings.hierarchy.next.forEach(f=>this.hierarchyLowerCase.next.push(f.toLowerCase().replaceAll(" ","-")))    
            break;
          default:
            this.settings.hierarchy.leftFriends.push(field[1]);
            this.settings.hierarchy.leftFriends = this.settings.hierarchy.leftFriends.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
            this.hierarchyLowerCase.leftFriends = [];
            this.settings.hierarchy.leftFriends.forEach(f=>this.hierarchyLowerCase.leftFriends.push(f.toLowerCase().replaceAll(" ","-")))    
        }
        await this.saveSettings();
        if (this.scene && !this.scene.terminated) {
          this.scene.vaultFileChanged = true;
        }
        new Notice(`Added ${field[1]} as ${desc}`);
      })();
      
      return true;
    } 

    this.addCommand({
      id: "excalibrain-addParentField",
      name: t("COMMAND_ADD_PARENT_FIELD"),
      checkCallback: (checking: boolean) => addFieldToOntology(checking, "parent"),
    });

    this.addCommand({
      id: "excalibrain-addChildField",
      name: t("COMMAND_ADD_CHILD_FIELD"),
      checkCallback: (checking: boolean) => addFieldToOntology(checking, "child"),
    });

    this.addCommand({
      id: "excalibrain-addLeftFriendField",
      name: t("COMMAND_ADD_LEFT_FRIEND_FIELD"),
      checkCallback: (checking: boolean) => addFieldToOntology(checking, "leftFriend"),
    });

    this.addCommand({
      id: "excalibrain-addRightFriendField",
      name: t("COMMAND_ADD_RIGHT_FRIEND_FIELD"),
      checkCallback: (checking: boolean) => addFieldToOntology(checking, "rightFriend"),
    });

    this.addCommand({
      id: "excalibrain-addPreviousField",
      name: t("COMMAND_ADD_PREVIOUS_FIELD"),
      checkCallback: (checking: boolean) => addFieldToOntology(checking, "previous"),
    });

    this.addCommand({
      id: "excalibrain-addNextField",
      name: t("COMMAND_ADD_NEXT_FIELD"),
      checkCallback: (checking: boolean) => addFieldToOntology(checking, "next"),
    });

    this.addCommand({
      id: "excalibrain-start",
      name: t("COMMAND_START"),
      checkCallback: (checking:boolean) => {
        if(checking) {
          return this.excalidrawAvailable();
        }
        if(!this.excalidrawAvailable()) return; //still need this in case user sets a hotkey
        
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
        Scene.openExcalidrawLeaf(window.ExcalidrawAutomate,this.settings,leaf);
      },
    });
    
    this.addCommand({
      id: "excalibrain-start-popout",
      name: t("COMMAND_START_POPOUT"),
      checkCallback: (checking:boolean) => {
        if(checking) {
          return !this.EA.DEVICE.isMobile && this.excalidrawAvailable();
        }
        if(!this.excalidrawAvailable() || this.EA.DEVICE.isMobile) return; //still need this in case user sets a hotkey
        
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
        //@ts-ignore
        Scene.openExcalidrawLeaf(window.ExcalidrawAutomate,this.settings,app.workspace.openPopoutLeaf());
      },
    });

    this.addCommand({
      id: "excalibrain-open-hover",
      name: t("COMMAND_START_HOVER"),
      checkCallback: (checking: boolean) => {
        //@ts-ignore
        const hoverEditor = app.plugins.getPlugin("obsidian-hover-editor");
        if(checking) {
          return hoverEditor && this.excalidrawAvailable();
        }
        if(!this.excalidrawAvailable() || !hoverEditor) return;        

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
            setTimeout(()=>app.commands.executeCommandById("obsidian-hover-editor:snap-active-popover-to-viewport"));
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
        leaf.view instanceof TextFileView && 
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
      const ea = this.EA;
      
      //this should never happen, but if it does, I will let Excalidraw deal with the link
      if(!page || !this.scene) {
        return true;
      }

      //handle click on virtual page
      if (page.isVirtual) {
        if(!event.shiftKey) {
          this.scene?.renderGraphForPath(path);
        } else {
          //shift click will offer to create the page for the unresolved link
          (async()=>{
            const source = page.getParents()[0] ?? page.getLeftFriends()[0] ?? page.getRightFriends()[0] ?? page.getChildren()[0];
            const f = await ea.newFilePrompt(page.path, false, undefined, source?.page.file);
            page.file = f;
            if(isEmbedFileType(f,ea)) {
              this.scene.renderGraphForPath(path);
            } else {
              this.scene.renderGraphForPath(path,false);
              return true;
            }
          })();
        }
        return false;
      }

      //if centralPage is in embeddedFrame, simply render the scene
      if(this.settings.embedCentralNode) {
        this.scene.renderGraphForPath(path);
        return false;
      }

      const centralLeaf = this.scene.getCentralLeaf();
      //handle click on link to existing file
      if(!page.isFolder && !page.isTag) {
        //if the leaf attached to ExcaliBrain already has the new file open, render the associated graph
        if((centralLeaf?.view as TextFileView)?.file?.path === path) {
          this.scene.renderGraphForPath(path);
          return false;
        }

        if(this.scene.isCentralLeafStillThere()) {
          const f = app.vault.getAbstractFileByPath(path.split("#")[0]);
          if(f && f instanceof TFile) {
            centralLeaf.openFile(f);
            this.scene.renderGraphForPath(path);
            return false;
          }
        }
    
        //if the centralLeaf is no longer available, lets render the graph, but
        //let Excalidraw deal with opening a new leaf
        this.scene.renderGraphForPath(path,false);
        return true; //true if file should be opened because central node is not embedded;
      }

      //the page is a folder or a tag
      this.scene.renderGraphForPath(path);
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

  loadCustomNodeLabelFunction() {
    if(!this.settings.nodeTitleScript) {
      this.customNodeLabel = null;
      return;
    }
    try{
      //@ts-ignore
      this.customNodeLabel = new Function("dvPage","defaultName","return " + this.settings.nodeTitleScript);
    } catch(e) {
      errorlog({
        fn: this.loadCustomNodeLabelFunction,
        message: "error processing custom node label script",
        where: "loadCustomNodeLabelFunction()",
        data: this.settings.nodeTitleScript,
        error: e
      });
      new Notice("Could not load custom node label function. See Developer console for details");
      this.customNodeLabel = null;
    }
  }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if(!this.settings.hierarchy.exclusions) {
      this.settings.hierarchy.exclusions = DEFAULT_HIERARCHY_DEFINITION.exclusions;
    }

    this.loadCustomNodeLabelFunction();
    this.settings.baseLinkStyle = {
      ...DEFAULT_LINK_STYLE,
      ...this.settings.baseLinkStyle,
    };
    this.settings.baseNodeStyle = {
      ...DEFAULT_NODE_STYLE,
      ...this.settings.baseNodeStyle,
    };
    
    this.hierarchyLowerCase.parents = [];
    this.settings.hierarchy.parents = this.settings.hierarchy.parents.sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
    this.settings.hierarchy.parents.forEach(f=>this.hierarchyLowerCase.parents.push(f.toLowerCase().replaceAll(" ","-")));
    let masterHierarchyList:string[] = [...this.hierarchyLowerCase.parents];    

    this.hierarchyLowerCase.children = [];
    this.settings.hierarchy.children = this.settings.hierarchy.children
      .filter(x=>!masterHierarchyList.includes(x.toLowerCase().replaceAll(" ","-")))
      .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
    this.settings.hierarchy.children.forEach(f=>this.hierarchyLowerCase.children.push(f.toLowerCase().replaceAll(" ","-")));
    masterHierarchyList = [...masterHierarchyList,...this.hierarchyLowerCase.children];

    this.hierarchyLowerCase.leftFriends = [];
    if(!this.settings.hierarchy.leftFriends) {
      //@ts-ignore
      this.settings.hierarchy.leftFriends = this.settings.hierarchy.friends ?? DEFAULT_HIERARCHY_DEFINITION.leftFriends; //migrate legacy settings
    }
    this.settings.hierarchy.leftFriends = this.settings.hierarchy.leftFriends
      .filter(x=>!masterHierarchyList.includes(x.toLowerCase().replaceAll(" ","-")))
      .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
    this.settings.hierarchy.leftFriends.forEach(f=>this.hierarchyLowerCase.leftFriends.push(f.toLowerCase().replaceAll(" ","-")));
    masterHierarchyList = [...masterHierarchyList,...this.hierarchyLowerCase.leftFriends];

    this.hierarchyLowerCase.rightFriends = [];
    if(!this.settings.hierarchy.rightFriends) {
      this.settings.hierarchy.rightFriends = DEFAULT_HIERARCHY_DEFINITION.rightFriends;
    }
    this.settings.hierarchy.rightFriends = this.settings.hierarchy.rightFriends
      .filter(x=>!masterHierarchyList.includes(x.toLowerCase().replaceAll(" ","-")))
      .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
    this.settings.hierarchy.rightFriends.forEach(f=>this.hierarchyLowerCase.rightFriends.push(f.toLowerCase().replaceAll(" ","-")));
    masterHierarchyList = [...masterHierarchyList,...this.hierarchyLowerCase.rightFriends];

    this.hierarchyLowerCase.previous = [];
    if(!this.settings.hierarchy.previous) {
      this.settings.hierarchy.previous = DEFAULT_HIERARCHY_DEFINITION.previous;
    }
    this.settings.hierarchy.previous = this.settings.hierarchy.previous
      .filter(x=>!masterHierarchyList.includes(x.toLowerCase().replaceAll(" ","-")))
      .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
    this.settings.hierarchy.previous.forEach(f=>this.hierarchyLowerCase.previous.push(f.toLowerCase().replaceAll(" ","-")));
    masterHierarchyList = [...masterHierarchyList,...this.hierarchyLowerCase.previous];

    this.hierarchyLowerCase.next = [];
    if(!this.settings.hierarchy.next) {
      this.settings.hierarchy.next = DEFAULT_HIERARCHY_DEFINITION.next;
    }
    this.settings.hierarchy.next = this.settings.hierarchy.next
      .filter(x=>!masterHierarchyList.includes(x.toLowerCase().replaceAll(" ","-")))
      .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);
    this.settings.hierarchy.next.forEach(f=>this.hierarchyLowerCase.next.push(f.toLowerCase().replaceAll(" ","-")));
    masterHierarchyList = [...masterHierarchyList,...this.hierarchyLowerCase.next];

    this.settings.hierarchy.exclusions = this.settings.hierarchy.exclusions
      .filter(x=>!masterHierarchyList.includes(x.toLowerCase().replaceAll(" ","-")))  
      .sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:1);

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
    Object.entries(this.settings.tagNodeStyles)
      .sort((a,b)=>a[0].toLowerCase()<b[0].toLowerCase()?-1:1)
      .forEach(item=>{
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
    if(!(leaf.view instanceof TextFileView)) {
      new Notice("Wrong view type. Cannot start ExcaliBrain.");
      return;
    }
    if(leaf.view.file.path !== this.settings.excalibrainFilepath) {
      new Notice(`The brain file is not the one configured in settings!\nThe file in settings is ${this.settings.excalibrainFilepath}.\nThis file is ${leaf.view.file.path}.\nPlease start ExcaliBrain using the Command Palette action.`,5000);
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
}

