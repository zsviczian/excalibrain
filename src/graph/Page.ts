import { TFile } from "obsidian";
import ExcaliBrain from "src/main";
import { Neighbour, Relation, RelationType } from "src/Types";



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
  isChild = (relation: Relation):boolean => relation.isChild && 
    //case: A, B
    ((!relation.isParent && !relation.isFriend) ||
    //case: F
    (relation.isParent && relation.parentType === RelationType.INFERRED &&
      relation.childType === RelationType.DEFINED && !relation.isFriend));

  hasChildren = ():boolean => Array.from(this.neighbours)
    .some(x => this.isChild(x[1]));

  getChildren = ():Neighbour[] => Array.from(this.neighbours)
    .filter(x => this.isChild(x[1]))
    .map(x=>{
      return {
        page: x[1].target,
        relationType: x[1].childType,
        typeDefinition: x[1].childTypeDefinition
      }
    });//.sort

  isParent = (relation: Relation):boolean => relation.isParent && 
    //case: C, D
    ((!relation.isChild && !relation.isFriend) ||
    //case: G
    (relation.isChild && relation.childType === RelationType.INFERRED &&
      relation.parentType === RelationType.DEFINED && !relation.isFriend));
  

  hasParents = ():boolean => Array.from(this.neighbours)
    .some(x => this.isParent(x[1]));

  getParents = ():Neighbour[] => Array.from(this.neighbours)
    .filter(x => this.isParent(x[1]))
    .map(x => {
      return {
        page: x[1].target,
        relationType: x[1].parentType,
        typeDefinition: x[1].parentTypeDefinition
      }
    });//.sort

  isFriend = (relation: Relation):boolean =>
    //case E, J, K, L, M, N, O, P, Q  
    relation.isFriend ||
    //case H, I
    (relation.isParent && relation.isChild && !relation.isFriend);

  hasFriends = ():boolean => Array.from(this.neighbours)
    .some(x => this.isFriend(x[1]))

  getFriends = ():Neighbour[] => Array.from(this.neighbours)
    .filter(x => this.isFriend(x[1]))
    .map(x => {
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
    });//.sort
  

  getRelationToPage(otherPage:Page):null|{
    type: "friend" | "parent" | "child",
    relationType: RelationType;
    typeDefinition: string,
  } {
    const relation = this.neighbours.get(otherPage.path)
    if(!relation) {
      return null;
    }
    if(this.isChild(relation)) {
      return {
        type: "child",
        relationType: relation.childType,
        typeDefinition: relation.childTypeDefinition
      }
    }
    if(this.isParent(relation)) {
      return {
        type: "parent",
        relationType: relation.parentType,
        typeDefinition: relation.parentTypeDefinition
      }
    }
    else return {
      type: "friend",
      relationType: relation.friendType,
      typeDefinition: relation.friendTypeDefinition
    }
  }

  getSiblings():Neighbour[] {
    const siblings = new Map<string,Neighbour>();
    this.getParents().forEach(p => {
      if(siblings.has(p.page.path)) {
        if(p.relationType === RelationType.DEFINED) {
          siblings.get(p.page.path).relationType = RelationType.DEFINED;
        }
        return;
      }
      siblings.set(p.page.path,p);
    })
    return Object.values(siblings);
  }
}