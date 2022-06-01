import {
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from "obsidian";
import type ExcalidrawPlugin from "../main";

export class FieldSuggester extends EditorSuggest<string> {
  plugin: ExcalidrawPlugin;
  suggestType: "parent" | "child" | "friend";
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
      const parentTrigger = new RegExp(`^${settings.ontologySuggesterParentTrigger}(.*)$`);
      const childTrigger = new RegExp(`^${settings.ontologySuggesterChildTrigger}(.*)$`);
      const friendTrigger = new RegExp(`^${settings.ontologySuggesterFriendTrigger}(.*)$`);
      const match =
        sub.match(parentTrigger)?.[1] ??
        sub.match(childTrigger)?.[1] ??
        sub.match(friendTrigger)?.[1];
      if (match !== undefined) {
        this.suggestType = sub.match(parentTrigger)
          ? "parent"
          : sub.match(childTrigger)
          ? "child"
          : "friend";
        
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
    return this.suggestType === "parent"
      ? this.plugin.settings.hierarchy.parents
      : this.suggestType === "child"
      ? this.plugin.settings.hierarchy.children
      : this.plugin.settings.hierarchy.friends;
  }

  getTrigger = ():string => {
    return this.suggestType === "parent"
      ? this.plugin.settings.ontologySuggesterParentTrigger
      : this.suggestType === "child"
      ? this.plugin.settings.ontologySuggesterChildTrigger
      : this.plugin.settings.ontologySuggesterFriendTrigger
  }

  getSuggestions = (context: EditorSuggestContext) => {
    const query = context.query.toLowerCase();
    return this.getKeys().filter((sug) => sug.toLowerCase().includes(query));
  };

  renderSuggestion(suggestion: string, el: HTMLElement): void {
    el.createEl("b", { text: suggestion });
  }

  selectSuggestion(suggestion: string): void {
    const { context } = this;
    if (context) {
      const replacement = `${suggestion}:: `;
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
