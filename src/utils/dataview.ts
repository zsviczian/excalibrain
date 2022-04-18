import { App, TFile } from "obsidian";
import NeuroGraph from "src/main";

const getPathOrSelf = (app: App, link:string, hostPath:string) => 
  (app.metadataCache.getFirstLinkpathDest(link,hostPath)?.path)??link;

const readDVField = (app: App, field: any, file:TFile) => {
  const res = new Set();

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

const getDVFieldLinks = (plugin: NeuroGraph, page: Record<string, any>, direction: string) => {
  const fields = plugin.settings.hierarchy[direction];
  const links = new Set();
  const processed = new Set();
  fields.forEach(f => {
    if(page[f] && !processed.has(f)) {
      processed.add(f);
      readDVField(plugin.app,page[f],page.file).forEach(l=>links.add(l))
    };
  });
  return Array.from(links);
}