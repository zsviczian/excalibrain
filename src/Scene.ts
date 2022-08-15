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
import { debug } from "./utils/utils";

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
  public nodesMap: Map<string,Node> = new Map<string,Node>();
  public links: Links;
  private layouts: Layout[] = [];
  private removeEH: Function;
  private removeTimer: Function;
  private removeOnCreate: Function;
  private removeOnModify: Function;
  private removeOnDelete: Function;
  private removeOnRename: Function;
  private blockUpdateTimer: boolean = false;
  public toolsPanel: ToolsPanel;
  private historyPanel: HistoryPanel;
  public vaultFileChanged: boolean = false;
  public pinLeaf: boolean = false;
  public focusSearchAfterInitiation: boolean = true;
  private zoomToFitOnNextBrainLeafActivate: boolean = false; //this addresses the issue caused in Obsidian 0.16.0 when the brain graph is rendered while the leaf is hidden because tab is not active

  constructor(plugin: ExcaliBrain, newLeaf: boolean, leaf?: WorkspaceLeaf) {
    this.ea = plugin.EA;
    this.plugin = plugin;
    this.app = plugin.app;
    this.leaf = leaf ?? app.workspace.getLeaf(newLeaf);
    this.terminated = false;
    this.links = new Links(plugin);
  }

  public async initialize(focusSearchAfterInitiation: boolean) {
    this.focusSearchAfterInitiation = focusSearchAfterInitiation;
    await this.plugin.loadSettings();
    this.toolsPanel = new ToolsPanel((this.leaf.view as TextFileView).contentEl,this.plugin);
    this.initializeScene();
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
  public async reRender(updateIndex:boolean = true) {
    if(!this.isActive()) {
      return;
    }
    if(!this.centralLeaf || !this.centralPagePath) {
      return;
    }
    if(updateIndex) {
      this.vaultFileChanged = false;
      await this.plugin.createIndex(); //temporary
    }
    await this.render();
    //this.toolsPanel.rerender(); //this is also there at the end of render. Seems duplicate.
  }

  /**
   * Renders the ExcaliBrain graph for the file provided by its path
   * @param path 
   * @returns 
   */
  public async renderGraphForPath(path: string, openFile:boolean = true) {
    if(!this.isActive()) {
      return;
    }

    this.blockUpdateTimer = true; //blocks the updateTimer

    const page = this.plugin.pages.get(path);
    if(!page) {
      this.blockUpdateTimer = false;
      return;
    }

    const isFile = !(page.isFolder || page.isTag || page.isVirtual);

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
      //log("!!!")
      this.blockUpdateTimer = false;
      return; //don't reload the file if it has not changed
    }

    if(isFile && openFile) {
      //@ts-ignore
      if(!this.centralLeaf || !app.workspace.getLeafById(this.centralLeaf.id)) {
        this.centralLeaf = this.ea.openFileInNewOrAdjacentLeaf(page.file);
      } else {
        this.centralLeaf.openFile(page.file, {active: false});
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

    while(!ea.targetView.excalidrawAPI && counter++<10) {
      await sleep(50);
    }
    if(!ea.targetView.excalidrawAPI) {
      new Notice(`Error initializing Excalidraw view`);
      return;
    }

    const api = ea.getExcalidrawAPI();
    this.ea.registerThisAsViewEA();
    this.ea.targetView.semaphores.saving = true; //disable saving by setting this Excalidraw flag (not published API)
    api.setMobileModeAllowed(false); //disable mobile view https://github.com/zsviczian/excalibrain/issues/9
    ea.style.fontFamily = style.fontFamily;
    ea.style.fontSize = style.fontSize;
    this.textSize = ea.measureText("m".repeat(style.maxLabelLength+3));
    this.nodeWidth = this.textSize.width + 3 * style.padding;
    this.nodeHeight = 2 * (this.textSize.height + 2 * style.padding);

    const frame1 = () => {
      api.updateScene({
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
        elements: []
      });
    }
    const frame2 = () => {
      ea.style.strokeColor = style.textColor;
      ea.addText(0,0,"🚀 To get started\nselect a document using the search in the top left or\n" +
        "open a document in another pane.\n\n" +
        "✨ For the best experience enable 'Open in adjacent pane'\nin Excalidraw settings " +
        "under 'Links and Transclusion'.\n\n⚠ ExcaliBrain may need to wait for " +
        "DataView to initialize its index.\nThis can take up to a few minutes after starting Obsidian.", {textAlign:"center"});
      ea.addElementsToView();
    }
    const frame3 = () => {
      api.zoomToFit(null, 5, 0.15);
      ea.targetView.linksAlwaysOpenInANewPane = true;
      this.addEventHandler();
      this.historyPanel = new HistoryPanel((this.leaf.view as TextFileView).contentEl,this.plugin);
      new Notice("ExcaliBrain On");
    }

    ea.targetView.ownerWindow.requestAnimationFrame(()=>{
      frame1();
      ea.targetView.ownerWindow.requestAnimationFrame(()=>{
        frame2();
        ea.targetView.ownerWindow.requestAnimationFrame(()=>{
          frame3();
        });
      });
    });
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
        ea: this.ea,
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
    if(!this.centralPagePath) return;
    let centralPage = this.plugin.pages.get(this.centralPagePath);
    if(!centralPage) {
      //path case sensitivity issue
      this.centralPagePath = this.plugin.lowercasePathMap.get(this.centralPagePath.toLowerCase());
      centralPage = this.plugin.pages.get(this.centralPagePath);
      if(!centralPage) return;
    }

    const ea = this.ea;

    this.zoomToFitOnNextBrainLeafActivate = !ea.targetView.containerEl.isShown();

    ea.clear();
    ea.getExcalidrawAPI().updateScene({elements:[]});
    ea.style.verticalAlign = "middle";
    
    //List nodes for the graph
    const parents = centralPage.getParents()
      .filter(x => 
        (x.page.path !== centralPage.path) &&
        !this.plugin.settings.excludeFilepaths.some(p => x.page.path.startsWith(p)) &&
        (!x.page.primaryStyleTag || !this.toolsPanel.linkTagFilter.selectedTags.has(x.page.primaryStyleTag)))
      .slice(0,this.plugin.settings.maxItemCount);
    const parentPaths = parents.map(x=>x.page.path);

    const children =centralPage.getChildren()
      .filter(x => 
        (x.page.path !== centralPage.path) &&
        !this.plugin.settings.excludeFilepaths.some(p => x.page.path.startsWith(p)) &&
        (!x.page.primaryStyleTag || !this.toolsPanel.linkTagFilter.selectedTags.has(x.page.primaryStyleTag)))
      .slice(0,this.plugin.settings.maxItemCount);
    
    const friends = centralPage.getFriends()
      .filter(x => 
        (x.page.path !== centralPage.path) &&
        !this.plugin.settings.excludeFilepaths.some(p => x.page.path.startsWith(p)) &&
        (!x.page.primaryStyleTag || !this.toolsPanel.linkTagFilter.selectedTags.has(x.page.primaryStyleTag)))
      .slice(0,this.plugin.settings.maxItemCount);

    const rawSiblings = centralPage
      .getSiblings()
      .filter(s => 
        //the node is not included already as a parent, child, or friend
        !(parents.some(p=>p.page.path === s.page.path)  ||
          children.some(c=>c.page.path === s.page.path) ||
          friends.some(f=>f.page.path === s.page.path)  ||
          //or not exluded via folder path in settings
          this.plugin.settings.excludeFilepaths.some(p => s.page.path.startsWith(p))
        ) && 
        //it is not the current central page
        (s.page.path !== centralPage.path));

    const siblings = rawSiblings
      .filter(s => 
        //Only display siblings for which the parents are actually displayed.
        //There might be siblings whose parnets have been filtered from view
        s.page.getParents().map(x=>x.page.path).some(y=>parentPaths.includes(y)) &&
        //filter based on primary tag
        (!s.page.primaryStyleTag || !this.toolsPanel.linkTagFilter.selectedTags.has(s.page.primaryStyleTag)))
      .slice(0,this.plugin.settings.maxItemCount);

    //-------------------------------------------------------
    // Generate layout and nodes
    this.nodesMap = new Map<string,Node>();
    this.links = new Links(this.plugin);
    this.layouts = [];
    const manyFriends = friends.length >= 10;
    const baseStyle = this.plugin.settings.baseNodeStyle;
    const siblingsCols = siblings.length >= 20
      ? 3
      : siblings.length >= 10
        ? 2
        : 1;
    const childrenCols = children.length <= 12 
      ? [1, 1, 2, 3, 3, 3, 3, 4, 4, 5, 5, 4, 4][children.length]
      : 5;
    const parentCols = parents.length < 5
      ? [1, 1, 2, 3, 2][parents.length]
      : 3;



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
      columns: childrenCols,
      columnWidth: this.nodeWidth,
      rowHeight: this.nodeHeight
    });
    this.layouts.push(lChildren);
  
    const lFriends = new Layout({
      origoX: -(((manyFriends?1:0)+Math.max(childrenCols,parentCols)+1.9)/2.4) * this.nodeWidth, // (manyChildren ? -3 : -2)  * this.nodeWidth,
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
      columns: parentCols, // 3,
      columnWidth: this.nodeWidth,
      rowHeight: this.nodeHeight
    });
    this.layouts.push(lParents);
    
    const siblingsStyle = this.plugin.settings.siblingNodeStyle;
    const siblingsPadding = siblingsStyle.padding??baseStyle.padding;
    const siblingsLabelLength = siblingsStyle.maxLabelLength??baseStyle.maxLabelLength;
    ea.style.fontFamily = siblingsStyle.fontFamily;
    ea.style.fontSize = siblingsStyle.fontSize;
    const siblingsTextSize = ea.measureText("m".repeat(siblingsLabelLength+3));
    const siblingsNodeWidth = siblingsTextSize.width + 3 * siblingsPadding;
    const siblingsNodeHeight = 2 * (siblingsTextSize.height + 2 * siblingsPadding);

    const lSiblings = new Layout({
      origoX: this.nodeWidth * ((parentCols-1)/2 + (siblingsCols+1.5)/3),
      origoY: -2.5 * this.nodeHeight,
      top: null,
      bottom: - this.nodeHeight/2, 
      columns: siblingsCols, 
      columnWidth: siblingsNodeWidth,
      rowHeight: siblingsNodeHeight,
    })
    this.layouts.push(lSiblings);

    const rootNode = new Node({
      ea,
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
          ea,
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
    ea.style.opacity = 100;
    this.layouts.forEach(layout => layout.render());
    const nodeElements = ea.getElements();
    this.links.render(Array.from(this.toolsPanel.linkTagFilter.selectedLinks));
    
    const linkElements = ea.getElements().filter(el=>!nodeElements.includes(el));

    ea.getExcalidrawAPI().updateScene({
      elements: linkElements.concat(nodeElements) //send link elements behind node elements
    })

    ea.targetView.ownerWindow.requestAnimationFrame(()=>{
      ea.getExcalidrawAPI().updateScene({appState: {viewBackgroundColor: this.plugin.settings.backgroundColor}});
      ea.targetView.ownerWindow.requestAnimationFrame(()=>{
        ea.getExcalidrawAPI().zoomToFit(null,5,0.15);
      });
    });
  
    this.toolsPanel.rerender();
    if(this.focusSearchAfterInitiation) {
      this.toolsPanel.searchElement.focus();
      this.focusSearchAfterInitiation = false;
    }

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
      await sleep(100);

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
        if(this.vaultFileChanged) {
          this.zoomToFitOnNextBrainLeafActivate = false;
          await this.reRender(true);
        }
        if(this.zoomToFitOnNextBrainLeafActivate) {
          this.zoomToFitOnNextBrainLeafActivate = false;
          self.ea.getExcalidrawAPI().zoomToFit(null, 5, 0.15);
        }
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

    const fileChangeHandler = () => {
      this.vaultFileChanged = true;
    }

    app.workspace.on("active-leaf-change", brainEventHandler);
    this.removeEH = () => app.workspace.off("active-leaf-change",brainEventHandler);
    this.setTimer();
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

  setTimer() {
    const updateTimer = async () => {
      if(this.blockUpdateTimer) {
        return;
      }
      if(this.vaultFileChanged) {
        this.vaultFileChanged = false;
        await this.plugin.createIndex();
        if(this.centralPagePath) {
          if(!this.plugin.pages.get(this.centralPagePath)) {
            //@ts-ignore
            if(this.centralLeaf && this.centralLeaf.view && this.centralLeaf.view.file) {
              //@ts-ignore
              this.centralPagePath = this.centralLeaf.view.file.path;
            }
          }
        }
        this.render();
      }
    }

    if(this.removeTimer) {
      this.removeTimer();
      this.removeTimer = undefined;
    }

    const timer = setInterval(updateTimer,this.plugin.settings.indexUpdateInterval);
    this.removeTimer = () => clearInterval(timer);
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
    //@ts-ignore
    if(!app.plugins.plugins["obsidian-excalidraw-plugin"]) {
      this.plugin.EA = null;
    }
    new Notice("Brain Graph Off");
  }
}