import { App, TFile } from "obsidian";
import { Literal } from "obsidian-dataview/lib/data-model/value";
import ExcaliBrain from "src/main";
import { ExcaliBrainSettings } from "src/Settings";
import { NodeStyle } from "src/Types";

const getPathOrSelf = (app: App, link:string, hostPath:string):string => {
  const f = app.metadataCache.getFirstLinkpathDest(link,hostPath);
  return f ? f.path : link;
}

const readLinksFromString = (data: string, file:TFile):string[] => {
  const res = new Set<string>();
  //               wiki link                    markdown link 
  const linkReg = /[^[]*\[\[(?<wikiLink>[^#\]\|]*)[^\]]*]]|\[[^\]]*]\((?<mdLink>[^)]*)\)/g;
  const m = data.matchAll(linkReg);
  let r;
  while(!(r=m.next()).done) {
    if(r?.value?.groups?.wikiLink) {
      const path = getPathOrSelf(app, r.value.groups.wikiLink,file.path);
      if(path) { 
        res.add(path);
      }
    }
    if(r?.value?.groups?.mdLink) {
      const path = getPathOrSelf(app, decodeURIComponent(r.value.groups.mdLink),file.path);
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
    const values =  Array.from(field.values())
    //List of links
    values
      .filter((l:any)=>l?.type && (l.type === "file" || l.type === "header" || l.type=="block"))
      .forEach((l:any)=>{
        const path = getPathOrSelf(app, l.path,file.path);
        if(path) {
          res.add(path);
        }
      });

    //string: e.g. list of virtual links
    const stringLinks:string[] = readLinksFromString(values
      .filter((l:any)=>typeof l === "string")
      .join(" "),file)

    //links in the frontmatter
    //! currently there is an issue with case sensitivity. DataView retains case sensitivity of links for the front matter, but not the others
    const objectLinks:string[] = values
      .filter((l:any) => l?.values && typeof l === "object" && typeof l.values[0] === "string")
      .map((l:any)=>getPathOrSelf(app,l.values[0],file.path))

    return Array.from(res).concat(stringLinks).concat(objectLinks);
  }

  //the field is a single link
  if(field.path) {
    const path = getPathOrSelf(app,field.path,file.path); 
    return path ? [path] : [];
  }

  if(typeof field === "string") {
    //the field is a string that may contain a link
    return readLinksFromString(field,file);
  }

  //other type of field, e.g. Datetime field
  return [];
}

export const getDVFieldLinksForPage = (plugin: ExcaliBrain, dvPage: Record<string, Literal>, fields: string[]):{link:string,field:string}[] => {
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

export const getPrimaryTag = (
  dvPage: Record<string, Literal>,
  settings: ExcaliBrainSettings
):string => {
  if(!dvPage) return null;
  return (dvPage.file?.tags?.values??[])
    .filter((t:string)=>settings.tagStyleList.some(x=>t.startsWith(x)))[0];
}



export const getTagStyle = (
  tag:string,
  settings: ExcaliBrainSettings
):NodeStyle => {
  if(!tag) {
    return {};
  }
  return settings.tagNodeStyles[settings.tagStyleList.filter(x=>tag.startsWith(x))[0]];
}