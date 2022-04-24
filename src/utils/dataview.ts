import { App, TFile } from "obsidian";
import { Page } from "src/graph/Page";
import ExcaliBrain from "src/main";

const getPathOrSelf = (app: App, link:string, hostPath:string, includeAttachments:boolean):string => {
  const f = app.metadataCache.getFirstLinkpathDest(link,hostPath);
  return f
    ? ((includeAttachments || f.extension === "md") ? f.path : null)
    : link;
}

const readDVField = (app: App, field: any, file:TFile, includeAttachments:boolean):string[] => {
  const res = new Set<string>();

  //the field is a list of links
  if(field.values) {
    field.values.forEach((l:any)=>{
      if(l.type === "file") {
        const path = getPathOrSelf(app, l.path,file.path, includeAttachments);
        if(path) {
          res.add(path);
        }
      }
    });
    return Array.from(res);
  }

  //the field is a single link
  if(field.path) {
    const path = getPathOrSelf(app,field.path,file.path, includeAttachments); 
    return path ? [path] : [];
  }

  //the field is a string that may contain a link
  const m = field.matchAll(/[^[]*\[\[([^#\]\|]*)[^\]]*]]/g);
  let r;
  while(!(r=m.next()).done) {
    if(r.value[1]) {
      const path = getPathOrSelf(app, r.value[1],file.path, includeAttachments);
      if(path) { 
        res.add(path);
      }
    }
  }
  return Array.from(res);
}

export const getDVFieldLinksForPage = (plugin: ExcaliBrain, dvPage: Record<string, any>, fields: string[],includeAttachments: boolean):{link:string,field:string}[] => {
  const links:{link:string,field:string}[] = [];
  const processed = new Set();
  fields.forEach(f => {
    if(dvPage[f] && !processed.has(f)) {
      processed.add(f);
      readDVField(plugin.app,dvPage[f],dvPage.file, includeAttachments).forEach(l=>links.push({link:l,field:f}))
    };
  });
  return links;
}