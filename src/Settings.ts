import {
  App,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { t } from "./lang/helpers";
import NeuroGraph from "./main";
import { Hierarchy } from "./Types";

export interface NeuroGraphSettings {
  hierarchy: Hierarchy;
}

export const DEFAULT_SETTINGS: NeuroGraphSettings = {
  hierarchy: {
    parents: ["Parent", "Parents", "up", "u"],
    children: ["Children", "Child", "down", "d"],
    friends: ["Friends", "Friend", "Jump", "Jumps", "j"]
  },
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

    
    const malformedJSON = containerEl.createEl("p", { text: t("JSON_MALFORMED"), cls:"neurograph-warning" });
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
              const j = JSON.parse(value);
              if(!(j.hasOwnProperty("parents") && j.hasOwnProperty("children") && j.hasOwnProperty("friends"))) {
                malformedJSON.setText(t("JSON_MISSING_KEYS"));
                malformedJSON.show();
                return;
              }
              if(!(Array.isArray(j.parents) && Array.isArray(j.children) && Array.isArray(j.friends))) {
                malformedJSON.setText(t("JSON_VALUES_NOT_STRING_ARRAYS"));
                malformedJSON.show();
                return;  
              }
              if(j.parents.length===0 || j.children.length===0 || j.friends.length === 0) {
                malformedJSON.setText(t("JSON_VALUES_NOT_STRING_ARRAYS"));
                malformedJSON.show();
                return;
              }
              if(!(j.parents.every((v:any)=>typeof v === "string") && j.children.every((v:any)=>typeof v === "string") && j.friends.every((v:any)=>typeof v === "string"))) {
                malformedJSON.setText(t("JSON_VALUES_NOT_STRING_ARRAYS"));
                malformedJSON.show();
                return;
              }
              malformedJSON.hide();
              this.hierarchy = value; 
            }
            catch {
              malformedJSON.setText(t("JSON_MALFORMED"));
              malformedJSON.show();
            }
        });
    });
  }
}
