import { App, MetadataCache, Notice, Plugin, PluginManifest } from 'obsidian';
import { Page, RelationType } from './graph/Page';
import { DEFAULT_SETTINGS, NeuroGraphSettings, NeuroGraphSettingTab } from './Settings';
import { errorlog, log } from './utils/logging';
import { getAPI } from "obsidian-dataview"
import { t } from './lang/helpers';
import { PLUGIN_NAME } from './constants';

declare module "obsidian" {
  interface App {
    plugins: {
      disablePlugin(plugin: string):Promise<any>;
    };
  }
}

export default class NeuroGraph extends Plugin {
  public settings:NeuroGraphSettings;
  private pages: Map<string,Page>;
  
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.pages = new Map<string,Page>();
  }

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new NeuroGraphSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(async()=>{
      if(!getAPI()) {
        new Notice(t("DATAVIEW_NOT_FOUND"),4000);
        errorlog({fn:this.onload, where:"main.ts/onload()", message:"Dataview not found"});
        this.app.plugins.disablePlugin(PLUGIN_NAME)
        return;
      }
      this.initializeIndexer();
    });
	}

  private initializeIndexer() {
//    this.registerMetaCacheEventHandlers();
    const start = Date.now();
    for(const f of this.app.vault.getFiles()) {
      this.pages.set(f.path,new Page(f.path,f));
    }
    Object.keys(this.app.metadataCache.unresolvedLinks).forEach(
      parentPath=>Object.keys(parentPath).forEach(childPath=>{
        const page = new Page(childPath,null);
        const parent = this.pages.get(parentPath);
        this.pages.set(childPath,page);
        page.addParent(parent,RelationType.INFERRED);
        parent.addChild(page,RelationType.INFERRED);
      })
    )
    Object.keys(app.metadataCache.resolvedLinks).forEach(
      parentPath=>Object.keys(parentPath).forEach(childPath=>{
        const child = this.pages.get(childPath);
        const parent = this.pages.get(parentPath);
        child.addParent(parent,RelationType.INFERRED);
        parent.addChild(child,RelationType.INFERRED);
      })
    )

    log(`NeuroGraph initialized ${this.pages.size} number of pages in ${Date.now()-start}ms`);
  }

  private registerMetaCacheEventHandlers() {
    const metaCache: MetadataCache = self.app.metadataCache;
    this.registerEvent(
      metaCache.on("changed", (file, data, cache) =>
        log({type:"changed",file,data,cache}),
      ),
    );

    this.registerEvent(
      metaCache.on("deleted", (file, prevCache) =>
        log({type:"deleted", file, prevCache}),
      ),
    );

    this.registerEvent(
      metaCache.on("resolve", (file) =>
        log({type:"resolve", file, resolvedLinks: app.metadataCache.resolvedLinks[file.path], unresolvedLinks: app.metadataCache.unresolvedLinks[file.path]}),
      ),
    );

    this.registerEvent(
      metaCache.on("resolved", () =>
        log("resolve"),
      ),
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
