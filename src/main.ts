import { App, MetadataCache, Notice, Plugin, PluginManifest, TAbstractFile, TFile, TFolder } from 'obsidian';
import { Page, RelationType } from './graph/Page';
import { DEFAULT_SETTINGS, NeuroGraphSettings, NeuroGraphSettingTab } from './Settings';
import { errorlog, log } from './utils/logging';
import { getAPI } from "obsidian-dataview"
import { t } from './lang/helpers';
import { PLUGIN_NAME } from './constants';
import { DvAPIInterface } from 'obsidian-dataview/lib/typings/api';
import { getDVFieldLinksForPage } from './utils/dataview';
import { Pages } from './graph/Pages';

declare module "obsidian" {
  interface App {
    plugins: {
      disablePlugin(plugin: string):Promise<any>;
    };
  }
}

export default class NeuroGraph extends Plugin {
  public settings:NeuroGraphSettings;
  private pages: Pages;
  public DVAPI: DvAPIInterface;
  
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.pages = new Pages(this);
  }

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new NeuroGraphSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(async()=>{
      this.DVAPI = getAPI();
      if(!this.DVAPI) {
        new Notice(t("DATAVIEW_NOT_FOUND"),4000);
        errorlog({fn:this.onload, where:"main.ts/onload()", message:"Dataview not found"});
        this.app.plugins.disablePlugin(PLUGIN_NAME)
        return;
      }
      this.initializeIndexer();
    });
	}

  private initializeIndexer() {
    this.registerMetaCacheEventHandlers();
    const start = Date.now();
    const resolvedLinks = this.app.metadataCache.resolvedLinks;

    //Add all existing files
    for(const f of this.app.vault.getFiles()) {
      this.pages.add(f.path,new Page(f.path,f));
    }
    //Add all unresolved links and make child of page where it was found
    this.pages.addUnresolvedLinks()
    //Add all links as inferred children to pages on which they were found
    this.pages.addResolvedLinks();
    //Iterate all pages and add defined links based on Dataview fields
    this.pages.forEach((page:Page,key:string)=>{
      if(!page?.file) return;
      this.pages.addDVFieldLinksToPage(page);
    })

    log(`NeuroGraph initialized ${this.pages.size} number of pages in ${Date.now()-start}ms`);
  }

  private registerMetaCacheEventHandlers() {
    const metaCache: MetadataCache = self.app.metadataCache;

    this.registerEvent(
      metaCache.on("dataview:metadata-change",(type:string, file: TAbstractFile|TFile, oldPath?: string) => {
        if(type!=="rename") return;
        if(!(file instanceof TFile)) return;
        this.pages.delete(oldPath);
        this.pages.addWithConnections(file);
        //register page: path
        log({type,fileType: file instanceof TFile ? "file":"folder", path:file.path,oldPath});
      })
    );
    this.registerEvent(
      metaCache.on("dataview:metadata-change",(type:string, file: TFile) => {
        if(type==="rename") return;
        switch (type) {
          case "update":
            this.pages.delete(file.path);
            this.pages.addWithConnections(file);
            break;
          case "delete":
            this.pages.delete(file.path);
            break;
        }
        log({type, path:file.path});       
      })
    );
  }

	onunload() {
    Object.keys(app.metadataCache.unresolvedLinks)
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

