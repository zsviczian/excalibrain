import { TFile } from "obsidian";
import ExcaliBrain from "src/main";

export enum RelationType {
  DEFINED,
  INFERRED
}

export type Relation = {
  target: Page;
  isParent: boolean;
  parentType?: RelationType;
  parentTypeDefinition?: string;
  isChild: boolean;
  childType?: RelationType;
  childTypeDefinition?: string;
  isFriend: boolean;
  friendType?: RelationType;
  friendTypeDefinition?: string;
}

const DEFAULT_RELATION:Relation = {
  target: null,
  isParent: false,
  isChild: false,
  isFriend: false
}

export class Page {
  public path: string;
  public file: TFile;
  public neighbours: Map<string,Relation>;
  public plugin: ExcaliBrain;
  public dvPage: Record<string, any>; 
  
  constructor(path:string, file:TFile, plugin: ExcaliBrain) {
    this.path = path;
    this.file = file;
    this.neighbours = new Map<string,Relation>();
    this.plugin = plugin;
  }

  public get isVirtual(): boolean {
    return this.file === null;
  }

  public get isMarkdown(): boolean {
    //files that have not been created are assumed to be markdown files
    return this.file?.extension === "md" || !this.file;
  }

  //-----------------------------------------------
  // add relationships
  //-----------------------------------------------
  addParent(page: Page, relationType:RelationType, definition?: string) {
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isParent = true;
      neighbour.parentType = relationType;
      neighbour.parentTypeDefinition = definition;
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isParent: true,
      parentType: relationType,
      parentTypeDefinition: definition,
    });
  }

  addChild(page: Page, relationType:RelationType, definition?: string) {
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isChild = true;
      neighbour.childType = relationType;
      neighbour.childTypeDefinition = definition;
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isChild: true,
      childType: relationType,
      childTypeDefinition: definition,
    });
  }

  addFriend(page: Page, relationType:RelationType, definition?: string) {
    const neighbour = this.neighbours.get(page.path);
    if(neighbour) {
      neighbour.isFriend = true;
      neighbour.friendType = relationType;
      neighbour.friendTypeDefinition = definition;
      return;
    }
    this.neighbours.set(page.path, {
      ...DEFAULT_RELATION,
      target: page,
      isFriend: true,
      friendType: relationType,
      friendTypeDefinition: definition,
    });
  }
  
  unlinkNeighbour(pagePath: string) {
    this.neighbours.delete(pagePath);
  }

  //-----------------------------------------------
  //see: getRelationLogic.excalidraw
  //-----------------------------------------------
  hasChildren():boolean {
    return Array.from(this.neighbours).some(x=>{
      const relation = x[1];
      return relation.isChild && 
        //case: A, B
        ((!relation.isParent && !relation.isFriend) ||
        //case: F
        (relation.isParent && relation.parentType === RelationType.INFERRED &&
          relation.childType === RelationType.DEFINED && !relation.isFriend));
    })
  }

  getChildren() {
    return Array.from(this.neighbours).filter(x=>{
      const relation = x[1];
      return relation.isChild && 
        //case: A, B
        ((!relation.isParent && !relation.isFriend) ||
        //case: F
        (relation.isParent && relation.parentType === RelationType.INFERRED &&
          relation.childType === RelationType.DEFINED && !relation.isFriend));
    }).map(x=>{
      return {
        page: x[1].target,
        relationType: x[1].childType,
        typeDefinition: x[1].childTypeDefinition
      }
    })//.sort;
  }

  hasParents():boolean {
    return Array.from(this.neighbours).some(x=>{
      const relation = x[1];
      return relation.isParent && 
        //case: C, D
        ((!relation.isChild && !relation.isFriend) ||
        //case: G
        (relation.isChild && relation.childType === RelationType.INFERRED &&
          relation.parentType === RelationType.DEFINED && !relation.isFriend));
    })
  }

  getParents() {
    return Array.from(this.neighbours).filter(x=>{
      const relation = x[1];
      return relation.isParent && 
        //case: C, D
        ((!relation.isChild && !relation.isFriend) ||
        //case: G
        (relation.isChild && relation.childType === RelationType.INFERRED &&
          relation.parentType === RelationType.DEFINED && !relation.isFriend));
    }).map(x=>{
      return {
        page: x[1].target,
        relationType: x[1].parentType,
        typeDefinition: x[1].parentTypeDefinition
      }
    })//.sort;
  }

  hasFriends():boolean {
    return Array.from(this.neighbours).some(x=>{
      const relation = x[1];
      //case E, J, K, L, M, N, O, P, Q
      return relation.isFriend ||
        //case H, I
        (relation.isParent && relation.isChild && !relation.isFriend);
    })
  }

  getFriends() {
    return Array.from(this.neighbours).filter(x=>{
      const relation = x[1];
      //case E, J, K, L, M, N, O, P, Q
      return relation.isFriend ||
        //case H, I
        (relation.isParent && relation.isChild && !relation.isFriend);
    }).map(x=>{
      return {
        page: x[1].target,
        relationType: x[1].friendType??
          (x[1].parentType === RelationType.DEFINED && x[1].childType === RelationType.DEFINED)
          //case H
          ? RelationType.DEFINED
          //case I
          : RelationType.INFERRED,
        typeDefinition: x[1].friendTypeDefinition
      }
    })//.sort;
  }

  getSiblings() {
    const siblings = new Set<Page>();
    this.getParents().forEach(p => siblings.add(p.page))
    return Array.from(siblings);//.sort
  }
}