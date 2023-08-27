// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App,  prepareFuzzySearch, TFile } from "obsidian";
import { Page } from "src/graph/Page";
import ExcaliBrain from "src/excalibrain-main";
import { TextInputSuggest } from "./Suggest";

export enum FileSuggestMode {
    TemplateFiles,
    ScriptFiles,
}

export class PageSuggest extends TextInputSuggest<Page> {
    private inputStr: string = "";
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
      this.inputStr = inputStr.trim();
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
      ).sort((a,b)=>query(b.path).score - query(a.path).score))
    }

    renderSuggestion(page: Page, el: HTMLElement): void {
        const inputReg = this.inputStr === "" ? null : new RegExp(`(${this.inputStr})`, "gi");
        el.ariaLabel = page.path;
        const data = 
          (page.isFolder || page.isTag)
            ? page.path.replace(/^folder:/,this.plugin.settings.folderNodeStyle.prefix??"📂").replace(/^tag:/,this.plugin.settings.tagNodeStyle.prefix??"🏷️")
            : inputReg
              ? page.name.match(inputReg) ? page.name : page.path
              : page.name;

        const pathParts = data.split("/");
        const fileName = pathParts.pop();
        const folderPath = pathParts.join("/") + (pathParts.length > 0 ? "/" : "");

        const [highlightedFolderPath, highlightedFileName] = this.highlightSequence(folderPath, fileName);

        el.innerHTML = `<span style="font-size: 0.8em; opacity: 0.8;">${highlightedFolderPath}</span>${highlightedFileName}`;
    }

    highlightSequence(folderName: string, fileName: string): [string, string] {
      let lastInputStringSegment = -1;
      const processSegment = (segment: string, inputStr: string) => {
          let lastIndex = 0;
          let result = "";
          inputStr.split(" ").forEach((char,i) => {
              const index = segment.toLowerCase().indexOf(char.toLowerCase(), lastIndex);
              if (index !== -1) {
                  result += segment.substring(lastIndex, index) + `<b>${char}</b>`;
                  lastIndex = index + char.length;
                  lastInputStringSegment = i;
              }
          });
          result += segment.substring(lastIndex);
          return result;
      };

      let inputStr = this.inputStr;
      const highlightedFolderName = processSegment(folderName, inputStr);
      inputStr = inputStr.split(" ").slice(lastInputStringSegment + 1).join(" ");
      const highlightedFileName = processSegment(fileName, inputStr);
      inputStr = inputStr.split(" ").slice(lastInputStringSegment + 1).join(" ");

      return [highlightedFolderName, highlightedFileName];
    }


    selectSuggestion(page: Page): void {
        this.inputEl.value = page.path;
        this.inputEl.trigger("input");
        this.close();
    }
}