import { App, TFile } from "obsidian";
import { Page } from "src/graph/Page";
import ExcaliBrain from "src/main";
import { ExcaliBrainSettings } from "src/Settings";
import { NodeStyle } from "src/Types";

const getPathOrSelf = (app: App, link:string, hostPath:string):string => {
  const f = app.metadataCache.getFirstLinkpathDest(link,hostPath);
  return f ? f.path : link;
}

const readLinksFromString = (data: string, file:TFile):string[] => {
  const res = new Set<string>();
  const linkReg = /[^[]*\[\[([^#\]\|]*)[^\]]*]]/g;
  const m = data.matchAll(linkReg);
  let r;
  while(!(r=m.next()).done) {
    if(r.value[1]) {
      const path = getPathOrSelf(app, r.value[1],file.path);
      if(path) { 
        res.add(path);
      }
    }
  }
  return Array.from(res);
}

const readDVField = (app: App, field: any, file:TFile):string[] => {
  const res = new Set<string>();

  //the field is a list of links
  if(field.values) {
    field
    .values
    .filter((l:any)=>l.type === "file" || l.type === "header")
    .forEach((l:any)=>{
      const path = getPathOrSelf(app, l.path,file.path);
      if(path) {
        res.add(path);
      }
    });
    if(res.size > 0) return Array.from(res);

    if(typeof field.values[0] === "string") {
      return readLinksFromString(field.values.join(" "),file);
    }

    if(typeof field.values[0] === "object" && typeof field.values[0].values[0] === "string") {
      return [getPathOrSelf(app,field.values[0]?.values[0],file.path)];
    }
  }

  //the field is a single link
  if(field.path) {
    const path = getPathOrSelf(app,field.path,file.path); 
    return path ? [path] : [];
  }

  //the field is a string that may contain a link
  return readLinksFromString(field,file);
}

export const getDVFieldLinksForPage = (plugin: ExcaliBrain, dvPage: Record<string, any>, fields: string[]):{link:string,field:string}[] => {
  const links:{link:string,field:string}[] = [];
  const processed = new Set();
  fields.forEach(f => {
    //f = f.toLowerCase().replaceAll(" ","-");
    const fieldvals = dvPage[f];
    if(fieldvals && !processed.has(f)) {
      processed.add(f);
      readDVField(plugin.app,fieldvals,dvPage.file).forEach(l=>links.push({link:l,field:f}))
    };
  });
  return links;
}

export const getTagStyle = (
  dvPage: Record<string, any>,
  settings: ExcaliBrainSettings
):NodeStyle => {
  if(!dvPage) return {};
  const tag = (dvPage.file?.tags?.values??[])
    .filter((t:string)=>settings.tagStyleList.some(x=>t.startsWith(x)))[0];
  if(!tag) {
    return {};
  }
  return settings.tagNodeStyles[settings.tagStyleList.filter(x=>tag.startsWith(x))[0]];
}