// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { App, prepareFuzzySearch } from "obsidian";
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
        const escapedInput = this.inputStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const inputReg = this.inputStr === "" ? null : new RegExp(`(${escapedInput})`, "gi");
        el.ariaLabel = page.path;
        const data = 
          (page.isFolder || page.isTag)
            ? page.path.replace(/^folder:/,this.plugin.settings.folderNodeStyle.prefix??"📂").replace(/^tag:/,this.plugin.settings.tagNodeStyle.prefix??"🏷️")
            : inputReg
              ? page.name.match(inputReg) ? page.name : page.path
              : page.name;

        const pathParts = data.split("/");
        const fileName = pathParts.pop() ?? "";
        const folderPath = pathParts.join("/") + (pathParts.length > 0 ? "/" : "");
        const [highlightedFolderPath, highlightedFileName] = this.highlightSequence(folderPath, fileName);

        el.empty();
        const folderEl = el.createSpan({ cls: "excalibrain-page-suggester-folder" });
        this.appendHighlightedParts(folderEl, highlightedFolderPath);
        this.appendHighlightedParts(el, highlightedFileName);
    }

    private appendHighlightedParts(
      container: HTMLElement,
      parts: Array<{text: string; bold: boolean}>,
    ): void {
      parts.forEach(({text, bold}) => {
        if(!text) return;
        if(bold) container.createEl("b", {text});
        else container.appendText(text);
      });
    }

    highlightSequence(
      folderName: string,
      fileName: string,
    ): [Array<{text: string; bold: boolean}>, Array<{text: string; bold: boolean}>] {
      let lastInputStringSegment = -1;
      const processSegment = (segment: string, inputStr: string): Array<{text: string; bold: boolean}> => {
          let lastIndex = 0;
          const result: Array<{text: string; bold: boolean}> = [];
          inputStr.split(" ").filter(Boolean).forEach((part,i) => {
              const index = segment.toLowerCase().indexOf(part.toLowerCase(), lastIndex);
              if (index !== -1) {
                  result.push({text: segment.substring(lastIndex, index), bold: false});
                  result.push({text: segment.substring(index, index + part.length), bold: true});
                  lastIndex = index + part.length;
                  lastInputStringSegment = i;
              }
          });
          result.push({text: segment.substring(lastIndex), bold: false});
          return result;
      };

      let inputStr = this.inputStr;
      const highlightedFolderName = processSegment(folderName, inputStr);
      inputStr = inputStr.split(" ").slice(lastInputStringSegment + 1).join(" ");
      const highlightedFileName = processSegment(fileName, inputStr);

      return [highlightedFolderName, highlightedFileName];
    }


    selectSuggestion(page: Page): void {
        this.inputEl.value = page.path;
        this.inputEl.trigger("input");
        this.close();
    }
}