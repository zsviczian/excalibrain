import { App } from "obsidian";
import ExcaliBrain from "src/excalibrain-main";
import { LinkDirection, Relation, RelationType } from "src/types";
import { Page} from "./Page";

export class Pages {
  private pages = new Map<string,Page>();
  private app: App;
  private plugin: ExcaliBrain;

  constructor (plugin: ExcaliBrain) {
    this.app = plugin.app;
    this.plugin = plugin;
  }

  public add(path: string, page: Page) {
    this.pages.set(path,page);
  }

  public has(path:string) : boolean {
    return this.pages.has(path);
  }

  public get(path:string): Page {
    return this.pages.get(path);
  }

  public getPages(): Page[] {
    return Array.from(this.pages.values());
  }

  public forEach = this.pages.forEach.bind(this.pages);
  public get size():number {
     return this.pages.size;
  }

  public delete(toBeDeletedPath:string) {
    const page = this.pages.get(toBeDeletedPath);
    if(!page) return;
    page.neighbours.forEach((relation:Relation, neighbourPath:string) => {
      const p = this.pages.get(neighbourPath);
      if(!p) return;
      p.unlinkNeighbour(toBeDeletedPath);
      //if neighbor is an unresolved link and no other files link to this unresolved links
      if(!p.file && p.neighbours.size === 0) {
        this.pages.delete(neighbourPath);
      }
    })
    this.pages.delete(toBeDeletedPath);
  }

  private addInferredParentChild(parent: Page, child: Page) {
    if(this.plugin.settings.inferAllLinksAsFriends) {
      child.addLeftFriend(parent,RelationType.INFERRED, LinkDirection.TO);
      parent.addLeftFriend(child,RelationType.INFERRED, LinkDirection.FROM);
    } else {
      if(this.plugin.settings.inverseInfer) { //https://github.com/zsviczian/excalibrain/issues/78
        child.addChild(parent,RelationType.INFERRED, LinkDirection.TO);
        parent.addParent(child,RelationType.INFERRED, LinkDirection.FROM);
      } else {
        child.addParent(parent,RelationType.INFERRED, LinkDirection.TO);
        parent.addChild(child,RelationType.INFERRED, LinkDirection.FROM);
      }
    }    
  }

  public addResolvedLinks(page?: Page) {
    const resolvedLinks = this.app.metadataCache.resolvedLinks;
    Object.keys(resolvedLinks).forEach(parentPath=>{
      if(page && page.path !== parentPath) {
        return;
      }
      const parent = this.pages.get(parentPath);
      Object.keys(resolvedLinks[parentPath]).forEach(childPath=>{
        let child = this.pages.get(childPath);
        if(!child) {
          //path case sensitivity issue
          child = this.pages.get(this.plugin.lowercasePathMap.get(childPath.toLowerCase()));
        }
        this.addInferredParentChild(parent,child);
      })
    }); 
  }

  public addPageURLs() {
    this.plugin.urlParser.fileToUrlMap.forEach((value, key)=>{
      const page=this.get(key.path);
      if(!page) return;
      value.forEach(url=>{
        let urlPage = this.get(url.url);
        if(!urlPage) {
          urlPage = new Page(this,url.url,null,this.plugin,false,false,url.alias,url.url);
          this.add(url.url, urlPage);
        }
        this.addInferredParentChild(page,urlPage);
        const originPage = this.get(url.origin);
        if(originPage) {
          urlPage.addParent(originPage,RelationType.INFERRED,LinkDirection.FROM);
          originPage.addChild(urlPage,RelationType.INFERRED,LinkDirection.TO);
        }
      })
    })
  }

  /**
   * @param page if undefined add unresolved links for all the pages
   */
  public addUnresolvedLinks(page?:Page) {
    if(page && (page.isFolder || page.isTag)) {
      return;
    }
    const unresolvedLinks = this.app.metadataCache.unresolvedLinks;
    Object.keys(unresolvedLinks).forEach(parentPath=>{
      if(page && page.path !== parentPath) {
        return;
      }
      let parent = this.pages.get(parentPath);
      if(!parent) {
        //path case sensitivity issue
        //Obsidian seems to store an all lower case path and a proper-case path in unresolvedLinks
        //I can throw away parentPaths that do not resolve, as the version with the proper case is also there
        return;
      }
      if(parentPath === this.plugin.settings.excalibrainFilepath) {
        return;
      }
      Object.keys(unresolvedLinks[parentPath]).forEach(childPath=>
        addUnresolvedPage(childPath, parent, this.plugin, this)        
      );
    });
  }
}

export const addUnresolvedPage = (childPath: string, parent: Page, plugin: ExcaliBrain, pages: Pages):Page => {
  const newPage = pages.get(childPath) ?? new Page(pages,childPath,null,plugin);
  if(plugin.settings.inferAllLinksAsFriends) {
    newPage.addLeftFriend(parent,RelationType.INFERRED, LinkDirection.TO);
    parent.addLeftFriend(newPage,RelationType.INFERRED, LinkDirection.FROM);
  } else {
    if(plugin.settings.inverseInfer) { //https://github.com/zsviczian/excalibrain/issues/78
      newPage.addChild(parent,RelationType.INFERRED, LinkDirection.TO);
      parent.addParent(newPage,RelationType.INFERRED, LinkDirection.FROM);
    } else {
      newPage.addParent(parent,RelationType.INFERRED, LinkDirection.TO);
      parent.addChild(newPage,RelationType.INFERRED, LinkDirection.FROM);
    }
  }
  pages.add(childPath,newPage);
  return newPage;
}