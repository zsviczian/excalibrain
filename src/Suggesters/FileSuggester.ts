// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, fuzzySearch, prepareFuzzySearch, prepareQuery, TAbstractFile, TFile } from "obsidian";
import ExcaliBrain from "src/main";
import { getTFilesFromFolder } from "src/utils/fileUtils";
import { fileURLToPath } from "url";
import { TextInputSuggest } from "./Suggest";

export enum FileSuggestMode {
    TemplateFiles,
    ScriptFiles,
}

export class FileSuggest extends TextInputSuggest<TFile> {
    constructor(
        public app: App,
        public inputEl: HTMLInputElement,
        private plugin: ExcaliBrain,
    ) {
        super(app, inputEl);
    }

    getSuggestions(inputStr: string): TFile[] {
      const lowerInputStr = inputStr.toLowerCase();
      const exactMatches = app.vault.getFiles().filter(f=> 
        (this.plugin.settings.showAttachments || f.extension === "md") &&
        !this.plugin.settings.excludeFilepaths.some(p=>f.path.startsWith(p)) &&
        f.path.toLowerCase().contains(lowerInputStr)
      )
      if(exactMatches.length>30) {
        return exactMatches;
      }

      const query = prepareFuzzySearch(inputStr);
      return exactMatches.concat(app.vault.getFiles().filter(f=>

          (this.plugin.settings.showAttachments || f.extension === "md") &&
          !this.plugin.settings.excludeFilepaths.some(p=>f.path.startsWith(p)) &&
          !exactMatches.contains(f) &&
          query(f.path)
        ))
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}