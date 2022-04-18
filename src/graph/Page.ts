import { TFile } from "obsidian";

export enum RelationType {
  DEFINED,
  INFERRED
}

export type Relation = {
  type: RelationType;
  target: Page;
  definition: string;
}

export class Page {
  private path: string;
  private file: TFile;
  private children: Map<string,Relation>;
  private parents: Map<string,Relation>;
  private friends: Map<string,Relation>;

  constructor(path:string, file:TFile) {
    this.path = path;
    this.file = file;
    this.children = new Map<string,Relation>();
    this.parents = new Map<string,Relation>();
    this.friends = new Map<string,Relation>();
    
  }

  public get isVirtual(): boolean {
    return this.file === null;
  }

  public get isMarkdown(): boolean {
    //files that have not been created are assumed to be markdown files
    return this.file?.extension === "md" || !this.file;
  }

  addParent(page: Page, type:RelationType, definition: string) {

  }

  addChild(page: Page, type:RelationType, definition: string) {
  }

  addFriend(page: Page, type:RelationType, definition: string) {
  }
  
  getChildren() {
    return this.children;
  }

  getParents() {
    return this.parents;
  }

  getFriends() {
    return this.friends;
  }
}