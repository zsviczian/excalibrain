import { App, TFile, Vault } from "obsidian";
import ExcaliBrain from "src/excalibrain-main";

export interface FileURL {
  url: string;
  alias: string;
  origin: string;
}

export const linkRegex = /\[([^[\]]+)\]\((https?:\d*?\/\/[a-z0-9&#=.\/\-?_]+)\)/gi; // Matches links in markdown format [label](url)
export const plainLinkRegex = /(https?:\d*?\/\/[a-z0-9&#=.\/\-?_]+)/gi; // Matches plain links

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
      const [, alias, url] = match;
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

    while ((match = plainLinkRegex.exec(content)) !== null) {
      const url = match[0];
      if (!links.has(url)) {
        const origin = this.getOrigin(url,file);
        links.set(url, { url, alias: '', origin});
        this.updateInverseMap(url, file, origin);
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
    const modifyEventHandler = async (file: TFile) => {
      await this.parseFileURLs(file);
    };

    this.plugin.registerEvent(this.app.vault.on('create', modifyEventHandler));
    this.plugin.registerEvent(this.app.vault.on('modify', modifyEventHandler));
    this.plugin.registerEvent(this.app.vault.on('delete', (file:TFile) => this.fileToUrlMap.delete(file)));
    this.plugin.registerEvent(this.app.vault.on('rename', async (file:TFile) => {
      this.fileToUrlMap.delete(file);
      await this.parseFileURLs(file);
    }));
  }

}
