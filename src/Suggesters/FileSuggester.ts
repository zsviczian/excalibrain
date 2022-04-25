// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, TAbstractFile, TFile } from "obsidian";
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
      return app.vault.getFiles().filter(f=>
          (this.plugin.settings.showAttachments || f.extension === "md") &&
          f.path.toLowerCase().contains(lowerInputStr)
        )
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