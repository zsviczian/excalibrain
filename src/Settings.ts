import {
  App,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { t } from "./lang/helpers";
import NeuroGraph from "./main";

export interface NeuroGraphSettings {
  hierarchy: {};
}

export const DEFAULT_SETTINGS: NeuroGraphSettings = {
  hierarchy: {},
};

const fragWithHTML = (html: string) =>
  createFragment((frag) => (frag.createDiv().innerHTML = html));

export class NeuroGraphSettingTab extends PluginSettingTab {
  plugin: NeuroGraph;
  private hierarchy: string = null;

  constructor(app: App, plugin: NeuroGraph) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async hide() {
    if(this.hierarchy) {
      this.plugin.settings.hierarchy = JSON.parse(this.hierarchy);
    }
    await this.plugin.saveSettings();
  }

  async display() {
    await this.plugin.loadSettings(); //in case sync loaded changed settings in the background
    const { containerEl } = this;
    this.containerEl.empty();

    const coffeeDiv = containerEl.createDiv("coffee");
    coffeeDiv.addClass("ex-coffee-div");
    const coffeeLink = coffeeDiv.createEl("a", {
      href: "https://ko-fi.com/zsolt",
    });
    const coffeeImg = coffeeLink.createEl("img", {
      attr: {
        src: "https://cdn.ko-fi.com/cdn/kofi3.png?v=3",
      },
    });
    coffeeImg.height = 45;

    
    const malformedJSON = containerEl.createEl("p", { text: t("MALFORMED_JSON"), cls:"neurograph-warning" });
    malformedJSON.hide();
    new Setting(containerEl)
      .setName(t("HIERARCHY_NAME"))
      .setDesc(fragWithHTML(t("HIERARCHY_DESC")))
      .addTextArea((text) => {
        text.inputEl.style.minHeight = "300px";
        text.inputEl.style.minWidth = "400px";
        text
          .setValue(JSON.stringify(this.plugin.settings.hierarchy,null,2))
          .onChange((value) => {
            try {
              JSON.parse(value);
              malformedJSON.hide();
              this.hierarchy = value;
            }
            catch {
              malformedJSON.show();
            }
        });
    });
  }
}
