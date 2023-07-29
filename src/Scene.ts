import { App, FileView, Notice, Setting, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import { ExcalidrawAutomate } from "obsidian-excalidraw-plugin/lib/ExcalidrawAutomate";
import { EMPTYBRAIN } from "./constants/emptyBrainFile";
import { Layout } from "./graph/Layout";
import { Links } from "./graph/Links";
import { Node } from "./graph/Node";
import ExcaliBrain from "./excalibrain-main";
import { ExcaliBrainSettings } from "./Settings";
import { ToolsPanel } from "./Components/ToolsPanel";
import { Mutable, Neighbour, NodeStyle, RelationType, Role } from "./types";
import { HistoryPanel } from "./Components/HistoryPanel";
import { WarningPrompt } from "./utils/Prompts";
import { debug, keepOnTop } from "./utils/utils";
import { ExcalidrawElement } from "obsidian-excalidraw-plugin";
import { isEmbedFileType } from "./utils/fileUtils";
import { DEFAULT_NODE_STYLE } from "./constants/constants";

export class Scene {
  ea: ExcalidrawAutomate;
  plugin: ExcaliBrain;
  app: App;
  leaf: WorkspaceLeaf;
  centralPagePath: string; //path of the page in the center of the graph
  private centralLeaf: WorkspaceLeaf; //workspace leaf containing the central page
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
  private rootNode: Node;

  constructor(plugin: ExcaliBrain, newLeaf: boolean, leaf?: WorkspaceLeaf) {
    this.ea = plugin.EA;
    this.plugin = plugin;
    this.app = plugin.app;
    this.leaf = leaf ?? app.workspace.getLeaf(newLeaf);
    this.terminated = false;
    this.links = new Links(plugin);
  }

  public getCentralLeaf(): WorkspaceLeaf {
    if(this.plugin.settings.embedCentralNode) {
      return null;
    }
    return this.centralLeaf;
  }

  public async initialize(focusSearchAfterInitiation: boolean) {
    this.focusSearchAfterInitiation = focusSearchAfterInitiation;
    await this.plugin.loadSettings();
    if(!this.leaf?.view) return;
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

    if(!this.centralPagePath) {
      return;
    }

    if(updateIndex) {
      this.vaultFileChanged = false;
      await this.plugin.createIndex(); //temporary
    }

    keepOnTop(this.ea);
    const centralPage = this.plugin.pages.get(this.centralPagePath);
    if(
      centralPage?.file &&
      !(centralPage.isFolder || centralPage.isTag || centralPage.isVirtual)
    ) {
      if(!this.centralLeaf) {
        this.ea.openFileInNewOrAdjacentLeaf(centralPage.file);
      } else if (
        //@ts-ignore
        this.centralLeaf.view?.file?.path !== centralPage.file.path
      ) {
        this.centralLeaf.openFile(centralPage.file, {active: true});
        app.workspace.revealLeaf(this.centralLeaf);
      }
    }
    await this.render();
    //this.toolsPanel.rerender(); //this is also there at the end of render. Seems duplicate.
  }

  /**
   * Renders the ExcaliBrain graph for the file provided by its path
   * @param path 
   * @returns 
   */
  public async renderGraphForPath(path: string, shouldOpenFile:boolean = true) {
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

    //abort excalibrain if the file in the Obsidian view has changed
    if(!this.ea.targetView?.file || this.ea.targetView.file.path !== this.plugin.settings.excalibrainFilepath) {
      this.unloadScene();
      return;
    }
    
    //don't render if the user is trying to render the excaliBrain file itself
    if (isFile && (page.file.path === this.ea.targetView.file.path)) { //brainview drawing is the active leaf
      this.blockUpdateTimer = false;
      return; 
    }
  
    keepOnTop(this.plugin.EA);

    const centralPage = this.plugin.pages.get(this.centralPagePath)
    const isSameFileAsCurrent = centralPage && centralPage.path === path && isFile

    // if the file hasn't changed don't update the graph
    if(isSameFileAsCurrent && page.file.stat.mtime === centralPage.mtime) {
      this.blockUpdateTimer = false;
      return; //don't reload the file if it has not changed
    }

    if(isFile && shouldOpenFile && !this.plugin.settings.embedCentralNode) {
      const centralLeaf = this.getCentralLeaf();
      //@ts-ignore
      if(!centralLeaf || !app.workspace.getLeafById(centralLeaf.id)) {
        this.centralLeaf = this.ea.openFileInNewOrAdjacentLeaf(page.file);
      } else {
        centralLeaf.openFile(page.file, {active: false});
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
    await this.render(isSameFileAsCurrent);
  }

  async addToHistory(path: string) {
    const nh = this.plugin.navigationHistory;
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
    if(!leaf) {
      leaf = app.workspace.getLeaf(false);
      if(leaf.getViewState().type !== "empty") {
        leaf = ea.getLeaf(leaf, "new-pane");
      }
    }
    if(settings.defaultAlwaysOnTop && leaf && ea.DEVICE.isDesktop) {
      //@ts-ignore
      const ownerWindow = leaf.view?.ownerWindow;
      if(ownerWindow && (ownerWindow !== window) && !ownerWindow.electronWindow?.isMaximized()) {
        ownerWindow.electronWindow.setAlwaysOnTop(true);
      }
    }
    await leaf.openFile(file as TFile);
  }

  /** iterates through a neighbour stack and returns the longest title length found.
     * @description: Possibly time consuming - consider its use? 
    */ 
  private longestTitle(neighbours: Neighbour[], checkMax:number=10): number {
    const lengths:number[] = [0];
    for (let index = 0; (index<neighbours.length) && (index<=checkMax); index++) {
      const item = neighbours[index];
      lengths.push(item.page.getTitle().length);
    }
    return Math.max(...lengths);
  }

/** get node height and width for requested nodestyle
 * according to: "NODESTYLE_FONTFAMILY" 
 * {1:"Hand-drawn",2:"Normal",3:"Code",4:"Fourth (custom) Font"};
 * heightfactor: In compactview by this design huge padded nodes are allowed to lie on top of other
 * members of that neighbour - a compromise.
 */
private getNodeSize(nodeLabelLength: number,
                    nodeStyle: NodeStyle = this.plugin.settings.baseNodeStyle,
                    heightFactor: number,
                    heightPaddingFactor: number = 2,
                    widthPaddingFactor: number = 3,
                    testString: string = "mi3l") : {width:number, height:number} {
  this.ea.style.fontFamily = nodeStyle.fontFamily??this.plugin.settings.baseNodeStyle.fontFamily;
  this.ea.style.fontSize = nodeStyle.fontSize??this.plugin.settings.baseNodeStyle.fontSize;
  const padding = nodeStyle.padding??this.plugin.settings.baseNodeStyle.padding;
  const testlabel = this.ea.measureText(testString.repeat(1));
  const testLabelLength = [...new Intl.Segmenter().segment(testString)].length
  const width = testlabel.width*(1/testString.length) * nodeLabelLength + widthPaddingFactor*padding;
  const height = testlabel.height * heightFactor + heightPaddingFactor*padding;
  return {width:width, height:height}
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
      ea.addElementsToView(false,false);
      ea.targetView.clearDirty(); //hack to prevent excalidraw from saving the changes
    }
    const frame3 = async () => {
      if(this.plugin.settings.allowAutozoom) api.zoomToFit(null, 5, 0.15);
      ea.targetView.linksAlwaysOpenInANewPane = true;
      await this.addEventHandler();
      this.historyPanel = new HistoryPanel((this.leaf.view as TextFileView).contentEl,this.plugin);
      new Notice("ExcaliBrain On");
    }

    frame1();
    frame2();
    frame3();
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
      
      n.page.maxLabelLength = x.layout.spec.maxLabelLength;
      
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

  /**
   * if retainCentralNode is true, the central node is not removed from the scene when the scene is rendered
   * this will ensure that the embedded frame in the center is not reloaded
   * @param retainCentralNode 
   * @returns 
   */
  private async render(retainCentralNode:boolean = false) {
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
    retainCentralNode = retainCentralNode && Boolean(this.rootNode) && isEmbedFileType(centralPage.file,ea);

    this.zoomToFitOnNextBrainLeafActivate = !ea.targetView.containerEl.isShown();

    ea.clear();
    const excalidrawAPI = ea.getExcalidrawAPI();
    if(!retainCentralNode) {
      excalidrawAPI.updateScene({elements:[]});
    } else {
      excalidrawAPI.updateScene({
        elements:excalidrawAPI.getSceneElements().filter((el:ExcalidrawElement)=>this.rootNode.embeddedElementIds.includes(el.id))
      });
    }
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
    
    const friends = centralPage.getLeftFriends()
      .filter(x => 
        (x.page.path !== centralPage.path) &&
        !this.plugin.settings.excludeFilepaths.some(p => x.page.path.startsWith(p)) &&
        (!x.page.primaryStyleTag || !this.toolsPanel.linkTagFilter.selectedTags.has(x.page.primaryStyleTag)))
      .slice(0,this.plugin.settings.maxItemCount);

    const nextFriends = centralPage.getRightFriends()
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
          nextFriends.some(f=>f.page.path === s.page.path)  ||
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
    this.nodesMap = new Map<string,Node>();
    this.links = new Links(this.plugin);
    this.layouts = [];
    const settings = this.plugin.settings; 
    
    /** 'compact view' : Boolean. 
     * User setting. Activates column optmisation.
    */ 
    const isCompactView:boolean = settings.compactView;
    
    /** basestyle font */
    const baseStyle = settings.baseNodeStyle;
    const baseChar = this.getNodeSize(1, baseStyle,1,0,0);

    /** container */
    const container = this.leaf.view.containerEl;
    const h = container.innerHeight-150;
    const w = container.innerWidth;
    const containerHeightRatio = h/w;
    const rf = 1/(h/w);
    
    /** the minimum accepted label length (readability) */
    const maxLabelLength = settings.baseNodeStyle.maxLabelLength ?? DEFAULT_NODE_STYLE.maxLabelLength;
    const siblingsMaxLabelLength = settings.siblingNodeStyle.maxLabelLength ?? baseStyle.maxLabelLength;
    const centralMaxLabelLength = settings.centralNodeStyle.maxLabelLength ?? baseStyle.maxLabelLength; 
    const minLabelLength = 7;
    const rfCorr = Math.min(rf,1);
    const correctedMaxLabelLength = Math.round(maxLabelLength*rfCorr);
    const correctedMinLabelLength = Math.max(minLabelLength, correctedMaxLabelLength); 
    const padding = 6 * baseStyle.padding;
    const manyFriends = friends.length >= 8;
    const manyNextFriends = nextFriends.length >= 5;
    //const manyFriends = friends.length >= 10;
    //const manyNextFriends = nextFriends.length >= 10;
    
    /** calculate single node space variations */
    const LengthPadding = 1; // +1 for possible front icon (utf-8 length is taken care of in node.ts)
    const baseHeight = baseChar.height + 3*baseStyle.padding
    const smallestNodeWidth = baseChar.width * (correctedMinLabelLength + LengthPadding) + padding;
    const maxNodeWidth = baseChar.width * (baseStyle.maxLabelLength + LengthPadding) + padding;

    const isCenterEmbedded = 
      this.plugin.settings.embedCentralNode &&
      !centralPage.isVirtual &&
      !centralPage.isFolder &&
      !centralPage.isTag;
    const centerEmbedWidth = this.plugin.settings.centerEmbedWidth;
    const centerEmbedHeight = this.plugin.settings.centerEmbedHeight;
    const minRowsInCenter = isCenterEmbedded
      ? Math.round(centerEmbedHeight/baseHeight)
      : 3;

    /** Calculate the total node space needed in this container ratio */
    const friendCols = isCompactView && isCenterEmbedded
      ? Math.ceil((friends.length*baseHeight)/centerEmbedHeight)
      : isCompactView && !isCenterEmbedded
        ? Math.min(Math.ceil(Math.sqrt(friends.length*0.5)*rfCorr),3)
        : 1
    
    const nextFriendCols = isCompactView && isCenterEmbedded
      ? Math.ceil((nextFriends.length*baseHeight)/centerEmbedHeight)
      : isCompactView && !isCenterEmbedded
        ? Math.min(Math.ceil(Math.sqrt(nextFriends.length*0.5)*rfCorr),3)
        : 1
    console.log("nfc", Math.ceil((nextFriends.length*baseHeight)/centerEmbedHeight),nextFriends.length, baseHeight,centerEmbedHeight)
    
    const centerCols = 1 + friendCols + nextFriendCols;
    console.log("friend", friendCols, nextFriendCols)
    const centerRows = Math.max(
      friends.length>0 ? friends.length/friendCols : 0, 
      nextFriends.length>0 ? nextFriends.length/nextFriendCols : 0, 
      minRowsInCenter);
    
    const totalNeed = parents.length + children.length + centerCols*centerRows + (settings.renderSiblings?siblings.length:0);
    console.log(totalNeed, baseHeight, centerCols, centerRows)
    /** min/max rows/cols needed */
    const rfNode = 1/((smallestNodeWidth/rf)/baseHeight);
    const rows = Math.sqrt(totalNeed/rfNode);
    const cols = Math.sqrt(totalNeed/(1/rfNode)); 
    
    const rfMaxNode = 1/((maxNodeWidth/rf)/baseHeight);
    const rows2 = Math.sqrt(totalNeed/rfMaxNode);
    const cols2 = Math.sqrt(totalNeed/(1/rfMaxNode)); 

    console.log("rfNode:" + rfNode + "rfMaxNode:" + rfMaxNode)
    console.log("container/char høyde:" + container.innerHeight/baseChar.height)
    console.log("ross2:" + rows2)
    console.log("rows:" + rows)
    
    const maxCols = isCompactView ? Math.ceil(cols) : 5;
    const a= [rows,cols, rows2,cols2]
    console.log(a)
    
    // siblings
    const siblingsCols = settings.renderSiblings && siblings.length>0
      ? isCompactView
        ? Math.round(cols*(siblings.length/totalNeed))
        : siblings.length > 20
          ? 3
          : siblings.length > 10
            ? 2
            : 1
      : 0;

    const siblingsLabelLength = settings.renderSiblings
      ? isCompactView
        ? Math.min(this.longestTitle(siblings,20) + LengthPadding, minLabelLength, siblingsMaxLabelLength)
        : siblingsMaxLabelLength
      : 0;

    // center
    const mainCols = maxCols-siblingsCols;
    const mainAreaTextLength = Math.max(centerCols,mainCols) * correctedMinLabelLength;

    // root
    const actualRootLength = [...new Intl.Segmenter().segment(centralPage.getTitle())].length;
    const rootNodeLength = isCompactView
      ? Math.min(actualRootLength + LengthPadding, Math.ceil(mainAreaTextLength/centerCols), centralMaxLabelLength)
      : maxLabelLength;
    
    // friends
    const friendsLabelLength = isCompactView
      ? Math.min(this.longestTitle(friends) + LengthPadding,correctedMinLabelLength)
      : maxLabelLength;
    
    // nextfriends
    const nextFriendsLabelLength = isCompactView
      ? Math.min(this.longestTitle(nextFriends) + LengthPadding, correctedMinLabelLength)
      : maxLabelLength;

    // parents
    const parentCols = isCompactView
      ? Math.min(Math.ceil(Math.sqrt(parents.length)),maxCols-siblingsCols)
      : (parents.length < 5
        ? [1, 1, 2, 3, 2][parents.length]
        : 3);

    const parentsLabelLength = isCompactView
    ? Math.min(
        this.longestTitle(parents) + LengthPadding, 
        Math.max(Math.floor(mainAreaTextLength/parentCols), correctedMinLabelLength), 
        baseStyle.maxLabelLength
      )
    : maxLabelLength;

    // children
    const childrenCols = isCompactView
      ? Math.min(Math.ceil(Math.sqrt(children.length)), maxCols-siblingsCols)
      : (children.length <= 12 
        ? [1, 1, 2, 3, 3, 3, 3, 4, 4, 5, 5, 4, 4][children.length]
        : 5);

    const childrenLabelLength = isCompactView
    ? Math.min(
        this.longestTitle(children,20) + LengthPadding, 
        Math.max(Math.floor(mainAreaTextLength/childrenCols), correctedMinLabelLength), 
        baseStyle.maxLabelLength
      )
    : maxLabelLength;
    
  // max node size
  const parentWidth = isCompactView
    ?(parentsLabelLength + LengthPadding) * baseChar.width + padding
    : this.nodeWidth;

  const childWidth = isCompactView
    ? (childrenLabelLength + LengthPadding) * baseChar.width + padding
    : this.nodeWidth;

  const friendWidth = isCompactView
    ? (friendsLabelLength + LengthPadding) * baseChar.width + padding
    : this.nodeWidth;

  const nextFriendWidth = isCompactView
    ? (nextFriendsLabelLength + LengthPadding) * baseChar.width + padding
    : this.nodeWidth;
  
    const siblingsFont = this.getNodeSize(siblingsLabelLength, settings.siblingNodeStyle, (isCompactView?1.2:2));
    const centralNodeFont = this.getNodeSize(rootNodeLength, settings.centralNodeStyle,(isCompactView?1.2:2));

    // layout areas
    const friendsArea = {
      width:  friends.length>0? friendCols*friendWidth:0, 
      height: friends.length>0? Math.ceil(friends.length/friendCols)*baseHeight:0
    }
    const nextFriendsArea = {
      width:  nextFriends.length>0? nextFriendCols*nextFriendWidth:0, 
      height: nextFriends.length>0? Math.ceil(nextFriends.length/nextFriendCols)*baseHeight:0
    }
    const parentsArea = {
      width:  parents.length>0? parentCols*parentWidth:0, 
      height: parents.length>0? Math.ceil(parents.length/parentCols)*baseHeight:0
    }
    const childrenArea = {
      width:  children.length>0? childrenCols*childrenLabelLength*baseChar.width:0, 
      height: children.length>0? Math.ceil(children.length/childrenCols)*baseHeight:0
    }
    const siblingsArea = {
      width:  siblings.length>0? siblingsFont.width*siblingsCols:0, 
      height: siblings.length>0? Math.ceil(siblings.length/siblingsCols)*siblingsFont.height:0
    }
    const rootWidth = isCompactView ? centralNodeFont.width : this.nodeWidth;
 
    const heightInCenter = isCenterEmbedded
      ? centerEmbedHeight
      : (isCompactView?minRowsInCenter:5)*baseHeight;
    
    const parentsOrigoY = isCompactView
      ? (parentsArea.height + Math.max(friendsArea.height,nextFriendsArea.height,heightInCenter))*0.5 + padding
      : (parentsArea.height + heightInCenter)*0.5;

    const childrenOrigoY = isCompactView
    ? (childrenArea.height + Math.max(friendsArea.height,nextFriendsArea.height,heightInCenter))*0.5 + padding
    : (childrenArea.height + heightInCenter)*0.5;

    const friendOrigoX = (isCompactView && rf < 1 
      ? Math.max(
          isCenterEmbedded?centerEmbedWidth:rootWidth + friendsArea.width, 
          childrenArea.width-friendsArea.width + childWidth*0.5, 
          parentsArea.width-friendsArea.width + parentWidth*0.5
        )
      : centerEmbedWidth + friendsArea.width
      )/2 + friendCols * 3 * baseStyle.padding;
        
    const nextFriendOrigoX = (isCompactView && rf < 1 
      ? Math.max(
          isCenterEmbedded?centerEmbedWidth:rootWidth + nextFriendsArea.width, 
          childrenArea.width-nextFriendsArea.width + childWidth*0.5, 
          parentsArea.width-nextFriendsArea.width + parentWidth*0.5
        )
      : centerEmbedWidth + nextFriendsArea.width
      )/2 + friendCols * 3 * baseStyle.padding;
    
    const siblingsPadding = settings.siblingNodeStyle.padding ?? baseStyle.padding;
    const siblingsOrigoX = 
      Math.max(
        parentsArea.width*0.5, 
        childrenArea.width*0.5,
        nextFriendOrigoX + nextFriendsArea.width*0.5
      ) + siblingsArea.width*0.5 + 3*siblingsPadding*(1 + siblingsCols);

    // layout    
    const lCenter = new Layout({
      origoX: 0,
      origoY: isCenterEmbedded
        ? centerEmbedHeight - this.nodeHeight/2
        : 0,
      top: null,
      bottom: null,
      columns: 1,
      columnWidth: isCenterEmbedded
        ? centerEmbedWidth
        : rootWidth,
      rowHeight: isCenterEmbedded
        ? centerEmbedHeight
        : centralNodeFont.height,
        maxLabelLength: rootNodeLength
    });
    this.layouts.push(lCenter);

    const lChildren = new Layout({
      // orig origoX: 0, 
      origoX: !isCompactView || (containerHeightRatio<1) || (centerCols>=3) || (centerCols==1) || (childrenCols>3)
        ? 0
        : rootWidth*((friends.length>0)?-0.1:0.1),
      origoY: childrenOrigoY,
      top: 0, //isCenterEmbedded ? centerEmbedHeight + this.nodeHeight: 2 * this.nodeHeight,
      bottom: null,
      columns: childrenCols,
      columnWidth: childWidth,
      rowHeight: baseHeight,
      maxLabelLength: childrenLabelLength
    });
    this.layouts.push(lChildren);
    
    const lFriends = new Layout({
      origoX: -friendOrigoX,
      origoY: 0,
      top: null,
      bottom: null,
      columns: friendCols,
      columnWidth: friendWidth,
      rowHeight: baseHeight,
      maxLabelLength: friendsLabelLength
    });
    this.layouts.push(lFriends);

    const lNextFriends = new Layout({
      origoX: nextFriendOrigoX,
      origoY: isCenterEmbedded
        ? centerEmbedHeight/2
        : 0,
      top: null,
      bottom: null,
      columns: nextFriendCols,
      columnWidth: nextFriendWidth,
      rowHeight: baseHeight,
      maxLabelLength: nextFriendsLabelLength
    });
    this.layouts.push(lNextFriends);
    
    const lParents = new Layout({
      origoX: !isCompactView || (containerHeightRatio<1) || (centerCols>=3) || (centerCols==1) || (parentCols>3)
        ? 0
        : rootWidth*((friends.length>0)?-0.1:0.1),
      origoY: - parentsOrigoY,
      top: null,
      bottom: -2 * baseHeight,
      columns: parentCols, // 3,
      columnWidth: parentWidth,
      rowHeight: baseHeight,
      maxLabelLength: parentsLabelLength
    });
    this.layouts.push(lParents);

    const lSiblings = new Layout({
      //origoX: this.nodeWidth * ((parentCols-1)/2 + (siblingsCols+1.5)/3), //orig
      origoX: siblingsOrigoX,
      origoY: parentsOrigoY + siblingsArea.height*0.1,
      top: null,
      bottom: null,
      columns: siblingsCols, 
      columnWidth: siblingsFont.width + 3*siblingsPadding,
      rowHeight: siblingsFont.height,
      maxLabelLength: siblingsLabelLength
    })
    this.layouts.push(lSiblings);
    
    centralPage.maxLabelLength = rootNodeLength; 
    this.rootNode = new Node({
      ea,
      page: centralPage,
      isInferred: false,
      isCentral: true,
      isSibling: false,
      friendGateOnLeft: true,
      isEmbeded: isCenterEmbedded,
      embeddedElementIds: retainCentralNode ? this.rootNode?.embeddedElementIds : undefined,
    });

    this.nodesMap.set(centralPage.path,this.rootNode);
    lCenter.nodes.push(this.rootNode);
  
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
      neighbours: nextFriends,
      layout: lNextFriends,
      isCentral: false,
      isSibling: false,
      friendGateOnLeft: true
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
      addLinks(nodeA, nodeA.page.getLeftFriends(),Role.FRIEND);
      addLinks(nodeA, nodeA.page.getRightFriends(),Role.NEXT);
    });
  
    //-------------------------------------------------------
    // Render
    ea.style.opacity = 100;
    await Promise.all(this.layouts.map(async (layout) => await layout.render()));
    const nodeElements = ea.getElements();
    this.links.render(Array.from(this.toolsPanel.linkTagFilter.selectedLinks));
    
    const linkElements = ea.getElements().filter(el=>!nodeElements.includes(el));


    //hack to send link elements behind node elements
    const newImagesDict = linkElements.concat(nodeElements) 
      .reduce((dict:{[key:string]:any}, obj:ExcalidrawElement) => {
        dict[obj.id] = obj;
        return dict;
      }, {});

    ea.elementsDict = newImagesDict;

    ea.addElementsToView(false,false);
    ea.targetView.clearDirty(); //hack to prevent excalidraw from saving the changes

    ea.getExcalidrawAPI().updateScene({appState: {viewBackgroundColor: this.plugin.settings.backgroundColor}});
    if(this.plugin.settings.allowAutozoom) ea.getExcalidrawAPI().zoomToFit(null,5,0.15);
  
    this.toolsPanel.rerender();
    if(this.focusSearchAfterInitiation && this.plugin.settings.allowAutofocuOnSearch) {
      this.toolsPanel.searchElement.focus();
      this.focusSearchAfterInitiation = false;
    }

    this.blockUpdateTimer = false;
  }

  public isCentralLeafStillThere():boolean {
    //@ts-ignore
    const noCentralLeaf = app.workspace.getLeafById(this.centralLeaf.id) === null ;
    if(noCentralLeaf) {
      return false;
    }
    //@ts-ignore
    if (this.centralLeaf.view?.file?.path === this.plugin.settings.excalibrainFilepath) {
      return false;
    }
    return true;
  }

  private async addEventHandler() {
    const self = this;
    
    const brainEventHandler = async (leaf:WorkspaceLeaf, startup:boolean = false) => {
      if(this.disregardLeafChange) {
        return;
      }
      if(!startup && self.plugin.settings.embedCentralNode) {
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
          if(self.plugin.settings.allowAutozoom) self.ea.getExcalidrawAPI().zoomToFit(null, 5, 0.15);
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
    
    let leafToOpen = leaves[0];
    if(leaves.length>0) {
      const lastFilePath = app.workspace.getLastOpenFiles()[0];
      if(lastFilePath && lastFilePath !== "") {
        const leaf = leaves.filter(l=>(l.view as FileView)?.file.path === lastFilePath);
        if(leaf.length>0) {
          leafToOpen = leaf[0];
        }
      }
      keepOnTop(this.plugin.EA);  
      brainEventHandler(leafToOpen, true);
    } else {
      if(this.plugin.navigationHistory.length>0) {
        const lastFilePath = this.plugin.navigationHistory.last();
        setTimeout(()=>this.renderGraphForPath(lastFilePath,true),100);
      }
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
        this.render(true);
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
    // timout is to make sure Obsidian is not being terminated when scene closes,
    // becasue that can lead to crippled settings file
    // if the plugin is still there after 400ms, it is safe to save the settings
    setTimeout(async () => {
      await this.plugin.loadSettings(); //only overwrite the navigation history, save other synchronized settings
      this.plugin.settings.navigationHistory = [...this.plugin.navigationHistory];
      await this.plugin.saveSettings();
    },400);
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