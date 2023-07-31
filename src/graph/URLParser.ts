import { App, TFile, Vault } from "obsidian";
import ExcaliBrain from "src/excalibrain-main";

export interface FileURL {
  url: string;
  alias: string;
  origin: string;
}

// Matches links in markdown format [label](url)
export const linkRegex = /(?:\[([^[\]]+)\]\()((?:(?:ftp|https?|sftp|shttp|tftp):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>"']|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))\)|\b()((?:(?:ftp|https?|sftp|shttp|tftp):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>"']|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))\b/gi;

export class URLParser {
  fileToUrlMap: Map<TFile, FileURL[]> = new Map();
  fileUrlInverseMap: Map<string, { files: TFile[]; origin: string }> = new Map();
  hosts: string[] = [];
  app: App;
  initalized: boolean = false;

  constructor(private plugin: ExcaliBrain) {
    this.app = plugin.app;
  }

  public async init(): Promise<void> {
    const startTimestamp = Date.now();
    const markdownFiles = this.app.vault.getMarkdownFiles();
    for (const file of markdownFiles) {
      await this.parseFileURLs(file);
    }

    this.registerFileEvents();
    this.initalized = true;
    console.log(`ExcaliBrain indexed ${
      this.fileUrlInverseMap.size} URLs from ${
      this.hosts.length} unique hosts in ${
      this.fileToUrlMap.size} of ${markdownFiles.length} markdown files in ${
      ((Date.now()-startTimestamp)/1000).toFixed(1)} seconds`);
  }

  private getOrigin(url:string, file: TFile):string {
    try {
      return new URL(url).origin;
    } catch (e) {
      console.log(`ExcaliBrain URLParser: Invalid URL ${url} in file ${file.path}`);
      return ":Unknown Origin:";
    }
  }

  private async parseFileURLs(file: TFile): Promise<void> {
    const content = await this.app.vault.cachedRead(file);
    const links = new Map<string,FileURL>();

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const alias = match[1] ?? match[3] ?? "";
      let url = match[2] ?? match[4] ?? "";
      if(!url.match(/^(?:ftp|https?|sftp|shttp|tftp):/)) {
        url = "https://" + url;
      }
      if (!links.has(url)) {
        const origin = this.getOrigin(url,file);
        links.set(url,{ url, alias, origin});
        this.updateInverseMap(url, file, origin);
      } else if(alias !== "") {
        const link = links.get(url);
        if(link.alias === "") {
          links.set(url,{...link,alias});
        }
      }
    }

    const linkArray = Array.from(links.values());
    if (linkArray.length > 0) {
      this.fileToUrlMap.set(file, linkArray);
    }
  }

  private updateInverseMap(url: string, file: TFile, origin: string): void {
    if (!this.fileUrlInverseMap.has(url)) {
      this.fileUrlInverseMap.set(url, { files: [], origin});
    }

    const data = this.fileUrlInverseMap.get(url);
    if (data) {
      if (!data.files.includes(file)) {
        data.files.push(file);
      }
      if (!this.hosts.includes(data.origin)) {
        this.hosts.push(data.origin);
      }
    }
  }

  private registerFileEvents(): void {
    const modifyEventHandler = (file: TFile) => {
      deleteEventHandler(file);
      this.parseFileURLs(file);
    };

    const deleteEventHandler = (file: TFile) => {
      const urls = this.fileToUrlMap.get(file);
      this.fileToUrlMap.delete(file);
      if(urls) {
        urls.forEach((url) => {
          const data = this.fileUrlInverseMap.get(url.url);
          if (data) {
            data.files = data.files.filter((f) => f !== file);
            if (data.files.length === 0) {
              this.fileUrlInverseMap.delete(url.url);
              this.hosts = this.hosts.filter((h) => h !== data.origin);
              return;
            }
            this.fileUrlInverseMap.set(url.url, data);
          }
        });
      }
      
    }

    this.plugin.registerEvent(this.app.vault.on('create', modifyEventHandler));
    this.plugin.registerEvent(this.app.vault.on('modify', modifyEventHandler));
    this.plugin.registerEvent(this.app.vault.on('delete', deleteEventHandler));
  }

}
