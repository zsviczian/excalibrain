import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import type ExcalidrawPlugin from "../excalibrain-main";

export class FieldSuggester extends EditorSuggest<string> {
  plugin: ExcalidrawPlugin;
  suggestType: "all" | "parent" | "child" | "friend";
  latestTriggerInfo: EditorSuggestTriggerInfo;

  constructor(plugin: ExcalidrawPlugin) {
    super(plugin.app);
    this.plugin = plugin;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    _: TFile,
  ): EditorSuggestTriggerInfo | null {
    const settings = this.plugin.settings;
    if (settings.allowOntologySuggester) {
      const sub = editor.getLine(cursor.line).substring(0, cursor.ch);

      const triggerREG = new RegExp(
        `(^${settings.ontologySuggesterTrigger}|\\${settings.ontologySuggesterMidSentenceTrigger+settings.ontologySuggesterTrigger
        }|^${settings.ontologySuggesterParentTrigger}|\\${settings.ontologySuggesterMidSentenceTrigger+settings.ontologySuggesterParentTrigger
        }|^${settings.ontologySuggesterChildTrigger}|\\${settings.ontologySuggesterMidSentenceTrigger+settings.ontologySuggesterChildTrigger
        }|^${settings.ontologySuggesterFriendTrigger}|\\${settings.ontologySuggesterMidSentenceTrigger+settings.ontologySuggesterFriendTrigger
        })([^\\s\\${settings.ontologySuggesterTrigger}]*)`,"g"
      );

      let match:string, trigger: string, v;
      const r=sub.matchAll(triggerREG);
        while(!(v=r.next()).done) {
          trigger = v.value[1];
          match = v.value[2];
        }

      if (match !== undefined) {
        switch(trigger) {
          case settings.ontologySuggesterTrigger:
          case settings.ontologySuggesterMidSentenceTrigger+settings.ontologySuggesterTrigger:
            this.suggestType = "all";
            break;
          case settings.ontologySuggesterParentTrigger:
          case settings.ontologySuggesterMidSentenceTrigger+settings.ontologySuggesterParentTrigger:
            this.suggestType = "parent";
            break;
          case settings.ontologySuggesterChildTrigger:
          case settings.ontologySuggesterMidSentenceTrigger+settings.ontologySuggesterChildTrigger:
            this.suggestType = "child";
            break;
          default: 
            this.suggestType = "friend";
            break;
        }
        
        this.latestTriggerInfo = {
          end: cursor,
          start: {
            ch: cursor.ch - match.length - this.getTrigger().length,
            line: cursor.line,
          },
          query: match,
        };
        return this.latestTriggerInfo;
      }
    }
    return null;
  }

  getKeys = ():string[] => {
    const h = this.plugin.settings.hierarchy;
    const t = this.suggestType;
    return t === "all"
      ? h.parents.concat(h.children).concat(h.friends).sort((a,b)=>a.toLowerCase()>b.toLowerCase()?1:-1)
      : t === "parent"
        ? h.parents
        : t === "child"
          ? h.children
          : h.friends;
  }

  getTrigger = ():string => {
    const t = this.suggestType;
    const s = this.plugin.settings;
    return t === "all"
      ? s.ontologySuggesterTrigger
      : t === "parent"
        ? s.ontologySuggesterParentTrigger
        : t === "child"
          ? s.ontologySuggesterChildTrigger
          : s.ontologySuggesterFriendTrigger
  }

  getSuggestions = (context: EditorSuggestContext) => {
    const query = context.query.toLowerCase();
    return this.getKeys()
      .filter((sug) => sug.toLowerCase().includes(query));
  };

  renderSuggestion(suggestion: string, el: HTMLElement): void {
    el.createEl("b", { text: suggestion });
  }

  selectSuggestion(suggestion: string): void {
    const { context } = this;
    if (context) {
      const bold = this.plugin.settings.boldFields;
      const replacement = `${(bold?"**":"") + suggestion + (bold?"**":"")}:: `;
      context.editor.replaceRange(
        replacement,
        this.latestTriggerInfo.start,
        this.latestTriggerInfo.end,
      );
      if (this.latestTriggerInfo.start.ch === this.latestTriggerInfo.end.ch) {
        // Dirty hack to prevent the cursor being at the
        // beginning of the word after completion,
        // Not sure what's the cause of this bug.
        const cursor_pos = this.latestTriggerInfo.end;
        cursor_pos.ch += replacement.length;
        context.editor.setCursor(cursor_pos);
      }
    }
  }
}
