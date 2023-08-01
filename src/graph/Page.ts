import { TFile } from "obsidian";
import { Literal } from "obsidian-dataview/lib/data-model/value";
import ExcaliBrain from "src/excalibrain-main";
import { LinkDirection, Neighbour, Relation, RelationType } from "src/types";
import { getDVFieldLinksForPage, getPrimaryTag } from "src/utils/dataview";
import { getFilenameFromPath } from "src/utils/fileUtils";
import { errorlog, log } from "src/utils/utils";
import { Pages, addUnresolvedPage } from "./Pages";

const DEFAULT_RELATION:Relation = {
  target: null,
  isParent: false,
  isChild: false,
  isLeftFriend: false,
  isRightFriend: false,
  isNextFriend: false,
  isPreviousFriend: false,
  direction: null
}

const concat = (s1: string, s2: string): string => {
  return s1 && s2 
    ? (s1 +", " + s2)
    : s1 
      ? s1
      : s2
}

const directionToSet = (currentDirection:LinkDirection, newDirection: LinkDirection):LinkDirection => {
  if(!currentDirection) {
    return newDirection;
  }
  if(currentDirection === LinkDirection.BOTH || currentDirection === newDirection) {
    return currentDirection;
  }
  return LinkDirection.BOTH;
}

const relationTypeToSet = (currentType: RelationType, newType: RelationType):RelationType => {
  if(currentType === RelationType.DEFINED) {
    return RelationType.DEFINED
  }
  if(currentType === RelationType.INFERRED) {
    if(newType === RelationType.DEFINED) {
      return RelationType.DEFINED;
    }
    return RelationType.INFERRED;
  }
  return newType;
}

export class Page {
  public mtime: number;
  public neighbours: Map<string,Relation>;
  public dvPage: Record<string, Literal>;
  public primaryStyleTag: string;
  public dvIndexReady: boolean = false;
  maxLabelLength: number;
  
  constructor(
    private pages: Pages,
    public path:string,
    public file:TFile,
    public plugin: ExcaliBrain,
    public isFolder: boolean=false,
    public isTag: boolean=false,
    public name?: string,
    public url:string = null
  ) {
    if(!name) {
      this.name = file 
      ? (file.extension === "md")
        ? file.basename
        : file.name
      : Boolean(url) ? url : getFilenameFromPath(path);
    }
    this.mtime = file ? file.stat.mtime : null;
    this.neighbours = new Map<string,Relation>();
  }

  public addDVFieldLinksToPage() {
    if(this.dvIndexReady || this.isFolder || !this.pages) {
      return;
    }

    this.dvIndexReady = true;

    if(this.isTag) {
      const invMap = this.plugin.DVAPI.index.etags.getInverse("#"+this.path.substring(4));
      if(!invMap) {
        return;
      }
      invMap.forEach(path=>{
        const child = this.pages.get(path);
        if(!child) {
          return;
        }
        if(this.neighbours.has(path)) return; //https://github.com/zsviczian/excalibrain/issues/74
        child.addParent(this,RelationType.DEFINED,LinkDirection.TO,"tag-tree");
        this.addChild(child,RelationType.DEFINED,LinkDirection.FROM,"tag-tree");
      });
      return;
    }

    if(!this.file) {
      return;
    }

    const dvPage = this.plugin.DVAPI.page(this.file.path);
    if(!dvPage) {
      return;
    }
    this.dvPage = dvPage;
    if(!dvPage) return;
    this.primaryStyleTag = getPrimaryTag(this.dvPage,this.plugin.settings);

    (dvPage.file?.etags?.values??[]).forEach((tag:string)=>{
      tag = "tag:" + tag.substring(1);
      const parent = this.pages.get(tag);
      if(!parent) return;
      this.addParent(parent,RelationType.DEFINED,LinkDirection.FROM,"tag-tree");
      parent.addChild(this,RelationType.DEFINED,LinkDirection.TO,"tag-tree");
    })    

    const parentFields = this.plugin.hierarchyLowerCase.parents;
    getDVFieldLinksForPage(this.plugin,dvPage,parentFields).forEach(item=>{
      let referencedPage = this.pages.get(item.link);
      if(!referencedPage) {
        referencedPage = addUnresolvedPage(item.link, this, this.plugin, this.plugin.pages)
        //log(`Unexpected: ${this.file.path} references ${item.link} in DV, but it was not found in app.metadataCache. The page was skipped.`);
        //return;
      }
      this.addParent(referencedPage,RelationType.DEFINED,LinkDirection.FROM, item.field);
      referencedPage.addChild(this,RelationType.DEFINED,LinkDirection.TO, item.field);
    });

    const childFields = this.plugin.hierarchyLowerCase.children;
    getDVFieldLinksForPage(this.plugin,dvPage,childFields).forEach(item=>{
      let referencedPage = this.pages.get(item.link);
      if(!referencedPage) {
        referencedPage = addUnresolvedPage(item.link, this, this.plugin, this.plugin.pages)
        //log(`Unexpected: ${this.file.path} references ${item.link} in DV, but it was not found in app.metadataCache. The page was skipped.`);
        //return;
      }        
      this.addChild(referencedPage,RelationType.DEFINED,LinkDirection.FROM, item.field);
      referencedPage.addParent(this,RelationType.DEFINED,LinkDirection.TO, item.field);
    });

    const leftFriendFields = this.plugin.hierarchyLowerCase.leftFriends;
    getDVFieldLinksForPage(this.plugin,dvPage,leftFriendFields).forEach(item=>{
      let referencedPage = this.pages.get(item.link);
      if(!referencedPage) {
        referencedPage = addUnresolvedPage(item.link, this, this.plugin, this.plugin.pages)
        //log(`Unexpected: ${this.file.path} references ${item.link} in DV, but it was not found in app.metadataCache. The page was skipped.`);
        //return;
      }        
      this.addLeftFriend(referencedPage,RelationType.DEFINED,LinkDirection.FROM,item.field);
      referencedPage.addLeftFriend(this,RelationType.DEFINED,LinkDirection.TO, item.field);
    });

    const rightFriendFields = this.plugin.hierarchyLowerCase.rightFriends;
    getDVFieldLinksForPage(this.plugin,dvPage,rightFriendFields).forEach(item=>{
      let referencedPage = this.pages.get(item.link);
      if(!referencedPage) {
        referencedPage = addUnresolvedPage(item.link, this, this.plugin, this.plugin.pages)
        //log(`Unexpected: ${this.file.path} references ${item.link} in DV, but it was not found in app.metadataCache. The page was skipped.`);
        //return;
      }        
      this.addRightFriend(referencedPage,RelationType.DEFINED,LinkDirection.FROM,item.field);
      referencedPage.addRightFriend(this,RelationType.DEFINED,LinkDirection.TO, item.field);
    });

    const previousFields = this.plugin.hierarchyLowerCase.previous;
    getDVFieldLinksForPage(this.plugin,dvPage,previousFields).forEach(item=>{
      let referencedPage = this.pages.get(item.link);
      if(!referencedPage) {
        referencedPage = addUnresolvedPage(item.link, this, this.plugin, this.plugin.pages)
        //log(`Unexpected: ${this.file.path} references ${item.link} in DV, but it was not found in app.metadataCache. The page was skipped.`);
        //return;
      }        
      this.addPreviousFriend(referencedPage,RelationType.DEFINED,LinkDirection.FROM,item.field);
      referencedPage.addNextFriend(this,RelationType.DEFINED,LinkDirection.TO, item.field);
    });

    const nextFields = this.plugin.hierarchyLowerCase.next;
    getDVFieldLinksForPage(this.plugin,dvPage,nextFields).forEach(item=>{
      let referencedPage = this.pages.get(item.link);
      if(!referencedPage) {
        referencedPage = addUnresolvedPage(item.link, this, this.plugin, this.plugin.pages)
        //log(`Unexpected: ${this.file.path} references ${item.link} in DV, but it was not found in app.metadataCache. The page was skipped.`);
        //return;
      }        
      this.addNextFriend(referencedPage,RelationType.DEFINED,LinkDirection.FROM,item.field);
      referencedPage.addPreviousFriend(this,RelationType.DEFINED,LinkDirection.TO, item.field);
    });    
  }

  public getTitle(): string {
    if(this.isURL) {
      if(this.plugin.settings.renderAlias && this.name && this.name !== "") {
        return this.name;
      }
      return this.url;
    }
    const aliases = (this.file && this.plugin.settings.renderAlias)
      ? (this.dvPage?.file?.aliases?.values??[])
      : [];
    let defaultName = aliases.length > 0 
      ? aliases[0] 
      : this.name

    //when the alias contains a colon, it is parsed by DataView as an object
    if(defaultName === "[object Object]") {
      if(this.dvPage.aliases?.[0]) {
        defaultName = Object.entries(this.dvPage.aliases[0])[0].join(": ");
      } else {
        defaultName = this.name;
      }
    }
    if(this.dvPage?.file && this.plugin.customNodeLabel) {
      try {
        return this.plugin.customNodeLabel(this.dvPage, defaultName);
      } 
      catch(e) {
        errorlog({
          fn: this.getTitle,
          message: "Error executing cutomer node label function. The script is: " + this.plugin.settings.nodeTitleScript,
          data: this.dvPage,
          where: "Page.getTitle()",
          error: e
        })
      }
    }
    return defaultName;
  }

  private getRelationVector (r:Relation):{
    pi: boolean,
    pd: boolean,
    ci: boolean,
    cd: boolean,
    lfd: boolean,//left friend defined
    rfd: boolean //right friend defined
    pfd: boolean //previous defined
    nfd: boolean //next defined
  } {
    return {
      pi: r.isParent && r.parentType === RelationType.INFERRED,
      pd: r.isParent && r.parentType === RelationType.DEFINED,
      ci: r.isChild && r.childType === RelationType.INFERRED,
      cd: r.isChild && r.childType === RelationType.DEFINED,
      lfd: (!this.plugin.settings.inferAllLinksAsFriends && r.isLeftFriend) ||
        (this.plugin.settings.inferAllLinksAsFriends && r.isLeftFriend && !(r.parentType === RelationType.DEFINED || r.childType === RelationType.DEFINED)),
      rfd: r.isRightFriend && (r.rightFriendType === RelationType.DEFINED),
      pfd: r.isPreviousFriend && (r.previousFriendType === RelationType.DEFINED),
      nfd: r.isNextFriend && (r.nextFriendType === RelationType.DEFINED),
    }
  }

  private getNeighbours(): [string, Relation][] {
    this.addDVFieldLinksToPage();
    this.neighbours.forEach(n=>n.target.addDVFieldLinksToPage());

    const { showVirtualNodes, showAttachments, showFolderNodes, showTagNodes, showPageNodes, showURLNodes } = this.plugin.settings
    return Array.from(this.neighbours)
      .filter(x=> (showVirtualNodes || !x[1].target.isVirtual) && 
        (showAttachments || !x[1].target.isAttachment) &&
        (showFolderNodes || !x[1].target.isFolder) &&
        (showTagNodes || !x[1].target.isTag) &&
        (showPageNodes || x[1].target.isFolder || x[1].target.isTag || x[1].target.isAttachment || x[1].target.isURL) &&
        (showURLNodes || !x[1].target.isURL)
      )
  }
  
  public get isVirtual(): boolean {
    return (this.file === null) && !this.isFolder && !this.isTag && !this.isURL;
  }

  public get isURL(): boolean {
    return Boolean(this.url);
  }

  public get isAttachment(): boolean {
    return this.file ? (this.file.extension !== "md") : false;
  }

  public get isMarkdown(): boolean {
    //files that have not been created are assumed to be markdown files
    return this.file?.extension === "md" || !this.file;
  }

  //-----------------------------------------------
  // add relationships
  //-----------------------------------------------
  addParent(page: Page, relationType:RelationType,  direction: LinkDirection, definition?: string) {
    if(page.path === this.plugin.settings.excalibrainFilepath || page.path === this.path) {
      return;
    };
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isParent = true;
      neighbour.parentType = relationTypeToSet(neighbour.parentType,relationType);
      if(definition && !neighbour.parentTypeDefinition?.contains(definition)) {
        neighbour.parentTypeDefinition = concat(definition, neighbour.parentTypeDefinition);
      }
      neighbour.direction = directionToSet(neighbour.direction, direction);
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isParent: true,
      parentType: relationType,
      parentTypeDefinition: definition,
      direction
    });
  }

  addChild(page: Page, relationType:RelationType, direction: LinkDirection, definition?: string) {
    if(page.path === this.plugin.settings.excalibrainFilepath || page.path === this.path) {
      return;
    };
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isChild = true;
      neighbour.childType = relationTypeToSet(neighbour.childType,relationType);
      if(definition && !neighbour.childTypeDefinition?.contains(definition)) {
        neighbour.childTypeDefinition = concat(definition,neighbour.childTypeDefinition);
      }
      neighbour.direction = directionToSet(neighbour.direction, direction);
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isChild: true,
      childType: relationType,
      childTypeDefinition: definition,
      direction
    });
  }

  addLeftFriend(page: Page, relationType:RelationType, direction: LinkDirection, definition?: string) {
    if(page.path === this.plugin.settings.excalibrainFilepath || page.path === this.path) {
      return;
    };
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isLeftFriend = true;
      neighbour.leftFriendType = relationTypeToSet(neighbour.leftFriendType,relationType);
      if(definition && !neighbour.leftFriendTypeDefinition?.contains(definition)) {
        neighbour.leftFriendTypeDefinition = concat(definition,neighbour.leftFriendTypeDefinition);
      }
      neighbour.direction = directionToSet(neighbour.direction, direction);
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isLeftFriend: true,
      leftFriendType: relationType,
      leftFriendTypeDefinition: definition,
      direction
    });
  }

  addRightFriend(page: Page, relationType:RelationType, direction: LinkDirection, definition?: string) {
    if(page.path === this.plugin.settings.excalibrainFilepath || page.path === this.path) {
      return;
    };
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isRightFriend = true;
      neighbour.rightFriendType = relationTypeToSet(neighbour.rightFriendType,relationType);
      if(definition && !neighbour.rightFriendTypeDefinition?.contains(definition)) {
        neighbour.rightFriendTypeDefinition = concat(definition,neighbour.rightFriendTypeDefinition);
      }
      neighbour.direction = directionToSet(neighbour.direction, direction);
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isRightFriend: true,
      rightFriendType: relationType,
      rightFriendTypeDefinition: definition,
      direction
    });
  }

  addNextFriend(page: Page, relationType:RelationType, direction: LinkDirection, definition?: string) {
    if(page.path === this.plugin.settings.excalibrainFilepath || page.path === this.path) {
      return;
    };
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isNextFriend = true;
      neighbour.nextFriendType = relationTypeToSet(neighbour.nextFriendType,relationType);
      if(definition && !neighbour.nextFriendTypeDefinition?.contains(definition)) {
        neighbour.nextFriendTypeDefinition = concat(definition,neighbour.nextFriendTypeDefinition);
      }
      neighbour.direction = directionToSet(neighbour.direction, direction);
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isNextFriend: true,
      nextFriendType: relationType,
      nextFriendTypeDefinition: definition,
      direction
    });
  }

  addPreviousFriend(page: Page, relationType:RelationType, direction: LinkDirection, definition?: string) {
    if(page.path === this.plugin.settings.excalibrainFilepath || page.path === this.path) {
      return;
    };
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isPreviousFriend = true;
      neighbour.previousFriendType = relationTypeToSet(neighbour.previousFriendType,relationType);
      if(definition && !neighbour.previousFriendTypeDefinition?.contains(definition)) {
        neighbour.previousFriendTypeDefinition = concat(definition,neighbour.previousFriendTypeDefinition);
      }
      neighbour.direction = directionToSet(neighbour.direction, direction);
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isPreviousFriend: true,
      previousFriendType: relationType,
      previousFriendTypeDefinition: definition,
      direction
    });
  }
  
  unlinkNeighbour(pagePath: string) {
    this.neighbours.delete(pagePath);
  }

  //-----------------------------------------------
  //see: getRelationLogic.excalidraw
  //-----------------------------------------------
  isChild (relation: Relation):RelationType {
    const { pi,pd,ci,cd,lfd, rfd, nfd, pfd } = this.getRelationVector(relation);
    return (cd && !pd && !lfd && !rfd && !nfd && !pfd)
      ? RelationType.DEFINED 
      : (!pi && !pd && ci && !cd && !lfd && !rfd && !nfd && !pfd)
        ? RelationType.INFERRED
        : null;
  };


  childrenCount():number {
    return this.getNeighbours()
    .reduce((prev,x) => {
      const rt = this.isChild(x[1]);
      return prev + ((rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED) ? 1:0);
    },0);
  }

  hasChildren ():boolean {
    return this.getNeighbours()
    .some(x => {
      const rt = this.isChild(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    });
  }

  getChildren():Neighbour[] {
    return this.getNeighbours()
      .filter(x => {
        const rt = this.isChild(x[1]);
        return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
      }).map(x=>{
        return {
          page: x[1].target,
          relationType: x[1].childType,
          typeDefinition: x[1].childTypeDefinition,
          linkDirection: x[1].direction
        }
      });//.sort
  }

  isParent (relation: Relation):RelationType {
    const { pi,pd,ci,cd,lfd, rfd, nfd, pfd } = this.getRelationVector(relation);
    return (!cd && pd && !lfd && !rfd && !nfd && !pfd)
      ? RelationType.DEFINED 
      : (pi && !pd && !ci && !cd && !lfd && !rfd && !nfd && !pfd)
        ? RelationType.INFERRED
        : null;
  }
  
  parentCount():number {
    return this.getNeighbours()
    .reduce((prev,x) => {
      const rt = this.isParent(x[1]);
      return prev + ((rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED) ? 1:0);
    },0);
  }

  hasParents():boolean { 
    return this.getNeighbours()
    .some(x => {
      const rt = this.isParent(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    });
  }

  getParents():Neighbour[] {
    return this.getNeighbours()
    .filter(x => {
      const rt = this.isParent(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    .map(x => {
      return {
        page: x[1].target,
        relationType: x[1].parentType,
        typeDefinition: x[1].parentTypeDefinition,
        linkDirection: x[1].direction
      }
    });//.sort
  }

  isLeftFriend (relation: Relation):RelationType {
    const { pi,pd,ci,cd,lfd, rfd, nfd, pfd } = this.getRelationVector(relation);
    let res = lfd
      ? RelationType.DEFINED 
      : (pi && !pd && ci && !cd && !lfd && !rfd && !nfd && !pfd) ||
        [pd, cd, lfd, rfd, nfd, pfd].filter(Boolean).length >= 2
        ? RelationType.INFERRED
        : null;
    return res;
  }

  leftFriendCount():number {
    const count = this.getNeighbours()
    .reduce((prev,x) => {
      const rt = this.isLeftFriend(x[1]);
      return prev + ((rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED) ? 1:0);
    },0);
    return count;
  }

  hasLeftFriends():boolean {
    const hasLeftFriends = this.getNeighbours()
    .some(x => {
      const rt = this.isLeftFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    return hasLeftFriends;
  }

  getLeftFriends():Neighbour[] {
    const neighbours = this.getNeighbours()
    .filter(x => {
      const rt = this.isLeftFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    .map(x => {
      return {
        page: x[1].target,
        relationType: x[1].leftFriendType ??
          ((x[1].parentType === RelationType.DEFINED && x[1].childType === RelationType.DEFINED)
          //case H
          ? RelationType.DEFINED
          //case I
          : RelationType.INFERRED),
        typeDefinition: x[1].leftFriendTypeDefinition,
        linkDirection: x[1].direction
      }
    });//.sort
    return neighbours;
  }

  isRightFriend (relation: Relation):RelationType {
    const { pd,cd,lfd, rfd, nfd, pfd } = this.getRelationVector(relation);
    return !pd && !cd && !lfd && rfd && !nfd && !pfd 
      ? RelationType.DEFINED 
      : null;
  }

  rightFriendCount():number {
    return this.getNeighbours()
    .reduce((prev,x) => {
      const rt = this.isRightFriend(x[1]);
      return prev + ((rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED) ? 1:0);
    },0);
  }

  hasRightFriends():boolean {
    return this.getNeighbours()
    .some(x => {
      const rt = this.isRightFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
  }

  getRightFriends():Neighbour[] {
    return this.getNeighbours()
    .filter(x => {
      const rt = this.isRightFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    .map(x => {
      return {
        page: x[1].target,
        relationType: RelationType.DEFINED,
        typeDefinition: x[1].rightFriendTypeDefinition,
        linkDirection: x[1].direction
      }
    });//.sort
  }

  isPreviousFriend (relation: Relation):RelationType {
    const { pd,cd,lfd, rfd, nfd, pfd } = this.getRelationVector(relation);
    let res = !pd && !cd && !lfd && !rfd && pfd && !nfd
      ? RelationType.DEFINED 
      : null;
    return res;
  }

  previousFriendCount():number {
    const count = this.getNeighbours()
    .reduce((prev,x) => {
      const rt = this.isPreviousFriend(x[1]);
      return prev + ((rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED) ? 1:0);
    },0);
    return count;
  }

  hasPreviousFriends():boolean {
    const hasPreviousFriends = this.getNeighbours()
    .some(x => {
      const rt = this.isPreviousFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    return hasPreviousFriends;
  }

  getPreviousFriends():Neighbour[] {
    return this.getNeighbours()
    .filter(x => {
      const rt = this.isPreviousFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    .map(x => {
      return {
        page: x[1].target,
        relationType: RelationType.DEFINED,
        typeDefinition: x[1].previousFriendTypeDefinition,
        linkDirection: x[1].direction
      }
    });//.sort
  }

  isNextFriend (relation: Relation):RelationType {
    const { pd,cd,lfd, rfd, nfd, pfd } = this.getRelationVector(relation);
    let res = !pd && !cd && !lfd && !rfd && !pfd && nfd
      ? RelationType.DEFINED 
      : null;
    return res;
  }

  nextFriendCount():number {
    const count = this.getNeighbours()
    .reduce((prev,x) => {
      const rt = this.isNextFriend(x[1]);
      return prev + ((rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED) ? 1:0);
    },0);
    return count;
  }

  hasNextFriends():boolean {
    const hasPreviousFriends = this.getNeighbours()
    .some(x => {
      const rt = this.isNextFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    return hasPreviousFriends;
  }

  getNextFriends():Neighbour[] {
    return this.getNeighbours()
    .filter(x => {
      const rt = this.isNextFriend(x[1]);
      return (rt && this.plugin.settings.showInferredNodes) || (rt === RelationType.DEFINED);
    })
    .map(x => {
      return {
        page: x[1].target,
        relationType: RelationType.DEFINED,
        typeDefinition: x[1].nextFriendTypeDefinition,
        linkDirection: x[1].direction
      }
    });//.sort
  }

  getSiblings():Neighbour[] {
    const siblings = new Map<string,Neighbour>();
    this.getParents().forEach(p => 
      p.page.getChildren().forEach(s => {
        if(siblings.has(s.page.path)) {
          if(s.relationType === RelationType.DEFINED) {
            siblings.get(s.page.path).relationType = RelationType.DEFINED;
          }
          return;
        }
        siblings.set(s.page.path,s);
      })
    );
    return Array.from(siblings.values());
  }
}