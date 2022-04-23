import { App, Modal } from "obsidian";

export class WarningPrompt extends Modal {
  private resolve: (value: boolean) => void;

  constructor(
    app: App,
    private title:string,
    private message: string,
  ) {
    super(app);
  }

  onOpen(): void {
    this.createForm();
  }

  onClose() {}

  createForm(): void {
    this.titleEl.setText(this.title);

    this.contentEl.createDiv({
      cls: "excalibrain-prompt-center",
      text: this.message,
    });

    this.contentEl.createDiv({ cls: "excalibrain-prompt-center" }, (el) => {
      el.style.textAlign = "right";


      const bOk = el.createEl("button", { text: "Ok" });
      bOk.onclick = () => {
        this.resolve(true);
        this.close();
      };

      const bCancel = el.createEl("button", {
        text: "Cancel",
      });
      bCancel.onclick = () => {
        this.resolve(false);
        this.close();
      };
    });
  }

  show(resolve: (value:boolean)=>void): void {
    this.resolve = resolve;
    this.open();
  }
}
