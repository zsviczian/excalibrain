import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginManifest, PluginSettingTab, Setting } from 'obsidian';
import { Page } from './graph/Page';
import { DEFAULT_SETTINGS, NeuroGraphSettings, NeuroGraphSettingTab } from './Settings';

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
    this.initializePages();
	}

  private initializePages() {
    
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
