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
        app: App,
        inputEl: HTMLInputElement,
        private plugin: ExcaliBrain,
        containerEl: HTMLElement
    ) {
        super(app, inputEl, containerEl);
    }

    getSuggestions(inputStr: string): Page[] {
      //if now query string is provided, show the favorits
      if(inputStr==="") {
        return this.plugin.starred;
      }
      const lowerInputStr = inputStr.toLowerCase();
      //first filter on the name of the file
      const exactMatchesBasename = this.plugin.pages?.getPages().filter(p=>
        (!p.file || 
          (this.plugin.settings.showAttachments || p.file.extension === "md") &&
          (!this.plugin.settings.excludeFilepaths.some(ep=>p.path.startsWith(ep)))
        ) && 
        (p.file || 
          (this.plugin.settings.showFolderNodes || !p.path.startsWith("folder:")) &&
          (this.plugin.settings.showTagNodes || !p.path.startsWith("tag:"))
        ) &&
        p.name.toLowerCase().contains(lowerInputStr)
      )
      //if there are more than 30 matches based on filename, return those
      if (exactMatchesBasename.length>30) {
        return exactMatchesBasename
      }
      //extend query with matches based on filepath
      const exactMatches = exactMatchesBasename.concat(
        this.plugin.pages?.getPages().filter(p=>
          !exactMatchesBasename.contains(p) && 
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
      )
      if(exactMatches.length>30) {
        return exactMatches;
      }
      //extend query based on fuzzy search results
      const query = prepareFuzzySearch(inputStr);
      return exactMatches.concat(this.plugin.pages?.getPages().filter(p=>
        !p.isVirtual &&
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