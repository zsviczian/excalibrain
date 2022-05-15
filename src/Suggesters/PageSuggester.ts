// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App,  prepareFuzzySearch, TFile } from "obsidian";
import { Page } from "src/graph/Page";
import ExcaliBrain from "src/main";
import { TextInputSuggest } from "./Suggest";

export enum FileSuggestMode {
    TemplateFiles,
    ScriptFiles,
}

export class PageSuggest extends TextInputSuggest<Page> {
    constructor(
        public app: App,
        public inputEl: HTMLInputElement,
        private plugin: ExcaliBrain,
    ) {
        super(app, inputEl);
    }

    getSuggestions(inputStr: string): Page[] {
      const lowerInputStr = inputStr.toLowerCase();
      const exactMatches = this.plugin.pages?.getPages().filter(p=> 
        (!p.file || 
          (this.plugin.settings.showAttachments || p.file.extension === "md") &&
          (!this.plugin.settings.excludeFilepaths.some(ep=>p.path.startsWith(ep)))
        ) && 
        (p.file || 
          (this.plugin.settings.showFolderNodes || !p.path.startsWith("folder:")) &&
          (this.plugin.settings.showTagNodes || !p.path.startsWith("tag:"))
        ) &&
        p.path.toLowerCase().contains(lowerInputStr)
      )
      if(exactMatches.length>30) {
        return exactMatches;
      }

      const query = prepareFuzzySearch(inputStr);
      return exactMatches.concat(this.plugin.pages?.getPages().filter(p=>
        (!p.file || 
          (this.plugin.settings.showAttachments || p.file.extension === "md") &&
          (!this.plugin.settings.excludeFilepaths.some(ep=>p.path.startsWith(ep)))
        ) && 
        (p.file || 
          (this.plugin.settings.showFolderNodes || !p.path.startsWith("folder:")) &&
          (this.plugin.settings.showTagNodes || !p.path.startsWith("tag:"))
        ) && !exactMatches.contains(p) && query(p.path)
      ))
    }

    renderSuggestion(page: Page, el: HTMLElement): void {
        el.setText(page.path);
    }

    selectSuggestion(page: Page): void {
        this.inputEl.value = page.path;
        this.inputEl.trigger("input");
        this.close();
    }
}