import { App, TFile } from "obsidian";
import { Page } from "src/graph/Page";
import ExcaliBrain from "src/main";

const getPathOrSelf = (app: App, link:string, hostPath:string):string => 
  (app.metadataCache.getFirstLinkpathDest(link,hostPath)?.path)??link;

const readDVField = (app: App, field: any, file:TFile):string[] => {
  const res = new Set<string>();

  //the field is a list of links
  if(field.values) {
    field.values.forEach((l:any)=>{
      if(l.type === "file") {
        res.add(getPathOrSelf(app, l.path,file.path));
      }
    });
    return Array.from(res);
  }

  //the field is a single link
  if(field.path) {
    return [getPathOrSelf(app,field.path,file.path)];
  }

  //the field is a string that may contain a link
  const m = field.matchAll(/[^[]*\[\[([^#\]\|]*)[^\]]*]]/g);
  let r;
  while(!(r=m.next()).done) {
    if(r.value[1]) {
      res.add(getPathOrSelf(app, r.value[1],file.path));
    }
  }
  return Array.from(res);
}

export const getDVFieldLinksForPage = (plugin: ExcaliBrain, dvPage: Record<string, any>, fields: string[]):{link:string,field:string}[] => {
  const links:{link:string,field:string}[] = [];
  const processed = new Set();
  fields.forEach(f => {
    if(dvPage[f] && !processed.has(f)) {
      processed.add(f);
      readDVField(plugin.app,dvPage[f],dvPage.file).forEach(l=>links.push({link:l,field:f}))
    };
  });
  return links;
}