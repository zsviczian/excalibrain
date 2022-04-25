import { App, FileView, MarkdownView, Notice, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { EMPTYBRAIN } from "./constants/emptyBrainFile";
import { Layout } from "./graph/Layout";
import { Links } from "./graph/Links";
import { Node } from "./graph/Node";
import { Page } from "./graph/Page";
import ExcaliBrain from "./main";
import { ExcaliBrainSettings } from "./Settings";
import { SearchBox } from "./Suggesters/SearchBox";
import { Neighbour, RelationType, Role } from "./Types";

export class Scene {
  public static _instance: Scene;
  settings: ExcaliBrainSettings;
  ea: ExcalidrawAutomate;
  plugin: ExcaliBrain;
  app: App;
  leaf: WorkspaceLeaf;
  centralPage: Page;
  centralLeaf: WorkspaceLeaf;
  textSize: {width:number, height:number};
  nodeWidth: number;
  nodeHeight: number;
  private nodesMap: Map<string,Node> = new Map<string,Node>();
  private links: Links = new Links();
  private layouts: Layout[] = [];
  private removeEH: Function;
  private removeTimer: Function;
  private blockTimer: boolean = false;
  private searchBox: SearchBox;
  
  constructor(plugin: ExcaliBrain, newLeaf: boolean, leaf?: WorkspaceLeaf) {
    this.settings = plugin.settings;
    this.ea = plugin.EA;
    this.plugin = plugin;
    this.app = plugin.app;
    this.leaf = leaf ?? app.workspace.getLeaf(newLeaf);
  }

  public static isActive() {
    //@ts-ignore
    return this._instance && app.workspace.getLeafById(this._instance.leaf?.id)
  }

  public static async show(plugin: ExcaliBrain,newLeaf: boolean) {
    if(!this.isActive()) {
      let brainLeaf: WorkspaceLeaf;
      app.workspace.iterateAllLeaves(leaf=>{
        if(
          leaf.view &&
          (leaf.view instanceof FileView) &&
          leaf.view.file.path === plugin.settings.excalibrainFilepath
        ) {
          brainLeaf = leaf;
        }
      });
      (this._instance = new this(plugin,newLeaf,brainLeaf));      
    }
    await this._instance.initilizeScene();
    this._instance.searchBox = new SearchBox((this._instance.leaf.view as TextFileView).contentEl,plugin);
  }
  public static async reRender() {
    if(!this.isActive()) {
      return;
    }
    const self = this._instance;
    if(!self.centralLeaf || !self.centralPage) {
      return;
    }
    const path = self.centralPage.path;
    await self.plugin.createIndex();
    self.centralPage = self.plugin.pages.get(path)
    await self.render();
  }

  public static async renderGraphForFile(path: string) {
    if(!this.isActive()) {
      return;
    }
    const self = this._instance;
    self.blockTimer = true;

    const page = self.plugin.pages.get(path);
    if(!page || !page.file) {
      self.blockTimer = false;
      return;
    }

    if(!self.ea.targetView?.file || self.ea.targetView.file.path !== self.settings.excalibrainFilepath) {
      self.removeEventHandler();
      self.blockTimer = false;
      return;
    }
    
    if (page.file.path === self.ea.targetView.file.path) { //brainview drawing is the active leaf
      self.blockTimer = false;
      return; 
    }
  
    if(
      self.centralPage &&
      self.centralPage.path === page.path &&
      page.file.stat.mtime === self.centralPage.mtime
    ) {
      self.blockTimer = false;
      return; //don't reload the file if it has not changed
    }

    
    self.centralLeaf.openFile(page.file);
    await self.plugin.createIndex();
    self.centralPage = self.plugin.pages.get(path)
    await self.render();
  }

  public async initilizeScene() {
    const ea = this.ea;
    const style = this.settings.baseNodeStyle;
    let file = this.app.vault.getAbstractFileByPath(this.settings.excalibrainFilepath);
    if(file && !(file instanceof TFile)) {
      new Notice(`Please check settings. ExcaliBrain path (${this.settings.excalibrainFilepath}) points to a folder, not a file`);
      return;
    }
    let counter = 0;
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
    
    const parents = this.centralPage.getParents().filter(x=>x.page.path !== this.centralPage.path).slice(0,this.plugin.settings.maxItemCount);
    const children = this.centralPage.getChildren().filter(x=>x.page.path !== this.centralPage.path).slice(0,this.plugin.settings.maxItemCount);
    const friends = this.centralPage.getFriends().filter(x=>x.page.path !== this.centralPage.path).slice(0,this.plugin.settings.maxItemCount);
    const siblings = this.centralPage.getSiblings()
      .filter(s => !(parents.some(p=>p.page.path === s.page.path) &&
        children.some(c=>c.page.path === s.page.path) &&
        friends.some(f=>f.page.path === s.page.path)) && 
        (s.page.path !== this.centralPage.path))
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
      page: this.centralPage,
      isInferred: false,
      isCentral: true,
      isSibling: false,
      friendGateOnLeft: true
    });

    this.nodesMap.set(this.centralPage.path,rootNode);
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
    this.blockTimer = false;
  }

  private addEventHandler() {
    const self = this;
    
    const brainEventHandler = async (leaf:WorkspaceLeaf) => {
      self.blockTimer = true;
      await self.plugin.createIndex();
      //await new Promise((resolve) => setTimeout(resolve, 100));
      //-------------------------------------------------------
      //terminate event handler if view no longer exists or file has changed
      if(!self.ea.targetView?.file || self.ea.targetView.file.path !== self.settings.excalibrainFilepath) {
        self.removeEventHandler();
        self.blockTimer = false;
        return;
      }
      
      if(!(leaf?.view && (leaf.view instanceof FileView) && leaf.view.file)) {
        self.blockTimer = false;
        return;
      }
  
      const rootFile = leaf.view.file;
      
      if (rootFile.path === self.ea.targetView.file.path) { //brainview drawing is the active leaf
        self.blockTimer = false;
        return; 
      }
    
      if(
        self.centralPage &&
        self.centralPage.path === rootFile.path &&
        rootFile.stat.mtime === self.centralPage.mtime
      ) {
        self.blockTimer = false;
        return; //don't reload the file if it has not changed
      }
  
      self.centralPage = self.plugin.pages.get(rootFile.path);
      self.centralLeaf = leaf;

      self.render();
    }

    const updateTimer = async () => {
      if(this.blockTimer) {
        return;
      }
      for(const node of this.nodesMap.values()) {
        const { file, mtime } = node.page;
        if(file && file.stat.mtime !== mtime) {
          await this.plugin.createIndex();
          this.centralPage = this.plugin.pages.get(file.path);
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

  private removeEventHandler() {

    if(this.removeEH) {
      this.removeEH();
      this.removeEH = undefined;
    }

    if(this.removeTimer) {
      this.removeTimer();
      this.removeTimer = undefined;
    }
    
    if(isBoolean(this.ea.targetView?.linksAlwaysOpenInANewPane)) {
      this.ea.targetView.linksAlwaysOpenInANewPane = false;
    }
    
    if(this.ea.targetView?.excalidrawAPI) {
      try {
        this.ea.targetView.semaphores.saving = false;
        this.ea.getExcalidrawAPI().updateScene({appState:{viewModeEnabled:false}});
      } catch {}
    }

    this.searchBox.terminate();
    this.searchBox = undefined;
    this.ea.targetView = undefined;
    this.leaf = undefined;
    this.centralLeaf = undefined;
    this.centralPage = undefined;
    new Notice("Brain Graph Off");
  }

  public static terminate() {
    if(this._instance && this._instance.removeEH) {
      this._instance.removeEventHandler();
      this._instance = undefined;
    }
  }
}