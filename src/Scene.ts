import { App, FileView, Notice, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { EMPTYBRAIN } from "./constants/emptyBrainFile";
import { Layout } from "./graph/Layout";
import { Links } from "./graph/Links";
import { Node } from "./graph/Node";
import ExcaliBrain from "./main";
import { ExcaliBrainSettings } from "./Settings";
import { ToolsPanel } from "./Components/ToolsPanel";
import { Neighbour, RelationType, Role } from "./Types";
import { HistoryPanel } from "./Components/HistoryPanel";
import { WarningPrompt } from "./utils/Prompts";
import { log } from "./utils/utils";

export class Scene {
  ea: ExcalidrawAutomate;
  plugin: ExcaliBrain;
  app: App;
  leaf: WorkspaceLeaf;
  centralPagePath: string;
  centralLeaf: WorkspaceLeaf;
  textSize: {width:number, height:number};
  nodeWidth: number;
  nodeHeight: number;
  public disregardLeafChange: boolean = false;
  public terminated: boolean;
  private nodesMap: Map<string,Node> = new Map<string,Node>();
  private links: Links;
  private layouts: Layout[] = [];
  private removeEH: Function;
  private removeTimer: Function;
  private removeOnCreate: Function;
  private removeOnModify: Function;
  private removeOnDelete: Function;
  private removeOnRename: Function;
  private blockUpdateTimer: boolean = false;
  private toolsPanel: ToolsPanel;
  private historyPanel: HistoryPanel;
  private vaultFileChanged: boolean = false;
  public pinLeaf: boolean = false;
  
  constructor(plugin: ExcaliBrain, newLeaf: boolean, leaf?: WorkspaceLeaf) {
    this.ea = plugin.EA;
    this.plugin = plugin;
    this.app = plugin.app;
    this.leaf = leaf ?? app.workspace.getLeaf(newLeaf);
    this.terminated = false;
    this.links = new Links(plugin);
  }

  public async initialize() {
    await this.plugin.loadSettings();
    await this.initializeScene();
    this.toolsPanel = new ToolsPanel((this.leaf.view as TextFileView).contentEl,this.plugin);
    this.historyPanel = new HistoryPanel((this.leaf.view as TextFileView).contentEl,this.plugin);
  }

  /**
   * Check if ExcaliBrain is currently active
   * @returns boolean; true if active
   */
  public isActive() {
    //@ts-ignore
    return !this.terminated && app.workspace.getLeafById(this.leaf?.id)
  }

  /**
   * Updates the current Scene applying changes in the Index
   * @returns 
   */
  public async reRender() {
    if(!this.isActive()) {
      return;
    }
    if(!this.centralLeaf || !this.centralPagePath) {
      return;
    }
    await this.plugin.createIndex(); //temporary
    await this.render();
    this.toolsPanel.rerender();
  }

  /**
   * Renders the ExcaliBrain graph for the file provided by its path
   * @param path 
   * @returns 
   */
  public async renderGraphForPath(path: string) {
    if(!this.isActive()) {
      return;
    }

    this.blockUpdateTimer = true; //blocks the updateTimer

    const page = this.plugin.pages.get(path);
    if(!page) {
      this.blockUpdateTimer = false;
      return;
    }

    const isFile = !(page.isFolder || page.isTag);

    if(isFile && !page.file) {
      this.blockUpdateTimer = false;
      return;
    }

    if(!this.ea.targetView?.file || this.ea.targetView.file.path !== this.plugin.settings.excalibrainFilepath) {
      this.unloadScene();
      return;
    }
    
    if (isFile && (page.file.path === this.ea.targetView.file.path)) { //brainview drawing is the active leaf
      this.blockUpdateTimer = false;
      return; 
    }
  
    const centralPage = this.plugin.pages.get(this.centralPagePath)

    if(
      centralPage &&
      centralPage.path === path &&
      isFile &&
      page.file.stat.mtime === centralPage.mtime
    ) {
      log("!!!")
      this.blockUpdateTimer = false;
      return; //don't reload the file if it has not changed
    }

    if(isFile) {
      //@ts-ignore
      if(!this.centralLeaf || !app.workspace.getLeafById(this.centralLeaf.id)) {
        this.centralLeaf = this.ea.openFileInNewOrAdjacentLeaf(page.file);
      } else {
        this.centralLeaf.openFile(page.file);
      }
      this.addToHistory(page.file.path);
    } else {
      this.addToHistory(page.path);
    }

    if(page.isFolder && !this.plugin.settings.showFolderNodes) {
      this.plugin.settings.showFolderNodes = true;
      this.toolsPanel.rerender();
    }

    if(page.isTag && !this.plugin.settings.showTagNodes) {
      this.plugin.settings.showTagNodes = true;
      this.toolsPanel.rerender();
    }

    this.centralPagePath = path;
    //await this.plugin.createIndex();
    await this.render();
  }

  async addToHistory(path: string) {
    const nh = this.plugin.settings.navigationHistory;
    if(nh.last() === path) {
      return;
    }
    const i = nh.indexOf(path);
    if(i>-1) {
      nh.splice(i,1);
    }
    if(nh.length>50) {
      nh.shift();
    }
    nh.push(path);
  }

  public static async openExcalidrawLeaf(ea: ExcalidrawAutomate, settings: ExcaliBrainSettings, leaf: WorkspaceLeaf) {
    let counter = 0;

    let file = app.vault.getAbstractFileByPath(settings.excalibrainFilepath);
    if(file && !(file instanceof TFile)) {
      new Notice(`Please check settings. ExcaliBrain path (${settings.excalibrainFilepath}) points to a folder, not a file`);
      return;
    }
    if(!file) {
      file = await app.vault.create(settings.excalibrainFilepath,EMPTYBRAIN);
      //an ugly temporary hack waiting for metadataCache to index the new file
      while(file instanceof TFile && !ea.isExcalidrawFile(file) && counter++<10) {
        await sleep(50);
      }
    }
    counter = 0;
    if(file && file instanceof TFile && !ea.isExcalidrawFile(file)) {
      (new WarningPrompt(
        app,
        "⚠ File Exists",
        `${file.path} already exists in your Vault. Is it ok to overwrite this file? If not, change ExcaliBrain file path in plugin settings.`)
      ).show(async (result: boolean) => {
        if(result) {
          await app.vault.modify(file as TFile,EMPTYBRAIN);
          while(file instanceof TFile && !ea.isExcalidrawFile(file) && counter++<10) {
            await sleep(50);
          }
          Scene.openExcalidrawLeaf(ea, settings, leaf);
        } else {
          new Notice(`Could not start ExcaliBrain. Please change the ExcaliBrain file path in plugin settings.`);
        }
      });
      return;
    }
    await (leaf ?? app.workspace.getLeaf(true)).openFile(file as TFile);   
  }

  public async initializeScene() {
    this.disregardLeafChange = false;
    const ea = this.ea;
    const style = this.plugin.settings.baseNodeStyle;
    let counter = 0;
    ea.clear();
    
    ea.setView(this.leaf.view as any)   
    counter = 0;
    while(!ea.targetView.excalidrawAPI && counter++<10) {
      await sleep(50);
    }
    if(!ea.targetView.excalidrawAPI) {
      new Notice(`Error initializing Excalidraw view`);
      return;
    }
    this.ea.registerThisAsViewEA();
    this.ea.targetView.semaphores.saving = true; //disable saving by setting this Excalidraw flag (not published API)
    this.ea.targetView.excalidrawAPI.setMobileModeAllowed(false); //disable mobile view https://github.com/zsviczian/excalibrain/issues/9
    ea.style.fontFamily = style.fontFamily;
    ea.style.fontSize = style.fontSize;
    this.textSize = ea.measureText("m".repeat(style.maxLabelLength+3));
    this.nodeWidth = this.textSize.width + 3 * style.padding;
    this.nodeHeight = 2 * (this.textSize.height + 2 * style.padding);
    
    ea.getExcalidrawAPI().updateScene({
      appState: {
        viewModeEnabled:true,
        activeTool: {
          lastActiveToolBeforeEraser: null,
          locked: false,
          type: "selection"
        },
        theme: "light",
      viewBackgroundColor: this.plugin.settings.backgroundColor
      },
      elements:[]
    });
    
    ea.style.strokeColor = style.textColor;
    ea.addText(0,0,"🚀 To get started\nselect a document using the search in the top left or\n" +
      "open a document in another pane.\n\n" +
      "✨ For the best experience enable 'Open in adjacent pane'\nin Excalidraw settings " +
      "under 'Links and Transclusion'.\n\n⚠ ExcaliBrain may need to wait for " +
      "DataView to initialize its index.\nThis can take up to a few minutes after starting Obsidian.", {textAlign:"center"});
    await ea.addElementsToView();
    ea.getExcalidrawAPI().zoomToFit(null, 5, 0.05);
    
    ea.targetView.linksAlwaysOpenInANewPane = true;
    
    this.addEventHandler();
    new Notice("ExcaliBrain On");
  }

  addNodes(x:{
    neighbours:Neighbour[],
    layout:Layout,
    isCentral:boolean,
    isSibling:boolean,
    friendGateOnLeft: boolean
  }) {
    x.neighbours.forEach(n => {
      if(n.page.path === this.ea.targetView.file.path) {
        return; 
      }
      const node = new Node({
        page: n.page,
        isInferred: n.relationType === RelationType.INFERRED,
        isCentral: x.isCentral,
        isSibling: x.isSibling,
        friendGateOnLeft: x.friendGateOnLeft
      });
      this.nodesMap.set(n.page.path,node);
      x.layout.nodes.push(node);
    });
  }

  private async render() {
    if(this.historyPanel) {
      this.historyPanel.rerender()
    }
    this.ea.clear();
    this.ea.getExcalidrawAPI().updateScene({elements:[]});
    this.ea.style.verticalAlign = "middle";
    const centralPage = this.plugin.pages.get(this.centralPagePath);
    const parents = centralPage.getParents()
      .filter(x=>(x.page.path !== centralPage.path) && !this.plugin.settings.excludeFilepaths.some(p => x.page.path.startsWith(p)))
      .slice(0,this.plugin.settings.maxItemCount);
    const children =centralPage.getChildren()
      .filter(x=>(x.page.path !== centralPage.path) && !this.plugin.settings.excludeFilepaths.some(p => x.page.path.startsWith(p)))
      .slice(0,this.plugin.settings.maxItemCount);
    const friends = centralPage.getFriends()
      .filter(x=>(x.page.path !== centralPage.path) && !this.plugin.settings.excludeFilepaths.some(p => x.page.path.startsWith(p)))
      .slice(0,this.plugin.settings.maxItemCount);
    const siblings = centralPage.getSiblings()
      .filter(s => !(parents.some(p=>p.page.path === s.page.path) ||
        children.some(c=>c.page.path === s.page.path) ||
        friends.some(f=>f.page.path === s.page.path) ||
        this.plugin.settings.excludeFilepaths.some(p => s.page.path.startsWith(p))) && 
        (s.page.path !== centralPage.path))
      .slice(0,this.plugin.settings.maxItemCount);

    //-------------------------------------------------------
    // Generate layout and nodes
    this.nodesMap = new Map<string,Node>();
    this.links = new Links(this.plugin);
    this.layouts = [];
    const manyChildren = children.length >10;
    const manySiblings = siblings.length > 10;
    const singleParent = parents.length <= 1
    const baseStyle = this.plugin.settings.baseNodeStyle;

    const lCenter = new Layout({
      origoX: 0,
      origoY: 0,
      top: null,
      bottom: null,
      columns: 1,
      columnWidth: this.nodeWidth,
      rowHeight: this.nodeHeight
    });
    this.layouts.push(lCenter);
    
    const lChildren = new Layout({
      origoX: 0,
      origoY: 2.5 * this.nodeHeight,
      top: 2 * this.nodeHeight,
      bottom: null,
      columns: manyChildren ? 5 : 3,
      columnWidth: this.nodeWidth,
      rowHeight: this.nodeHeight
    });
    this.layouts.push(lChildren);
  
    const lFriends = new Layout({
      origoX: (manyChildren ? -3 : -2)  * this.nodeWidth,
      origoY: 0,
      top: null,
      bottom: null,
      columns: 1,
      columnWidth: this.nodeWidth,
      rowHeight: this.nodeHeight
    });
    this.layouts.push(lFriends);

    const lParents = new Layout({
      origoX: 0,
      origoY: -2.5 * this.nodeHeight,
      top: null,
      bottom: -2 * this.nodeHeight,
      columns: 3,
      columnWidth: this.nodeWidth,
      rowHeight: this.nodeHeight
    });
    this.layouts.push(lParents);
    
    const siblingsStyle = this.plugin.settings.siblingNodeStyle;
    const siblingsPadding = siblingsStyle.padding??baseStyle.padding;
    const siblingsLabelLength = siblingsStyle.maxLabelLength??baseStyle.maxLabelLength;
    this.ea.style.fontFamily = siblingsStyle.fontFamily;
    this.ea.style.fontSize = siblingsStyle.fontSize;
    const siblingsTextSize = this.ea.measureText("m".repeat(siblingsLabelLength+3));
    const siblingsNodeWidth = siblingsTextSize.width + 3 * siblingsPadding;
    const siblingsNodeHeight = 2 * (siblingsTextSize.height + 2 * siblingsPadding);

    const lSiblings = new Layout({
      origoX: this.nodeWidth * 1.3 * ((singleParent ? 0 : 1) + (manySiblings ? 2 : 1)),
      origoY: -2.5 * this.nodeHeight,
      top: null,
      bottom: 0, //this.nodeHeight,
      columns: (manySiblings ? 3 : 1),
      columnWidth: siblingsNodeWidth, //this.nodeWidth,
      rowHeight: siblingsNodeHeight, //this.nodeHeight
    })
    this.layouts.push(lSiblings);

    const rootNode = new Node({
      page: centralPage,
      isInferred: false,
      isCentral: true,
      isSibling: false,
      friendGateOnLeft: true
    });

    this.nodesMap.set(centralPage.path,rootNode);
    lCenter.nodes.push(rootNode);
  
    this.addNodes({
      neighbours: parents,
      layout: lParents,
      isCentral: false,
      isSibling: false,
      friendGateOnLeft: true
    });
  
    this.addNodes({
      neighbours: children,
      layout: lChildren,
      isCentral: false,
      isSibling: false,
      friendGateOnLeft: true
    });
  
    this.addNodes({
      neighbours: friends,
      layout: lFriends,
      isCentral: false,
      isSibling: false,
      friendGateOnLeft: false
    });

    if(this.plugin.settings.renderSiblings) {
      this.addNodes({
        neighbours: siblings,
        layout: lSiblings,
        isCentral: false,
        isSibling: true,
        friendGateOnLeft: true
      });
    }

    //-------------------------------------------------------
    // Generate links for all displayed nodes
    const addLinks = (nodeA: Node, neighbours:Neighbour[],role: Role) => {
      neighbours.forEach(neighbour=>{
        const nodeB = this.nodesMap.get(neighbour.page.path);
        if(!nodeB) {
          return;
        }
        this.links.addLink(
          nodeA,
          nodeB,
          role,
          neighbour.relationType,
          neighbour.typeDefinition,
          neighbour.linkDirection,
          this.ea,
          this.plugin.settings
        )
      })
    }

    Array.from(this.nodesMap.values()).forEach(nodeA => {
      addLinks(nodeA, nodeA.page.getChildren(),Role.CHILD);
      addLinks(nodeA, nodeA.page.getParents(),Role.PARENT);
      addLinks(nodeA, nodeA.page.getFriends(),Role.FRIEND);
    });
  
    //-------------------------------------------------------
    // Render
    this.layouts.forEach(layout => layout.render());
    this.links.render();    
   
    const elements = this.ea.getElements();
    this.ea.getExcalidrawAPI().updateScene({
      elements: elements.filter(
        el=>el.type==="arrow"
      ).concat(elements.filter(el=>el.type!=="arrow"))
    })
    this.ea.getExcalidrawAPI().zoomToFit(null,5,0.05);
    this.blockUpdateTimer = false;
  }

  public isCentralLeafStillThere():boolean {
    //@ts-ignore
    return app.workspace.getLeafById(this.centralLeaf.id) !== null;
  }

  private async addEventHandler() {
    const self = this;
    
    const brainEventHandler = async (leaf:WorkspaceLeaf) => {
      if(this.disregardLeafChange) {
        return;
      }
      self.blockUpdateTimer = true;
      //await self.plugin.createIndex();
      await new Promise((resolve) => setTimeout(resolve, 100));
      //-------------------------------------------------------
      //terminate event handler if view no longer exists or file has changed

      if(this.pinLeaf && !this.isCentralLeafStillThere()) {
        this.pinLeaf = false;
        this.toolsPanel.rerender();
      }

      if(this.pinLeaf && leaf !== this.centralLeaf) return;

      if(!self.ea.targetView?.file || self.ea.targetView.file.path !== self.plugin.settings.excalibrainFilepath) {
        self.unloadScene();
        return;
      }
      
      if(!(leaf?.view && (leaf.view instanceof FileView) && leaf.view.file)) {
        self.blockUpdateTimer = false;
        return;
      }
  
      const rootFile = leaf.view.file;
      
      if (rootFile.path === self.ea.targetView.file.path) { //brainview drawing is the active leaf
        self.blockUpdateTimer = false;
        return; 
      }
    
      const centralPage = self.plugin.pages.get(self.centralPagePath);
      if(
        centralPage &&
        centralPage.path === rootFile.path &&
        rootFile.stat.mtime === centralPage.mtime
      ) {
        self.blockUpdateTimer = false;
        return; //don't reload the file if it has not changed
      }

      if(!self.plugin.pages.get(rootFile.path)) {
        await self.plugin.createIndex();
      }
  
      this.addToHistory(rootFile.path);
      self.centralPagePath = rootFile.path;
      self.centralLeaf = leaf;

      self.render();
    }

    const updateTimer = async () => {
      if(this.blockUpdateTimer) {
        return;
      }
      if(this.vaultFileChanged) {
        this.vaultFileChanged = false;
        await this.plugin.createIndex();
        this.render();
      }
/*      for(const node of this.nodesMap.values()) {
        const { file, mtime } = node.page;
        if(file && file.stat.mtime !== mtime) {
          await this.plugin.createIndex();
          this.centralPagePath = file.path;
          this.render();
          return;
        }
      }*/
    }

    const fileChangeHandler = () => {
      this.vaultFileChanged = true;
    }

    app.workspace.on("active-leaf-change", brainEventHandler);
    this.removeEH = () => app.workspace.off("active-leaf-change",brainEventHandler);
    const timer = setInterval(updateTimer,5000);
    this.removeTimer = () => clearInterval(timer);
    app.vault.on("rename",fileChangeHandler);
    this.removeOnRename = () => app.vault.off("rename",fileChangeHandler)
    app.vault.on("modify",fileChangeHandler);
    this.removeOnModify = () => app.vault.off("modify",fileChangeHandler)
    app.vault.on("create",fileChangeHandler);
    this.removeOnCreate = () => app.vault.off("create",fileChangeHandler)
    app.vault.on("delete",fileChangeHandler);
    this.removeOnDelete = () => app.vault.off("delete",fileChangeHandler)

    const leaves: WorkspaceLeaf[] = [];
    app.workspace.iterateAllLeaves(l=>{
      if( (l.view instanceof FileView) && l.view.file && l.view.file.path !== this.ea.targetView.file.path) {
        leaves.push(l);
      }
    })
    
    await this.plugin.createIndex(); //temporary
    
    if(leaves.length>0) {
      brainEventHandler(leaves[0]);
    }
  }

  public unloadScene() {
    if(this.removeEH) {
      this.removeEH();
      this.removeEH = undefined;
    }

    if(this.removeTimer) {
      this.removeTimer();
      this.removeTimer = undefined;
    }

    if(this.removeOnRename) {
      this.removeOnRename();
      this.removeOnRename = undefined;
    }
    
    if(this.removeOnModify) {
      this.removeOnModify();
      this.removeOnModify = undefined;
    }

    if(this.removeOnCreate) {
      this.removeOnCreate();
      this.removeOnCreate = undefined;
    }
    
    if(this.removeOnDelete) {
      this.removeOnDelete();
      this.removeOnDelete = undefined;
    }

    if(this.ea.targetView && isBoolean(this.ea.targetView.linksAlwaysOpenInANewPane)) {
      this.ea.targetView.linksAlwaysOpenInANewPane = false;
    }
    
    if(this.ea.targetView && this.ea.targetView.excalidrawAPI) {
      try {
        this.ea.targetView.semaphores.saving = false;
        this.ea.targetView.excalidrawAPI.setMobileModeAllowed(true);
        this.ea.targetView.excalidrawAPI.updateScene({appState:{viewModeEnabled:false}});
      } catch {}
    }
    //@ts-ignore
    if(this.ea.targetView && this.ea.targetView._loaded) {
      try {
        this.ea.deregisterThisAsViewEA();
      } catch {}
    }
    (async()=>{
      const tmpNavigationHistory = this.plugin.settings.navigationHistory.slice(); //copy by value
      await this.plugin.loadSettings(); //only overwrite the navigation history, save other synchronized settings
      this.plugin.settings.navigationHistory = tmpNavigationHistory;
      await this.plugin.saveSettings();
    })();
    this.toolsPanel?.terminate();
    this.toolsPanel = undefined;
    this.historyPanel?.terminate();
    this.historyPanel = undefined;
    this.ea.targetView = undefined;
    this.leaf = undefined;
    this.centralLeaf = undefined;
    this.centralPagePath = undefined;
    this.terminated = true;
    new Notice("Brain Graph Off");
  }
}