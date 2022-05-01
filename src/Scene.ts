import { App, FileView, MarkdownView, Notice, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { EMPTYBRAIN } from "./constants/emptyBrainFile";
import { Layout } from "./graph/Layout";
import { Links } from "./graph/Links";
import { Node } from "./graph/Node";
import ExcaliBrain from "./main";
import { ExcaliBrainSettings } from "./Settings";
import { SearchBox } from "./Suggesters/SearchBox";
import { Neighbour, RelationType, Role } from "./Types";
import { log } from "./utils/utils";

export class Scene {
  settings: ExcaliBrainSettings;
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
  private links: Links = new Links();
  private layouts: Layout[] = [];
  private removeEH: Function;
  private removeTimer: Function;
  private blockUpdateTimer: boolean = false;
  private searchBox: SearchBox;
  
  constructor(plugin: ExcaliBrain, newLeaf: boolean, leaf?: WorkspaceLeaf) {
    this.settings = plugin.settings;
    this.ea = plugin.EA;
    this.plugin = plugin;
    this.app = plugin.app;
    this.leaf = leaf ?? app.workspace.getLeaf(newLeaf);
    this.terminated = false;
  }

  public async initialize() {
    await this.initilizeScene();
    this.searchBox = new SearchBox((this.leaf.view as TextFileView).contentEl,this.plugin);
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
  }

  /**
   * Renders the ExcaliBrain graph for the file provided by its path
   * @param path 
   * @returns 
   */
  public async renderGraphForFile(path: string) {
    if(!this.isActive()) {
      return;
    }

    this.blockUpdateTimer = true; //blocks the updateTimer

    const page = this.plugin.pages.get(path);
    if(!page || !page.file) {
      this.blockUpdateTimer = false;
      return;
    }

    if(!this.ea.targetView?.file || this.ea.targetView.file.path !== this.settings.excalibrainFilepath) {
      this.unloadScene();
      return;
    }
    
    if (page.file.path === this.ea.targetView.file.path) { //brainview drawing is the active leaf
      this.blockUpdateTimer = false;
      return; 
    }
  
    const centralPage = this.plugin.pages.get(this.centralPagePath)

    if(
      centralPage &&
      centralPage.path === path &&
      page.file.stat.mtime === centralPage.mtime
    ) {
      this.blockUpdateTimer = false;
      return; //don't reload the file if it has not changed
    }

    this.centralLeaf.openFile(page.file);
    this.centralPagePath = path;
    await this.plugin.createIndex();
    await this.render();
  }

  public async openExcalidrawLeaf() {
    log("openExcalidrawLeaf")
    const ea = this.ea;
    let counter = 0;

    let file = this.app.vault.getAbstractFileByPath(this.settings.excalibrainFilepath);
    if(file && !(file instanceof TFile)) {
      new Notice(`Please check settings. ExcaliBrain path (${this.settings.excalibrainFilepath}) points to a folder, not a file`);
      return;
    }
    if(!file) {
      file = await app.vault.create(this.settings.excalibrainFilepath,EMPTYBRAIN);
      //an ugly temporary hack waiting for metadataCache to index the new file
      while(file instanceof TFile && !ea.isExcalidrawFile(file) && counter++<10) {
        await sleep(50);
      }
    }
    counter = 0;
    if(file && file instanceof TFile && !ea.isExcalidrawFile(file)) {
      file = await app.vault.create(this.settings.excalibrainFilepath,EMPTYBRAIN);
      //an ugly temporary hack waiting for metadataCache to index the new file
      while(file instanceof TFile && !ea.isExcalidrawFile(file) && counter++<10) {
        await sleep(50);
      }
      if(!ea.isExcalidrawFile(file as TFile)) {
        new Notice(`Couldn't open ${this.settings.excalibrainFilepath}. Please try again later.`);
        return;
      }
    }
    await this.leaf.openFile(file as TFile);   
  }

  public async initilizeScene() {
    this.disregardLeafChange = false;
    const ea = this.ea;
    const style = this.settings.baseNodeStyle;
    let counter = 0;

    ea.setView(this.leaf.view as any)
    ea.clear();
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
    ea.style.fontFamily = style.fontFamily;
    ea.style.fontSize = style.fontSize;
    this.textSize = ea.measureText("m".repeat(style.maxLabelLength+3));
    this.nodeWidth = this.textSize.width + 3 * style.padding;
    this.nodeHeight = 2 * (this.textSize.height + 2 * style.padding);
    
    ea.getExcalidrawAPI().updateScene({
      appState: {
        viewModeEnabled:true,
        theme: "light",
      viewBackgroundColor: this.settings.backgroundColor
      },
      elements:[]
    });
    
    ea.style.strokeColor = style.textColor;
    ea.addText(0,0,"Open a document in another pane and click it to get started.\n\n" +
      "For the best experience enable 'Open in adjacent pane'\nin Excalidraw settings " +
      "under 'Links and Transclusion'.", {textAlign:"center"});
    await ea.addElementsToView();
    ea.getExcalidrawAPI().zoomToFit();
    
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
    this.ea.clear();
    this.ea.getExcalidrawAPI().updateScene({elements:[]});
    this.ea.style.verticalAlign = "middle";
    const centralPage = this.plugin.pages.get(this.centralPagePath);
    const parents = centralPage.getParents().filter(x=>x.page.path !== centralPage.path).slice(0,this.plugin.settings.maxItemCount);
    const children =centralPage.getChildren().filter(x=>x.page.path !==centralPage.path).slice(0,this.plugin.settings.maxItemCount);
    const friends = centralPage.getFriends().filter(x=>x.page.path !== centralPage.path).slice(0,this.plugin.settings.maxItemCount);
    const siblings = centralPage.getSiblings()
      .filter(s => !(parents.some(p=>p.page.path === s.page.path) ||
        children.some(c=>c.page.path === s.page.path) ||
        friends.some(f=>f.page.path === s.page.path)) && 
        (s.page.path !== centralPage.path))
      .slice(0,this.plugin.settings.maxItemCount);

    //-------------------------------------------------------
    // Generate layout and nodes
    this.nodesMap = new Map<string,Node>();
    this.links = new Links();
    this.layouts = [];
    const manyChildren = children.length >10;
    const manySiblings = siblings.length > 10;
    const singleParent = parents.length <= 1
    
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
    
    const lSiblings = new Layout({
      origoX: this.nodeWidth * ((singleParent ? 0 : 1) + (manySiblings ? 2 : 1)),
      origoY: -2.5 * this.nodeHeight,
      top: null,
      bottom: this.nodeHeight,
      columns: (manySiblings ? 3 : 1),
      columnWidth: this.nodeWidth,
      rowHeight: this.nodeHeight
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

    this.addNodes({
      neighbours: siblings,
      layout: lSiblings,
      isCentral: false,
      isSibling: true,
      friendGateOnLeft: true
    });
    
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
          this.ea,
          this.settings
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
    this.ea.getExcalidrawAPI().zoomToFit();
    this.blockUpdateTimer = false;
  }

  private addEventHandler() {
    const self = this;
    
    const brainEventHandler = async (leaf:WorkspaceLeaf) => {
      if(this.disregardLeafChange) {
        return;
      }
      self.blockUpdateTimer = true;
      await self.plugin.createIndex();
      //await new Promise((resolve) => setTimeout(resolve, 100));
      //-------------------------------------------------------
      //terminate event handler if view no longer exists or file has changed
      if(!self.ea.targetView?.file || self.ea.targetView.file.path !== self.settings.excalibrainFilepath) {
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
  
      self.centralPagePath = rootFile.path;
      self.centralLeaf = leaf;

      self.render();
    }

    const updateTimer = async () => {
      if(this.blockUpdateTimer) {
        return;
      }
      for(const node of this.nodesMap.values()) {
        const { file, mtime } = node.page;
        if(file && file.stat.mtime !== mtime) {
          await this.plugin.createIndex();
          this.centralPagePath = file.path;
          this.render();
          return;
        }
      }
    }

    app.workspace.on("active-leaf-change", brainEventHandler);
    this.removeEH = () => app.workspace.off("active-leaf-change",brainEventHandler);
    const timer = setInterval(updateTimer,5000);
    this.removeTimer = () => clearInterval(timer);

    const leaves: WorkspaceLeaf[] = [];
    app.workspace.iterateAllLeaves(l=>{
      if( (l.view instanceof FileView) && l.view.file && l.view.file.path !== this.ea.targetView.file.path) {
        leaves.push(l);
      }
    })

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
    
    if(this.ea.targetView && isBoolean(this.ea.targetView.linksAlwaysOpenInANewPane)) {
      this.ea.targetView.linksAlwaysOpenInANewPane = false;
    }
    
    if(this.ea.targetView && this.ea.targetView.excalidrawAPI) {
      try {
        this.ea.targetView.semaphores.saving = false;
        this.ea.targetView.excalidrawAPI.updateScene({appState:{viewModeEnabled:false}});
      } catch {}
    }

    if(this.ea.targetView) {
      this.ea.deregisterThisAsViewEA();
    }
    this.searchBox?.terminate();
    this.searchBox = undefined;
    this.ea.targetView = undefined;
    this.leaf = undefined;
    this.centralLeaf = undefined;
    this.centralPagePath = undefined;
    this.terminated = true;
    new Notice("Brain Graph Off");
  }
}